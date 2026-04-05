'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ClipboardList, ImageIcon, LogOut, MapPin, User, AlertTriangle, CloudOff, CheckCircle, UserPlus, Plus, History, Search } from 'lucide-react'
import { MeterReadingForm } from './components/MeterReadingForm'
import { ReadingHistory } from './components/ReadingHistory'
import { PhotoReview } from './components/PhotoReview'
import { MeterLookup } from './components/MeterLookup'

interface Route {
  id: string
  name: string
  area: string
  meter_count: number
  assigned_to: string | null
  status: 'unassigned' | 'assigned' | 'in-progress' | 'completed'
  meters_read?: number
  rechecks_detected?: number
  sync_status?: 'synced' | 'pending' | 'failed'
}

interface RouteAssignment {
  id: string
  user_id: string
  route_area: string
  assigned_at: string
  status: 'assigned' | 'in-progress' | 'completed'
  started_at?: string
  completed_at?: string
  meters_total: number
  meters_read: number
}

type Tab = 'routes' | 'photos'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [routes, setRoutes] = useState<Route[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('routes')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [showReadingForm, setShowReadingForm] = useState(false)
  const [pendingReadings, setPendingReadings] = useState(0)
  const [lastSync, setLastSync] = useState<Date>(new Date())
  const [assignments, setAssignments] = useState<RouteAssignment[]>([])
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedRouteArea, setSelectedRouteArea] = useState<string | null>(null)
  const [showMeterLookup, setShowMeterLookup] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.push('/login')
      } else {
        setUser(session.user)
        loadRoutes()
        loadAssignments()
        checkPendingSync()
      }
      setLoading(false)
    })
  }, [router])

  async function loadRoutes() {
    const { data, error } = await supabase
      .from('meters')
      .select('*')
      .limit(50)

    if (data) {
      const routeMap = new Map<string, Route>()
      data.forEach((meter, idx) => {
        const area = meter.zip_code || 'Unknown'
        if (!routeMap.has(area)) {
          routeMap.set(area, {
            id: area,
            name: `Route ${String.fromCharCode(65 + (idx % 26))}${Math.floor(idx / 26) + 1}`,
            area: area,
            meter_count: 0,
            assigned_to: null,
            status: 'unassigned',
            meters_read: 0,
            rechecks_detected: 0,
            sync_status: 'synced'
          })
        }
        const route = routeMap.get(area)!
        route.meter_count++
      })
      setRoutes(Array.from(routeMap.values()))
    }
  }

  async function loadAssignments() {
    if (!user) return
    
    const { data, error } = await supabase
      .from('route_assignments')
      .select('*')
      .eq('user_id', user.id)
    
    if (data) {
      setAssignments(data)
      
      setRoutes(prev => prev.map(route => {
        const assignment = data.find(a => a.route_area === route.area)
        if (assignment) {
          return {
            ...route,
            assigned_to: 'You',
            status: assignment.status,
            meters_read: assignment.meters_read
          }
        }
        return route
      }))
    }
  }

  async function checkPendingSync() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('readings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneHourAgo)

    setPendingReadings(count || 0)
    setLastSync(new Date())
  }

  async function handleSelfAssign() {
    if (!selectedRouteId || !user) return
    
    try {
      const route = routes.find(r => r.id === selectedRouteId)
      if (!route) return
      
      const { error } = await supabase
        .from('route_assignments')
        .upsert({
          user_id: user.id,
          route_area: route.area,
          status: 'assigned',
          meters_total: route.meter_count,
          meters_read: 0
        })
      
      if (error) throw error
      
      setRoutes(prev =>
        prev.map(r =>
          r.id === selectedRouteId
            ? { ...r, assigned_to: 'You', status: 'assigned' }
            : r
        )
      )
      
      await loadAssignments()
      
      setShowAssignModal(false)
      setSelectedRouteId(null)
    } catch (err: any) {
      console.error('Assignment error:', err)
    }
  }

  async function updateAssignmentStatus(area: string, status: RouteAssignment['status']) {
    if (!user) return
    
    const { error } = await supabase
      .from('route_assignments')
      .update({ 
        status,
        started_at: status === 'in-progress' ? new Date().toISOString() : undefined,
        completed_at: status === 'completed' ? new Date().toISOString() : undefined
      })
      .eq('user_id', user.id)
      .eq('route_area', area)
    
    if (!error) {
      await loadAssignments()
    }
  }

  const getStatusColor = (status: Route['status']) => {
    switch (status) {
      case 'unassigned': return 'bg-gray-100 text-gray-700'
      case 'assigned': return 'bg-blue-100 text-blue-700'
      case 'in-progress': return 'bg-yellow-100 text-yellow-700'
      case 'completed': return 'bg-green-100 text-green-700'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-semibold">Meter Reading Manager</h1>
              {user && <p className="text-sm text-blue-100">{user.email}</p>}
            </div>
          </div>
          <button
            onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
            className="flex items-center gap-2 px-3 py-2 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('routes')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 border-b-2 transition-colors ${
              activeTab === 'routes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600'
            }`}
          >
            <ClipboardList size={20} />
            <span>Routes</span>
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 border-b-2 transition-colors ${
              activeTab === 'photos'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600'
            }`}
          >
            <ImageIcon size={20} />
            <span>Photos</span>
          </button>
        </div>
      </nav>

      {/* Sync Status Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {pendingReadings > 0 ? (
            <>
              <CloudOff size={16} className="text-orange-600" />
              <span className="text-orange-600">{pendingReadings} readings pending sync</span>
            </>
          ) : (
            <>
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-green-600">All synced</span>
            </>
          )}
        </div>
        <span className="text-gray-500">Last sync: {lastSync.toLocaleTimeString()}</span>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4">
        {activeTab === 'routes' ? (
          <div className="max-w-4xl mx-auto">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Reading Routes</h2>
                <p className="text-sm text-gray-600">Assign routes to yourself for hands-on reading</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowMeterLookup(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Search size={18} />
                  <span className="hidden sm:inline">Lookup</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedRouteArea(null)
                    setShowHistoryModal(true)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <History size={18} />
                  <span className="hidden sm:inline">History</span>
                </button>
                <button
                  onClick={() => setShowReadingForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">Demo Reading</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {routes.map(route => (
                <div
                  key={route.id}
                  className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${
                    route.status === 'completed' ? 'opacity-60 bg-gray-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{route.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                        <MapPin size={14} />
                        <span>Area {route.area}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(route.status)}`}>
                      {route.status.replace('-', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-gray-600">{route.meter_count} meters</span>
                  </div>

                  {route.status === 'in-progress' && route.meters_read !== undefined && (
                    <div className="mb-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium text-gray-900">
                          {route.meters_read} / {route.meter_count} read
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${(route.meters_read / route.meter_count) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {route.assigned_to ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User size={16} className="text-blue-600" />
                        <span className="text-gray-700">Assigned to: <span className="font-medium">{route.assigned_to}</span></span>
                      </div>
                      {route.assigned_to === 'You' && (
                        <div className="flex gap-2">
                          {route.status === 'assigned' && (
                            <button
                              onClick={() => updateAssignmentStatus(route.area, 'in-progress')}
                              className="flex-1 text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              Start Reading
                            </button>
                          )}
                          {route.status === 'in-progress' && (
                            <button
                              onClick={() => updateAssignmentStatus(route.area, 'completed')}
                              className="flex-1 text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                              Complete
                            </button>
                          )}
                          {route.status === 'completed' && (
                            <span className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded">
                              ✓ Completed
                            </span>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setSelectedRouteArea(route.area)
                          setShowHistoryModal(true)
                        }}
                        className="w-full text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <History size={12} />
                        View History
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedRouteId(route.id)
                        setShowAssignModal(true)
                      }}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <UserPlus size={18} />
                      Assign to Me
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <PhotoReview />
        )}
      </main>

      {/* Assignment Modal - Self Assign */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[80vh] overflow-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Assign Route to Yourself</h3>
              <p className="text-sm text-gray-600 mt-1">You'll be responsible for reading all meters in this route</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-900">Self-Assignment Mode</div>
                <div className="text-xs text-blue-700 mt-1">
                  As a manager, you can assign yourself to routes for hands-on reading or training purposes.
                </div>
              </div>
              <button
                onClick={handleSelfAssign}
                className="w-full p-4 rounded-lg border text-left transition-colors border-blue-600 bg-blue-50 hover:bg-blue-100"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-900">Assign to Me</span>
                  <UserPlus size={20} className="text-blue-600" />
                </div>
              </button>
            </div>
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedRouteId(null)
                }}
                className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meter Reading Form */}
      {showReadingForm && (
        <MeterReadingForm
          meterId="M-DEMO-001"
          meterAddress="123 Main St, Demo City"
          previousReading={32450}
          onSuccess={() => {
            setShowReadingForm(false)
            checkPendingSync()
          }}
          onCancel={() => setShowReadingForm(false)}
        />
      )}

      {/* Reading History Modal */}
      {showHistoryModal && (
        <ReadingHistory
          routeArea={selectedRouteArea || undefined}
          onClose={() => {
            setShowHistoryModal(false)
            setSelectedRouteArea(null)
          }}
        />
      )}

      {/* Meter Lookup Modal */}
      {showMeterLookup && (
        <MeterLookup
          onClose={() => setShowMeterLookup(false)}
        />
      )}
    </div>
  )
}

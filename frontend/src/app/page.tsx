'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ClipboardList, ImageIcon, LogOut, MapPin, User, AlertTriangle, CloudOff, CheckCircle, UserPlus, Plus } from 'lucide-react'
import { MeterReadingForm } from './components/MeterReadingForm'

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

interface Reader {
  id: string
  name: string
  available: boolean
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.push('/login')
      } else {
        setUser(session.user)
        loadRoutes()
        checkPendingSync()
      }
      setLoading(false)
    })
  }, [router])

  async function loadRoutes() {
    // For POC, load meters as "routes"
    const { data, error } = await supabase
      .from('meters')
      .select('*')
      .limit(50)

    if (data) {
      // Group meters by area/zip as "routes"
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

  async function checkPendingSync() {
    // Check for readings created in last hour without sync
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('readings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneHourAgo)

    setPendingReadings(count || 0)
    setLastSync(new Date())
  }

  async function handleAssignReader(readerName: string) {
    if (!selectedRouteId) return

    setRoutes(prev =>
      prev.map(route =>
        route.id === selectedRouteId
          ? { ...route, assigned_to: readerName, status: 'assigned' }
          : route
      )
    )
    setShowAssignModal(false)
    setSelectedRouteId(null)
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
                <p className="text-sm text-gray-600">Assign routes to meter readers</p>
              </div>
              <button
                onClick={() => setShowReadingForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Demo Reading</span>
              </button>
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
                    <div className="flex items-center gap-2 text-sm">
                      <User size={16} className="text-blue-600" />
                      <span className="text-gray-700">Assigned to: <span className="font-medium">{route.assigned_to}</span></span>
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
                      Assign Reader
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Photo Approval</h2>
            <p className="text-sm text-gray-600 mb-4">Review and approve meter reading photos</p>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No photos pending approval</p>
              <p className="text-sm text-gray-500 mt-2">Photos from OCR readings will appear here</p>
            </div>
          </div>
        )}
      </main>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[80vh] overflow-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Select Reader</h3>
            </div>
            <div className="p-4 space-y-2">
              {['John Smith', 'Sarah Johnson', 'Mike Davis', 'Emily Chen'].map((name, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAssignReader(name)}
                  className="w-full p-4 rounded-lg border text-left transition-colors border-gray-200 hover:border-blue-600 hover:bg-blue-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{name}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      idx % 4 === 2 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {idx % 4 === 2 ? 'On route' : 'Available'}
                    </span>
                  </div>
                </button>
              ))}
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
          onSubmit={(reading, photoUrl, gps) => {
            console.log('Reading submitted:', { reading, photoUrl, gps })
            setShowReadingForm(false)
            checkPendingSync()
          }}
          onCancel={() => setShowReadingForm(false)}
        />
      )}
    </div>
  )
}

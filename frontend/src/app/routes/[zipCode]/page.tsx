'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, MapPin, User, Phone, Mail, CheckCircle, Clock, Circle, Filter, TrendingUp } from 'lucide-react'
import { ApproveRejectButtons } from '@/app/components/ApproveRejectButtons'

interface Meter {
  id: string
  meter_number: string
  meter_type: string
  address: string
  city: string
  state: string
  zip_code: string
  status: 'active' | 'inactive' | 'maintenance' | 'decommissioned'
  location: any
  latest_reading?: {
    id: string
    value: number
    unit: string
    reading_timestamp: string
    status: 'pending' | 'approved' | 'rejected' | 'certified'
    reader_id: string | null
  } | null
}

interface RouteAssignment {
  id: string
  reader_id: string
  status: 'assigned' | 'in-progress' | 'completed' | 'cancelled'
  meters_total: number
  meters_read: number
  readers?: {
    full_name: string
    email: string
    phone: string | null
  } | null
}

type MeterFilter = 'all' | 'read' | 'pending' | 'not-read'

export default function RouteDetailPage() {
  const router = useRouter()
  const params = useParams()
  const zipCode = params.zipCode as string

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [meters, setMeters] = useState<Meter[]>([])
  const [assignment, setAssignment] = useState<RouteAssignment | null>(null)
  const [filter, setFilter] = useState<MeterFilter>('all')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.push('/login')
        return
      }
      setUser(session.user)
      loadRouteData(session.user.id)
    })
  }, [router, zipCode])

  async function loadRouteData(managerId: string) {
    setLoading(true)

    try {
      // Load meters for this route (zip_code)
      const { data: metersData, error: metersError } = await supabase
        .from('meters')
        .select(`
          *,
          latest_reading:readings (
            id,
            value,
            unit,
            reading_timestamp,
            status,
            reader_id
          )
        `)
        .eq('zip_code', zipCode)
        .eq('user_id', managerId)
        .order('address')

      if (metersError) throw metersError
      
      // Process meters to get only the latest reading
      const processedMeters = (metersData || []).map(meter => {
        const readings = (meter as any).latest_reading
        const latestReading = Array.isArray(readings) && readings.length > 0 
          ? readings[0] 
          : null
        
        return {
          ...meter,
          latest_reading: latestReading
        }
      }) as Meter[]
      
      setMeters(processedMeters)

      // Load route assignment
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('route_assignments')
        .select(`
          *,
          readers (
            full_name,
            email,
            phone
          )
        `)
        .eq('route_id', zipCode)
        .eq('manager_id', managerId)
        .single()

      if (assignmentError && assignmentError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is ok
        throw assignmentError
      }

      setAssignment(assignmentData)
    } catch (err: any) {
      console.error('Error loading route data:', err)
    } finally {
      setLoading(false)
    }
  }

  function getMeterStatus(meter: Meter): 'read' | 'pending' | 'not-read' {
    if (!meter.latest_reading) return 'not-read'
    if (meter.latest_reading.status === 'approved') return 'read'
    if (meter.latest_reading.status === 'pending') return 'pending'
    if (meter.latest_reading.status === 'rejected') return 'pending'
    if (meter.latest_reading.status === 'certified') return 'read'
    return 'not-read'
  }

  function filteredMeters() {
    if (filter === 'all') return meters

    return meters.filter(meter => {
      const status = getMeterStatus(meter)
      if (filter === 'read') return status === 'read'
      if (filter === 'pending') return status === 'pending'
      if (filter === 'not-read') return status === 'not-read'
      return true
    })
  }

  function getStatusCounts() {
    const counts = { read: 0, pending: 0, 'not-read': 0 }
    meters.forEach(meter => {
      const status = getMeterStatus(meter)
      counts[status]++
    })
    return counts
  }

  const displayMeters = filteredMeters()
  const statusCounts = getStatusCounts()
  const progressPercent = meters.length > 0 
    ? Math.round((statusCounts.read / meters.length) * 100) 
    : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading route details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">
                Route {zipCode}
              </h1>
              <p className="text-sm text-gray-600">
                {meters.length} meters • {progressPercent}% complete
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Route Info Card */}
        {assignment && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="font-semibold text-gray-900 mb-1">Route Assignment</h2>
                <p className="text-sm text-gray-600">
                  {assignment.status === 'completed' ? 'Completed' : 
                   assignment.status === 'in-progress' ? 'In Progress' : 'Assigned'}
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                assignment.status === 'completed' ? 'bg-green-100 text-green-700' :
                assignment.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {assignment.status.replace('-', ' ')}
              </span>
            </div>

            {assignment.readers && (
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <User size={16} className="text-blue-600" />
                  <span className="font-medium">{assignment.readers.full_name}</span>
                  <span className="text-gray-500">(Reader)</span>
                </div>
                {assignment.readers.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={16} className="text-gray-400" />
                    <span>{assignment.readers.phone}</span>
                  </div>
                )}
                {assignment.readers.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={16} className="text-gray-400" />
                    <span>{assignment.readers.email}</span>
                  </div>
                )}
              </div>
            )}

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1">
                  <TrendingUp size={14} />
                  Progress
                </span>
                <span className="font-medium text-gray-900">
                  {statusCounts.read} / {meters.length} meters
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    progressPercent === 100 ? 'bg-green-500' :
                    progressPercent > 50 ? 'bg-blue-500' :
                    'bg-yellow-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="text-xs text-gray-500">
                {progressPercent}% complete
                {statusCounts.pending > 0 && (
                  <span className="ml-2 text-yellow-600">
                    ({statusCounts.pending} pending review)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter size={16} className="text-gray-500 flex-shrink-0" />
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({meters.length})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === 'read'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✅ Read ({statusCounts.read})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⏳ Pending ({statusCounts.pending})
            </button>
            <button
              onClick={() => setFilter('not-read')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === 'not-read'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⚪ Not Read ({statusCounts['not-read']})
            </button>
          </div>
        </div>

        {/* Meter List */}
        <div className="space-y-2">
          {displayMeters.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Circle size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600">No meters found</p>
              <p className="text-sm text-gray-500 mt-1">
                Try adjusting your filter
              </p>
            </div>
          ) : (
            displayMeters.map((meter) => {
              const status = getMeterStatus(meter)
              const reading = meter.latest_reading

              function handleReadingUpdated() {
                // Refresh the meter list after approve/reject
                loadRouteData(user?.id)
              }

              return (
                <div
                  key={meter.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin size={18} className="text-gray-400 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-gray-900">{meter.meter_number}</h3>
                        <p className="text-sm text-gray-600">
                          {meter.address}, {meter.city}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      status === 'read' ? 'bg-green-100 text-green-700' :
                      status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {status === 'read' && '✅ Read'}
                      {status === 'pending' && '⏳ Pending'}
                      {status === 'not-read' && '⚪ Not Read'}
                    </span>
                  </div>

                  {reading && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          {status === 'read' ? (
                            <CheckCircle size={14} className="text-green-600" />
                          ) : status === 'pending' ? (
                            <Clock size={14} className="text-yellow-600" />
                          ) : (
                            <Circle size={14} className="text-gray-400" />
                          )}
                          <span>
                            {reading.value.toLocaleString()} {reading.unit}
                          </span>
                        </div>
                        <span className="text-gray-500 text-xs">
                          {new Date(reading.reading_timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      {status === 'pending' && (
                        <div className="mt-3 flex justify-end">
                          <ApproveRejectButtons
                            readingId={reading.id}
                            onApproveComplete={handleReadingUpdated}
                            onRejectComplete={handleReadingUpdated}
                            size="sm"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {!reading && status === 'not-read' && (
                    <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
                      No readings recorded yet
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}

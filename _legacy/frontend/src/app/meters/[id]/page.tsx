'use client'

import { useEffect, useState } from 'react'
import { supabase, Meter, Reading } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function MeterDetail() {
  const params = useParams()
  const router = useRouter()
  const [meter, setMeter] = useState<Meter | null>(null)
  const [readings, setReadings] = useState<Reading[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user && params.id) {
        loadMeterData(params.id as string, session.user.id)
      } else {
        setLoading(false)
      }
    })
  }, [params.id])

  async function loadMeterData(meterId: string, userId: string) {
    // Load meter
    const { data: meterData, error: meterError } = await supabase
      .from('meters')
      .select('*')
      .eq('id', meterId)
      .eq('user_id', userId)
      .single()

    if (meterData) {
      setMeter(meterData)

      // Load readings (last 50)
      const { data: readingsData } = await supabase
        .from('readings')
        .select('*')
        .eq('meter_id', meterId)
        .order('reading_timestamp', { ascending: false })
        .limit(50)

      if (readingsData) setReadings(readingsData)
    }

    setLoading(false)
  }

  if (!user) {
    router.push('/login')
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    )
  }

  if (!meter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Meter Not Found</h1>
          <p className="text-gray-600 mt-2">This meter doesn't exist or you don't have access.</p>
          <Link href="/" className="mt-4 inline-block text-brand-600 hover:text-brand-800">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{meter.meter_number}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href={`/meters/${meter.id}/reading`}
              className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 text-sm font-medium"
            >
              + Add Reading
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Meter Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Meter Details</h2>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Type</label>
                  <p className="font-medium text-gray-900 capitalize">{meter.meter_type}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <p>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      meter.status === 'active' ? 'bg-green-100 text-green-800' :
                      meter.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {meter.status}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-500">Manufacturer</label>
                  <p className="font-medium text-gray-900">{meter.manufacturer || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-500">Model</label>
                  <p className="font-medium text-gray-900">{meter.model || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-500">Serial Number</label>
                  <p className="font-medium text-gray-900 font-mono text-sm">{meter.serial_number || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-500">Install Date</label>
                  <p className="font-medium text-gray-900">
                    {meter.install_date ? new Date(meter.install_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-500">Location</label>
                  <p className="font-medium text-gray-900">
                    {meter.address}
                    {meter.city && `, ${meter.city}`}
                    {meter.state && `, ${meter.state}`}
                    {meter.zip_code && ` ${meter.zip_code}`}
                  </p>
                </div>

                {meter.last_reading_date && (
                  <div>
                    <label className="text-sm text-gray-500">Last Reading</label>
                    <p className="font-medium text-gray-900">
                      {new Date(meter.last_reading_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Readings List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Reading History</h2>
              </div>

              {readings.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-gray-500 mb-4">No readings yet</p>
                  <Link
                    href={`/meters/${meter.id}/reading`}
                    className="text-brand-600 hover:text-brand-800 font-medium"
                  >
                    Add your first reading →
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Delta
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {readings.map((reading) => (
                        <tr key={reading.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(reading.reading_timestamp).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {reading.value.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {reading.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {reading.delta_value ? `+${reading.delta_value.toLocaleString()}` : '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              reading.reading_type === 'actual' ? 'bg-green-100 text-green-800' :
                              reading.reading_type === 'estimated' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {reading.reading_type}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

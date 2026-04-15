'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewReading() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [meter, setMeter] = useState<any>(null)
  const [lastReading, setLastReading] = useState<any>(null)

  const [formData, setFormData] = useState({
    value: '',
    unit: '',
    reading_type: 'actual' as 'actual' | 'estimated' | 'adjusted' | 'self_read',
    source: 'manual' as 'manual' | 'api' | 'iot_device' | 'import' | 'ocr',
    reading_timestamp: new Date().toISOString().slice(0, 16),
    photo_url: '',
    notes: '',
  })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (!session?.user || !params.id) {
        router.push('/login')
        return
      }

      // Load meter info
      const { data: meterData } = await supabase
        .from('meters')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', session.user.id)
        .single()

      if (meterData) {
        setMeter(meterData)
        setFormData(prev => ({ ...prev, unit: getUnitForType(meterData.meter_type) }))

        // Load last reading
        const { data: lastReadingData } = await supabase
          .from('readings')
          .select('*')
          .eq('meter_id', params.id)
          .order('reading_timestamp', { ascending: false })
          .limit(1)
          .single()

        setLastReading(lastReadingData)
      } else {
        router.push('/')
      }
    })
  }, [params.id, router])

  function getUnitForType(type: string): string {
    const units: Record<string, string> = {
      water: 'gallons',
      electric: 'kWh',
      gas: 'therms',
      solar: 'kWh',
    }
    return units[type] || 'units'
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !meter) return

    setLoading(true)
    setError(null)

    const value = parseFloat(formData.value)
    const previousValue = lastReading?.value || null
    const deltaValue = previousValue !== null ? value - previousValue : null

    // Calculate cost for electric
    const cost = meter.meter_type === 'electric' && deltaValue
      ? parseFloat((deltaValue * 0.15).toFixed(2))
      : null

    const metadata = formData.notes
      ? { notes: formData.notes }
      : {}

    const { data, error } = await supabase
      .from('readings')
      .insert({
        meter_id: meter.id,
        reading_timestamp: formData.reading_timestamp,
        value,
        unit: formData.unit,
        reading_type: formData.reading_type,
        source: formData.source,
        previous_value: previousValue,
        delta_value: deltaValue,
        cost,
        metadata,
        photo_url: formData.photo_url || null,
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (data) {
      // Update meter's last_reading_date
      await supabase
        .from('meters')
        .update({ last_reading_date: formData.reading_timestamp })
        .eq('id', meter.id)

      router.push(`/meters/${meter.id}`)
    }
  }

  if (!user || !meter) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href={`/meters/${meter.id}`} className="text-gray-500 hover:text-gray-700">
              ← Back to meter
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Add Reading</h1>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Meter Info */}
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Meter</p>
                <p className="font-semibold text-gray-900">{meter.meter_number}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Last Reading</p>
                <p className="font-semibold text-gray-900">
                  {lastReading
                    ? `${lastReading.value.toLocaleString()} ${lastReading.unit} (${new Date(lastReading.reading_timestamp).toLocaleDateString()})`
                    : 'No previous readings'}
                </p>
              </div>
            </div>
          </div>

          {/* Reading Value */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Reading Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="value" className="block text-sm font-medium text-gray-700">
                  Current Reading Value *
                </label>
                <input
                  type="number"
                  id="value"
                  name="value"
                  step="0.0001"
                  required
                  value={formData.value}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 text-gray-900 text-lg"
                  placeholder="0.0000"
                />
                {lastReading && formData.value && (
                  <p className="mt-1 text-sm text-gray-600">
                    Delta: <span className="font-medium">{(parseFloat(formData.value) - lastReading.value).toFixed(4)}</span> {formData.unit}
                    {meter.meter_type === 'electric' && (
                      <span className="ml-2 text-gray-500">
                        (~${((parseFloat(formData.value) - lastReading.value) * 0.15).toFixed(2)} est. cost)
                      </span>
                    )}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                  Unit
                </label>
                <input
                  type="text"
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="reading_timestamp" className="block text-sm font-medium text-gray-700">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  id="reading_timestamp"
                  name="reading_timestamp"
                  required
                  value={formData.reading_timestamp}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="reading_type" className="block text-sm font-medium text-gray-700">
                  Reading Type
                </label>
                <select
                  id="reading_type"
                  name="reading_type"
                  value={formData.reading_type}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 text-gray-900"
                >
                  <option value="actual">Actual</option>
                  <option value="estimated">Estimated</option>
                  <option value="adjusted">Adjusted</option>
                  <option value="self_read">Self-Read</option>
                </select>
              </div>

              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                  Source
                </label>
                <select
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 text-gray-900"
                >
                  <option value="manual">Manual Entry</option>
                  <option value="api">API Import</option>
                  <option value="iot_device">IoT Device</option>
                  <option value="import">CSV Import</option>
                  <option value="ocr">Photo (OCR)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="photo_url" className="block text-sm font-medium text-gray-700">
                  Photo URL (optional)
                </label>
                <input
                  type="url"
                  id="photo_url"
                  name="photo_url"
                  value={formData.photo_url}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 text-gray-900"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 text-gray-900"
                  placeholder="Any additional notes about this reading..."
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <Link
              href={`/meters/${meter.id}`}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Reading'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

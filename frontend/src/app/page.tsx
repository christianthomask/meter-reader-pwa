'use client'

import { useEffect, useState } from 'react'
import { supabase, Meter } from '@/lib/supabase'
import Link from 'next/link'

export default function Dashboard() {
  const [meters, setMeters] = useState<Meter[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadMeters(session.user.id)
      } else {
        setLoading(false)
      }
    })
  }, [])

  async function loadMeters(userId: string) {
    const { data, error } = await supabase
      .from('meters')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (data) setMeters(data)
    setLoading(false)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <h1 className="text-3xl font-bold text-center text-gray-900">
            Meter Reader PWA
          </h1>
          <p className="text-center text-gray-600">
            Track and manage your utility meters
          </p>
          <div className="space-y-4">
            <Link
              href="/login"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="w-full flex justify-center py-3 px-4 border border-brand-600 rounded-md shadow-sm text-sm font-medium text-brand-600 bg-white hover:bg-gray-50"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-sm text-brand-600 hover:text-brand-800"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Meters</h3>
            <p className="text-3xl font-bold text-gray-900">{meters.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Active Meters</h3>
            <p className="text-3xl font-bold text-gray-900">
              {meters.filter(m => m.status === 'active').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Meter Types</h3>
            <p className="text-3xl font-bold text-gray-900">
              {new Set(meters.map(m => m.meter_type)).size}
            </p>
          </div>
        </div>

        {/* Meters List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Your Meters</h2>
            <Link
              href="/meters/new"
              className="text-sm text-brand-600 hover:text-brand-800 font-medium"
            >
              + Add Meter
            </Link>
          </div>

          {meters.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500 mb-4">No meters yet</p>
              <Link
                href="/meters/new"
                className="text-brand-600 hover:text-brand-800 font-medium"
              >
                Add your first meter →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {meters.map((meter) => (
                <Link
                  key={meter.id}
                  href={`/meters/${meter.id}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-semibold text-gray-900">
                          {meter.meter_number}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          meter.meter_type === 'water' ? 'bg-blue-100 text-blue-800' :
                          meter.meter_type === 'electric' ? 'bg-yellow-100 text-yellow-800' :
                          meter.meter_type === 'gas' ? 'bg-orange-100 text-orange-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {meter.meter_type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {meter.address}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        meter.status === 'active' ? 'bg-green-100 text-green-800' :
                        meter.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {meter.status}
                      </span>
                      {meter.last_reading_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          Last reading: {new Date(meter.last_reading_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

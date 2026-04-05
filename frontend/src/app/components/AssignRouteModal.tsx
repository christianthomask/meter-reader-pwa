'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, UserCheck, AlertCircle, Loader2 as LoaderIcon } from 'lucide-react'

interface Reader {
  id: string
  full_name: string
  email: string
  phone: string | null
  active: boolean
  assigned_routes_count: number
}

interface Route {
  id: string
  name: string
  area: string
  meter_count: number
}

interface AssignRouteModalProps {
  route: Route | null
  onClose: (refresh: boolean) => void
  managerId: string
}

export function AssignRouteModal({ route, onClose, managerId }: AssignRouteModalProps) {
  const [readers, setReaders] = useState<Reader[]>([])
  const [selectedReaderId, setSelectedReaderId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadActiveReaders()
  }, [managerId])

  async function loadActiveReaders() {
    setLoading(true)
    
    // Fetch only active readers from the manager's team
    const { data, error } = await supabase
      .from('readers')
      .select('id, full_name, email, phone, active, assigned_routes_count')
      .eq('manager_id', managerId)
      .eq('active', true)
      .order('full_name')

    if (error) {
      console.error('Error loading readers:', error)
      setError('Failed to load readers')
    } else {
      setReaders(data || [])
    }
    
    setLoading(false)
  }

  async function handleAssign() {
    if (!route || !selectedReaderId) return

    setSaving(true)
    setError(null)

    try {
      const selectedReader = readers.find(r => r.id === selectedReaderId)
      if (!selectedReader) {
        throw new Error('Selected reader not found')
      }

      // Create route assignment record
      // Note: route_assignments uses reader_id (not user_id) per schema
      const { error } = await supabase
        .from('route_assignments')
        .insert({
          route_id: route.id,
          reader_id: selectedReaderId,
          manager_id: managerId,
          status: 'assigned',
          meters_total: route.meter_count,
          meters_read: 0,
          notes: `Assigned to ${selectedReader.full_name}`
        })

      if (error) throw error

      // Update reader's assigned_routes_count
      await supabase
        .from('readers')
        .update({ 
          assigned_routes_count: (selectedReader.assigned_routes_count || 0) + 1 
        })
        .eq('id', selectedReaderId)

      onClose(true)
    } catch (err: any) {
      console.error('Assignment error:', err)
      setError(err.message || 'Failed to assign route')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[80vh] overflow-auto">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Assign Route</h3>
            <p className="text-sm text-gray-600 mt-1">
              {route ? `${route.name} • ${route.meter_count} meters` : 'Select route'}
            </p>
          </div>
          <button onClick={() => onClose(false)} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoaderIcon size={24} className="animate-spin text-blue-600" />
            </div>
          ) : readers.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <UserCheck size={32} className="mx-auto text-yellow-600 mb-2" />
              <p className="text-sm text-yellow-800 font-medium">No active readers</p>
              <p className="text-xs text-yellow-600 mt-1">
                Add readers to your team before assigning routes
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Reader <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedReaderId}
                  onChange={(e) => setSelectedReaderId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a reader...</option>
                  {readers.map(reader => (
                    <option key={reader.id} value={reader.id}>
                      {reader.full_name} ({reader.email})
                      {reader.assigned_routes_count > 0 && 
                        ` • ${reader.assigned_routes_count} route${reader.assigned_routes_count !== 1 ? 's' : ''}`
                      }
                    </option>
                  ))}
                </select>
              </div>

              {selectedReaderId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCheck size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Assignment Summary</span>
                  </div>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div className="flex justify-between">
                      <span>Route:</span>
                      <span className="font-medium">{route?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reader:</span>
                      <span className="font-medium">
                        {readers.find(r => r.id === selectedReaderId)?.full_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Meters:</span>
                      <span className="font-medium">{route?.meter_count}</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleAssign}
                disabled={!selectedReaderId || saving}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              >
                {saving && <LoaderIcon size={18} className="animate-spin" />}
                {saving ? 'Assigning...' : 'Assign Route'}
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => onClose(false)}
            disabled={saving}
            className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

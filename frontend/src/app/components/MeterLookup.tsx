'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Search, MapPin, Calendar, TrendingUp, Camera, FileText, History } from 'lucide-react'
import { ReadingHistory } from './ReadingHistory'

interface MeterLookupProps {
  onClose: () => void
}

interface Meter {
  id: string
  meter_number: string
  meter_type: string
  manufacturer: string
  model: string
  serial_number: string
  address: string
  city: string
  state: string
  zip_code: string
  status: string
  last_reading_date: string
  location: string
  metadata: Record<string, any>
}

interface RecentReading {
  id: string
  reading_timestamp: string
  value: number
  unit: string
  reading_type: string
  photo_url: string | null
  notes: string | null
  delta_value: number | null
}

export function MeterLookup({ onClose }: MeterLookupProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<Meter[]>([])
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null)
  const [recentReadings, setRecentReadings] = useState<RecentReading[]>([])
  const [loadingReadings, setLoadingReadings] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  async function searchMeters(query: string) {
    if (!query.trim()) {
      setResults([])
      return
    }

    setSearching(true)

    // Search by meter_number, address, or serial_number
    const { data, error } = await supabase
      .from('meters')
      .select('*')
      .or(`meter_number.ilike.%${query}%,address.ilike.%${query}%,serial_number.ilike.%${query}%,zip_code.eq.${query}`)
      .limit(20)

    if (error) {
      console.error('Search error:', error)
    } else {
      setResults(data || [])
    }

    setSearching(false)
  }

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery) {
        searchMeters(searchQuery)
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(debounce)
  }, [searchQuery])

  async function loadRecentReadings(meterId: string) {
    setLoadingReadings(true)
    
    const { data, error } = await supabase
      .from('readings')
      .select('*')
      .eq('meter_id', meterId)
      .order('reading_timestamp', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Error loading readings:', error)
    } else {
      setRecentReadings(data || [])
    }

    setLoadingReadings(false)
  }

  function selectMeter(meter: Meter) {
    setSelectedMeter(meter)
    loadRecentReadings(meter.id)
  }

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'inactive': return 'bg-gray-100 text-gray-700'
      case 'maintenance': return 'bg-yellow-100 text-yellow-700'
      case 'decommissioned': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  function getMeterTypeIcon(type: string) {
    switch (type) {
      case 'water': return '💧'
      case 'electric': return '⚡'
      case 'gas': return '🔥'
      case 'solar': return '☀️'
      default: return '📊'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Meter Lookup</h3>
            <p className="text-sm text-gray-600">Search by meter ID, address, or account number</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search meter number, address, or serial..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {selectedMeter ? (
            // Meter Detail View
            <div className="p-4 space-y-4">
              {/* Back button */}
              <button
                onClick={() => setSelectedMeter(null)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                ← Back to results
              </button>

              {/* Meter Info Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{getMeterTypeIcon(selectedMeter.meter_type)}</span>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {selectedMeter.meter_number}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin size={14} />
                      {selectedMeter.address}, {selectedMeter.city}, {selectedMeter.state} {selectedMeter.zip_code}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(selectedMeter.status)}`}>
                    {selectedMeter.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <div className="text-gray-500">Type</div>
                    <div className="font-medium capitalize">{selectedMeter.meter_type}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Manufacturer</div>
                    <div className="font-medium">{selectedMeter.manufacturer || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Model</div>
                    <div className="font-medium">{selectedMeter.model || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Serial</div>
                    <div className="font-medium truncate">{selectedMeter.serial_number || 'N/A'}</div>
                  </div>
                </div>

                {selectedMeter.last_reading_date && (
                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2 text-sm">
                    <Calendar size={14} className="text-gray-500" />
                    <span className="text-gray-600">Last reading:</span>
                    <span className="font-medium">
                      {new Date(selectedMeter.last_reading_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Recent Readings */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp size={18} />
                    Recent Readings
                  </h4>
                  <button
                    onClick={() => setShowHistory(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <History size={14} />
                    View All
                  </button>
                </div>

                {loadingReadings ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : recentReadings.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
                    <FileText size={32} className="mx-auto mb-2 text-gray-400" />
                    <p>No readings yet</p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reading</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Delta</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {recentReadings.map(reading => (
                          <tr key={reading.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {new Date(reading.reading_timestamp).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">
                              {reading.value.toLocaleString()} {reading.unit}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {reading.delta_value !== null && reading.delta_value !== undefined ? (
                                <span className={reading.delta_value >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {reading.delta_value >= 0 ? '+' : ''}{reading.delta_value.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                {reading.reading_type}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {reading.photo_url ? (
                                <a
                                  href={reading.photo_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                  <Camera size={14} />
                                  View
                                </a>
                              ) : (
                                <span className="text-gray-400">No photo</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Search Results
            <div className="p-4">
              {searching ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : results.length === 0 ? (
                searchQuery ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <Search size={48} className="mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No meters found</p>
                    <p className="text-sm mt-1">Try a different search term</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <Search size={48} className="mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Search for a meter</p>
                    <p className="text-sm mt-1">Enter meter ID, address, or serial number</p>
                  </div>
                )
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600 mb-3">
                    Found {results.length} meter{results.length !== 1 ? 's' : ''}
                  </div>
                  {results.map(meter => (
                    <button
                      key={meter.id}
                      onClick={() => selectMeter(meter)}
                      className="w-full bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all text-left"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getMeterTypeIcon(meter.meter_type)}</span>
                          <div>
                            <div className="font-medium text-gray-900">{meter.meter_number}</div>
                            <div className="text-sm text-gray-600 flex items-center gap-1">
                              <MapPin size={14} />
                              {meter.address}, {meter.city}
                            </div>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(meter.status)}`}>
                          {meter.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reading History Modal */}
        {showHistory && selectedMeter && (
          <ReadingHistory
            meterId={selectedMeter.id}
            onClose={() => setShowHistory(false)}
          />
        )}
      </div>
    </div>
  )
}

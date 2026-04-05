'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Reading } from '@/lib/supabase'
import { X, Download, Filter, Calendar, MapPin, Camera, FileText } from 'lucide-react'

interface ReadingHistoryProps {
  meterId?: string
  routeArea?: string
  onClose: () => void
}

interface ReadingWithMeter extends Reading {
  meters?: {
    meter_number: string
    address: string
    city: string
    meter_type: string
  }
}

export function ReadingHistory({ meterId, routeArea, onClose }: ReadingHistoryProps) {
  const [readings, setReadings] = useState<ReadingWithMeter[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'with-photo' | 'with-notes'>('all')

  useEffect(() => {
    loadReadings()
  }, [meterId, routeArea, startDate, endDate, filterType])

  async function loadReadings() {
    setLoading(true)
    
    let query = supabase
      .from('readings')
      .select(`
        *,
        meters (
          meter_number,
          address,
          city,
          meter_type
        )
      `)
      .order('reading_timestamp', { ascending: false })
      .limit(50)

    // Apply filters
    if (meterId) {
      query = query.eq('meter_id', meterId)
    }
    
    if (routeArea && !meterId) {
      // Get meters in this route area first
      const { data: meters } = await supabase
        .from('meters')
        .select('id')
        .eq('zip_code', routeArea)
      
      if (meters) {
        const meterIds = meters.map(m => m.id)
        query = query.in('meter_id', meterIds)
      }
    }

    if (startDate) {
      query = query.gte('reading_timestamp', new Date(startDate).toISOString())
    }

    if (endDate) {
      // Add one day to include the end date
      const end = new Date(endDate)
      end.setDate(end.getDate() + 1)
      query = query.lte('reading_timestamp', end.toISOString())
    }

    if (filterType === 'with-photo') {
      query = query.not('photo_url', 'is', null)
    } else if (filterType === 'with-notes') {
      query = query.not('notes', 'is', null).neq('notes', '')
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading readings:', error)
    } else {
      setReadings(data || [])
    }
    
    setLoading(false)
  }

  function exportToCSV() {
    const headers = [
      'Date',
      'Meter Number',
      'Address',
      'Reading',
      'Unit',
      'Delta',
      'Type',
      'Photo',
      'Notes'
    ]

    const rows = readings.map(r => [
      new Date(r.reading_timestamp).toLocaleDateString(),
      r.meters?.meter_number || 'N/A',
      `${r.meters?.address || ''}, ${r.meters?.city || ''}`.trim(),
      r.value.toLocaleString(),
      r.unit,
      r.delta_value?.toFixed(2) || 'N/A',
      r.reading_type,
      r.photo_url ? 'Yes' : 'No',
      r.notes || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `readings-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function clearFilters() {
    setStartDate('')
    setEndDate('')
    setFilterType('all')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Reading History</h3>
            <p className="text-sm text-gray-600">
              {meterId ? 'Meter' : routeArea ? 'Route ' + routeArea : 'All'} readings
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-500" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Readings</option>
                <option value="with-photo">With Photos</option>
                <option value="with-notes">With Notes</option>
              </select>
            </div>

            <div className="flex-1" />

            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear Filters
            </button>

            <button
              onClick={exportToCSV}
              disabled={readings.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : readings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <FileText size={48} className="mb-4 text-gray-400" />
              <p>No readings found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Meter
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reading
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delta
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Photo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {readings.map((reading) => (
                  <tr key={reading.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {new Date(reading.reading_timestamp).toLocaleDateString()}
                      <div className="text-xs text-gray-500">
                        {new Date(reading.reading_timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-medium">{reading.meters?.meter_number || 'N/A'}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin size={10} />
                        {reading.meters?.address ? `${reading.meters.address}, ${reading.meters.city}` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">{reading.value.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{reading.unit}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {reading.delta_value !== null && reading.delta_value !== undefined ? (
                        <span className={reading.delta_value >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {reading.delta_value >= 0 ? '+' : ''}{reading.delta_value.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        reading.reading_type === 'actual' ? 'bg-blue-100 text-blue-700' :
                        reading.reading_type === 'estimated' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {reading.reading_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
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
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {reading.notes || <span className="text-gray-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {readings.length} reading{readings.length !== 1 ? 's' : ''}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

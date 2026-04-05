'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, ZoomIn, Flag, CheckCircle, Calendar, MapPin, Filter, Grid, List } from 'lucide-react'

interface PhotoReviewProps {
  onClose?: () => void
}

interface ReadingWithMeter {
  id: string
  meter_id: string
  reading_timestamp: string
  value: number
  unit: string
  photo_url: string | null
  notes: string | null
  reading_type: string
  meters: {
    meter_number: string
    address: string
    city: string
    zip_code: string
    meter_type: string
  } | null
  review_status?: 'pending' | 'verified' | 'flagged'
}

type ViewMode = 'grid' | 'list'
type FilterStatus = 'all' | 'pending' | 'verified' | 'flagged'

export function PhotoReview({ onClose }: PhotoReviewProps) {
  const [readings, setReadings] = useState<ReadingWithMeter[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [selectedRoute, setSelectedRoute] = useState<string>('all')
  const [selectedPhoto, setSelectedPhoto] = useState<ReadingWithMeter | null>(null)
  const [routes, setRoutes] = useState<string[]>([])

  useEffect(() => {
    loadPhotos()
    loadRoutes()
  }, [filterStatus, selectedRoute])

  async function loadPhotos() {
    setLoading(true)
    
    let query = supabase
      .from('readings')
      .select(`
        *,
        meters (
          meter_number,
          address,
          city,
          zip_code,
          meter_type
        )
      `)
      .not('photo_url', 'is', null)
      .order('reading_timestamp', { ascending: false })
      .limit(100)

    if (filterStatus === 'pending') {
      // Pending = no review metadata or review_status = 'pending'
      query = query.or('metadata->>review_status.is.null,metadata->>review_status.eq.pending')
    } else if (filterStatus === 'verified') {
      query = query.eq('metadata->>review_status', 'verified')
    } else if (filterStatus === 'flagged') {
      query = query.eq('metadata->>review_status', 'flagged')
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading photos:', error)
    } else {
      setReadings(data || [])
    }
    
    setLoading(false)
  }

  async function loadRoutes() {
    const { data, error } = await supabase
      .from('meters')
      .select('zip_code')
      .order('zip_code')
    
    if (data) {
      const uniqueRoutes = Array.from(new Set(data.map(m => m.zip_code || 'Unknown')))
      setRoutes(uniqueRoutes)
    }
  }

  async function updateReviewStatus(readingId: string, status: 'verified' | 'flagged') {
    const reading = readings.find(r => r.id === readingId)
    if (!reading) return

    const currentMetadata = reading.metadata || {}
    const updatedMetadata = {
      ...currentMetadata,
      review_status: status,
      reviewed_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('readings')
      .update({ metadata: updatedMetadata })
      .eq('id', readingId)

    if (error) {
      console.error('Error updating review status:', error)
    } else {
      // Update local state
      setReadings(prev => prev.map(r => 
        r.id === readingId 
          ? { ...r, metadata: updatedMetadata, review_status: status }
          : r
      ))
      
      // Close modal if open
      if (selectedPhoto?.id === readingId) {
        setSelectedPhoto(null)
      }
    }
  }

  function getReviewStatus(reading: ReadingWithMeter): 'pending' | 'verified' | 'flagged' {
    return (reading.metadata?.review_status as any) || 'pending'
  }

  function getStatusBadgeClass(status: 'pending' | 'verified' | 'flagged') {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-700 border-green-200'
      case 'flagged': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    }
  }

  function filteredReadings() {
    let filtered = readings
    
    if (selectedRoute !== 'all') {
      filtered = filtered.filter(r => r.meters?.zip_code === selectedRoute)
    }
    
    return filtered
  }

  const displayReadings = filteredReadings()

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Photo Review</h2>
            <p className="text-sm text-gray-600">Review your submitted meter reading photos</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Photos</option>
              <option value="pending">Pending Review</option>
              <option value="verified">Verified</option>
              <option value="flagged">Flagged</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-gray-500" />
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Routes</option>
              {routes.map(route => (
                <option key={route} value={route}>{route}</option>
              ))}
            </select>
          </div>

          <div className="flex-1" />

          <div className="text-sm text-gray-600">
            {displayReadings.length} photo{displayReadings.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : displayReadings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Grid size={64} className="mb-4 text-gray-300" />
            <p className="text-lg font-medium">No photos found</p>
            <p className="text-sm mt-1">
              {filterStatus === 'all' 
                ? 'Submit readings with photos to see them here'
                : `No ${filterStatus} photos`}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayReadings.map(reading => (
              <PhotoCard
                key={reading.id}
                reading={reading}
                onView={() => setSelectedPhoto(reading)}
                onVerify={() => updateReviewStatus(reading.id, 'verified')}
                onFlag={() => updateReviewStatus(reading.id, 'flagged')}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {displayReadings.map(reading => (
              <PhotoListItem
                key={reading.id}
                reading={reading}
                onView={() => setSelectedPhoto(reading)}
                onVerify={() => updateReviewStatus(reading.id, 'verified')}
                onFlag={() => updateReviewStatus(reading.id, 'flagged')}
              />
            ))}
          </div>
        )}
      </div>

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <PhotoDetailModal
          reading={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onVerify={() => updateReviewStatus(selectedPhoto.id, 'verified')}
          onFlag={() => updateReviewStatus(selectedPhoto.id, 'flagged')}
        />
      )}
    </div>
  )
}

// Photo Card Component (Grid View)
function PhotoCard({ 
  reading, 
  onView, 
  onVerify, 
  onFlag 
}: { 
  reading: ReadingWithMeter
  onView: () => void
  onVerify: () => void
  onFlag: () => void
}) {
  const status = (reading.metadata?.review_status as any) || 'pending'

  return (
    <div className={`bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${
      status === 'verified' ? 'border-green-200' : status === 'flagged' ? 'border-red-200' : 'border-gray-200'
    }`}>
      {/* Photo Thumbnail */}
      <div className="relative aspect-square bg-gray-100 cursor-pointer" onClick={onView}>
        {reading.photo_url ? (
          <img
            src={reading.photo_url}
            alt={`Meter ${reading.meters?.meter_number}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center text-gray-400">
            No photo
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadgeClass(status)}`}>
            {status}
          </span>
        </div>

        {/* Zoom Icon Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity flex items-center justify-center">
          <ZoomIn size={32} className="text-white opacity-0 hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="font-medium text-gray-900 text-sm truncate flex-1">
            {reading.meters?.meter_number || 'N/A'}
          </div>
          <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
            {new Date(reading.reading_timestamp).toLocaleDateString()}
          </div>
        </div>
        
        <div className="text-xs text-gray-600 mb-2 truncate">
          {reading.meters?.address}, {reading.meters?.city}
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Reading: <span className="font-medium">{reading.value.toLocaleString()} {reading.unit}</span></span>
        </div>

        {/* Actions */}
        {status === 'pending' && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={onVerify}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs"
            >
              <CheckCircle size={12} />
              Verify
            </button>
            <button
              onClick={onFlag}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs"
            >
              <Flag size={12} />
              Flag
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Photo List Item Component (List View)
function PhotoListItem({
  reading,
  onView,
  onVerify,
  onFlag
}: {
  reading: ReadingWithMeter
  onView: () => void
  onVerify: () => void
  onFlag: () => void
}) {
  const status = (reading.metadata?.review_status as any) || 'pending'

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-3 flex items-center gap-3 hover:shadow-md transition-shadow ${
      status === 'verified' ? 'border-green-200' : status === 'flagged' ? 'border-red-200' : 'border-gray-200'
    }`}>
      {/* Thumbnail */}
      <div 
        className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded cursor-pointer overflow-hidden"
        onClick={onView}
      >
        {reading.photo_url ? (
          <img
            src={reading.photo_url}
            alt={`Meter ${reading.meters?.meter_number}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center text-gray-400 text-xs">
            No photo
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900">{reading.meters?.meter_number || 'N/A'}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadgeClass(status)}`}>
            {status}
          </span>
        </div>
        <div className="text-sm text-gray-600 truncate">
          {reading.meters?.address}, {reading.meters?.city}
        </div>
        <div className="text-xs text-gray-500">
          {new Date(reading.reading_timestamp).toLocaleString()} • {reading.value.toLocaleString()} {reading.unit}
        </div>
      </div>

      {/* Actions */}
      {status === 'pending' && (
        <div className="flex gap-2">
          <button
            onClick={onVerify}
            className="p-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            title="Verify"
          >
            <CheckCircle size={16} />
          </button>
          <button
            onClick={onFlag}
            className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            title="Flag for Re-visit"
          >
            <Flag size={16} />
          </button>
        </div>
      )}

      <button
        onClick={onView}
        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <ZoomIn size={18} />
      </button>
    </div>
  )
}

// Photo Detail Modal
function PhotoDetailModal({
  reading,
  onClose,
  onVerify,
  onFlag
}: {
  reading: ReadingWithMeter
  onClose: () => void
  onVerify: () => void
  onFlag: () => void
}) {
  const status = (reading.metadata?.review_status as any) || 'pending'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {reading.meters?.meter_number || 'Meter Photo'}
            </h3>
            <p className="text-sm text-gray-600">
              {reading.meters?.address}, {reading.meters?.city}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 grid md:grid-cols-2 gap-4">
          {/* Photo */}
          <div className="bg-gray-100 rounded-lg overflow-hidden">
            {reading.photo_url ? (
              <img
                src={reading.photo_url}
                alt={`Meter ${reading.meters?.meter_number}`}
                className="w-full h-full object-contain max-h-[60vh]"
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                No photo available
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Reading Details</h4>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date</span>
                  <span className="font-medium">{new Date(reading.reading_timestamp).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reading</span>
                  <span className="font-medium">{reading.value.toLocaleString()} {reading.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type</span>
                  <span className="font-medium capitalize">{reading.reading_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeClass(status)}`}>
                    {status}
                  </span>
                </div>
              </div>
            </div>

            {reading.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                  {reading.notes}
                </div>
              </div>
            )}

            {/* Actions */}
            {status === 'pending' && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Review Actions</h4>
                <div className="flex gap-2">
                  <button
                    onClick={onVerify}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle size={18} />
                    Verify Photo
                  </button>
                  <button
                    onClick={onFlag}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Flag size={18} />
                    Flag for Re-visit
                  </button>
                </div>
              </div>
            )}

            {status !== 'pending' && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                This photo has been {status}. No further action needed.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

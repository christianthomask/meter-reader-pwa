'use client'

import { useState } from 'react'
import { Camera, MapPin, AlertTriangle, CheckCircle, TrendingUp, Navigation, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface MeterReadingFormProps {
  meterId: string
  meterAddress: string
  previousReading: number
  onSubmit?: (reading: number, photoUrl: string, gps: { lat: number; lng: number }) => void
  onCancel: () => void
  onSuccess?: () => void
}

export function MeterReadingForm({
  meterId,
  meterAddress,
  previousReading,
  onSubmit,
  onCancel,
  onSuccess
}: MeterReadingFormProps) {
  const [reading, setReading] = useState('')
  const [notes, setNotes] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoUploadProgress, setPhotoUploadProgress] = useState<number | null>(null)
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const readingValue = parseFloat(reading)
  const isValid = !isNaN(readingValue) && readingValue > 0
  const percentageChange = isValid
    ? ((readingValue - previousReading) / previousReading) * 100
    : 0

  const hasRecheck = Math.abs(percentageChange) > 40

  const captureGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          setGpsAccuracy(position.coords.accuracy)
        },
        (error) => {
          console.error('GPS error:', error)
          // Use mock coordinates for demo
          setGpsCoordinates({
            lat: 34.0522 + (Math.random() - 0.5) * 0.01,
            lng: -118.2437 + (Math.random() - 0.5) * 0.01
          })
          setGpsAccuracy(8)
        }
      )
    }
  }

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSubmitError('Please select an image file')
      return
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setSubmitError('Image must be less than 10MB')
      return
    }
    
    setPhotoFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!isValid || !gpsCoordinates) return
    
    setIsSubmitting(true)
    setSubmitError(null)
    
    let photoUrl = ''
    
    try {
      // Upload photo if selected
      if (photoFile) {
        setPhotoUploadProgress(0)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('meter-photos')
          .upload(`readings/${meterId}/${Date.now()}-${photoFile.name}`, photoFile, {
            cacheControl: '3600',
            upsert: false
          })
        
        if (uploadError) throw uploadError
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('meter-photos')
          .getPublicUrl(uploadData.path)
        
        photoUrl = urlData.publicUrl
        setPhotoUploadProgress(100)
      }
      
      // Insert reading into database
      const { data, error } = await supabase
        .from('readings')
        .insert({
          meter_id: meterId,
          reading_timestamp: new Date().toISOString(),
          value: readingValue,
          unit: 'units', // TODO: Get from meter type
          reading_type: 'actual',
          source: 'manual',
          previous_value: previousReading,
          delta_value: readingValue - previousReading,
          photo_url: photoUrl || null,
          notes: notes || null,
          metadata: {
            gps_accuracy: gpsAccuracy,
            captured_at: new Date().toISOString()
          }
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Update meter's last_reading_date
      const { error: meterError } = await supabase
        .from('meters')
        .update({ last_reading_date: new Date().toISOString() })
        .eq('id', meterId)
      
      if (meterError) throw meterError
      
      // Call parent callback if provided
      if (onSubmit) {
        onSubmit(readingValue, photoUrl, gpsCoordinates)
      }
      
      // Call success callback
      if (onSuccess) {
        onSuccess()
      }
      
    } catch (err: any) {
      console.error('Submit error:', err)
      setSubmitError(err.message || 'Failed to submit reading')
    } finally {
      setIsSubmitting(false)
      setPhotoUploadProgress(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Record Meter Reading</h3>
            <div className="text-sm text-gray-600 mt-1">{meterId}</div>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Address */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={16} />
            <span>{meterAddress}</span>
          </div>

          {/* GPS Capture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GPS Location
            </label>
            {gpsCoordinates ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-green-900">Location Captured</div>
                    <div className="text-xs text-green-700 mt-1">
                      {gpsCoordinates.lat.toFixed(4)}, {gpsCoordinates.lng.toFixed(4)}
                    </div>
                    {gpsAccuracy && (
                      <div className={`text-xs mt-1 ${
                        gpsAccuracy <= 10 ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        Accuracy: ±{gpsAccuracy.toFixed(1)}m
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={captureGPS}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
              >
                <Navigation size={20} />
                <span>Capture GPS Location</span>
              </button>
            )}
          </div>

          {/* Reading Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meter Reading
            </label>
            <input
              type="number"
              value={reading}
              onChange={(e) => setReading(e.target.value)}
              placeholder="Enter reading value"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
            <div className="text-sm text-gray-600 mt-1">
              Previous reading: {previousReading.toLocaleString()}
            </div>
          </div>

          {/* Notes Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any observations or comments..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
            />
          </div>

          {/* Validation Feedback */}
          {isValid && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Change from previous</span>
                <div className={`flex items-center gap-1 font-medium ${
                  hasRecheck ? 'text-orange-600' : 'text-green-600'
                }`}>
                  <TrendingUp size={16} />
                  <span>{percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%</span>
                </div>
              </div>

              {hasRecheck && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={20} className="text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-orange-900">
                        Recheck Required
                      </div>
                      <div className="text-xs text-orange-700 mt-1">
                        This reading is {Math.abs(percentageChange).toFixed(0)}% {percentageChange > 0 ? 'higher' : 'lower'} than the previous reading. Photo verification recommended.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Photo Capture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo {hasRecheck && <span className="text-orange-600">(Recommended)</span>}
            </label>
            
            {photoPreview ? (
              <div className="space-y-2">
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Meter preview"
                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    onClick={() => {
                      setPhotoFile(null)
                      setPhotoPreview(null)
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                    type="button"
                  >
                    <X size={16} />
                  </button>
                </div>
                {photoUploadProgress !== null && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${photoUploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <label className="w-full p-3 border-2 border-dashed rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer
                border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600">
                <Camera size={20} />
                <span>Take Photo or Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="px-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-900">{submitError}</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 flex gap-2">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || !gpsCoordinates || isSubmitting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              'Submit Reading'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

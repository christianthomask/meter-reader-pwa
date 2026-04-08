'use client'

import { useState } from 'react'
import { X, AlertTriangle, Loader2 } from 'lucide-react'

interface RejectionReasonModalProps {
  isOpen: boolean
  onClose: (rejected: boolean, reason?: string) => void
  readingId: string
  onRejectComplete: () => void
}

const REJECTION_REASONS: Record<string, string> = {
  high_usage: 'Usage exceeds 40% increase from previous reading',
  low_usage: 'Usage significantly below normal range',
  zero_reading: 'Zero reading submitted - possible skip',
  negative_reading: 'Negative delta detected',
  photo_unclear: 'Photo is blurry or meter number unreadable',
  gps_mismatch: 'GPS location does not match meter address',
  other: 'Other (please specify)'
}

export function RejectionReasonModal({
  isOpen,
  onClose,
  readingId,
  onRejectComplete
}: RejectionReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [rejectionText, setRejectionText] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  function handleReasonSelect(reasonKey: string) {
    setSelectedReason(reasonKey)
    setRejectionText(REJECTION_REASONS[reasonKey] || '')
  }

  function handleTextChange(text: string) {
    setRejectionText(text)
    if (selectedReason !== 'custom') {
      setSelectedReason('custom')
    }
  }

  async function handleSubmit() {
    if (!rejectionText.trim()) {
      setError('Please provide a rejection reason')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const { supabase } = await import('@/lib/supabase')
      
      const { error } = await supabase
        .from('readings')
        .update({
          status: 'rejected',
          rejection_reason: rejectionText.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', readingId)

      if (error) throw error

      onRejectComplete()
      onClose(true, rejectionText)
    } catch (err: any) {
      console.error('Rejection error:', err)
      setError(err.message || 'Failed to reject reading')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Reject Reading</h3>
          </div>
          <button onClick={() => onClose(false)} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Rejection <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => handleReasonSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Select a reason...</option>
              {Object.entries(REJECTION_REASONS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Details <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={rejectionText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Add any additional details about why this reading needs to be re-done..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Pre-populated from selection above. You can edit this text.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            type="button"
            onClick={() => onClose(false)}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !rejectionText.trim()}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? 'Rejecting...' : 'Reject Reading'}
          </button>
        </div>
      </div>
    </div>
  )
}

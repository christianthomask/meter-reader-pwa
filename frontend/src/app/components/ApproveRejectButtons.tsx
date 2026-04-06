'use client'

import { useState } from 'react'
import { CheckCircle, Flag, Loader2, Edit, Check } from 'lucide-react'
import { RejectionReasonModal } from './RejectionReasonModal'

interface ApproveRejectButtonsProps {
  readingId: string
  currentValue?: number
  onApproveComplete: (edited?: boolean, newValue?: number) => void
  onRejectComplete: () => void
  size?: 'sm' | 'md' | 'lg'
}

export function ApproveRejectButtons({
  readingId,
  currentValue,
  onApproveComplete,
  onRejectComplete,
  size = 'md'
}: ApproveRejectButtonsProps) {
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedValue, setEditedValue] = useState(currentValue?.toString() || '')

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  async function handleApprove(editedValueParam?: string) {
    setIsApproving(true)
    setError(null)

    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      
      const isEdited = editedValueParam !== undefined || (isEditing && editedValue !== currentValue?.toString())
      const finalValue = isEdited ? parseFloat(editedValueParam || editedValue) : currentValue
      
      const updateData: any = {
        status: 'approved',
        updated_at: new Date().toISOString()
      }

      if (isEdited && finalValue !== undefined) {
        updateData.value = finalValue
        updateData.original_value = currentValue
        updateData.edited_by = user?.id
        updateData.edited_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('readings')
        .update(updateData)
        .eq('id', readingId)

      if (error) throw error

      onApproveComplete(isEdited, finalValue)
    } catch (err: any) {
      console.error('Approval error:', err)
      setError(err.message || 'Failed to approve reading')
    } finally {
      setIsApproving(false)
    }
  }

  function handleRejectClick() {
    setShowRejectModal(true)
  }

  function handleRejectComplete() {
    onRejectComplete()
  }

  return (
    <>
      {/* Reading Value Edit */}
      {currentValue !== undefined && (
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-600 block mb-1">Reading Value</label>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={editedValue}
                onChange={(e) => setEditedValue(e.target.value)}
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                step="0.01"
              />
              <button
                onClick={() => {
                  setIsEditing(false)
                  setEditedValue(currentValue.toString())
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                title="Cancel edit"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                title="Save edit"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-gray-900">{currentValue.toLocaleString()}</span>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Edit value"
              >
                <Edit size={14} />
              </button>
            </div>
          )}
          {isEditing && currentValue?.toString() !== editedValue && (
            <p className="text-xs text-orange-600 mt-1">
              Original: {currentValue.toLocaleString()} → Edited: {editedValue}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => handleApprove(isEditing ? editedValue : undefined)}
          disabled={isApproving}
          className={`${sizeClasses[size]} bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1`}
          title="Approve reading"
        >
          {isApproving ? (
            <Loader2 size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} className="animate-spin" />
          ) : (
            <CheckCircle size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />
          )}
          {size !== 'sm' && (isApproving ? 'Approving...' : 'Approve')}
        </button>
        <button
          onClick={handleRejectClick}
          disabled={isRejecting}
          className={`${sizeClasses[size]} bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1`}
          title="Reject reading"
        >
          <Flag size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />
          {size !== 'sm' && 'Reject'}
        </button>
      </div>

      {showRejectModal && (
        <RejectionReasonModal
          isOpen={showRejectModal}
          onClose={(rejected, reason) => {
            setShowRejectModal(false)
            if (rejected) {
              handleRejectComplete()
            }
          }}
          readingId={readingId}
          onRejectComplete={handleRejectComplete}
        />
      )}

      {error && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
    </>
  )
}

'use client'

import { useState } from 'react'
import { CheckCircle, Flag, Loader2 } from 'lucide-react'
import { RejectionReasonModal } from './RejectionReasonModal'

interface ApproveRejectButtonsProps {
  readingId: string
  onApproveComplete: () => void
  onRejectComplete: () => void
  size?: 'sm' | 'md' | 'lg'
}

export function ApproveRejectButtons({
  readingId,
  onApproveComplete,
  onRejectComplete,
  size = 'md'
}: ApproveRejectButtonsProps) {
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  async function handleApprove() {
    setIsApproving(true)
    setError(null)

    try {
      const { supabase } = await import('@/lib/supabase')
      
      const { error } = await supabase
        .from('readings')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', readingId)

      if (error) throw error

      onApproveComplete()
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
      <div className="flex gap-2">
        <button
          onClick={handleApprove}
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

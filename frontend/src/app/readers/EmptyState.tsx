'use client'

import { UserPlus } from 'lucide-react'

interface EmptyStateProps {
  onAddReader: () => void
}

export function EmptyState({ onAddReader }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-lg border border-gray-200">
      <div className="bg-gray-100 rounded-full p-4 mb-4">
        <UserPlus size={48} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No readers yet</h3>
      <p className="text-gray-600 text-center mb-6 max-w-md">
        Click 'Add Reader' to get started. Add your field team members to assign routes and track readings.
      </p>
      <button
        onClick={onAddReader}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        <UserPlus size={18} />
        Add Reader
      </button>
    </div>
  )
}

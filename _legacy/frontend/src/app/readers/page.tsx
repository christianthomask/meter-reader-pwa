'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Users, Plus, AlertCircle, Loader2 as LoaderIcon } from 'lucide-react'
import { ReadersTable } from './ReadersTable'
import { EmptyState } from './EmptyState'

interface Reader {
  id: string
  manager_id: string
  email: string
  full_name: string
  phone: string | null
  active: boolean
  assigned_routes_count: number
  completed_readings_count: number
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export default function ReadersPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [readers, setReaders] = useState<Reader[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingReader, setEditingReader] = useState<Reader | null>(null)

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.push('/login')
        return
      }
      setUser(session.user)
      loadReaders(session.user.id)
    })
  }, [router])

  async function loadReaders(managerId: string) {
    setLoading(true)
    setError(null)

    try {
      // Fetch readers from Supabase (readers table where manager_id = auth.uid())
      // RLS policy ensures only current manager's readers are returned
      const { data, error } = await supabase
        .from('readers')
        .select('*')
        .eq('manager_id', managerId)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setReaders(data || [])
    } catch (err: any) {
      console.error('Error loading readers:', err)
      setError(err.message || 'Failed to load readers')
    } finally {
      setLoading(false)
    }
  }

  function handleAddReader() {
    setShowAddModal(true)
  }

  function handleEditReader(reader: Reader) {
    setEditingReader(reader)
    setShowAddModal(true)
  }

  function handleModalClose(refresh: boolean = false) {
    setShowAddModal(false)
    setEditingReader(null)
    if (refresh) {
      loadReaders(user.id)
    }
  }

  async function handleDeleteReader(reader: Reader) {
    if (!confirm(`Are you sure you want to delete "${reader.full_name}"? This cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('readers')
        .delete()
        .eq('id', reader.id)

      if (error) throw error

      // Remove from local state
      setReaders(prev => prev.filter(r => r.id !== reader.id))
    } catch (err: any) {
      console.error('Error deleting reader:', err)
      alert('Failed to delete reader: ' + (err.message || 'Unknown error'))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoaderIcon size={48} className="animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Loading readers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-lg p-2">
                <Users size={24} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Readers Management</h1>
                <p className="text-sm text-gray-600">Manage your field team members</p>
              </div>
            </div>
            <button
              onClick={handleAddReader}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus size={18} />
              Add Reader
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Error loading readers</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        ) : readers.length === 0 ? (
          <EmptyState onAddReader={handleAddReader} />
        ) : (
          <ReadersTable
            readers={readers}
            onEdit={handleEditReader}
            onDelete={handleDeleteReader}
          />
        )}

        {/* Reader count */}
        {readers.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Showing {readers.length} reader{readers.length !== 1 ? 's' : ''}
          </div>
        )}
      </main>

      {/* Add/Edit Reader Modal */}
      {showAddModal && (
        <AddReaderModal
          reader={editingReader}
          onClose={handleModalClose}
          managerId={user?.id}
        />
      )}
    </div>
  )
}

// Inline AddReaderModal for HANDOFF-01/02 continuity
// Will be extracted to separate file in HANDOFF-02 if needed
function AddReaderModal({
  reader,
  onClose,
  managerId
}: {
  reader: Reader | null
  onClose: (refresh: boolean) => void
  managerId: string
}) {
  const [formData, setFormData] = useState({
    full_name: reader?.full_name || '',
    email: reader?.email || '',
    phone: reader?.phone || '',
    active: reader?.active ?? true
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!reader

  function validateForm() {
    if (!formData.full_name.trim() || formData.full_name.length < 2) {
      return 'Name must be at least 2 characters'
    }
    if (!formData.email.trim()) {
      return 'Email is required'
    }
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      return 'Invalid email format'
    }
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)

    try {
      if (isEdit) {
        // Update existing reader
        const { error } = await supabase
          .from('readers')
          .update({
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone || null,
            active: formData.active
          })
          .eq('id', reader.id)

        if (error) throw error
      } else {
        // Create new reader
        const { error } = await supabase
          .from('readers')
          .insert({
            manager_id: managerId,
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone || null,
            active: true
          })

        if (error) throw error
      }

      onClose(true)
    } catch (err: any) {
      console.error('Save error:', err)
      if (err.code === '23505') {
        // Unique constraint violation (duplicate email)
        setError('A reader with this email already exists')
      } else {
        setError(err.message || 'Failed to save reader')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Reader' : 'Add Reader'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {isEdit ? 'Update reader information' : 'Add a new team member'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="John Doe"
              required
              minLength={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          {isEdit && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="active" className="text-sm text-gray-700">
                Active (can be assigned routes)
              </label>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => onClose(false)}
              disabled={saving}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <LoaderIcon size={16} className="animate-spin" />}
              {saving ? 'Saving...' : isEdit ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

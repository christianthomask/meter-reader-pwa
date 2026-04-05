'use client'

import { User, Mail, Phone, Activity, Edit2, Trash2 } from 'lucide-react'

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

interface ReadersTableProps {
  readers: Reader[]
  onEdit: (reader: Reader) => void
  onDelete?: (reader: Reader) => void
}

export function ReadersTable({ readers, onEdit, onDelete }: ReadersTableProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Routes
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Readings
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {readers.map((reader) => (
              <tr key={reader.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-100 rounded-full p-2">
                      <User size={16} className="text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-900">{reader.full_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={14} className="text-gray-400" />
                    <span className="text-sm">{reader.email}</span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {reader.phone ? (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone size={14} className="text-gray-400" />
                      <span className="text-sm">{reader.phone}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      reader.active
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    <Activity size={12} />
                    {reader.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {reader.assigned_routes_count}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {reader.completed_readings_count}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(reader)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit reader"
                    >
                      <Edit2 size={16} />
                    </button>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(reader)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete reader"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

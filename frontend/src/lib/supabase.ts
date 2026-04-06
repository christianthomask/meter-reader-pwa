import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type helpers
export type User = {
  id: string
  email: string
  full_name?: string
  phone?: string
  timezone?: string
  preferences?: Record<string, any>
}

export type Meter = {
  id: string
  user_id: string
  meter_number: string
  meter_type: 'water' | 'electric' | 'gas' | 'solar'
  manufacturer?: string
  model?: string
  serial_number?: string
  install_date?: string
  location?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  status: 'active' | 'inactive' | 'maintenance' | 'decommissioned'
  last_reading_date?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export type Reading = {
  id: string
  meter_id: string
  reader_id?: string | null
  reading_timestamp: string
  value: number
  unit: string
  reading_type: 'actual' | 'estimated' | 'adjusted' | 'self_read'
  source: 'manual' | 'api' | 'iot_device' | 'import' | 'ocr'
  previous_value?: number
  delta_value?: number
  cost?: number
  metadata?: Record<string, any>
  photo_url?: string
  notes?: string
  reader_notes?: string | null
  status: 'pending' | 'approved' | 'rejected' | 'certified'
  rejection_reason?: string | null
  is_exception: boolean
  original_value?: number | null
  edited_by?: string | null
  edited_at?: string | null
  needs_reread: boolean
  created_at: string
  updated_at: string
}

export type City = {
  id: string
  name: string
  status: 'read_pending' | 'active' | 'complete' | 'ready_to_download'
  total_meters: number
  meters_read: number
  created_at: string
  updated_at: string
}

export type Route = {
  id: string
  city_id: string
  name: string
  status: 'unassigned' | 'assigned' | 'in-progress' | 'completed'
  total_meters: number
  meters_read: number
  created_at: string
  updated_at: string
}

export type Reader = {
  id: string
  manager_id: string
  full_name: string
  email: string
  phone?: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export type RouteAssignment = {
  id: string
  route_id: string
  reader_id: string
  manager_id: string
  status: 'assigned' | 'in-progress' | 'completed' | 'cancelled'
  started_at?: string
  completed_at?: string
  meters_total: number
  meters_read: number
  meters_pending: number
  notes?: string | null
  created_at: string
  updated_at: string
}

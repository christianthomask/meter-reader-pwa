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
  created_at: string
  updated_at: string
}

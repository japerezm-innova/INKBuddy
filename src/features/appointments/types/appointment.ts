export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export interface Appointment {
  id: string
  studio_id: string
  client_id: string | null
  artist_id: string
  service_id: string | null
  status: AppointmentStatus
  starts_at: string
  ends_at: string
  price: number | null
  deposit: number | null
  notes: string | null
  client_name: string | null
  client_phone: string | null
  client_email: string | null
  design_reference_urls: string[] | null
  body_placement: string | null
  external_calendar_id: string | null
  consent_accepted: boolean
  consent_accepted_at: string | null
  consent_name: string | null
  created_at: string
  updated_at: string
  // Joined relations
  artist?: { id: string; full_name: string | null; avatar_url: string | null }
  client?: { id: string; full_name: string; phone: string | null }
  service?: { id: string; name: string; duration_minutes: number }
}

export interface Service {
  id: string
  studio_id: string
  name: string
  description: string | null
  duration_minutes: number
  price_min: number | null
  price_max: number | null
  is_active: boolean
}

export interface ArtistAvailability {
  id: string
  artist_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
}

export interface TimeSlot {
  start: string // ISO datetime
  end: string // ISO datetime
  available: boolean
}

export type CalendarViewMode = 'day' | 'week'

export interface CreateAppointmentInput {
  client_id?: string
  artist_id: string
  service_id?: string
  starts_at: string
  ends_at: string
  price?: number
  deposit?: number
  notes?: string
  client_name?: string
  client_phone?: string
  client_email?: string
  body_placement?: string
  design_reference_urls?: string[]
  consent_accepted?: boolean
  consent_accepted_at?: string
  consent_name?: string
}

export interface UpdateAppointmentInput {
  status?: AppointmentStatus
  starts_at?: string
  ends_at?: string
  price?: number
  deposit?: number
  notes?: string
  client_name?: string
  client_phone?: string
  body_placement?: string
}

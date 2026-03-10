export type BookingStep = 'artist' | 'service' | 'datetime' | 'details' | 'confirmation'

export interface BookingFormData {
  artistId: string
  artistName: string
  serviceId: string
  serviceName: string
  serviceDurationMinutes: number
  date: string
  startTime: string
  endTime: string
  clientName: string
  clientEmail: string
  clientPhone: string
  bodyPlacement: string
  notes: string
  designReferenceUrls: string
}

export interface PublicArtist {
  id: string
  full_name: string | null
  avatar_url: string | null
  specialties: string[] | null
  bio: string | null
}

export interface PublicService {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  price_min: number | null
  price_max: number | null
}

export interface PublicTimeSlot {
  start: string
  end: string
}

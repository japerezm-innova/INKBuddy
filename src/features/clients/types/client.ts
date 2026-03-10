export interface Client {
  id: string
  studio_id: string
  full_name: string
  email: string | null
  phone: string | null
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
  birth_date: string | null
  profession: string | null
  notes: string | null
  source: 'walk_in' | 'instagram' | 'referral' | 'website' | 'other' | null
  created_at: string
  updated_at: string
}

export interface ClientWithStats extends Client {
  total_appointments: number
  last_appointment_date: string | null
}

export interface CreateClientInput {
  full_name: string
  email?: string
  phone?: string
  gender?: Client['gender']
  birth_date?: string
  profession?: string
  notes?: string
  source?: Client['source']
}

export interface UpdateClientInput extends Partial<CreateClientInput> {}

export interface ClientFilter {
  search?: string
  source?: Client['source']
  gender?: Client['gender']
}

export type Role = 'owner' | 'artist'

export interface Profile {
  id: string
  studio_id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: Role
  phone: string | null
  bio: string | null
  specialties: string[] | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: { id: string; email: string } | null
  profile: Profile | null
  isLoading: boolean
}

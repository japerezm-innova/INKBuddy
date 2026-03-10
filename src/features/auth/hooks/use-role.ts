'use client'

import type { Role } from '../types/auth'
import { useAuth } from './use-auth'

interface UseRoleReturn {
  isOwner: boolean
  isArtist: boolean
  role: Role | null
}

export function useRole(): UseRoleReturn {
  const { profile } = useAuth()

  const role = profile?.role ?? null

  return {
    isOwner: role === 'owner',
    isArtist: role === 'artist',
    role,
  }
}

'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AuthState, Profile } from '../types/auth'

export function useAuth(): AuthState & { refreshProfile: () => Promise<void> } {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
  })

  const fetchProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error || !data) {
        return null
      }

      return data as Profile
    },
    []
  )

  const refreshProfile = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      return
    }

    const profile = await fetchProfile(user.id)
    setState((prev) => ({ ...prev, profile }))
  }, [fetchProfile])

  useEffect(() => {
    const supabase = createClient()

    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user?.email) {
        const profile = await fetchProfile(session.user.id)
        setState({
          user: { id: session.user.id, email: session.user.email },
          profile,
          isLoading: false,
        })
      } else {
        setState({ user: null, profile: null, isLoading: false })
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user?.email) {
        const profile = await fetchProfile(session.user.id)
        setState({
          user: { id: session.user.id, email: session.user.email },
          profile,
          isLoading: false,
        })
      } else {
        setState({ user: null, profile: null, isLoading: false })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  return { ...state, refreshProfile }
}

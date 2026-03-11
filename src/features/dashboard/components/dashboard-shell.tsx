'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { OwnerDashboard } from './owner-dashboard'
import { ArtistDashboard } from './artist-dashboard'
import type { Profile } from '@/features/auth/types/auth'

function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6 animate-pulse space-y-6" aria-label="Cargando dashboard">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-white/40 rounded-2xl" />
        <div className="h-4 w-36 bg-white/30 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 bg-white/30 rounded-3xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 h-48 bg-white/30 rounded-3xl" />
        <div className="lg:col-span-2 h-48 bg-white/30 rounded-3xl" />
      </div>
    </div>
  )
}

export function DashboardShell() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error || !data) {
        router.push('/login')
        return
      }

      setProfile(data as Profile)
      setLoading(false)
    }

    loadProfile()
  }, [router])

  if (loading) return <DashboardSkeleton />

  if (!profile) return null

  return profile.role === 'owner' ? (
    <OwnerDashboard profile={profile} />
  ) : (
    <ArtistDashboard profile={profile} />
  )
}

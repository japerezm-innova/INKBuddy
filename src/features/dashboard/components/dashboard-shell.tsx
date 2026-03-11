'use client'

import { useEffect, useState } from 'react'
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

function LoginPrompt() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center">
      <div className="h-16 w-16 rounded-full bg-ink-orange/20 flex items-center justify-center mb-2">
        <span className="text-3xl">🔐</span>
      </div>
      <h2 className="text-xl font-bold text-ink-dark">Sesion expirada</h2>
      <p className="text-sm text-ink-dark/60 max-w-xs">
        Tu sesion ha expirado. Ingresa de nuevo para continuar.
      </p>
      <a
        href="/login"
        className="mt-2 px-6 py-3 rounded-2xl bg-ink-orange text-white font-medium text-sm hover:bg-ink-orange/90 transition-colors"
      >
        Iniciar sesion
      </a>
    </div>
  )
}

export function DashboardShell() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'unauthenticated'>('loading')

  useEffect(() => {
    fetch('/api/me')
      .then((res) => {
        if (res.status === 401) {
          setStatus('unauthenticated')
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (data?.profile) {
          setProfile(data.profile as Profile)
          setStatus('ready')
        }
      })
      .catch(() => setStatus('unauthenticated'))
  }, [])

  if (status === 'loading') return <DashboardSkeleton />
  if (status === 'unauthenticated') return <LoginPrompt />
  if (!profile) return null

  return profile.role === 'owner' ? (
    <OwnerDashboard profile={profile} />
  ) : (
    <ArtistDashboard profile={profile} />
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  ProfileSettings,
  AccountSettings,
  PlatformSettings,
  ComingSoonSection,
  CalendarSettings,
} from '@/features/settings/components'
import type { Profile } from '@/features/auth/types/auth'
import type { StudioSettings } from '../types/settings'
import { DEFAULT_STUDIO_SETTINGS } from '../types/settings'

interface SettingsData {
  profile: Profile
  studioSettings: StudioSettings
  calendarToken: string | null
  isOwner: boolean
  baseUrl: string
}

function SettingsSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto animate-pulse space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-2xl bg-white/30" />
        <div className="space-y-2">
          <div className="h-7 w-40 bg-white/40 rounded-xl" />
          <div className="h-4 w-52 bg-white/30 rounded-lg" />
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-48 bg-white/30 rounded-3xl" />
      ))}
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

export function SettingsShell() {
  const [data, setData] = useState<SettingsData | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'unauthenticated'>('loading')

  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setStatus('unauthenticated')
          return
        }

        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profileError || !profile) {
            setStatus('unauthenticated')
            return
          }

          const { data: studio } = await supabase
            .from('studios')
            .select('settings, calendar_token')
            .eq('id', profile.studio_id)
            .single()

          const rawSettings = (studio?.settings ?? {}) as Partial<StudioSettings>
          const studioSettings: StudioSettings = {
            ...DEFAULT_STUDIO_SETTINGS,
            ...rawSettings,
            platforms: {
              ...DEFAULT_STUDIO_SETTINGS.platforms,
              ...(rawSettings.platforms ?? {}),
            },
          }

          setData({
            profile: profile as Profile,
            studioSettings,
            calendarToken: studio?.calendar_token ?? null,
            isOwner: profile.role === 'owner',
            baseUrl: window.location.origin,
          })
          setStatus('ready')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (status === 'loading') return <SettingsSkeleton />
  if (status === 'unauthenticated') return <LoginPrompt />
  if (!data) return null

  const { profile, studioSettings, calendarToken, isOwner, baseUrl } = data

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <header className="mb-6 flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-2xl gradient-accent flex items-center justify-center shadow-warm shrink-0"
          aria-hidden="true"
        >
          <Settings className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-ink-dark">
            Configuracion
          </h1>
          <p className="text-sm text-ink-dark/50 mt-0.5">
            Administra tu perfil y preferencias
          </p>
        </div>
      </header>

      <main className="space-y-6">
        <ProfileSettings profile={profile} />
        <AccountSettings profile={profile} />
        {isOwner && (
          <PlatformSettings initialSettings={studioSettings} isOwner={isOwner} />
        )}
        {calendarToken && (
          <CalendarSettings baseUrl={baseUrl} initialToken={calendarToken} />
        )}
        <ComingSoonSection />
      </main>
    </div>
  )
}

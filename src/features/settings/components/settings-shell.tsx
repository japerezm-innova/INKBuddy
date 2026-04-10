'use client'

import { useEffect, useState } from 'react'
import { Settings } from 'lucide-react'
import {
  ProfileSettings,
  AccountSettings,
  PlatformSettings,
  ComingSoonSection,
  CalendarSettings,
  ActivationSettings,
  StudioAssociationSettings,
} from '@/features/settings/components'
import { ThemeSettings } from './theme-settings'
import type { ThemeId } from './theme-settings'
import { updateStudioTheme } from '../services/settings-service'
import type { Profile } from '@/features/auth/types/auth'
import type { StudioSettings } from '../types/settings'
import { DEFAULT_STUDIO_SETTINGS } from '../types/settings'

interface MeResponse {
  profile: Profile & {
    studio?: {
      settings?: Partial<StudioSettings>
      calendar_token?: string
      plan?: string
    }
  }
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
  const [profile, setProfile] = useState<Profile | null>(null)
  const [studioSettings, setStudioSettings] = useState<StudioSettings>(DEFAULT_STUDIO_SETTINGS)
  const [calendarToken, setCalendarToken] = useState<string | null>(null)
  const [studioPlan, setStudioPlan] = useState<string>('free')
  const [studioTheme, setStudioTheme] = useState<ThemeId>('original')
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
      .then((data: MeResponse | null) => {
        if (data?.profile) {
          setProfile(data.profile)

          const raw = data.profile.studio?.settings ?? {}
          setStudioSettings({
            ...DEFAULT_STUDIO_SETTINGS,
            ...raw,
            platforms: {
              ...DEFAULT_STUDIO_SETTINGS.platforms,
              ...(raw.platforms ?? {}),
            },
          })
          setCalendarToken(data.profile.studio?.calendar_token ?? null)
          setStudioPlan(data.profile.studio?.plan ?? 'free')
          setStudioTheme(((raw as Record<string, unknown>).theme as ThemeId) ?? 'original')
          setStatus('ready')
        }
      })
      .catch(() => setStatus('unauthenticated'))
  }, [])

  if (status === 'loading') return <SettingsSkeleton />
  if (status === 'unauthenticated') return <LoginPrompt />
  if (!profile) return null

  const isOwner = profile.role === 'owner'
  const baseUrl = window.location.origin

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
          <h1 className="text-2xl md:text-3xl font-bold text-ink-dark">Configuracion</h1>
          <p className="text-sm text-ink-dark/50 mt-0.5">Administra tu perfil y preferencias</p>
        </div>
      </header>

      <main className="space-y-6">
        <ProfileSettings profile={profile} />
        <ThemeSettings currentTheme={studioTheme} onThemeChange={updateStudioTheme} />
        <StudioAssociationSettings />
        <AccountSettings profile={profile} />
        {isOwner && (
          <>
            <PlatformSettings initialSettings={studioSettings} isOwner={isOwner} />
            <ActivationSettings currentPlan={studioPlan} />
          </>
        )}
        {calendarToken && <CalendarSettings baseUrl={baseUrl} initialToken={calendarToken} />}
        <ComingSoonSection />
      </main>
    </div>
  )
}

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getProfile } from '@/features/auth/services/auth-service'
import { getStudioSettings, getCalendarToken } from '@/features/settings/services/settings-service'
import {
  ProfileSettings,
  AccountSettings,
  PlatformSettings,
  ComingSoonSection,
  CalendarSettings,
} from '@/features/settings/components'
import { Settings } from 'lucide-react'
import { DEFAULT_STUDIO_SETTINGS } from '@/features/settings/types/settings'

export const metadata = {
  title: 'Configuracion | INKBuddy',
  description: 'Configura tu perfil y preferencias del estudio',
}

export default async function SettingsPage() {
  const { data: profile } = await getProfile()

  if (!profile) {
    redirect('/login')
  }

  const [{ data: settings }, { data: calendarToken }] = await Promise.all([
    getStudioSettings(),
    getCalendarToken(),
  ])
  const studioSettings = settings ?? DEFAULT_STUDIO_SETTINGS
  const isOwner = profile.role === 'owner'

  const headersList = await headers()
  const host = headersList.get('host') ?? 'inkbuddycl.vercel.app'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const baseUrl = `${proto}://${host}`

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

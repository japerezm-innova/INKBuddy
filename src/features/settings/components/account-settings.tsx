'use client'

import { Mail, Shield, Calendar, LogOut } from 'lucide-react'
import { GlassCard, GlassButton } from '@/shared/components'
import { signOut } from '@/features/auth/services/auth-service'
import type { Profile } from '@/features/auth/types/auth'

interface Props {
  profile: Profile
}

export function AccountSettings({ profile }: Props) {
  const memberSince = new Date(profile.created_at).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const isOwner = profile.role === 'owner'

  async function handleSignOut() {
    const confirmed = window.confirm('Seguro que deseas cerrar sesion?')
    if (confirmed) {
      await signOut()
    }
  }

  return (
    <GlassCard hover={false} padding="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center h-9 w-9 rounded-2xl bg-white/20 border border-white/25">
          <Shield className="h-4 w-4 text-ink-dark/70" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-ink-dark">Cuenta</h2>
      </div>

      <div className="flex flex-col gap-4">
        {/* Email row */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 border border-white/15">
          <Mail className="h-4 w-4 text-ink-dark/50 shrink-0" aria-hidden="true" />
          <span className="text-sm text-ink-dark/80 truncate">{profile.email}</span>
        </div>

        {/* Role badge row */}
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/10 border border-white/15">
          <span className="text-sm text-ink-dark/70 font-medium">Rol</span>
          <span
            className={
              isOwner
                ? 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-ink-orange to-ink-coral text-white shadow-sm'
                : 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-ink-dark/70'
            }
          >
            {isOwner ? 'Propietario' : 'Artista'}
          </span>
        </div>

        {/* Member since row */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 border border-white/15">
          <Calendar className="h-4 w-4 text-ink-dark/50 shrink-0" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="text-xs text-ink-dark/50">Miembro desde</span>
            <span className="text-sm text-ink-dark/80">{memberSince}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/15" />

        {/* Sign out button */}
        <GlassButton
          variant="ghost"
          className="w-full text-red-500/70 hover:text-red-500 hover:border-red-400/30"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Cerrar sesion
        </GlassButton>
      </div>
    </GlassCard>
  )
}

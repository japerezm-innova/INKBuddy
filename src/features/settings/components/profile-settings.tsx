'use client'

import { useState } from 'react'
import { User, Save } from 'lucide-react'
import { GlassCard, GlassButton, GlassInput } from '@/shared/components'
import { cn } from '@/shared/lib/utils'
import { updateProfile } from '@/features/auth/services/auth-service'
import { useAuth } from '@/features/auth/hooks/use-auth'
import type { Profile } from '@/features/auth/types/auth'

interface Props {
  profile: Profile
}

function getInitials(fullName: string | null): string {
  if (!fullName) return '?'
  return fullName
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export function ProfileSettings({ profile }: Props) {
  const { refreshProfile } = useAuth()

  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [specialties, setSpecialties] = useState(
    profile.specialties?.join(', ') ?? ''
  )

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const initials = getInitials(profile.full_name)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!fullName.trim()) {
      setError('El nombre completo es requerido')
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(false)

    const specialtiesArray = specialties
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const result = await updateProfile({
      full_name: fullName.trim(),
      phone: phone.trim() || undefined,
      bio: bio.trim() || undefined,
      specialties: specialtiesArray.length > 0 ? specialtiesArray : undefined,
      avatar_url: avatarUrl.trim() || undefined,
    })

    setIsSaving(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setSuccess(true)
    await refreshProfile()
  }

  return (
    <GlassCard hover={false} padding="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center h-9 w-9 rounded-2xl bg-white/20 border border-white/25">
          <User className="h-4 w-4 text-ink-dark/70" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-ink-dark">Perfil</h2>
      </div>

      {/* Avatar */}
      <div className="flex justify-center mb-6">
        <div
          className={cn(
            'flex items-center justify-center h-20 w-20 rounded-full border-2 border-white/30 shadow-glass text-xl font-bold text-white select-none',
            'bg-gradient-to-br from-ink-orange to-ink-coral'
          )}
          aria-label={`Avatar de ${profile.full_name ?? 'usuario'}`}
        >
          {initials}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <GlassInput
          label="Nombre completo"
          id="full-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Tu nombre completo"
          required
          autoComplete="name"
        />

        <GlassInput
          label="Telefono"
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+52 55 0000 0000"
          autoComplete="tel"
        />

        <GlassInput
          label="URL del avatar"
          id="avatar-url"
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://ejemplo.com/foto.jpg"
        />

        {/* Bio */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="bio"
            className="text-sm font-medium text-ink-dark/80"
          >
            Bio
          </label>
          <textarea
            id="bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Cuéntanos sobre ti y tu trabajo..."
            className="w-full px-4 py-3 text-sm text-ink-dark bg-white/15 backdrop-blur-md border border-white/20 focus:border-ink-orange/50 focus:ring-2 focus:ring-ink-orange/20 rounded-xl transition-all duration-200 outline-none resize-none placeholder:text-gray-400"
          />
        </div>

        <GlassInput
          label="Especialidades"
          id="specialties"
          value={specialties}
          onChange={(e) => setSpecialties(e.target.value)}
          placeholder="Realismo, Blackwork, Acuarela..."
        />
        <p className="text-xs text-ink-dark/50 -mt-2">
          Separa las especialidades con comas
        </p>

        {/* Error state */}
        {error && (
          <p role="alert" className="text-sm text-red-500 font-medium">
            {error}
          </p>
        )}

        {/* Success state */}
        {success && !error && (
          <p className="text-sm text-emerald-600 font-medium">
            Perfil actualizado
          </p>
        )}

        {/* Submit */}
        <GlassButton
          type="submit"
          variant="primary"
          className="w-full mt-2"
          isLoading={isSaving}
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          Guardar cambios
        </GlassButton>
      </form>
    </GlassCard>
  )
}

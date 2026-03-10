'use client'

import { useState } from 'react'
import { Share2, Save } from 'lucide-react'
import { GlassCard, GlassButton } from '@/shared/components'
import { cn } from '@/shared/lib/utils'
import { updateStudioSettings } from '../services/settings-service'
import type { StudioSettings } from '../types/settings'

interface Props {
  initialSettings: StudioSettings
  isOwner: boolean
}

interface PlatformConfig {
  key: keyof StudioSettings['platforms']
  label: string
  circleClass: string
}

const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    key: 'instagram',
    label: 'Instagram',
    circleClass: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400',
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    circleClass: 'bg-black',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    circleClass: 'bg-blue-600',
  },
]

export function PlatformSettings({ initialSettings, isOwner }: Props) {
  const [platforms, setPlatforms] = useState(initialSettings.platforms)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  function handleToggle(key: keyof StudioSettings['platforms']) {
    if (!isOwner) return
    setPlatforms((prev) => ({ ...prev, [key]: !prev[key] }))
    setSuccessMessage(null)
    setError(null)
  }

  async function handleSave() {
    if (!isOwner) return

    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    const result = await updateStudioSettings({ platforms })

    setIsSaving(false)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccessMessage('Preferencias guardadas correctamente')
    }
  }

  return (
    <GlassCard hover={false} className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-ink-orange" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-ink-dark">Plataformas Sociales</h2>
        </div>
        <p className="text-sm text-ink-dark/60">
          Selecciona las plataformas en las que te enfocas
        </p>
      </div>

      {/* Platform toggle rows */}
      <div className="flex flex-col gap-3" role="group" aria-label="Plataformas sociales">
        {PLATFORM_CONFIGS.map(({ key, label, circleClass }) => {
          const isEnabled = platforms[key]
          return (
            <div
              key={key}
              className="flex items-center justify-between rounded-2xl bg-white/10 border border-white/15 px-4 py-3"
            >
              {/* Left: colored circle + label */}
              <div className="flex items-center gap-3">
                <span
                  className={cn('h-4 w-4 rounded-full flex-shrink-0', circleClass)}
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-ink-dark">{label}</span>
              </div>

              {/* Right: toggle switch */}
              <button
                role="switch"
                aria-checked={isEnabled}
                aria-label={`Activar ${label}`}
                onClick={() => handleToggle(key)}
                disabled={!isOwner}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50',
                  isEnabled ? 'bg-ink-orange' : 'bg-white/25 border border-white/20',
                  !isOwner && 'opacity-50 cursor-not-allowed'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
                    isEnabled ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
          )
        })}
      </div>

      {/* Feedback messages */}
      {error && (
        <p role="alert" className="text-sm text-red-500 font-medium">
          {error}
        </p>
      )}
      {successMessage && (
        <p role="status" className="text-sm text-green-600 font-medium">
          {successMessage}
        </p>
      )}

      {/* Save button — owner only */}
      {isOwner && (
        <GlassButton
          variant="primary"
          onClick={handleSave}
          isLoading={isSaving}
          className="self-start"
          aria-label="Guardar preferencias de plataformas"
        >
          <Save className="h-4 w-4" />
          Guardar preferencias
        </GlassButton>
      )}
    </GlassCard>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { Calendar, Copy, Check, RefreshCw, Apple, Globe } from 'lucide-react'
import { GlassCard } from '@/shared/components'
import { regenerateCalendarToken } from '../services/settings-service'

interface Props {
  baseUrl: string
  initialToken: string
}

export function CalendarSettings({ baseUrl, initialToken }: Props) {
  const [token, setToken] = useState(initialToken)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  const calendarUrl = `${baseUrl}/api/calendar/${token}`
  const webcalUrl = calendarUrl.replace(/^https?:\/\//, 'webcal://')

  async function handleCopy() {
    await navigator.clipboard.writeText(calendarUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleRegenerate() {
    if (!window.confirm('¿Regenerar el token? La URL anterior dejara de funcionar.'))
      return

    startTransition(async () => {
      const result = await regenerateCalendarToken()
      if (result.data) setToken(result.data)
    })
  }

  return (
    <GlassCard className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="h-8 w-8 rounded-xl gradient-accent flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <Calendar className="h-4 w-4 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-ink-dark">Sincronizar Calendario</h2>
          <p className="text-xs text-ink-dark/50">
            Agrega tus citas a Apple Calendar o Google Calendar
          </p>
        </div>
      </div>

      {/* URL box */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-ink-dark/70">URL de suscripcion</p>
        <div className="flex gap-2">
          <div className="flex-1 bg-white/30 border border-white/40 rounded-2xl px-3 py-2.5 text-xs text-ink-dark/60 truncate font-mono">
            {calendarUrl}
          </div>
          <button
            onClick={handleCopy}
            className="shrink-0 h-10 w-10 flex items-center justify-center rounded-2xl bg-ink-orange text-white hover:bg-ink-orange/90 transition-colors"
            aria-label="Copiar URL"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        {copied && (
          <p className="text-xs text-green-600 font-medium">URL copiada al portapapeles</p>
        )}
      </div>

      {/* Instructions */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-ink-dark/70">Como suscribirse</p>
        <div className="space-y-2">
          <a
            href={webcalUrl}
            className="flex items-start gap-3 p-3 rounded-2xl bg-white/30 border border-white/40 hover:bg-white/50 transition-colors"
          >
            <Apple className="h-5 w-5 text-ink-dark/60 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-ink-dark">Apple Calendar (iPhone / Mac)</p>
              <p className="text-xs text-ink-dark/50 mt-0.5">
                Toca este boton para suscribirte directamente en tu iPhone
              </p>
            </div>
          </a>
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/30 border border-white/40">
            <Globe className="h-5 w-5 text-ink-dark/60 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-ink-dark">Google Calendar</p>
              <p className="text-xs text-ink-dark/50 mt-0.5">
                Abre Google Calendar → Otros calendarios (+) → Desde URL → pega la URL de arriba
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Regenerate */}
      <div className="pt-2 border-t border-white/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink-dark/70">Regenerar token</p>
            <p className="text-xs text-ink-dark/40 mt-0.5">
              Genera una nueva URL privada y revoca la anterior
            </p>
          </div>
          <button
            onClick={handleRegenerate}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-ink-dark/60 bg-white/30 border border-white/40 hover:bg-white/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
            Regenerar
          </button>
        </div>
      </div>
    </GlassCard>
  )
}

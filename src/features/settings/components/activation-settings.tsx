'use client'

import { useState } from 'react'
import { CheckCircle, Key } from 'lucide-react'
import { GlassCard, GlassButton, GlassInput } from '@/shared/components'
import { activateCode } from '../services/activation-service'

interface Props {
  currentPlan: string
}

export function ActivationSettings({ currentPlan: initialPlan }: Props) {
  const [plan, setPlan] = useState(initialPlan)
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleActivate() {
    if (!code.trim()) return
    setError(null)
    setIsLoading(true)
    try {
      const result = await activateCode(code.trim())
      if (result.error) {
        setError(result.error)
      } else {
        setPlan('pro')
        setCode('')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <GlassCard padding="p-5 md:p-6">
      <h2 className="text-base font-bold text-ink-dark mb-4 flex items-center gap-2">
        <Key className="h-4 w-4 text-ink-orange" />
        Plan Pro
      </h2>

      {plan === 'pro' ? (
        <div className="flex items-center gap-3 py-2">
          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-dark">Plan Pro Activo</p>
            <p className="text-xs text-ink-dark/50">Tienes acceso a todas las funciones premium</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink-dark/60">
            Ingresa tu codigo de activacion para desbloquear las funciones Pro.
          </p>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <GlassInput
                label=""
                id="activation_code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="XXXX-XXXX-XXXX"
                disabled={isLoading}
              />
            </div>
            <GlassButton
              variant="primary"
              size="md"
              isLoading={isLoading}
              onClick={handleActivate}
              disabled={!code.trim()}
            >
              Activar
            </GlassButton>
          </div>
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        </div>
      )}
    </GlassCard>
  )
}

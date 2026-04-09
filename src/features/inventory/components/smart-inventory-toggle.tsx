'use client'

import { useState, useEffect } from 'react'
import { Zap, Settings2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/shared/lib/utils'
import { GlassCard } from '@/shared/components'

interface Props {
  initialEnabled: boolean
  onToggle: (enabled: boolean) => Promise<void>
}

export function SmartInventoryToggle({ initialEnabled, onToggle }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setEnabled(initialEnabled)
  }, [initialEnabled])

  const handleToggle = async () => {
    setIsLoading(true)
    const newValue = !enabled
    try {
      await onToggle(newValue)
      setEnabled(newValue)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <GlassCard padding="p-4 md:p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              'h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors',
              enabled
                ? 'bg-emerald-500/20'
                : 'bg-ink-dark/10'
            )}
          >
            <Zap
              className={cn(
                'h-5 w-5 transition-colors',
                enabled ? 'text-emerald-500' : 'text-ink-dark/40'
              )}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-ink-dark">Smart Inventory</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-ink-orange/15 text-ink-orange">
                Beta
              </span>
            </div>
            <p className="text-xs text-ink-dark/50 mt-0.5">
              {enabled
                ? 'Descuento automatico de insumos al completar citas'
                : 'Activa para descontar insumos automaticamente'}
            </p>
          </div>
        </div>

        {/* Toggle switch */}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Activar Smart Inventory"
          disabled={isLoading}
          onClick={handleToggle}
          className={cn(
            'relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50',
            'disabled:opacity-50',
            enabled ? 'bg-emerald-500' : 'bg-ink-dark/20'
          )}
        >
          <span
            className={cn(
              'inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200 mt-1',
              enabled ? 'translate-x-6 ml-0' : 'translate-x-1'
            )}
          />
        </button>
      </div>

      {/* Configure recipes link */}
      {enabled && (
        <Link
          href="/inventory/recipes"
          className={cn(
            'mt-3 flex items-center gap-2 p-2.5 rounded-xl',
            'bg-white/20 border border-white/25 hover:bg-white/35',
            'transition-all duration-200 group'
          )}
        >
          <Settings2 className="h-4 w-4 text-ink-orange shrink-0" aria-hidden="true" />
          <span className="text-xs font-medium text-ink-dark/70 group-hover:text-ink-dark">
            Configurar recetas de insumos por servicio
          </span>
        </Link>
      )}
    </GlassCard>
  )
}

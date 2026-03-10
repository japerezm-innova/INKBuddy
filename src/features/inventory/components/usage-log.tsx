'use client'

import { ClipboardList, Calendar, User, Package } from 'lucide-react'
import { GlassCard } from '@/shared/components'
import type { InventoryUsage } from '../types/inventory'

interface UsageLogProps {
  itemId?: string
  usageEntries: InventoryUsage[]
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function UsageLog({ usageEntries }: UsageLogProps) {
  if (usageEntries.length === 0) {
    return (
      <GlassCard padding="p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className="h-12 w-12 rounded-2xl bg-white/30 flex items-center justify-center"
            aria-hidden="true"
          >
            <ClipboardList className="h-6 w-6 text-ink-dark/30" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-dark/60">
              Sin registros de uso
            </p>
            <p className="text-xs text-ink-dark/40 mt-0.5">
              El historial de uso aparecera aqui
            </p>
          </div>
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard padding="p-0" className="overflow-hidden">
      <div className="px-5 py-4 border-b border-white/20">
        <h3 className="text-sm font-bold text-ink-dark flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-ink-orange" aria-hidden="true" />
          Historial de uso
          <span className="ml-auto text-xs font-medium text-ink-dark/40">
            {usageEntries.length} registros
          </span>
        </h3>
      </div>

      <ul role="list" className="divide-y divide-white/15">
        {usageEntries.map((entry) => (
          <li key={entry.id} className="px-5 py-3.5 hover:bg-white/10 transition-colors duration-150">
            <div className="flex items-start gap-3">
              {/* Quantity badge */}
              <div
                className="shrink-0 h-8 w-8 rounded-xl bg-ink-orange/10 flex items-center justify-center mt-0.5"
                aria-hidden="true"
              >
                <Package className="h-3.5 w-3.5 text-ink-orange" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Item name (shown when no itemId filter) */}
                {entry.item && (
                  <p className="text-sm font-semibold text-ink-dark truncate">
                    {entry.item.name}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                  {/* Quantity */}
                  <span className="text-xs font-medium text-ink-dark">
                    -{entry.quantity_used} unid.
                  </span>

                  {/* Artist */}
                  {entry.user?.full_name && (
                    <span className="inline-flex items-center gap-1 text-xs text-ink-dark/50">
                      <User className="h-3 w-3" aria-hidden="true" />
                      {entry.user.full_name}
                    </span>
                  )}

                  {/* Appointment link */}
                  {entry.appointment_id && (
                    <a
                      href={`/appointments/${entry.appointment_id}`}
                      className="inline-flex items-center gap-1 text-xs text-ink-orange hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-orange/50 rounded"
                      aria-label="Ver cita relacionada"
                    >
                      Ver cita
                    </a>
                  )}
                </div>
              </div>

              {/* Date + time */}
              <div className="shrink-0 text-right">
                <p className="text-xs font-medium text-ink-dark/70 flex items-center gap-1 justify-end">
                  <Calendar className="h-3 w-3" aria-hidden="true" />
                  {formatDate(entry.used_at)}
                </p>
                <p className="text-xs text-ink-dark/40 mt-0.5">
                  {formatTime(entry.used_at)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </GlassCard>
  )
}

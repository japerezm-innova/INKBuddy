'use client'

import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { InventoryItem } from '../types/inventory'

interface StockAlertBannerProps {
  items: InventoryItem[]
}

export function StockAlertBanner({ items }: StockAlertBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || items.length === 0) return null

  const count = items.length
  const displayNames = items.slice(0, 3).map((i) => i.name)
  const remaining = count - displayNames.length

  return (
    <div
      role="alert"
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-2xl',
        'bg-red-50/60 backdrop-blur-xl border border-red-300/40',
        'shadow-[0_4px_24px_rgba(248,113,113,0.15)]'
      )}
    >
      {/* Icon */}
      <div
        className="shrink-0 h-9 w-9 rounded-xl bg-red-100/80 flex items-center justify-center mt-0.5"
        aria-hidden="true"
      >
        <AlertTriangle className="h-4 w-4 text-red-500" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-red-700">
          {count === 1
            ? '1 item con stock bajo'
            : `${count} items con stock bajo`}
        </p>
        <p className="text-xs text-red-600/80 mt-0.5 leading-relaxed">
          {displayNames.join(', ')}
          {remaining > 0 && ` y ${remaining} mas`}
        </p>
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Descartar alerta de stock bajo"
        className="shrink-0 h-7 w-7 rounded-lg bg-red-100/60 hover:bg-red-200/60 flex items-center justify-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
      >
        <X className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
      </button>
    </div>
  )
}

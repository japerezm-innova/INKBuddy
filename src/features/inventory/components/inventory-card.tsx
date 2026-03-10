'use client'

import {
  Droplets,
  Syringe,
  Box,
  Heart,
  Wrench,
  Package,
} from 'lucide-react'
import { cn, glass } from '@/shared/lib/utils'
import type { InventoryCategory, InventoryItem } from '../types/inventory'

interface InventoryCardProps {
  item: InventoryItem
  onClick: () => void
}

const CATEGORY_ICONS: Record<InventoryCategory, React.ElementType> = {
  ink: Droplets,
  needle: Syringe,
  supply: Box,
  aftercare: Heart,
  equipment: Wrench,
  other: Package,
}

const CATEGORY_LABELS: Record<InventoryCategory, string> = {
  ink: 'Tinta',
  needle: 'Aguja',
  supply: 'Insumo',
  aftercare: 'Aftercare',
  equipment: 'Equipo',
  other: 'Otro',
}

function getStockStatus(
  current: number,
  minimum: number
): 'critical' | 'warning' | 'ok' {
  if (current <= minimum) return 'critical'
  if (current < minimum * 1.5) return 'warning'
  return 'ok'
}

function getBarColor(status: 'critical' | 'warning' | 'ok'): string {
  if (status === 'critical') return 'bg-red-400'
  if (status === 'warning') return 'bg-amber-400'
  return 'bg-emerald-400'
}

function getBarWidth(current: number, minimum: number): number {
  const maxStock = minimum * 3
  if (maxStock === 0) return current > 0 ? 100 : 0
  const pct = (current / maxStock) * 100
  return Math.min(100, Math.max(0, pct))
}

export function InventoryCard({ item, onClick }: InventoryCardProps) {
  const CategoryIcon = CATEGORY_ICONS[item.category]
  const status = getStockStatus(item.current_stock, item.minimum_stock)
  const barWidth = getBarWidth(item.current_stock, item.minimum_stock)
  const barColor = getBarColor(status)
  const isCritical = status === 'critical'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ver detalles de ${item.name}`}
      className={cn(
        glass.cardHover,
        'p-4 w-full text-left flex flex-col gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50',
        isCritical && 'border-red-400/50 shadow-[0_0_0_1px_rgba(248,113,113,0.3),0_4px_24px_rgba(248,113,113,0.12)]'
      )}
    >
      {/* Header: icon + category */}
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            'h-9 w-9 rounded-xl flex items-center justify-center shrink-0',
            isCritical
              ? 'bg-red-100/70'
              : 'bg-white/30'
          )}
          aria-hidden="true"
        >
          <CategoryIcon
            className={cn(
              'h-4 w-4',
              isCritical ? 'text-red-500' : 'text-ink-orange'
            )}
          />
        </div>
        <span
          className={cn(
            'text-xs font-semibold px-2 py-0.5 rounded-lg',
            isCritical
              ? 'bg-red-100/70 text-red-600'
              : 'bg-white/20 text-ink-dark/60'
          )}
        >
          {CATEGORY_LABELS[item.category]}
        </span>
      </div>

      {/* Name */}
      <div className="flex-1">
        <p className="text-sm font-bold text-ink-dark leading-tight line-clamp-2">
          {item.name}
        </p>
        {item.supplier && (
          <p className="text-xs text-ink-dark/50 mt-0.5 truncate">
            {item.supplier}
          </p>
        )}
      </div>

      {/* Stock bar */}
      <div className="flex flex-col gap-1.5">
        <div
          className="h-1.5 w-full rounded-full bg-black/10 overflow-hidden"
          role="progressbar"
          aria-valuenow={item.current_stock}
          aria-valuemin={0}
          aria-valuemax={item.minimum_stock * 3}
          aria-label={`Stock: ${item.current_stock} de ${item.minimum_stock * 3}`}
        >
          <div
            className={cn('h-full rounded-full transition-all duration-500', barColor)}
            style={{ width: `${barWidth}%` }}
          />
        </div>

        {/* Stock text */}
        <p className="text-xs text-ink-dark/60">
          <span
            className={cn(
              'font-bold',
              isCritical ? 'text-red-500' : 'text-ink-dark'
            )}
          >
            {item.current_stock}
          </span>
          {' / '}
          {item.minimum_stock} {item.unit}
        </p>
      </div>
    </button>
  )
}

'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Droplets,
  Syringe,
  Box,
  Heart,
  Wrench,
  Package,
  Edit2,
  Trash2,
  SlidersHorizontal,
} from 'lucide-react'
import { GlassCard, GlassButton, GlassInput, StatCard } from '@/shared/components/client'
import { cn } from '@/shared/lib/utils'
import {
  getInventoryItemById,
  getUsageLog,
  deleteInventoryItem,
  adjustStock,
} from '../services/inventory-service'
import { UsageLog } from './usage-log'
import { LogUsageForm } from './log-usage-form'
import type { InventoryCategory, InventoryItem, InventoryUsage } from '../types/inventory'

interface InventoryDetailProps {
  itemId: string
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

export function InventoryDetail({ itemId }: InventoryDetailProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [item, setItem] = useState<InventoryItem | null>(null)
  const [usageEntries, setUsageEntries] = useState<InventoryUsage[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustValue, setAdjustValue] = useState('')
  const [adjustError, setAdjustError] = useState<string | null>(null)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const loadData = () => {
    startTransition(async () => {
      setFetchError(null)

      const [itemResult, usageResult] = await Promise.all([
        getInventoryItemById(itemId),
        getUsageLog(itemId),
      ])

      if (itemResult.error) {
        setFetchError(itemResult.error)
      } else {
        setItem(itemResult.data ?? null)
        setAdjustValue(itemResult.data?.current_stock?.toString() ?? '0')
      }

      if (!usageResult.error) {
        setUsageEntries(usageResult.data ?? [])
      }

      setIsLoading(false)
    })
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId])

  const handleDelete = () => {
    setDeleteError(null)
    startTransition(async () => {
      const result = await deleteInventoryItem(itemId)
      if (result.error) {
        setDeleteError(result.error)
        return
      }
      router.push('/inventory')
    })
  }

  const handleAdjustStock = () => {
    setAdjustError(null)
    const parsed = parseFloat(adjustValue)
    if (isNaN(parsed) || parsed < 0) {
      setAdjustError('Ingresa un numero valido mayor o igual a 0')
      return
    }

    startTransition(async () => {
      const result = await adjustStock(itemId, parsed)
      if (result.error) {
        setAdjustError(result.error)
        return
      }
      setItem(result.data ?? null)
      setShowAdjustModal(false)
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 animate-pulse">
        <div className="h-10 w-24 rounded-xl bg-white/20" />
        <div className="h-40 rounded-3xl bg-white/20" />
        <div className="h-64 rounded-3xl bg-white/20" />
      </div>
    )
  }

  if (fetchError || !item) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-lg font-semibold text-ink-dark">
          {fetchError ?? 'Item no encontrado'}
        </p>
        <GlassButton variant="secondary" onClick={() => router.push('/inventory')}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al inventario
        </GlassButton>
      </div>
    )
  }

  const CategoryIcon = CATEGORY_ICONS[item.category]
  const status = getStockStatus(item.current_stock, item.minimum_stock)
  const isCritical = status === 'critical'
  const isWarning = status === 'warning'

  return (
    <div className="flex flex-col gap-5">
      {/* Back button */}
      <GlassButton
        variant="ghost"
        size="sm"
        onClick={() => router.push('/inventory')}
        className="self-start"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Inventario
      </GlassButton>

      {/* Item header card */}
      <GlassCard
        padding="p-5"
        className={cn(
          isCritical &&
            'border-red-400/50 shadow-[0_0_0_1px_rgba(248,113,113,0.3),0_4px_24px_rgba(248,113,113,0.12)]'
        )}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={cn(
              'h-12 w-12 rounded-2xl flex items-center justify-center shrink-0',
              isCritical
                ? 'bg-red-100/70'
                : 'gradient-accent shadow-warm'
            )}
            aria-hidden="true"
          >
            <CategoryIcon
              className={cn(
                'h-6 w-6',
                isCritical ? 'text-red-500' : 'text-white'
              )}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="text-xl font-bold text-ink-dark leading-tight">
                  {item.name}
                </h1>
                <p className="text-sm text-ink-dark/50 mt-0.5">
                  {CATEGORY_LABELS[item.category]}
                  {item.supplier && ` · ${item.supplier}`}
                </p>
              </div>

              {/* Status badge */}
              <span
                className={cn(
                  'shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg',
                  isCritical && 'bg-red-100/80 text-red-600',
                  isWarning && 'bg-amber-100/80 text-amber-600',
                  status === 'ok' && 'bg-emerald-100/80 text-emerald-600'
                )}
              >
                {isCritical ? 'Stock bajo' : isWarning ? 'Stock medio' : 'OK'}
              </span>
            </div>

            {/* Stock bar */}
            <div className="mt-4">
              <div
                className="h-2 w-full rounded-full bg-black/10 overflow-hidden"
                role="progressbar"
                aria-valuenow={item.current_stock}
                aria-valuemin={0}
                aria-valuemax={item.minimum_stock * 3}
                aria-label={`Stock: ${item.current_stock} ${item.unit}`}
              >
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    isCritical
                      ? 'bg-red-400'
                      : isWarning
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  )}
                  style={{
                    width: `${Math.min(
                      100,
                      (item.current_stock / (item.minimum_stock * 3 || 1)) * 100
                    )}%`,
                  }}
                />
              </div>
              <p className="text-sm text-ink-dark/60 mt-2">
                <span className={cn('font-bold', isCritical ? 'text-red-500' : 'text-ink-dark')}>
                  {item.current_stock}
                </span>
                {' / '}
                {item.minimum_stock} {item.unit} (minimo)
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          title="Stock actual"
          value={`${item.current_stock} ${item.unit}`}
          icon={Package}
        />
        {item.cost_per_unit !== null && (
          <StatCard
            title="Costo por unidad"
            value={`$${item.cost_per_unit.toFixed(2)}`}
            icon={Package}
          />
        )}
      </div>

      {/* Notes */}
      {item.notes && (
        <GlassCard padding="p-4">
          <p className="text-xs font-semibold text-ink-dark/50 uppercase tracking-wide mb-1.5">
            Notas
          </p>
          <p className="text-sm text-ink-dark/80 leading-relaxed">{item.notes}</p>
        </GlassCard>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <GlassButton
          variant="secondary"
          className="flex-1"
          onClick={() => setShowAdjustModal(true)}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Ajustar stock
        </GlassButton>
        <GlassButton
          variant="secondary"
          className="flex-1"
          onClick={() => router.push(`/inventory/${itemId}/edit`)}
        >
          <Edit2 className="h-4 w-4" aria-hidden="true" />
          Editar
        </GlassButton>
        <GlassButton
          variant="ghost"
          size="icon"
          onClick={() => setShowDeleteConfirm(true)}
          aria-label="Eliminar item"
          className="text-red-500 hover:bg-red-50/30"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </GlassButton>
      </div>

      {/* Log usage form */}
      <LogUsageForm onSuccess={loadData} />

      {/* Usage log */}
      <UsageLog itemId={itemId} usageEntries={usageEntries} />

      {/* Adjust stock modal */}
      {showAdjustModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Ajustar stock"
        >
          <GlassCard padding="p-5" className="w-full max-w-sm">
            <h2 className="text-base font-bold text-ink-dark mb-4">
              Ajustar stock manualmente
            </h2>
            <GlassInput
              label="Nuevo stock"
              id="new-stock"
              type="number"
              min="0"
              step="0.01"
              value={adjustValue}
              onChange={(e) => setAdjustValue(e.target.value)}
              autoFocus
            />
            {adjustError && (
              <p role="alert" className="mt-2 text-xs text-red-500 font-medium">
                {adjustError}
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <GlassButton
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowAdjustModal(false)
                  setAdjustError(null)
                }}
                disabled={isPending}
              >
                Cancelar
              </GlassButton>
              <GlassButton
                variant="primary"
                className="flex-1"
                onClick={handleAdjustStock}
                isLoading={isPending}
              >
                Guardar
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar eliminacion"
        >
          <GlassCard padding="p-5" className="w-full max-w-sm">
            <h2 className="text-base font-bold text-ink-dark mb-2">
              Eliminar item
            </h2>
            <p className="text-sm text-ink-dark/60 mb-4">
              Esta accion no se puede deshacer. Se eliminara &ldquo;{item.name}&rdquo; del inventario.
            </p>
            {deleteError && (
              <p role="alert" className="mb-3 text-xs text-red-500 font-medium">
                {deleteError}
              </p>
            )}
            <div className="flex gap-3">
              <GlassButton
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteError(null)
                }}
                disabled={isPending}
              >
                Cancelar
              </GlassButton>
              <GlassButton
                variant="primary"
                className="flex-1 bg-red-500 hover:bg-red-600"
                onClick={handleDelete}
                isLoading={isPending}
              >
                Eliminar
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Droplets,
  Syringe,
  Box,
  Heart,
  Wrench,
  Package,
} from 'lucide-react'
import { GlassInput, GlassButton } from '@/shared/components'
import { cn } from '@/shared/lib/utils'
import { createInventoryItem, updateInventoryItem } from '../services/inventory-service'
import type { CreateInventoryInput, InventoryCategory, InventoryItem } from '../types/inventory'

interface InventoryFormProps {
  item?: InventoryItem
  onSuccess?: (item: InventoryItem) => void
}

interface CategoryOption {
  value: InventoryCategory
  label: string
  icon: React.ElementType
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'ink', label: 'Tinta', icon: Droplets },
  { value: 'needle', label: 'Agujas', icon: Syringe },
  { value: 'supply', label: 'Insumos', icon: Box },
  { value: 'aftercare', label: 'Aftercare', icon: Heart },
  { value: 'equipment', label: 'Equipo', icon: Wrench },
  { value: 'other', label: 'Otro', icon: Package },
]

export function InventoryForm({ item, onSuccess }: InventoryFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(item?.name ?? '')
  const [category, setCategory] = useState<InventoryCategory>(
    item?.category ?? 'supply'
  )
  const [currentStock, setCurrentStock] = useState(
    item?.current_stock?.toString() ?? '0'
  )
  const [minimumStock, setMinimumStock] = useState(
    item?.minimum_stock?.toString() ?? '0'
  )
  const [unit, setUnit] = useState(item?.unit ?? 'unidad')
  const [costPerUnit, setCostPerUnit] = useState(
    item?.cost_per_unit?.toString() ?? ''
  )
  const [supplier, setSupplier] = useState(item?.supplier ?? '')
  const [notes, setNotes] = useState(item?.notes ?? '')

  const isEditMode = !!item

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('El nombre es requerido')
      return
    }

    const parsedCurrentStock = parseFloat(currentStock)
    const parsedMinimumStock = parseFloat(minimumStock)
    const parsedCostPerUnit = costPerUnit ? parseFloat(costPerUnit) : undefined

    if (isNaN(parsedCurrentStock) || parsedCurrentStock < 0) {
      setError('El stock actual debe ser un numero positivo')
      return
    }

    if (isNaN(parsedMinimumStock) || parsedMinimumStock < 0) {
      setError('El stock minimo debe ser un numero positivo')
      return
    }

    if (parsedCostPerUnit !== undefined && (isNaN(parsedCostPerUnit) || parsedCostPerUnit < 0)) {
      setError('El costo por unidad debe ser un numero positivo')
      return
    }

    const input: CreateInventoryInput = {
      name: name.trim(),
      category,
      current_stock: parsedCurrentStock,
      minimum_stock: parsedMinimumStock,
      unit: unit.trim() || 'unidad',
      ...(parsedCostPerUnit !== undefined && { cost_per_unit: parsedCostPerUnit }),
      ...(supplier.trim() && { supplier: supplier.trim() }),
      ...(notes.trim() && { notes: notes.trim() }),
    }

    startTransition(async () => {
      if (isEditMode) {
        const result = await updateInventoryItem(item.id, input)
        if (result.error) {
          setError(result.error)
          return
        }
        if (result.data) {
          onSuccess?.(result.data)
          router.push(`/inventory/${item.id}`)
        }
      } else {
        const result = await createInventoryItem(input)
        if (result.error) {
          setError(result.error)
          return
        }
        if (result.data) {
          onSuccess?.(result.data)
          router.push(`/inventory/${result.data.id}`)
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Name */}
      <GlassInput
        label="Nombre *"
        id="item-name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tinta negra carbono"
        required
        autoComplete="off"
      />

      {/* Category pills */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink-dark/80">Categoria *</span>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Seleccionar categoria"
        >
          {CATEGORY_OPTIONS.map((opt) => {
            const Icon = opt.icon
            const isActive = category === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCategory(opt.value)}
                aria-pressed={isActive}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 border',
                  isActive
                    ? 'gradient-accent text-white border-transparent shadow-warm'
                    : 'bg-white/15 backdrop-blur-md border-white/20 text-ink-dark/70 hover:bg-white/25'
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Stock + Minimum */}
      <div className="grid grid-cols-2 gap-4">
        <GlassInput
          label="Stock actual"
          id="current-stock"
          type="number"
          min="0"
          step="0.01"
          value={currentStock}
          onChange={(e) => setCurrentStock(e.target.value)}
          placeholder="0"
        />
        <GlassInput
          label="Stock minimo"
          id="minimum-stock"
          type="number"
          min="0"
          step="0.01"
          value={minimumStock}
          onChange={(e) => setMinimumStock(e.target.value)}
          placeholder="0"
        />
      </div>

      {/* Unit + Cost */}
      <div className="grid grid-cols-2 gap-4">
        <GlassInput
          label="Unidad"
          id="unit"
          type="text"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="unidad, ml, caja..."
        />
        <GlassInput
          label="Costo por unidad"
          id="cost-per-unit"
          type="number"
          min="0"
          step="0.01"
          value={costPerUnit}
          onChange={(e) => setCostPerUnit(e.target.value)}
          placeholder="0.00"
        />
      </div>

      {/* Supplier */}
      <GlassInput
        label="Proveedor"
        id="supplier"
        type="text"
        value={supplier}
        onChange={(e) => setSupplier(e.target.value)}
        placeholder="Nombre del proveedor"
        autoComplete="off"
      />

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="item-notes" className="text-sm font-medium text-ink-dark/80">
          Notas
        </label>
        <textarea
          id="item-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Informacion adicional, referencias, etc."
          className={cn(
            'w-full px-4 py-3 text-sm text-ink-dark rounded-xl resize-none outline-none',
            'bg-white/15 backdrop-blur-md border border-white/20',
            'focus:border-ink-orange/50 focus:ring-2 focus:ring-ink-orange/20',
            'transition-all duration-200 placeholder:text-gray-400'
          )}
        />
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="px-4 py-3 rounded-xl bg-red-100/80 border border-red-200/60 text-red-700 text-sm font-medium"
        >
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <GlassButton
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={isPending}
          className="flex-1"
        >
          Cancelar
        </GlassButton>
        <GlassButton
          type="submit"
          variant="primary"
          isLoading={isPending}
          className="flex-1"
        >
          {isEditMode ? 'Guardar cambios' : 'Crear item'}
        </GlassButton>
      </div>
    </form>
  )
}

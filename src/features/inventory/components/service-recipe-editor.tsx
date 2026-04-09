'use client'

import { useState, useEffect, useTransition } from 'react'
import { Package, Plus, Minus, Trash2, Check, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { GlassCard } from '@/shared/components'
import {
  getServicesWithRecipes,
  getServiceMaterials,
  getInventoryItems,
  upsertServiceMaterial,
  deleteServiceMaterial,
} from '@/features/inventory/services/inventory-service'
import type {
  ServiceMaterial,
  ServiceWithRecipeCount,
} from '@/features/inventory/services/inventory-service'
import type { InventoryItem } from '@/features/inventory/types/inventory'

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ServiceRecipeEditor() {
  const [services, setServices] = useState<ServiceWithRecipeCount[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [isLoading, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      const result = await getServicesWithRecipes()
      if (result.data) setServices(result.data)
    })
  }, [])

  const refreshServices = () => {
    startTransition(async () => {
      const result = await getServicesWithRecipes()
      if (result.data) setServices(result.data)
    })
  }

  return (
    <div className="space-y-4">
      {isLoading && services.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white/20 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <GlassCard padding="p-8">
          <div className="text-center">
            <Package className="h-10 w-10 text-ink-dark/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-ink-dark/60">No hay servicios configurados</p>
            <p className="text-xs text-ink-dark/40 mt-1">
              Crea servicios en la seccion de citas para definir recetas.
            </p>
          </div>
        </GlassCard>
      ) : (
        <>
          {/* Service list */}
          <div className="space-y-2">
            {services.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() =>
                  setSelectedServiceId(
                    selectedServiceId === service.id ? null : service.id
                  )
                }
                className={cn(
                  'w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-200',
                  'border text-left',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50',
                  selectedServiceId === service.id
                    ? 'bg-ink-orange/10 border-ink-orange/30'
                    : 'bg-white/30 border-white/25 hover:bg-white/45'
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-dark truncate">
                    {service.name}
                  </p>
                  <p className="text-xs text-ink-dark/50 mt-0.5">
                    {service.duration_minutes} min
                    {service.material_count > 0 && (
                      <span className="text-emerald-600 font-medium ml-2">
                        {service.material_count} insumo{service.material_count > 1 ? 's' : ''} configurado{service.material_count > 1 ? 's' : ''}
                      </span>
                    )}
                  </p>
                </div>
                <ChevronRight
                  className={cn(
                    'h-4 w-4 text-ink-dark/30 transition-transform',
                    selectedServiceId === service.id && 'rotate-90 text-ink-orange'
                  )}
                />
              </button>
            ))}
          </div>

          {/* Recipe editor for selected service */}
          {selectedServiceId && (
            <RecipePanel
              serviceId={selectedServiceId}
              onUpdate={refreshServices}
            />
          )}
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Recipe panel for a single service
// ---------------------------------------------------------------------------

function RecipePanel({
  serviceId,
  onUpdate,
}: {
  serviceId: string
  onUpdate: () => void
}) {
  const [materials, setMaterials] = useState<ServiceMaterial[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [isLoading, startTransition] = useTransition()
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    startTransition(async () => {
      const [matResult, invResult] = await Promise.all([
        getServiceMaterials(serviceId),
        getInventoryItems(),
      ])
      if (matResult.data) setMaterials(matResult.data)
      if (invResult.data) setInventoryItems(invResult.data)
    })
  }, [serviceId])

  const usedItemIds = new Set(materials.map((m) => m.item_id))
  const availableItems = inventoryItems.filter((i) => !usedItemIds.has(i.id))

  const handleAdd = async (itemId: string, quantity: number) => {
    const result = await upsertServiceMaterial(serviceId, itemId, quantity)
    if (!result.error) {
      const matResult = await getServiceMaterials(serviceId)
      if (matResult.data) setMaterials(matResult.data)
      setShowAddForm(false)
      onUpdate()
    }
  }

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return
    await upsertServiceMaterial(serviceId, itemId, quantity)
    setMaterials((prev) =>
      prev.map((m) =>
        m.item_id === itemId ? { ...m, quantity_per_session: quantity } : m
      )
    )
  }

  const handleRemove = async (itemId: string) => {
    await deleteServiceMaterial(serviceId, itemId)
    setMaterials((prev) => prev.filter((m) => m.item_id !== itemId))
    onUpdate()
  }

  return (
    <GlassCard padding="p-4 md:p-5">
      <h3 className="text-sm font-bold text-ink-dark mb-3 flex items-center gap-2">
        <Package className="h-4 w-4 text-ink-orange" />
        Receta de insumos
      </h3>

      {isLoading && materials.length === 0 ? (
        <div className="h-20 bg-white/20 rounded-xl animate-pulse" />
      ) : (
        <>
          {/* Current materials */}
          {materials.length > 0 ? (
            <div className="space-y-2 mb-3">
              {materials.map((mat) => (
                <div
                  key={mat.id}
                  className="flex items-center gap-3 p-3 bg-white/20 rounded-xl border border-white/20"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-dark truncate">
                      {mat.item?.name ?? 'Item'}
                    </p>
                    <p className="text-[10px] text-ink-dark/40 uppercase">
                      {mat.item?.category} {mat.item?.unit && `· ${mat.item.unit}`}
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateQuantity(
                          mat.item_id,
                          mat.quantity_per_session - 1
                        )
                      }
                      disabled={mat.quantity_per_session <= 1}
                      className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/30 hover:bg-white/50 disabled:opacity-30 transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-bold text-ink-dark w-6 text-center tabular-nums">
                      {mat.quantity_per_session}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateQuantity(
                          mat.item_id,
                          mat.quantity_per_session + 1
                        )
                      }
                      className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/30 hover:bg-white/50 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(mat.item_id)}
                    className="h-7 w-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
                    aria-label={`Eliminar ${mat.item?.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-ink-dark/40 mb-3">
              Sin insumos configurados. Agrega materiales que se usan en este servicio.
            </p>
          )}

          {/* Add material */}
          {showAddForm ? (
            <AddMaterialForm
              items={availableItems}
              onAdd={handleAdd}
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              disabled={availableItems.length === 0}
              className={cn(
                'w-full flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-semibold',
                'border border-dashed transition-all duration-200',
                availableItems.length === 0
                  ? 'border-white/20 text-ink-dark/30 cursor-not-allowed'
                  : 'border-ink-orange/30 text-ink-orange hover:bg-ink-orange/5'
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar insumo
            </button>
          )}
        </>
      )}
    </GlassCard>
  )
}

// ---------------------------------------------------------------------------
// Add material form
// ---------------------------------------------------------------------------

function AddMaterialForm({
  items,
  onAdd,
  onCancel,
}: {
  items: InventoryItem[]
  onAdd: (itemId: string, quantity: number) => Promise<void>
  onCancel: () => void
}) {
  const [selectedItemId, setSelectedItemId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async () => {
    if (!selectedItemId) return
    setIsSaving(true)
    await onAdd(selectedItemId, quantity)
    setIsSaving(false)
  }

  return (
    <div className="p-3 bg-white/25 rounded-xl border border-white/30 space-y-3">
      <select
        value={selectedItemId}
        onChange={(e) => setSelectedItemId(e.target.value)}
        className="w-full h-9 px-3 rounded-xl bg-white/40 border border-white/30 text-sm text-ink-dark focus:outline-none focus:ring-2 focus:ring-ink-orange/50"
      >
        <option value="">Seleccionar insumo...</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} ({item.category})
          </option>
        ))}
      </select>

      <div className="flex items-center gap-3">
        <label className="text-xs text-ink-dark/60 shrink-0">Cantidad por sesion:</label>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/30 hover:bg-white/50 transition-colors"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="text-sm font-bold text-ink-dark w-6 text-center tabular-nums">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/30 hover:bg-white/50 transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-9 rounded-xl text-xs font-medium bg-white/25 hover:bg-white/40 border border-white/30 text-ink-dark transition-all"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedItemId || isSaving}
          className={cn(
            'flex-1 h-9 rounded-xl text-xs font-semibold text-white transition-all',
            'gradient-accent shadow-warm hover:shadow-warm-lg',
            'disabled:opacity-50 disabled:pointer-events-none',
            'flex items-center justify-center gap-1.5'
          )}
        >
          <Check className="h-3.5 w-3.5" />
          {isSaving ? 'Guardando...' : 'Agregar'}
        </button>
      </div>
    </div>
  )
}

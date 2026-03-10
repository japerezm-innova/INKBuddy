'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Package } from 'lucide-react'
import { GlassButton } from '@/shared/components'
import { cn } from '@/shared/lib/utils'
import { getInventoryItems } from '../services/inventory-service'
import { InventoryCard } from './inventory-card'
import { StockAlertBanner } from './stock-alert-banner'
import type { InventoryCategory, InventoryItem } from '../types/inventory'

type CategoryFilter = InventoryCategory | 'all'

interface FilterChip {
  value: CategoryFilter
  label: string
}

const FILTER_CHIPS: FilterChip[] = [
  { value: 'all', label: 'Todos' },
  { value: 'ink', label: 'Tinta' },
  { value: 'needle', label: 'Agujas' },
  { value: 'supply', label: 'Insumos' },
  { value: 'aftercare', label: 'Aftercare' },
  { value: 'equipment', label: 'Equipo' },
  { value: 'other', label: 'Otro' },
]

export function InventoryList() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [items, setItems] = useState<InventoryItem[]>([])
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const lowStockItems = items.filter(
    (item) => item.current_stock <= item.minimum_stock
  )

  const fetchItems = useCallback(
    (category: CategoryFilter, onlyLow: boolean) => {
      startTransition(async () => {
        setFetchError(null)

        const result = await getInventoryItems({
          ...(category !== 'all' && { category }),
          ...(onlyLow && { lowStockOnly: true }),
        })

        if (result.error) {
          setFetchError(result.error)
        } else {
          setItems(result.data ?? [])
        }
        setIsInitialLoad(false)
      })
    },
    []
  )

  useEffect(() => {
    fetchItems(activeCategory, lowStockOnly)
  }, [activeCategory, lowStockOnly, fetchItems])

  const handleCardClick = (id: string) => {
    router.push(`/inventory/${id}`)
  }

  const handleAddItem = () => {
    router.push('/inventory/new')
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Low stock alert banner - always fetch from full list */}
      {!isInitialLoad && lowStockItems.length > 0 && activeCategory === 'all' && !lowStockOnly && (
        <StockAlertBanner items={lowStockItems} />
      )}

      {/* Category filter chips */}
      <div
        className="flex gap-2 flex-wrap"
        role="group"
        aria-label="Filtrar por categoria"
      >
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.value}
            type="button"
            onClick={() => setActiveCategory(chip.value)}
            aria-pressed={activeCategory === chip.value}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 border',
              activeCategory === chip.value
                ? 'gradient-accent text-white border-transparent shadow-warm'
                : 'bg-white/15 backdrop-blur-md border-white/20 text-ink-dark/70 hover:bg-white/25'
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Low stock toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={lowStockOnly}
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={cn(
            'relative h-6 w-11 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50',
            lowStockOnly ? 'bg-red-400' : 'bg-black/10'
          )}
          aria-label="Mostrar solo items con stock bajo"
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
              lowStockOnly ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
        <label
          className="text-sm font-medium text-ink-dark/70 cursor-pointer select-none"
          onClick={() => setLowStockOnly(!lowStockOnly)}
        >
          Solo stock bajo
          {!isInitialLoad && lowStockItems.length > 0 && (
            <span className="ml-2 text-xs font-bold text-red-500">
              ({lowStockItems.length})
            </span>
          )}
        </label>
      </div>

      {/* Error state */}
      {fetchError && (
        <div
          role="alert"
          className="px-4 py-3 rounded-xl bg-red-100/80 border border-red-200/60 text-red-700 text-sm font-medium"
        >
          {fetchError}
        </div>
      )}

      {/* Loading skeleton */}
      {(isPending || isInitialLoad) && !fetchError && (
        <div
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
          aria-busy="true"
          aria-label="Cargando inventario"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-44 rounded-3xl bg-white/20 backdrop-blur-sm animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isPending && !isInitialLoad && !fetchError && items.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="h-16 w-16 rounded-3xl gradient-accent flex items-center justify-center shadow-warm">
            <Package className="h-8 w-8 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-semibold text-ink-dark">
              {activeCategory !== 'all' || lowStockOnly
                ? 'Sin resultados'
                : 'Inventario vacio'}
            </p>
            <p className="text-sm text-ink-dark/50 mt-1">
              {activeCategory !== 'all' || lowStockOnly
                ? 'Intenta con otros filtros.'
                : 'Agrega tu primer item de inventario.'}
            </p>
          </div>
          {activeCategory === 'all' && !lowStockOnly && (
            <GlassButton variant="primary" onClick={handleAddItem}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Agregar item
            </GlassButton>
          )}
        </div>
      )}

      {/* Items grid */}
      {!isPending && !isInitialLoad && items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <InventoryCard
              key={item.id}
              item={item}
              onClick={() => handleCardClick(item.id)}
            />
          ))}
        </div>
      )}

      {/* Floating action button */}
      <button
        type="button"
        onClick={handleAddItem}
        aria-label="Agregar item de inventario"
        className="fixed bottom-24 right-5 md:bottom-8 md:right-8 h-14 w-14 rounded-2xl gradient-accent text-white shadow-warm hover:shadow-warm-lg hover:scale-105 transition-all duration-200 flex items-center justify-center z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50"
      >
        <Plus className="h-6 w-6" aria-hidden="true" />
      </button>
    </div>
  )
}

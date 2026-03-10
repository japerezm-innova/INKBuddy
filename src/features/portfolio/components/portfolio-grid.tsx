'use client'

import { useState, useMemo } from 'react'
import { SlidersHorizontal, Bookmark, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { PortfolioCard } from './portfolio-card'
import { PortfolioDetailModal } from './portfolio-detail-modal'
import type { PortfolioItem, PortfolioFilter } from '../types/portfolio'

interface PortfolioGridProps {
  items: PortfolioItem[]
  isManageMode?: boolean
  onEdit?: (item: PortfolioItem) => void
  onDelete?: (item: PortfolioItem) => void
}

function deriveStyles(items: PortfolioItem[]): string[] {
  const set = new Set<string>()
  items.forEach((it) => {
    if (it.style) set.add(it.style)
  })
  return Array.from(set).sort()
}

export function PortfolioGrid({
  items,
  isManageMode = false,
  onEdit,
  onDelete,
}: PortfolioGridProps) {
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null)
  const [filter, setFilter] = useState<PortfolioFilter>({})

  const availableStyles = useMemo(() => deriveStyles(items), [items])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filter.style && item.style !== filter.style) return false
      if (filter.availableOnly && !item.is_available_design) return false
      return true
    })
  }, [items, filter])

  const setStyle = (style: string | undefined) => {
    setFilter((prev) => ({ ...prev, style }))
  }

  const toggleAvailableOnly = () => {
    setFilter((prev) => ({
      ...prev,
      availableOnly: !prev.availableOnly,
    }))
  }

  const clearFilters = () => setFilter({})

  const hasActiveFilters = !!filter.style || !!filter.availableOnly

  return (
    <section aria-label="Galeria de trabajos">
      {/* Filter bar */}
      {(availableStyles.length > 0 || items.some((i) => i.is_available_design)) && (
        <div
          className="flex flex-wrap items-center gap-2 mb-6"
          aria-label="Filtros de galeria"
        >
          <span
            className="flex items-center gap-1.5 text-sm font-medium text-ink-dark/60 mr-1"
            aria-hidden="true"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtrar
          </span>

          {/* Style chips */}
          {availableStyles.map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => setStyle(filter.style === style ? undefined : style)}
              aria-pressed={filter.style === style}
              className={cn(
                'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold',
                'border transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50',
                filter.style === style
                  ? 'bg-ink-orange text-white border-ink-orange shadow-warm'
                  : 'bg-white/25 backdrop-blur-sm border-white/30 text-ink-dark hover:bg-white/40'
              )}
            >
              {style}
            </button>
          ))}

          {/* Available toggle */}
          {items.some((i) => i.is_available_design) && (
            <button
              type="button"
              onClick={toggleAvailableOnly}
              aria-pressed={!!filter.availableOnly}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold',
                'border transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50',
                filter.availableOnly
                  ? 'bg-ink-orange text-white border-ink-orange shadow-warm'
                  : 'bg-white/25 backdrop-blur-sm border-white/30 text-ink-dark hover:bg-white/40'
              )}
            >
              <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
              Disponibles
            </button>
          )}

          {/* Clear */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              aria-label="Limpiar filtros"
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium',
                'bg-white/15 border border-white/25 text-ink-dark/60',
                'hover:bg-white/25 hover:text-ink-dark transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50'
              )}
            >
              <X className="h-3 w-3" aria-hidden="true" />
              Limpiar
            </button>
          )}
        </div>
      )}

      {/* Result count */}
      {hasActiveFilters && (
        <p className="text-sm text-ink-dark/50 mb-4" aria-live="polite">
          {filteredItems.length}{' '}
          {filteredItems.length === 1 ? 'resultado' : 'resultados'}
        </p>
      )}

      {/* Grid */}
      {filteredItems.length > 0 ? (
        <div
          className={cn(
            'columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4'
          )}
          role="list"
          aria-label="Trabajos de tatuaje"
        >
          {filteredItems.map((item) => (
            <div key={item.id} role="listitem" className="break-inside-avoid">
              <PortfolioCard
                item={item}
                isManageMode={isManageMode}
                onOpen={setSelectedItem}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} />
      )}

      {/* Detail modal */}
      <PortfolioDetailModal
        item={selectedItem}
        isOpen={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
      />
    </section>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

interface EmptyStateProps {
  hasFilters: boolean
  onClear: () => void
}

function EmptyState({ hasFilters, onClear }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-20 px-4 text-center',
        'bg-white/20 backdrop-blur-sm border border-white/25 rounded-3xl'
      )}
      role="status"
    >
      <div
        aria-hidden="true"
        className="h-14 w-14 rounded-2xl gradient-accent flex items-center justify-center mb-4 shadow-warm"
      >
        <span className="text-2xl">🎨</span>
      </div>
      <h3 className="text-base font-semibold text-ink-dark mb-1">
        {hasFilters ? 'Sin resultados' : 'Portafolio vacio'}
      </h3>
      <p className="text-sm text-ink-dark/60 max-w-xs">
        {hasFilters
          ? 'No hay trabajos que coincidan con los filtros seleccionados.'
          : 'Aun no hay trabajos publicados en el portafolio.'}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className={cn(
            'mt-4 px-4 py-2 rounded-xl text-sm font-medium',
            'bg-white/25 hover:bg-white/40 border border-white/30 text-ink-dark',
            'transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50'
          )}
        >
          Ver todos los trabajos
        </button>
      )}
    </div>
  )
}

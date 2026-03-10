'use client'

import { useState, useEffect, useTransition } from 'react'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { PortfolioGrid } from '@/features/portfolio/components'
import { getPublicPortfolio } from '@/features/portfolio/services/portfolio-service'
import type { PortfolioItem } from '@/features/portfolio/types/portfolio'

export function PublicPortfolioContent() {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [hasFetched, setHasFetched] = useState(false)

  const fetchItems = () => {
    startTransition(async () => {
      const result = await getPublicPortfolio()
      if (result.error) {
        setError(result.error)
      } else {
        setItems(result.data ?? [])
        setError(null)
      }
      setHasFetched(true)
    })
  }

  useEffect(() => {
    fetchItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!hasFetched || isPending) {
    return <PortfolioGridSkeleton />
  }

  if (error) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-16 px-4 text-center',
          'bg-white/20 backdrop-blur-sm border border-white/25 rounded-3xl'
        )}
        role="alert"
      >
        <p className="text-sm font-medium text-red-500 mb-4">{error}</p>
        <button
          type="button"
          onClick={fetchItems}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium',
            'bg-white/25 hover:bg-white/40 border border-white/30 text-ink-dark',
            'transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50'
          )}
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Reintentar
        </button>
      </div>
    )
  }

  return <PortfolioGrid items={items} isManageMode={false} />
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function PortfolioGridSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando galeria"
      className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'break-inside-avoid rounded-2xl overflow-hidden',
            'bg-white/20 backdrop-blur-sm border border-white/25 animate-pulse',
            i % 3 === 0 ? 'aspect-[3/4]' : i % 3 === 1 ? 'aspect-square' : 'aspect-[4/3]'
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

'use client'

import Image from 'next/image'
import { Pencil, Trash2, Bookmark } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { PortfolioItem } from '../types/portfolio'

interface PortfolioCardProps {
  item: PortfolioItem
  isManageMode?: boolean
  onOpen?: (item: PortfolioItem) => void
  onEdit?: (item: PortfolioItem) => void
  onDelete?: (item: PortfolioItem) => void
}

export function PortfolioCard({
  item,
  isManageMode = false,
  onOpen,
  onEdit,
  onDelete,
}: PortfolioCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onOpen) {
      e.preventDefault()
      onOpen(item)
    }
  }

  return (
    <article
      className={cn(
        'relative group rounded-2xl overflow-hidden',
        'bg-white/20 backdrop-blur-sm border border-white/25',
        'shadow-glass transition-all duration-300',
        onOpen && 'cursor-pointer hover:shadow-glass-lg hover:scale-[1.02]',
        'focus-within:ring-2 focus-within:ring-ink-orange/50'
      )}
      aria-label={item.title ?? 'Trabajo de tatuaje'}
    >
      {/* Image */}
      <div
        role={onOpen ? 'button' : undefined}
        tabIndex={onOpen ? 0 : undefined}
        onClick={() => onOpen?.(item)}
        onKeyDown={handleKeyDown}
        aria-label={`Ver detalle: ${item.title ?? 'Trabajo de tatuaje'}`}
        className="relative aspect-[3/4] w-full overflow-hidden"
      >
        <Image
          src={item.image_url}
          alt={item.title ?? 'Trabajo de tatuaje'}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Hover overlay */}
        <div
          aria-hidden="true"
          className={cn(
            'absolute inset-0 flex flex-col justify-end p-3',
            'bg-gradient-to-t from-black/70 via-black/20 to-transparent',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-300'
          )}
        >
          {/* Style badge */}
          {item.style && (
            <span className="inline-flex self-start items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-white border border-white/30 mb-2">
              {item.style}
            </span>
          )}

          {/* Title */}
          {item.title && (
            <p className="text-white font-semibold text-sm leading-snug truncate">
              {item.title}
            </p>
          )}

          {/* Artist */}
          {item.artist?.full_name && (
            <p className="text-white/70 text-xs mt-0.5 truncate">
              {item.artist.full_name}
            </p>
          )}
        </div>

        {/* Available badge */}
        {item.is_available_design && (
          <div
            aria-label="Disponible para reservar"
            className={cn(
              'absolute top-2 left-2 flex items-center gap-1',
              'px-2 py-0.5 rounded-full text-xs font-semibold',
              'bg-ink-orange/90 backdrop-blur-sm text-white shadow-sm'
            )}
          >
            <Bookmark className="h-3 w-3" aria-hidden="true" />
            <span>Disponible</span>
          </div>
        )}

        {/* Visibility badge (manage mode only) */}
        {isManageMode && !item.is_public && (
          <div
            aria-label="Solo visible para el estudio"
            className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-800/80 backdrop-blur-sm text-white"
          >
            Privado
          </div>
        )}
      </div>

      {/* Manage mode action buttons */}
      {isManageMode && (
        <div
          className={cn(
            'absolute bottom-0 inset-x-0 flex items-center justify-end gap-1.5 p-2',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-200'
          )}
          aria-label="Acciones"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.(item)
            }}
            aria-label={`Editar ${item.title ?? 'item'}`}
            className={cn(
              'flex items-center justify-center h-8 w-8 rounded-xl',
              'bg-white/80 backdrop-blur-sm border border-white/40',
              'text-ink-dark hover:text-ink-orange hover:bg-white',
              'transition-all duration-200 shadow-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50'
            )}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.(item)
            }}
            aria-label={`Eliminar ${item.title ?? 'item'}`}
            className={cn(
              'flex items-center justify-center h-8 w-8 rounded-xl',
              'bg-white/80 backdrop-blur-sm border border-white/40',
              'text-ink-dark hover:text-red-500 hover:bg-white',
              'transition-all duration-200 shadow-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50'
            )}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </article>
  )
}

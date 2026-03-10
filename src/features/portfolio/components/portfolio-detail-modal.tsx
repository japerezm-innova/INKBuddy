'use client'

import { useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, Bookmark, User, Palette, MapPin, Calendar } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { PortfolioItem } from '../types/portfolio'

interface PortfolioDetailModalProps {
  item: PortfolioItem | null
  isOpen: boolean
  onClose: () => void
}

export function PortfolioDetailModal({
  item,
  isOpen,
  onClose,
}: PortfolioDetailModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      // Delay focus to allow animation
      const timer = setTimeout(() => closeButtonRef.current?.focus(), 50)
      return () => {
        clearTimeout(timer)
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = ''
      }
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) {
      onClose()
    }
  }

  if (!isOpen || !item) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title ?? 'Detalle del trabajo'}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={handleBackdropClick}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        className={cn(
          'relative z-10 w-full max-w-3xl max-h-[90vh]',
          'bg-white/30 backdrop-blur-2xl border border-white/25',
          'rounded-3xl shadow-glass overflow-hidden',
          'flex flex-col md:flex-row',
          'transition-all duration-200'
        )}
      >
        {/* Close button */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalle"
          className={cn(
            'absolute top-3 right-3 z-20',
            'flex items-center justify-center h-8 w-8 rounded-xl',
            'bg-black/20 backdrop-blur-sm border border-white/20 text-white',
            'hover:bg-black/40 transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
          )}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* Image */}
        <div className="relative w-full md:w-1/2 aspect-[3/4] md:aspect-auto md:min-h-[400px] shrink-0">
          <Image
            src={item.image_url}
            alt={item.title ?? 'Trabajo de tatuaje'}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
          {item.style && (
            <span
              className={cn(
                'absolute bottom-3 left-3',
                'inline-flex items-center px-2.5 py-1 rounded-full',
                'text-xs font-semibold bg-black/40 backdrop-blur-sm text-white',
                'border border-white/20'
              )}
            >
              {item.style}
            </span>
          )}
        </div>

        {/* Info panel */}
        <div className="flex flex-col flex-1 p-6 overflow-y-auto gap-4">
          {/* Available badge */}
          {item.is_available_design && (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full',
                  'text-sm font-semibold bg-ink-orange/15 text-ink-orange',
                  'border border-ink-orange/30'
                )}
              >
                <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                Disponible para reservar
              </span>
            </div>
          )}

          {/* Title */}
          {item.title && (
            <h2 className="text-xl font-bold text-ink-dark leading-snug">
              {item.title}
            </h2>
          )}

          {/* Description */}
          {item.description && (
            <p className="text-sm text-ink-dark/70 leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Metadata */}
          <dl className="flex flex-col gap-3 text-sm">
            {item.artist?.full_name && (
              <div className="flex items-center gap-2.5">
                <dt className="sr-only">Artista</dt>
                <User
                  className="h-4 w-4 text-ink-orange shrink-0"
                  aria-hidden="true"
                />
                <dd className="text-ink-dark font-medium">
                  {item.artist.full_name}
                </dd>
              </div>
            )}

            {item.style && (
              <div className="flex items-center gap-2.5">
                <dt className="sr-only">Estilo</dt>
                <Palette
                  className="h-4 w-4 text-ink-coral shrink-0"
                  aria-hidden="true"
                />
                <dd className="text-ink-dark/80">{item.style}</dd>
              </div>
            )}

            {item.body_placement && (
              <div className="flex items-center gap-2.5">
                <dt className="sr-only">Colocacion en el cuerpo</dt>
                <MapPin
                  className="h-4 w-4 text-ink-peach shrink-0"
                  aria-hidden="true"
                />
                <dd className="text-ink-dark/80">{item.body_placement}</dd>
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <dt className="sr-only">Fecha de publicacion</dt>
              <Calendar
                className="h-4 w-4 text-ink-pink shrink-0"
                aria-hidden="true"
              />
              <dd className="text-ink-dark/60">
                {new Date(item.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
          </dl>

          {/* CTA */}
          {item.is_available_design && (
            <div className="mt-auto pt-4">
              <Link
                href="/booking"
                className={cn(
                  'inline-flex items-center justify-center w-full h-12 px-7 text-base font-medium rounded-2xl',
                  'gradient-accent text-white shadow-warm',
                  'hover:shadow-warm-lg hover:scale-[1.02]',
                  'transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50'
                )}
              >
                Reservar este diseno
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

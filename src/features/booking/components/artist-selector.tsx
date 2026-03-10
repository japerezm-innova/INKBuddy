'use client'

import { useEffect, useState } from 'react'
import { User, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { GlassCard } from '@/shared/components'
import { getPublicArtists } from '../services/booking-service'
import type { PublicArtist } from '../types/booking'

interface ArtistSelectorProps {
  selectedArtistId: string
  onSelect: (artist: PublicArtist) => void
}

export function ArtistSelector({ selectedArtistId, onSelect }: ArtistSelectorProps) {
  const [artists, setArtists] = useState<PublicArtist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchArtists() {
      setIsLoading(true)
      setError(null)
      const result = await getPublicArtists()
      if (result.error) {
        setError(result.error)
      } else {
        setArtists(result.data ?? [])
      }
      setIsLoading(false)
    }

    void fetchArtists()
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-ink-orange" aria-hidden="true" />
        <p className="text-sm text-gray-500">Cargando artistas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
        <AlertCircle className="h-8 w-8 text-red-400" aria-hidden="true" />
        <p className="text-sm text-red-500 font-medium">{error}</p>
      </div>
    )
  }

  if (artists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
        <User className="h-10 w-10 text-gray-300" aria-hidden="true" />
        <p className="text-sm text-gray-500">No hay artistas disponibles en este momento.</p>
      </div>
    )
  }

  return (
    <div
      role="radiogroup"
      aria-label="Seleccionar artista"
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      {artists.map((artist) => {
        const isSelected = artist.id === selectedArtistId
        const initials = artist.full_name
          ? artist.full_name
              .split(' ')
              .slice(0, 2)
              .map((n) => n[0])
              .join('')
              .toUpperCase()
          : '?'

        return (
          <button
            key={artist.id}
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(artist)}
            className={cn(
              'text-left rounded-3xl p-5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50',
              'bg-white/30 backdrop-blur-xl border shadow-glass',
              isSelected
                ? 'border-ink-orange/70 shadow-warm bg-white/50 scale-[1.02]'
                : 'border-white/25 hover:border-ink-orange/30 hover:bg-white/40 hover:scale-[1.01]'
            )}
          >
            <div className="flex items-start gap-4">
              {/* Avatar or initials */}
              <div className="flex-shrink-0">
                {artist.avatar_url ? (
                  <img
                    src={artist.avatar_url}
                    alt={artist.full_name ?? 'Artista'}
                    className="h-14 w-14 rounded-2xl object-cover"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="h-14 w-14 rounded-2xl gradient-accent flex items-center justify-center text-white font-bold text-lg"
                  >
                    {initials}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink-dark truncate">
                  {artist.full_name ?? 'Artista'}
                </p>

                {artist.bio && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{artist.bio}</p>
                )}

                {artist.specialties && artist.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {artist.specialties.slice(0, 3).map((specialty) => (
                      <span
                        key={specialty}
                        className="inline-block px-2 py-0.5 bg-ink-orange/10 text-ink-orange text-xs rounded-full font-medium"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Selection indicator */}
              <div
                aria-hidden="true"
                className={cn(
                  'flex-shrink-0 h-5 w-5 rounded-full border-2 transition-all duration-200 mt-0.5',
                  isSelected
                    ? 'border-ink-orange bg-ink-orange'
                    : 'border-gray-300 bg-white/50'
                )}
              >
                {isSelected && (
                  <svg viewBox="0 0 10 10" className="h-full w-full text-white" fill="currentColor">
                    <path d="M2 5l2.5 2.5 3.5-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

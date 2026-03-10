'use client'

import { useEffect, useState } from 'react'
import { Scissors, Clock, DollarSign, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { getPublicServices } from '../services/booking-service'
import type { PublicService } from '../types/booking'

interface ServiceSelectorProps {
  selectedServiceId: string
  onSelect: (service: PublicService) => void
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  if (remaining === 0) return `${hours} h`
  return `${hours} h ${remaining} min`
}

function formatPrice(min: number | null, max: number | null): string {
  if (min === null && max === null) return 'Precio a consultar'
  if (min !== null && max !== null) {
    if (min === max) return `$${min.toLocaleString()}`
    return `$${min.toLocaleString()} – $${max.toLocaleString()}`
  }
  if (min !== null) return `Desde $${min.toLocaleString()}`
  if (max !== null) return `Hasta $${max.toLocaleString()}`
  return 'Precio a consultar'
}

export function ServiceSelector({ selectedServiceId, onSelect }: ServiceSelectorProps) {
  const [services, setServices] = useState<PublicService[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchServices() {
      setIsLoading(true)
      setError(null)
      const result = await getPublicServices()
      if (result.error) {
        setError(result.error)
      } else {
        setServices(result.data ?? [])
      }
      setIsLoading(false)
    }

    void fetchServices()
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-ink-orange" aria-hidden="true" />
        <p className="text-sm text-gray-500">Cargando servicios...</p>
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

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
        <Scissors className="h-10 w-10 text-gray-300" aria-hidden="true" />
        <p className="text-sm text-gray-500">No hay servicios disponibles en este momento.</p>
      </div>
    )
  }

  return (
    <div
      role="radiogroup"
      aria-label="Seleccionar servicio"
      className="flex flex-col gap-3"
    >
      {services.map((service) => {
        const isSelected = service.id === selectedServiceId

        return (
          <button
            key={service.id}
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(service)}
            className={cn(
              'text-left rounded-3xl p-5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50',
              'bg-white/30 backdrop-blur-xl border shadow-glass',
              isSelected
                ? 'border-ink-orange/70 shadow-warm bg-white/50'
                : 'border-white/25 hover:border-ink-orange/30 hover:bg-white/40'
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-ink-dark">{service.name}</p>
                  {isSelected && (
                    <span className="inline-block px-2 py-0.5 gradient-accent text-white text-xs rounded-full font-medium">
                      Seleccionado
                    </span>
                  )}
                </div>

                {service.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{service.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-ink-orange" aria-hidden="true" />
                    {formatDuration(service.duration_minutes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-ink-orange" aria-hidden="true" />
                    {formatPrice(service.price_min, service.price_max)}
                  </span>
                </div>
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

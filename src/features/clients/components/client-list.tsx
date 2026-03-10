'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Users } from 'lucide-react'
import { GlassInput, GlassButton } from '@/shared/components'
import { getClients } from '../services/client-service'
import { ClientCard } from './client-card'
import type { Client, ClientFilter } from '../types/client'

type SourceFilter = NonNullable<Client['source']> | 'all'

interface FilterChip {
  value: SourceFilter
  label: string
}

const FILTER_CHIPS: FilterChip[] = [
  { value: 'all', label: 'Todos' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'referral', label: 'Referido' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'website', label: 'Web' },
  { value: 'other', label: 'Otro' },
]

export function ClientList() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [activeSource, setActiveSource] = useState<SourceFilter>('all')
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const fetchClients = useCallback(
    (searchTerm: string, source: SourceFilter) => {
      startTransition(async () => {
        setFetchError(null)

        const filter: ClientFilter = {}
        if (searchTerm.trim()) filter.search = searchTerm.trim()
        if (source !== 'all') filter.source = source

        const result = await getClients(filter)
        if (result.error) {
          setFetchError(result.error)
        } else {
          setClients(result.data ?? [])
        }
        setIsInitialLoad(false)
      })
    },
    []
  )

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients(search, activeSource)
    }, 300)

    return () => clearTimeout(timer)
  }, [search, activeSource, fetchClients])

  const handleCardClick = (clientId: string) => {
    router.push(`/clients/${clientId}`)
  }

  const handleNewClient = () => {
    router.push('/clients/new')
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Search bar */}
      <GlassInput
        id="client-search"
        type="search"
        placeholder="Buscar por nombre, telefono o email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        icon={Search}
        aria-label="Buscar clientes"
      />

      {/* Source filter chips */}
      <div
        className="flex gap-2 flex-wrap"
        role="group"
        aria-label="Filtrar por origen"
      >
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.value}
            type="button"
            onClick={() => setActiveSource(chip.value)}
            aria-pressed={activeSource === chip.value}
            className={
              activeSource === chip.value
                ? 'px-3.5 py-1.5 rounded-xl text-sm font-semibold gradient-accent text-white shadow-warm border border-transparent transition-all duration-200'
                : 'px-3.5 py-1.5 rounded-xl text-sm font-medium bg-white/15 backdrop-blur-md border border-white/20 text-ink-dark/70 hover:bg-white/25 transition-all duration-200'
            }
          >
            {chip.label}
          </button>
        ))}
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
          aria-label="Cargando clientes"
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
      {!isPending && !isInitialLoad && !fetchError && clients.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="h-16 w-16 rounded-3xl gradient-accent flex items-center justify-center shadow-warm">
            <Users className="h-8 w-8 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-semibold text-ink-dark">
              {search || activeSource !== 'all'
                ? 'Sin resultados'
                : 'Aun no hay clientes'}
            </p>
            <p className="text-sm text-ink-dark/50 mt-1">
              {search || activeSource !== 'all'
                ? 'Intenta con otros terminos o filtros.'
                : 'Crea tu primer cliente para comenzar.'}
            </p>
          </div>
          {!search && activeSource === 'all' && (
            <GlassButton variant="primary" onClick={handleNewClient}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nuevo cliente
            </GlassButton>
          )}
        </div>
      )}

      {/* Client grid */}
      {!isPending && !isInitialLoad && clients.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onClick={() => handleCardClick(client.id)}
            />
          ))}
        </div>
      )}

      {/* Floating action button */}
      <button
        type="button"
        onClick={handleNewClient}
        aria-label="Nuevo cliente"
        className="fixed bottom-24 right-5 md:bottom-8 md:right-8 h-14 w-14 rounded-2xl gradient-accent text-white shadow-warm hover:shadow-warm-lg hover:scale-105 transition-all duration-200 flex items-center justify-center z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50"
      >
        <Plus className="h-6 w-6" aria-hidden="true" />
      </button>
    </div>
  )
}

'use client'

import { useState, useTransition, useEffect } from 'react'
import { Building2, Star, Trash2, Plus, Search, X } from 'lucide-react'
import { GlassCard } from '@/shared/components'
import {
  getMyStudios,
  addStudioAssociation,
  removeStudioAssociation,
  setPrimaryStudio,
  searchStudios,
} from '../services/studio-association-service'
import type { StudioItem } from '../services/studio-association-service'

export function StudioAssociationSettings() {
  const [studios, setStudios] = useState<StudioItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Search state
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<StudioItem[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    getMyStudios().then((res) => {
      if (res.data) setStudios(res.data)
      setIsLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    const timeout = setTimeout(async () => {
      setIsSearching(true)
      const res = await searchStudios(searchQuery)
      setSearchResults(res.data ?? [])
      setIsSearching(false)
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  function showMessage(msg: string, isError = false) {
    if (isError) setError(msg)
    else setSuccess(msg)
    setTimeout(() => { setError(null); setSuccess(null) }, 3000)
  }

  function handleSetPrimary(studioId: string) {
    startTransition(async () => {
      const res = await setPrimaryStudio(studioId)
      if (res.error) { showMessage(res.error, true); return }
      const updated = await getMyStudios()
      if (updated.data) setStudios(updated.data)
      showMessage('Estudio principal actualizado')
    })
  }

  function handleRemove(studioId: string) {
    startTransition(async () => {
      const res = await removeStudioAssociation(studioId)
      if (res.error) { showMessage(res.error, true); return }
      const updated = await getMyStudios()
      if (updated.data) setStudios(updated.data)
      showMessage('Estudio eliminado')
    })
  }

  function handleAdd(studioId: string) {
    const alreadyLinked = studios.some((s) => s.id === studioId)
    if (alreadyLinked) { showMessage('Ya estás asociado a ese estudio', true); return }

    startTransition(async () => {
      const res = await addStudioAssociation(studioId)
      if (res.error) { showMessage(res.error, true); return }
      const updated = await getMyStudios()
      if (updated.data) setStudios(updated.data)
      setShowSearch(false)
      setSearchQuery('')
      setSearchResults([])
      showMessage('Estudio agregado')
    })
  }

  return (
    <GlassCard hover={false} padding="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center h-9 w-9 rounded-2xl bg-white/20 border border-white/25">
          <Building2 className="h-4 w-4 text-ink-dark/70" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-ink-dark">Mis estudios</h2>
          <p className="text-xs text-ink-dark/50 mt-0.5">El estudio principal aparece en tus cotizaciones</p>
        </div>
      </div>

      {/* Studio list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-white/20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {studios.map((studio) => (
            <div
              key={studio.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                studio.is_primary
                  ? 'bg-ink-orange/10 border-ink-orange/30'
                  : 'bg-white/20 border-white/20'
              }`}
            >
              <Building2 className={`h-4 w-4 shrink-0 ${studio.is_primary ? 'text-ink-orange' : 'text-ink-dark/40'}`} />
              <span className={`flex-1 text-sm font-medium ${studio.is_primary ? 'text-ink-dark' : 'text-ink-dark/70'}`}>
                {studio.name}
              </span>
              {studio.is_primary && (
                <span className="text-[11px] font-semibold text-ink-orange bg-ink-orange/10 px-2 py-0.5 rounded-full">
                  Principal
                </span>
              )}
              {!studio.is_primary && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSetPrimary(studio.id)}
                    disabled={isPending}
                    title="Hacer estudio principal"
                    className="p-1.5 rounded-lg text-ink-dark/40 hover:text-ink-orange hover:bg-ink-orange/10 transition-colors disabled:opacity-40"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleRemove(studio.id)}
                    disabled={isPending}
                    title="Eliminar asociación"
                    className="p-1.5 rounded-lg text-ink-dark/40 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Feedback messages */}
      {error && (
        <p className="mt-3 text-sm text-red-500 font-medium">{error}</p>
      )}
      {success && (
        <p className="mt-3 text-sm text-emerald-600 font-medium">{success}</p>
      )}

      {/* Add studio */}
      {!showSearch ? (
        <button
          onClick={() => setShowSearch(true)}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/40 text-sm text-ink-dark/50 hover:text-ink-dark/70 hover:border-white/60 hover:bg-white/10 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Agregar otro estudio
        </button>
      ) : (
        <div className="mt-4 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-dark/40" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar estudio por nombre..."
              className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white/30 border border-white/30 text-sm text-ink-dark placeholder:text-ink-dark/40 focus:outline-none focus:ring-2 focus:ring-ink-orange/30"
            />
            <button
              onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-dark/40 hover:text-ink-dark/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {isSearching && (
            <p className="text-xs text-ink-dark/40 px-1">Buscando...</p>
          )}
          {searchResults.length > 0 && (
            <div className="rounded-xl border border-white/30 bg-white/40 backdrop-blur-sm overflow-hidden">
              {searchResults.map((result) => {
                const linked = studios.some((s) => s.id === result.id)
                return (
                  <button
                    key={result.id}
                    disabled={linked || isPending}
                    onClick={() => handleAdd(result.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-white/40 transition-colors disabled:opacity-40 disabled:cursor-default"
                  >
                    <Building2 className="h-4 w-4 text-ink-dark/40 shrink-0" />
                    <span className="flex-1 text-ink-dark/80">{result.name}</span>
                    {linked && <span className="text-xs text-ink-dark/40">Ya asociado</span>}
                  </button>
                )
              })}
            </div>
          )}
          {searchQuery.trim() && !isSearching && searchResults.length === 0 && (
            <p className="text-xs text-ink-dark/40 px-1">No se encontraron estudios con ese nombre</p>
          )}
        </div>
      )}
    </GlassCard>
  )
}

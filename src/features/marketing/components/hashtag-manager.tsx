'use client'

import { useState, useEffect } from 'react'
import { Hash, Copy, Plus, Trash2, Check, ChevronDown, ChevronUp, Star } from 'lucide-react'
import { GlassCard, GlassButton, GlassInput } from '@/shared/components'
import { cn, glass } from '@/shared/lib/utils'
import {
  getHashtagCollections,
  createHashtagCollection,
  deleteHashtagCollection,
  incrementUsageCount,
} from '../services/hashtag-service'
import type { HashtagCollection } from '../types/marketing'

function parseHashtagsInput(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith('#') ? t : `#${t}`))
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3" aria-label="Cargando colecciones" aria-busy="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <GlassCard key={i} padding="p-4" hover={false}>
          <div className="h-5 w-48 rounded-lg bg-white/20 animate-pulse" />
          <div className="h-3 w-24 rounded-lg bg-white/10 animate-pulse mt-2" />
        </GlassCard>
      ))}
    </div>
  )
}

export function HashtagManager() {
  const [collections, setCollections] = useState<HashtagCollection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newHashtags, setNewHashtags] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCollections()
  }, [])

  async function loadCollections() {
    setIsLoading(true)
    const result = await getHashtagCollections()
    setCollections(result.data ?? [])
    setIsLoading(false)
  }

  async function handleCreate() {
    setError(null)
    const parsedHashtags = parseHashtagsInput(newHashtags)

    if (!newName.trim()) {
      setError('El nombre es requerido')
      return
    }
    if (parsedHashtags.length === 0) {
      setError('Agrega al menos un hashtag')
      return
    }

    const result = await createHashtagCollection({
      name: newName.trim(),
      hashtags: parsedHashtags,
      category: newCategory.trim() || undefined,
    })

    if (result.error) {
      setError(result.error)
      return
    }

    setNewName('')
    setNewCategory('')
    setNewHashtags('')
    setShowCreateForm(false)
    await loadCollections()
  }

  async function handleDelete(collection: HashtagCollection) {
    const confirmed = window.confirm(
      `Eliminar la coleccion "${collection.name}"? Esta accion no se puede deshacer.`
    )
    if (!confirmed) return

    await deleteHashtagCollection(collection.id)
    setCollections((prev) => prev.filter((c) => c.id !== collection.id))
    if (expandedId === collection.id) setExpandedId(null)
  }

  async function handleCopy(collection: HashtagCollection) {
    const text = collection.hashtags.join(' ')
    await navigator.clipboard.writeText(text)
    setCopiedId(collection.id)
    await incrementUsageCount(collection.id)

    // Update usage_count locally for instant feedback
    setCollections((prev) =>
      prev.map((c) =>
        c.id === collection.id ? { ...c, usage_count: c.usage_count + 1 } : c
      )
    )

    setTimeout(() => setCopiedId(null), 2000)
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  if (isLoading) return <LoadingSkeleton />

  return (
    <section aria-label="Gestor de colecciones de hashtags" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink-dark flex items-center gap-2">
          <Hash className="h-5 w-5 text-ink-orange" aria-hidden="true" />
          Colecciones de Hashtags
        </h2>

        <GlassButton
          variant={showCreateForm ? 'secondary' : 'primary'}
          size="sm"
          onClick={() => setShowCreateForm((v) => !v)}
          aria-expanded={showCreateForm}
          aria-controls="create-collection-form"
        >
          <Plus className={cn('h-4 w-4 transition-transform', showCreateForm && 'rotate-45')} aria-hidden="true" />
          {showCreateForm ? 'Cancelar' : 'Nueva coleccion'}
        </GlassButton>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <GlassCard>
          <h3 className="font-semibold text-ink-dark mb-4">Nueva coleccion</h3>

          <div className="space-y-3">
            <GlassInput
              label="Nombre"
              placeholder="Ej: Estilo Realismo"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              aria-required="true"
            />

            <GlassInput
              label="Categoria (opcional)"
              placeholder="Ej: realismo, blackwork..."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-dark/80">
                Hashtags
              </label>
              <textarea
                placeholder="Escribe hashtags separados por espacio o coma"
                value={newHashtags}
                onChange={(e) => setNewHashtags(e.target.value)}
                rows={3}
                className={cn(
                  glass.input,
                  'w-full resize-none rounded-2xl p-4 text-sm text-ink-dark outline-none'
                )}
                aria-label="Hashtags de la coleccion"
                aria-required="true"
              />
              {newHashtags.trim() && (
                <p className="text-xs text-ink-dark/50">
                  {parseHashtagsInput(newHashtags).length} hashtags detectados
                </p>
              )}
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-500 font-medium">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <GlassButton variant="primary" size="md" onClick={handleCreate}>
                Guardar coleccion
              </GlassButton>
              <GlassButton
                variant="ghost"
                size="md"
                onClick={() => { setShowCreateForm(false); setError(null) }}
              >
                Cancelar
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Collections list */}
      {collections.length === 0 ? (
        <GlassCard hover={false}>
          <p className="text-center text-sm text-ink-dark/50 py-6">
            No hay colecciones. Las colecciones predeterminadas se crearan automaticamente.
          </p>
        </GlassCard>
      ) : (
        <ul className="flex flex-col gap-3" aria-label="Lista de colecciones">
          {collections.map((collection) => {
            const isExpanded = expandedId === collection.id
            const isCopied = copiedId === collection.id

            return (
              <li key={collection.id}>
                <GlassCard padding="p-4" hover={!isExpanded}>
                  {/* Header row */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-ink-dark truncate">
                          {collection.name}
                        </span>

                        {collection.is_preset && (
                          <Star
                            className="h-3.5 w-3.5 text-ink-orange flex-shrink-0"
                            aria-label="Coleccion predeterminada"
                          />
                        )}

                        {collection.category && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-ink-dark/60 capitalize">
                            {collection.category}
                          </span>
                        )}

                        {collection.usage_count > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-ink-orange/15 text-ink-orange/80">
                            Usado {collection.usage_count} {collection.usage_count === 1 ? 'vez' : 'veces'}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-ink-dark/40 mt-0.5">
                        {collection.hashtags.length} hashtags
                      </p>
                    </div>

                    <button
                      onClick={() => toggleExpand(collection.id)}
                      className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-xl hover:bg-white/15 transition-colors"
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? 'Colapsar coleccion' : 'Expandir coleccion'}
                    >
                      {isExpanded
                        ? <ChevronUp className="h-4 w-4 text-ink-dark/60" aria-hidden="true" />
                        : <ChevronDown className="h-4 w-4 text-ink-dark/60" aria-hidden="true" />
                      }
                    </button>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/15 space-y-4">
                      {/* Hashtag chips */}
                      <div
                        className="flex flex-wrap gap-2"
                        role="list"
                        aria-label={`Hashtags de ${collection.name}`}
                      >
                        {collection.hashtags.map((tag) => (
                          <span
                            key={tag}
                            role="listitem"
                            className="rounded-full bg-white/15 px-3 py-1 text-sm text-ink-dark/70"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <GlassButton
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCopy(collection)}
                          aria-label={`Copiar todos los hashtags de ${collection.name}`}
                        >
                          {isCopied
                            ? <Check className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
                            : <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          }
                          {isCopied ? 'Copiado' : 'Copiar todo'}
                        </GlassButton>

                        {!collection.is_preset && (
                          <GlassButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(collection)}
                            className="text-red-500/70 hover:text-red-500 hover:border-red-400/30"
                            aria-label={`Eliminar coleccion ${collection.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Eliminar
                          </GlassButton>
                        )}
                      </div>
                    </div>
                  )}
                </GlassCard>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

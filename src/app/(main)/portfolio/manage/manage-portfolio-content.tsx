'use client'

import { useState, useEffect, useTransition } from 'react'
import { Plus, X, RefreshCw, ImagePlus } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { GlassCard } from '@/shared/components'
import { PortfolioGrid } from '@/features/portfolio/components'
import { PortfolioUpload } from '@/features/portfolio/components'
import { getPortfolioItems, deletePortfolioItem } from '@/features/portfolio/services/portfolio-service'
import type { PortfolioItem } from '@/features/portfolio/types/portfolio'

type DrawerMode = 'create' | 'edit' | null

export function ManagePortfolioContent() {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [hasFetched, setHasFetched] = useState(false)

  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null)
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null)

  const [deleteConfirm, setDeleteConfirm] = useState<PortfolioItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const fetchItems = () => {
    startTransition(async () => {
      const result = await getPortfolioItems()
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

  const openCreate = () => {
    setEditingItem(null)
    setDrawerMode('create')
  }

  const openEdit = (item: PortfolioItem) => {
    setEditingItem(item)
    setDrawerMode('edit')
  }

  const closeDrawer = () => {
    setDrawerMode(null)
    setEditingItem(null)
  }

  const handleUploadSuccess = (newItem: PortfolioItem) => {
    if (drawerMode === 'edit') {
      setItems((prev) => prev.map((i) => (i.id === newItem.id ? newItem : i)))
    } else {
      setItems((prev) => [newItem, ...prev])
    }
    closeDrawer()
  }

  const handleDeleteRequest = (item: PortfolioItem) => {
    setDeleteConfirm(item)
    setDeleteError(null)
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    setIsDeleting(true)
    setDeleteError(null)

    const result = await deletePortfolioItem(deleteConfirm.id)

    setIsDeleting(false)

    if (result.error) {
      setDeleteError(result.error)
      return
    }

    setItems((prev) => prev.filter((i) => i.id !== deleteConfirm.id))
    setDeleteConfirm(null)
  }

  const cancelDelete = () => {
    setDeleteConfirm(null)
    setDeleteError(null)
  }

  return (
    <>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mi Portafolio</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {hasFetched && !isPending ? `${items.length} trabajos` : 'Cargando...'}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          aria-label="Agregar nuevo trabajo al portfolio"
          className={cn(
            'inline-flex items-center gap-2 h-10 px-4 rounded-2xl text-sm font-semibold',
            'gradient-accent text-white shadow-warm',
            'hover:shadow-warm-lg hover:scale-[1.02] transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50'
          )}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Agregar</span>
        </button>
      </div>

      {/* Content */}
      {!hasFetched || isPending ? (
        <PortfolioManageSkeleton />
      ) : error ? (
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
      ) : items.length === 0 ? (
        <EmptyPortfolio onAdd={openCreate} />
      ) : (
        <PortfolioGrid
          items={items}
          isManageMode
          onEdit={openEdit}
          onDelete={handleDeleteRequest}
        />
      )}

      {/* Upload/Edit Drawer */}
      {drawerMode !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={drawerMode === 'edit' ? 'Editar trabajo' : 'Agregar trabajo'}
          className="fixed inset-0 z-50 flex"
        >
          {/* Backdrop */}
          <div
            onClick={closeDrawer}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <div
            className={cn(
              'relative z-10 ml-auto w-full max-w-md h-full',
              'bg-white/70 backdrop-blur-2xl border-l border-white/30',
              'shadow-glass flex flex-col',
              'transition-transform duration-300'
            )}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between p-6 border-b border-white/25 shrink-0">
              <h2 className="text-lg font-bold text-ink-dark">
                {drawerMode === 'edit' ? 'Editar trabajo' : 'Nuevo trabajo'}
              </h2>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Cerrar panel"
                className={cn(
                  'flex items-center justify-center h-8 w-8 rounded-xl',
                  'bg-white/30 hover:bg-white/50 border border-white/30 text-ink-dark',
                  'transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50'
                )}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto p-6">
              <PortfolioUpload
                item={editingItem ?? undefined}
                onSuccess={handleUploadSuccess}
                onCancel={closeDrawer}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar eliminacion"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={cancelDelete}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
          />
          <GlassCard
            className={cn(
              'relative z-10 w-full max-w-sm',
              'transition-all duration-200'
            )}
          >
            <h2 className="text-base font-bold text-ink-dark mb-2">
              Eliminar trabajo
            </h2>
            <p className="text-sm text-ink-dark/70 mb-4">
              Estas a punto de eliminar{' '}
              <strong>{deleteConfirm.title ?? 'este trabajo'}</strong>. Esta
              accion no se puede deshacer.
            </p>

            {deleteError && (
              <p role="alert" className="text-sm text-red-500 mb-4">
                {deleteError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={cancelDelete}
                disabled={isDeleting}
                className={cn(
                  'flex-1 h-10 rounded-2xl text-sm font-medium',
                  'bg-white/25 hover:bg-white/40 border border-white/30 text-ink-dark',
                  'transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50',
                  'disabled:opacity-50 disabled:pointer-events-none'
                )}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className={cn(
                  'flex-1 h-10 rounded-2xl text-sm font-medium',
                  'bg-red-500 hover:bg-red-600 text-white',
                  'transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50',
                  'disabled:opacity-50 disabled:pointer-events-none'
                )}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyPortfolio({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-24 px-4 text-center',
        'bg-white/20 backdrop-blur-sm border border-white/25 rounded-3xl',
        'border-dashed'
      )}
    >
      <div
        aria-hidden="true"
        className="h-16 w-16 rounded-2xl gradient-accent flex items-center justify-center mb-4 shadow-warm"
      >
        <ImagePlus className="h-8 w-8 text-white" />
      </div>
      <h3 className="text-base font-semibold text-ink-dark mb-1">
        Tu portafolio esta vacio
      </h3>
      <p className="text-sm text-ink-dark/60 max-w-xs mb-6">
        Agrega tus mejores trabajos para mostrarlos a tus clientes potenciales.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className={cn(
          'inline-flex items-center gap-2 h-10 px-5 rounded-2xl text-sm font-semibold',
          'gradient-accent text-white shadow-warm',
          'hover:shadow-warm-lg hover:scale-[1.02] transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50'
        )}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Agregar primer trabajo
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function PortfolioManageSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando portafolio"
      className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'break-inside-avoid rounded-2xl overflow-hidden',
            'bg-white/20 backdrop-blur-sm border border-white/25 animate-pulse',
            i % 2 === 0 ? 'aspect-[3/4]' : 'aspect-square'
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

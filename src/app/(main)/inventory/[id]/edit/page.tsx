'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { GlassCard, GlassButton } from '@/shared/components'
import { ArrowLeft } from 'lucide-react'
import { InventoryForm } from '@/features/inventory/components'
import { getInventoryItemById } from '@/features/inventory/services/inventory-service'
import type { InventoryItem } from '@/features/inventory/types/inventory'

export default function EditInventoryItemPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  const [item, setItem] = useState<InventoryItem | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getInventoryItemById(id).then((result) => {
      if (result.error) {
        setFetchError(result.error)
      } else {
        setItem(result.data ?? null)
      }
      setIsLoading(false)
    })
  }, [id])

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto flex flex-col gap-4 animate-pulse">
        <div className="h-8 w-32 rounded-xl bg-white/20" />
        <div className="h-80 rounded-3xl bg-white/20" />
      </div>
    )
  }

  if (fetchError || !item) {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-lg font-semibold text-ink-dark">
          {fetchError ?? 'Item no encontrado'}
        </p>
        <GlassButton variant="secondary" onClick={() => router.push('/inventory')}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al inventario
        </GlassButton>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <GlassButton
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/inventory/${id}`)}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </GlassButton>
        <h1 className="text-2xl font-bold text-gray-800">Editar item</h1>
      </div>
      <GlassCard>
        <InventoryForm item={item} />
      </GlassCard>
    </div>
  )
}

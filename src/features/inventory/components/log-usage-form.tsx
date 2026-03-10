'use client'

import { useState, useTransition, useEffect } from 'react'
import { Package, ChevronDown } from 'lucide-react'
import { GlassInput, GlassButton, GlassCard } from '@/shared/components'
import { cn } from '@/shared/lib/utils'
import { logUsage, getInventoryItems } from '../services/inventory-service'
import type { InventoryItem, LogUsageInput } from '../types/inventory'

interface LogUsageFormProps {
  appointmentId?: string
  onSuccess?: () => void
}

export function LogUsageForm({ appointmentId, onSuccess }: LogUsageFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [items, setItems] = useState<InventoryItem[]>([])
  const [selectedItemId, setSelectedItemId] = useState('')
  const [quantity, setQuantity] = useState('1')

  // Load inventory items on mount
  useEffect(() => {
    getInventoryItems().then((result) => {
      if (result.data) setItems(result.data)
    })
  }, [])

  const selectedItem = items.find((i) => i.id === selectedItemId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (!selectedItemId) {
      setError('Selecciona un item del inventario')
      return
    }

    const parsedQty = parseFloat(quantity)
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setError('La cantidad debe ser mayor a 0')
      return
    }

    const input: LogUsageInput = {
      item_id: selectedItemId,
      quantity_used: parsedQty,
      ...(appointmentId && { appointment_id: appointmentId }),
    }

    startTransition(async () => {
      const result = await logUsage(input)
      if (result.error) {
        setError(result.error)
        return
      }
      setSuccessMsg('Uso registrado correctamente')
      setSelectedItemId('')
      setQuantity('1')
      onSuccess?.()
    })
  }

  return (
    <GlassCard padding="p-5">
      <h3 className="text-sm font-bold text-ink-dark mb-4 flex items-center gap-2">
        <Package className="h-4 w-4 text-ink-orange" aria-hidden="true" />
        Registrar uso de inventario
      </h3>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* Item selector */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="item-select" className="text-sm font-medium text-ink-dark/80">
            Item *
          </label>
          <div className="relative">
            <select
              id="item-select"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              required
              className={cn(
                'w-full h-11 px-4 pr-10 text-sm text-ink-dark rounded-xl outline-none appearance-none',
                'bg-white/15 backdrop-blur-md border border-white/20',
                'focus:border-ink-orange/50 focus:ring-2 focus:ring-ink-orange/20',
                'transition-all duration-200',
                !selectedItemId && 'text-gray-400'
              )}
              aria-label="Seleccionar item de inventario"
            >
              <option value="" disabled>
                Seleccionar item...
              </option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.current_stock} {item.unit} disponibles)
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-dark/40 pointer-events-none"
              aria-hidden="true"
            />
          </div>

          {/* Stock warning */}
          {selectedItem && selectedItem.current_stock <= selectedItem.minimum_stock && (
            <p className="text-xs text-amber-600 font-medium">
              Stock bajo: {selectedItem.current_stock} {selectedItem.unit} disponibles
            </p>
          )}
        </div>

        {/* Quantity */}
        <GlassInput
          label="Cantidad usada *"
          id="usage-quantity"
          type="number"
          min="0.01"
          step="0.01"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="1"
          required
        />

        {/* Appointment context */}
        {appointmentId && (
          <p className="text-xs text-ink-dark/50 bg-white/20 rounded-lg px-3 py-2">
            Se vinculara a la cita actual
          </p>
        )}

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="px-4 py-3 rounded-xl bg-red-100/80 border border-red-200/60 text-red-700 text-sm font-medium"
          >
            {error}
          </div>
        )}

        {/* Success */}
        {successMsg && (
          <div
            role="status"
            className="px-4 py-3 rounded-xl bg-emerald-100/80 border border-emerald-200/60 text-emerald-700 text-sm font-medium"
          >
            {successMsg}
          </div>
        )}

        {/* Submit */}
        <GlassButton
          type="submit"
          variant="primary"
          isLoading={isPending}
          className="w-full"
        >
          Registrar uso
        </GlassButton>
      </form>
    </GlassCard>
  )
}

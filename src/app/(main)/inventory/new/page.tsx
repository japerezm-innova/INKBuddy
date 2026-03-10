import { GlassCard } from '@/shared/components'
import { InventoryForm } from '@/features/inventory/components'

export default function NewInventoryItemPage() {
  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Nuevo item</h1>
      <GlassCard>
        <InventoryForm />
      </GlassCard>
    </div>
  )
}

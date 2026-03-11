import { InventoryList } from '@/features/inventory/components'
import { ProGate } from '@/shared/components'

export default function InventoryPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Inventario</h1>
      <ProGate>
        <InventoryList />
      </ProGate>
    </div>
  )
}

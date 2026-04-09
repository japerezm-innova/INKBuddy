'use client'

import { InventoryList } from '@/features/inventory/components'
import { SmartInventoryToggle } from '@/features/inventory/components/smart-inventory-toggle'
import { toggleSmartInventory } from '@/features/inventory/services/inventory-service'

interface Props {
  smartInventoryEnabled: boolean
}

export function InventoryPageClient({ smartInventoryEnabled }: Props) {
  return (
    <div className="space-y-4">
      <SmartInventoryToggle
        initialEnabled={smartInventoryEnabled}
        onToggle={toggleSmartInventory}
      />
      <InventoryList />
    </div>
  )
}

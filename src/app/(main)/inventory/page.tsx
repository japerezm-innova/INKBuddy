import { InventoryList } from '@/features/inventory/components'
import { ProGate } from '@/shared/components'
import { getProfile } from '@/features/auth/services/auth-service'
import { createClient } from '@/lib/supabase/server'
import { InventoryPageClient } from './inventory-page-client'

export default async function InventoryPage() {
  const { data: profile } = await getProfile()
  let smartEnabled = false

  if (profile?.studio_id) {
    const supabase = await createClient()
    const { data: studio } = await supabase
      .from('studios')
      .select('settings')
      .eq('id', profile.studio_id)
      .single()
    const settings = (studio?.settings ?? {}) as Record<string, unknown>
    smartEnabled = !!settings.smart_inventory_enabled
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Inventario</h1>
      <ProGate>
        <InventoryPageClient smartInventoryEnabled={smartEnabled} />
      </ProGate>
    </div>
  )
}

import { InventoryDetail } from '@/features/inventory/components'

export default async function InventoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <InventoryDetail itemId={id} />
    </div>
  )
}

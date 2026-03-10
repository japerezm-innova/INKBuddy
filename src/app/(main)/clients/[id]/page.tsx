import { ClientDetail } from '@/features/clients/components'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <ClientDetail clientId={id} />
    </div>
  )
}

import { ClientForm } from '@/features/clients/components'
import { GlassCard } from '@/shared/components'
import { getClientById } from '@/features/clients/services/client-service'
import { notFound } from 'next/navigation'

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: client, error } = await getClientById(id)

  if (error || !client) {
    notFound()
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Editar Cliente</h1>
      <GlassCard padding="p-6">
        <ClientForm client={client} />
      </GlassCard>
    </div>
  )
}

import { ClientForm } from '@/features/clients/components'
import { GlassCard } from '@/shared/components'

export default function NewClientPage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Nuevo Cliente</h1>
      <GlassCard padding="p-6">
        <ClientForm />
      </GlassCard>
    </div>
  )
}

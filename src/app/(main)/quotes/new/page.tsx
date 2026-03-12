import { GlassCard, ProGate } from '@/shared/components'
import { QuoteForm } from '@/features/quotes/components'
import { getMyStudios } from '@/features/settings/services/studio-association-service'

export const metadata = {
  title: 'Nueva Cotización | INKBuddy',
  description: 'Crea una cotización profesional para tu cliente',
}

export default async function NewQuotePage() {
  const { data: studios } = await getMyStudios()

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-ink-dark mb-6">Nueva Cotización</h1>
      <ProGate>
        <GlassCard padding="p-6">
          <QuoteForm studios={studios ?? []} />
        </GlassCard>
      </ProGate>
    </div>
  )
}

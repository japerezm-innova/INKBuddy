import { GlassCard } from '@/shared/components'
import { QuoteForm } from '@/features/quotes/components'

export const metadata = {
  title: 'Nueva Cotización | INKBuddy',
  description: 'Crea una cotización profesional para tu cliente',
}

export default function NewQuotePage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-ink-dark mb-6">Nueva Cotización</h1>
      <GlassCard padding="p-6">
        <QuoteForm />
      </GlassCard>
    </div>
  )
}

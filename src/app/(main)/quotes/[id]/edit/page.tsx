import { notFound } from 'next/navigation'
import { GlassCard, ProGate } from '@/shared/components'
import { QuoteForm } from '@/features/quotes/components'
import { getQuoteById } from '@/features/quotes/services/quote-service'

interface Props {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: 'Editar Cotización | INKBuddy',
}

export default async function EditQuotePage({ params }: Props) {
  const { id } = await params
  const { data: quote, error } = await getQuoteById(id)

  if (error || !quote) notFound()

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-ink-dark mb-6">Editar Cotización</h1>
      <ProGate>
        <GlassCard padding="p-6">
          <QuoteForm quote={quote} />
        </GlassCard>
      </ProGate>
    </div>
  )
}

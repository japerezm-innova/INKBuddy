import Link from 'next/link'
import { Plus } from 'lucide-react'
import { GlassCard, GlassButton, ProGate } from '@/shared/components'
import { QuoteList } from '@/features/quotes/components'
import { getQuotes } from '@/features/quotes/services/quote-service'

export const metadata = {
  title: 'Cotizaciones | INKBuddy',
  description: 'Gestiona las cotizaciones de tu estudio de tatuajes',
}

export default async function QuotesPage() {
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-ink-dark mb-6">Cotizaciones</h1>
      <ProGate>
        <QuotesContent />
      </ProGate>
    </div>
  )
}

async function QuotesContent() {
  const { data: quotes = [], error } = await getQuotes()

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <Link href="/quotes/new">
          <GlassButton variant="primary" className="hidden md:flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nueva cotización
          </GlassButton>
        </Link>
      </div>

      {error ? (
        <GlassCard padding="p-6">
          <p className="text-sm text-red-600">Error: {error}</p>
        </GlassCard>
      ) : (
        <QuoteList quotes={quotes} />
      )}
    </>
  )
}

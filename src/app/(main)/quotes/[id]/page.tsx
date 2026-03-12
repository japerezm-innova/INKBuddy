import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { getQuoteById, getStudioName } from '@/features/quotes/services/quote-service'
import { ProGate } from '@/shared/components'
import { QuoteDetailClient } from './quote-detail-client'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const { data: quote } = await getQuoteById(id)
  return {
    title: quote
      ? `${quote.quote_number} — ${quote.client_name} | INKBuddy`
      : 'Cotización | INKBuddy',
  }
}

export default async function QuoteDetailPage({ params }: Props) {
  const { id } = await params
  const { data: quote, error } = await getQuoteById(id)

  if (error || !quote) notFound()

  // Build public URL dynamically from request host
  const headersList = await headers()
  const host = headersList.get('host') ?? 'inkbuddycl.vercel.app'
  const protocol = host.startsWith('localhost') ? 'http' : 'https'
  const publicUrl = `${protocol}://${host}/q/${quote.id}`

  const studioName = await getStudioName(quote.studio_id)

  return (
    <ProGate>
      <QuoteDetailClient
        quote={quote}
        publicUrl={publicUrl}
        studioName={studioName}
      />
    </ProGate>
  )
}

import { notFound } from 'next/navigation'
import { getQuoteById } from '@/features/quotes/services/quote-service'
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://inkbuddy.app'
  const publicUrl = `${baseUrl}/q/${quote.id}`

  return (
    <QuoteDetailClient
      quote={quote}
      publicUrl={publicUrl}
      studioName="INKBuddy Studio"
    />
  )
}

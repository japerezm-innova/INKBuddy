import { notFound } from 'next/navigation'
import { getQuotePublic, getStudioName } from '@/features/quotes/services/quote-service'
import { PublicQuoteClient } from './public-quote-client'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const { data: quote } = await getQuotePublic(id)
  return {
    title: quote
      ? `Cotización ${quote.quote_number} | INKBuddy`
      : 'Cotización | INKBuddy',
  }
}

export default async function PublicQuotePage({ params }: Props) {
  const { id } = await params
  const { data: quote, error } = await getQuotePublic(id)

  if (error || !quote) notFound()

  const studioName = await getStudioName(quote.studio_id)

  return <PublicQuoteClient quote={quote} studioName={studioName} />
}

'use client'

import { useState, useTransition, useEffect } from 'react'
import { Printer, CheckCircle, XCircle } from 'lucide-react'
import { QuotePreview } from '@/features/quotes/components'
import { respondToQuotePublic } from '@/features/quotes/services/quote-service'
import type { Quote } from '@/features/quotes/types/quote'

interface Props {
  quote: Quote
  studioName: string
}

export function PublicQuoteClient({ quote: initial, studioName }: Props) {
  const [quote, setQuote] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  // Auto-print if ?print=1 param is in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('print') === '1') {
      setTimeout(() => window.print(), 600)
    }
  }, [])

  function handlePrint() {
    window.print()
  }

  function handleAccept() {
    startTransition(async () => {
      const result = await respondToQuotePublic(quote.id, 'accepted')
      if (result.data) { setQuote(result.data); setDone(true) }
    })
  }

  function handleReject() {
    startTransition(async () => {
      const result = await respondToQuotePublic(quote.id, 'rejected')
      if (result.data) { setQuote(result.data); setDone(true) }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4 md:p-8">
      <div className="max-w-xl mx-auto flex flex-col gap-4">
        {/* Preview */}
        <QuotePreview quote={quote} studioName={studioName} />

        {/* Actions */}
        <div className="flex flex-col gap-3 print:hidden">
          {/* Accept / Reject (only when status is 'sent') */}
          {quote.status === 'sent' && !done && (
            <div className="flex gap-3">
              <button
                onClick={handleAccept}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="h-5 w-5" />
                Aceptar cotización
              </button>
              <button
                onClick={handleReject}
                disabled={isPending}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-red-200 text-red-500 font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          )}

          {done && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium text-center ${
              quote.status === 'accepted'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {quote.status === 'accepted'
                ? '¡Cotización aceptada! El estudio se pondrá en contacto contigo.'
                : 'Cotización rechazada. El estudio ha sido notificado.'}
            </div>
          )}

          {/* Print */}
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/60 border border-white/40 text-gray-600 text-sm font-medium hover:bg-white transition-colors"
          >
            <Printer className="h-4 w-4" />
            Imprimir / Guardar PDF
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pb-4">
          Powered by INKBuddy · Plataforma para estudios de tatuajes
        </p>
      </div>

      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body { background: white !important; margin: 0; padding: 0; }
          .quote-document { box-shadow: none !important; border-radius: 0 !important; }
        }
        .print\\:hidden { }
        @media print { .print\\:hidden { display: none !important; } }
      `}</style>
    </div>
  )
}

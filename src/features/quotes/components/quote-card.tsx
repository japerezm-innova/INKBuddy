'use client'

import Link from 'next/link'
import { MessageCircle, Edit2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import {
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_COLORS,
  type Quote,
} from '../types/quote'

interface Props {
  quote: Quote
}

function formatPrice(price: number | null): string {
  if (price == null) return '—'
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(price)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function QuoteCard({ quote }: Props) {
  return (
    <div className="rounded-2xl bg-white/40 backdrop-blur-sm border border-white/30 p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-bold text-ink-orange tracking-wide">
            {quote.quote_number}
          </span>
          <p className="font-semibold text-ink-dark text-sm mt-0.5 line-clamp-1">
            {quote.client_name}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 px-2 py-0.5 rounded-full text-xs font-medium',
            QUOTE_STATUS_COLORS[quote.status]
          )}
        >
          {QUOTE_STATUS_LABELS[quote.status]}
        </span>
      </div>

      {/* Description */}
      {quote.design_description && (
        <p className="text-xs text-ink-dark/60 line-clamp-2">
          {quote.design_description}
        </p>
      )}

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-ink-dark/50">
        {quote.estimated_price != null && (
          <span className="font-semibold text-ink-dark/70">
            {formatPrice(quote.estimated_price)}
          </span>
        )}
        {quote.valid_until && (
          <span>Vence {formatDate(quote.valid_until)}</span>
        )}
        {quote.whatsapp_reminders_enabled && (
          <MessageCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Link
          href={`/quotes/${quote.id}`}
          className="flex-1 text-center py-1.5 rounded-xl bg-ink-orange/10 text-ink-orange text-xs font-medium hover:bg-ink-orange/20 transition-colors"
        >
          Ver cotización
        </Link>
        <Link
          href={`/quotes/${quote.id}/edit`}
          className="flex items-center justify-center px-3 py-1.5 rounded-xl bg-white/30 text-ink-dark/60 hover:bg-white/50 transition-colors"
          aria-label="Editar"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}

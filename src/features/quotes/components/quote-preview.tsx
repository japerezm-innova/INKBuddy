import { MessageCircle } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import {
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_COLORS,
  REMINDER_HOUR_OPTIONS,
  type Quote,
} from '../types/quote'

interface Props {
  quote: Quote
  studioName?: string
}

function formatPrice(price: number | null): string {
  if (price == null) return '—'
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(price)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function QuotePreview({ quote, studioName = 'INKBuddy Studio' }: Props) {
  const reminderHourLabels = REMINDER_HOUR_OPTIONS
    .filter(({ value }) => quote.whatsapp_reminder_hours.includes(value))
    .map(({ label }) => label)

  return (
    <div className="quote-document rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden print:shadow-none print:border-none print:rounded-none">
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100/60">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">INKBuddy</h1>
            <p className="text-sm text-gray-500 mt-0.5">{studioName}</p>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-ink-orange tracking-wide">
              {quote.quote_number}
            </span>
            <div className="mt-1">
              <span
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium',
                  QUOTE_STATUS_COLORS[quote.status]
                )}
              >
                {QUOTE_STATUS_LABELS[quote.status]}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 flex flex-col gap-5">
        {/* Cliente */}
        <div className="pb-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Para</p>
          <p className="text-base font-semibold text-gray-900">{quote.client_name}</p>
          {quote.client_phone && (
            <p className="text-sm text-gray-500 mt-0.5">📞 {quote.client_phone}</p>
          )}
          {quote.client_email && (
            <p className="text-sm text-gray-500 mt-0.5">✉️ {quote.client_email}</p>
          )}
        </div>

        {/* Tatuaje */}
        {(quote.design_description || quote.body_placement || quote.style) && (
          <div className="pb-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Descripción del Tatuaje
            </p>
            {quote.design_description && (
              <p className="text-sm text-gray-700 leading-relaxed mb-2">
                {quote.design_description}
              </p>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-500">
              {quote.style && <span>🎨 {quote.style}</span>}
              {quote.body_placement && <span>📍 {quote.body_placement}</span>}
              {quote.size_cm && <span>📐 {quote.size_cm}</span>}
              {quote.session_count > 1 && (
                <span>🗓️ {quote.session_count} sesiones</span>
              )}
            </div>
          </div>
        )}

        {/* Precio */}
        {(quote.estimated_price != null || quote.deposit_amount != null) && (
          <div className="pb-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Precio
            </p>
            {quote.estimated_price != null && (
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-gray-600">Precio estimado</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(quote.estimated_price)}
                </span>
              </div>
            )}
            {quote.deposit_amount != null && (
              <div className="flex justify-between items-baseline mt-1">
                <span className="text-sm text-gray-600">Depósito / Seña</span>
                <span className="text-sm font-semibold text-gray-700">
                  {formatPrice(quote.deposit_amount)}
                </span>
              </div>
            )}
            {quote.price_notes && (
              <p className="text-xs text-gray-400 mt-2 italic">{quote.price_notes}</p>
            )}
          </div>
        )}

        {/* Validez */}
        {quote.valid_until && (
          <div className={cn(
            'pb-4 border-b border-gray-100',
            quote.whatsapp_reminders_enabled ? '' : 'border-b-0'
          )}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Válida hasta
            </p>
            <p className="text-sm font-medium text-gray-700">
              {formatDate(quote.valid_until)}
            </p>
          </div>
        )}

        {/* Recordatorios WSP */}
        {quote.whatsapp_reminders_enabled && reminderHourLabels.length > 0 && (
          <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 flex items-start gap-2 print:hidden">
            <MessageCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-green-700">Recordatorios por WhatsApp</p>
              <p className="text-xs text-green-600/80 mt-0.5">
                {reminderHourLabels.join(' · ')} de que venza la cotización
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">
          Cotización generada con INKBuddy · Esta cotización es válida por el período indicado
        </p>
      </div>

      <style>{`
        @media print {
          .quote-document { margin: 0; padding: 0; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  )
}

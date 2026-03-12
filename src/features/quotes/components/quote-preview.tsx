import { cn } from '@/shared/lib/utils'
import {
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_COLORS,
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

function todayFormatted(): string {
  return new Date().toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function QuotePreview({ quote, studioName = 'INKBuddy Studio' }: Props) {
  return (
    <div className="quote-document rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      {/* Header dark */}
      <div className="px-7 py-6 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">INKBuddy</h1>
            <p className="text-sm text-gray-400 mt-0.5">{studioName}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-orange-400 tracking-widest uppercase">
              {quote.quote_number}
            </span>
            <div className="mt-1.5">
              <span
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-semibold',
                  QUOTE_STATUS_COLORS[quote.status]
                )}
              >
                {QUOTE_STATUS_LABELS[quote.status]}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Accent stripe */}
      <div className="h-0.5 bg-gradient-to-r from-orange-400 to-amber-300" />

      <div className="px-7 py-6 flex flex-col gap-6">
        {/* Cliente */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Dirigido a
          </p>
          <p className="text-base font-semibold text-gray-900">{quote.client_name}</p>
          {quote.client_phone && (
            <p className="text-sm text-gray-500 mt-1">Tel. {quote.client_phone}</p>
          )}
          {quote.client_email && (
            <p className="text-sm text-gray-500 mt-0.5">{quote.client_email}</p>
          )}
        </div>

        {/* Descripción del tatuaje */}
        {(quote.design_description || quote.body_placement || quote.style) && (
          <div className="border-t border-gray-100 pt-5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Descripción del Tatuaje
            </p>
            {quote.design_description && (
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                {quote.design_description}
              </p>
            )}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
              {quote.style && (
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide block">Estilo</span>
                  <p className="text-sm font-medium text-gray-800">{quote.style}</p>
                </div>
              )}
              {quote.body_placement && (
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide block">Zona corporal</span>
                  <p className="text-sm font-medium text-gray-800">{quote.body_placement}</p>
                </div>
              )}
              {quote.size_cm && (
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide block">Tamaño</span>
                  <p className="text-sm font-medium text-gray-800">{quote.size_cm}</p>
                </div>
              )}
              {quote.session_count > 1 && (
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide block">Sesiones</span>
                  <p className="text-sm font-medium text-gray-800">{quote.session_count} sesiones</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Precio */}
        {(quote.estimated_price != null || quote.deposit_amount != null) && (
          <div className="border-t border-gray-100 pt-5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Pagos
            </p>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              {quote.estimated_price != null && (
                <div className="flex justify-between items-center px-4 py-3 bg-gray-50/80">
                  <span className="text-sm text-gray-600">Precio estimado</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(quote.estimated_price)}
                  </span>
                </div>
              )}
              {quote.deposit_amount != null && (
                <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100">
                  <span className="text-sm text-gray-600">Depósito / Abono</span>
                  <span className="text-sm font-semibold text-gray-700">
                    {formatPrice(quote.deposit_amount)}
                  </span>
                </div>
              )}
            </div>
            {quote.price_notes && (
              <p className="text-xs text-gray-400 mt-2 italic">{quote.price_notes}</p>
            )}
          </div>
        )}

        {/* Vigencia */}
        {quote.valid_until && (
          <div className="border-t border-gray-100 pt-5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Vigencia
            </p>
            <p className="text-sm font-medium text-gray-700">
              Esta cotización es válida hasta el{' '}
              <span className="font-semibold">{formatDate(quote.valid_until)}</span>
            </p>
          </div>
        )}

        {/* Notas (si existen) */}
        {quote.notes && (
          <div className="border-t border-gray-100 pt-5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Notas
            </p>
            <p className="text-sm text-gray-600 italic">{quote.notes}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-7 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <p className="text-xs text-gray-400">Generado con INKBuddy</p>
        <p className="text-xs text-gray-400">{todayFormatted()}</p>
      </div>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MessageCircle,
  Link2,
  Printer,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Send,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { GlassButton } from '@/shared/components'
import { QuotePreview } from '@/features/quotes/components'
import {
  updateQuoteStatus,
  deleteQuote,
  updateQuote,
} from '@/features/quotes/services/quote-service'
import {
  QUOTE_STATUS_LABELS,
  REMINDER_HOUR_OPTIONS,
  type Quote,
  type QuoteStatus,
} from '@/features/quotes/types/quote'

interface Props {
  quote: Quote
  publicUrl: string
  studioName?: string
}

const STATUS_FLOW: { status: QuoteStatus; label: string; icon: React.ElementType }[] = [
  { status: 'sent',     label: 'Marcar enviada',   icon: Send },
  { status: 'accepted', label: 'Marcar aceptada',  icon: CheckCircle },
  { status: 'rejected', label: 'Marcar rechazada', icon: XCircle },
]

export function QuoteDetailClient({ quote: initial, publicUrl, studioName }: Props) {
  const router = useRouter()
  const [quote, setQuote] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [copied, setCopied] = useState(false)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)

  function handleCopyLink() {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleWhatsApp() {
    if (!quote.client_phone) return
    const phone = quote.client_phone.replace(/\D/g, '')
    const name = quote.client_name
    const text = encodeURIComponent(
      `Hola ${name}, te envío tu cotización de tatuaje: ${publicUrl}`
    )
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
  }

  function handlePrint() {
    window.open(publicUrl + '?print=1', '_blank')
  }

  function handleStatusChange(status: QuoteStatus) {
    setStatusMenuOpen(false)
    startTransition(async () => {
      const result = await updateQuoteStatus(quote.id, status)
      if (result.data) setQuote(result.data)
    })
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    startTransition(async () => {
      await deleteQuote(quote.id)
      router.push('/quotes')
    })
  }

  function handleToggleReminders() {
    startTransition(async () => {
      const result = await updateQuote(quote.id, {
        whatsapp_reminders_enabled: !quote.whatsapp_reminders_enabled,
      })
      if (result.data) setQuote(result.data)
    })
  }

  const reminderLabels = REMINDER_HOUR_OPTIONS
    .filter(({ value }) => quote.whatsapp_reminder_hours.includes(value))
    .map(({ label }) => label)

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto flex flex-col gap-4">
      {/* Actions bar */}
      <div className="flex flex-wrap gap-2">
        {/* WhatsApp */}
        <button
          onClick={handleWhatsApp}
          disabled={!quote.client_phone}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500 text-white text-sm font-medium disabled:opacity-40 hover:bg-green-600 transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </button>

        {/* Copy link */}
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/40 backdrop-blur-sm border border-white/30 text-ink-dark/70 text-sm font-medium hover:bg-white/60 transition-colors"
        >
          <Link2 className="h-4 w-4" />
          {copied ? '¡Copiado!' : 'Copiar link'}
        </button>

        {/* Print */}
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/40 backdrop-blur-sm border border-white/30 text-ink-dark/70 text-sm font-medium hover:bg-white/60 transition-colors"
        >
          <Printer className="h-4 w-4" />
          Imprimir
        </button>

        {/* Status */}
        <div className="relative ml-auto">
          <button
            onClick={() => setStatusMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ink-orange/10 text-ink-orange text-sm font-medium hover:bg-ink-orange/20 transition-colors"
          >
            {QUOTE_STATUS_LABELS[quote.status]}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {statusMenuOpen && (
            <div className="absolute right-0 top-full mt-1 z-10 w-44 rounded-xl bg-white shadow-lg border border-gray-100 overflow-hidden">
              {STATUS_FLOW.map(({ status, label, icon: Icon }) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={quote.status === status || isPending}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 text-left"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quote preview */}
      <QuotePreview quote={quote} studioName={studioName} />

      {/* Chatbot WSP panel */}
      <div className={`rounded-2xl border p-4 flex items-start gap-3 ${
        quote.whatsapp_reminders_enabled
          ? 'bg-green-50/60 border-green-200/60'
          : 'bg-white/30 border-white/30'
      }`}>
        <MessageCircle className={`h-5 w-5 mt-0.5 shrink-0 ${
          quote.whatsapp_reminders_enabled ? 'text-green-600' : 'text-ink-dark/30'
        }`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm font-semibold ${
              quote.whatsapp_reminders_enabled ? 'text-green-700' : 'text-ink-dark/50'
            }`}>
              Aviso automático al cliente
              {quote.whatsapp_reminders_enabled && (
                <span className="ml-2 text-xs font-normal text-green-600">activado</span>
              )}
            </p>
            <button
              onClick={handleToggleReminders}
              disabled={isPending}
              className="shrink-0"
              aria-label="Toggle aviso automatico"
            >
              {quote.whatsapp_reminders_enabled
                ? <ToggleRight className="h-5 w-5 text-green-600" />
                : <ToggleLeft className="h-5 w-5 text-ink-dark/30" />
              }
            </button>
          </div>
          {quote.whatsapp_reminders_enabled && reminderLabels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {reminderLabels.map((label) => (
                <span
                  key={label}
                  className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
          {quote.whatsapp_reminders_enabled && (
            <p className="text-[11px] text-green-600/60 mt-1.5 italic">
              El chatbot avisará al cliente con anticipación recordándole su cita y cuidados previos.
            </p>
          )}
          {!quote.whatsapp_reminders_enabled && (
            <p className="text-xs text-ink-dark/40 mt-0.5">
              El chatbot enviará recordatorios y recomendaciones al cliente por WhatsApp
            </p>
          )}
        </div>
      </div>

      {/* Edit / Delete */}
      <div className="flex gap-2">
        <Link href={`/quotes/${quote.id}/edit`} className="flex-1">
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/40 backdrop-blur-sm border border-white/30 text-ink-dark/70 text-sm font-medium hover:bg-white/60 transition-colors">
            <Edit2 className="h-4 w-4" />
            Editar
          </button>
        </Link>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            confirmDelete
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-white/40 backdrop-blur-sm border border-white/30 text-red-500 hover:bg-red-50'
          }`}
        >
          <Trash2 className="h-4 w-4" />
          {confirmDelete ? '¿Confirmar?' : 'Eliminar'}
        </button>
      </div>
    </div>
  )
}

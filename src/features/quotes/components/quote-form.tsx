'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { GlassButton, GlassInput } from '@/shared/components'
import { createQuote, updateQuote } from '../services/quote-service'
import {
  TATTOO_STYLES,
  REMINDER_HOUR_OPTIONS,
  type Quote,
  type CreateQuoteInput,
} from '../types/quote'

interface Props {
  quote?: Quote
}

export function QuoteForm({ quote }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Client
  const [clientName, setClientName] = useState(quote?.client_name ?? '')
  const [clientPhone, setClientPhone] = useState(quote?.client_phone ?? '')
  const [clientEmail, setClientEmail] = useState(quote?.client_email ?? '')

  // Tattoo
  const [description, setDescription] = useState(quote?.design_description ?? '')
  const [bodyPlacement, setBodyPlacement] = useState(quote?.body_placement ?? '')
  const [style, setStyle] = useState(quote?.style ?? '')
  const [sizeCm, setSizeCm] = useState(quote?.size_cm ?? '')
  const [sessionCount, setSessionCount] = useState(String(quote?.session_count ?? 1))

  // Price
  const [estimatedPrice, setEstimatedPrice] = useState(
    quote?.estimated_price != null ? String(quote.estimated_price) : ''
  )
  const [depositAmount, setDepositAmount] = useState(
    quote?.deposit_amount != null ? String(quote.deposit_amount) : ''
  )
  const [priceNotes, setPriceNotes] = useState(quote?.price_notes ?? '')

  // Validity
  const [validityDays, setValidityDays] = useState<7 | 14 | 30>(14)

  // WhatsApp reminders
  const [wspEnabled, setWspEnabled] = useState(quote?.whatsapp_reminders_enabled ?? false)
  const [selectedHours, setSelectedHours] = useState<number[]>(
    quote?.whatsapp_reminder_hours ?? [24]
  )

  // Notes
  const [notes, setNotes] = useState(quote?.notes ?? '')

  function toggleHour(hours: number) {
    setSelectedHours((prev) =>
      prev.includes(hours) ? prev.filter((h) => h !== hours) : [...prev, hours]
    )
  }

  function buildValidUntil(): string {
    const d = new Date()
    d.setDate(d.getDate() + validityDays)
    return d.toISOString().split('T')[0]!
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const input: CreateQuoteInput = {
      client_name: clientName,
      client_phone: clientPhone || undefined,
      client_email: clientEmail || undefined,
      design_description: description || undefined,
      body_placement: bodyPlacement || undefined,
      style: style || undefined,
      size_cm: sizeCm || undefined,
      session_count: parseInt(sessionCount, 10) || 1,
      estimated_price: estimatedPrice ? parseFloat(estimatedPrice) : undefined,
      deposit_amount: depositAmount ? parseFloat(depositAmount) : undefined,
      price_notes: priceNotes || undefined,
      valid_until: quote ? quote.valid_until ?? undefined : buildValidUntil(),
      notes: notes || undefined,
      whatsapp_reminders_enabled: wspEnabled,
      whatsapp_reminder_hours: wspEnabled ? selectedHours : [],
    }

    startTransition(async () => {
      const result = quote
        ? await updateQuote(quote.id, input)
        : await createQuote(input)

      if (result.error) {
        setError(result.error)
        return
      }

      router.push(quote ? `/quotes/${quote.id}` : `/quotes/${result.data!.id}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Sección Cliente */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-ink-dark/50 uppercase tracking-wide">
          Cliente
        </h2>
        <GlassInput
          label="Nombre del cliente *"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          required
          placeholder="Ej. María García"
        />
        <div className="grid grid-cols-2 gap-3">
          <GlassInput
            label="Teléfono"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="+56 9 1234 5678"
            type="tel"
          />
          <GlassInput
            label="Email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            type="email"
          />
        </div>
      </section>

      <div className="border-t border-white/20" />

      {/* Sección Tatuaje */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-ink-dark/50 uppercase tracking-wide">
          Descripción del Tatuaje
        </h2>
        <div>
          <label className="block text-sm font-medium text-ink-dark/70 mb-1">
            Descripción del diseño
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe el tatuaje que el cliente quiere..."
            className="w-full rounded-xl bg-white/30 backdrop-blur-sm border border-white/30 px-4 py-3 text-sm text-ink-dark placeholder:text-ink-dark/40 focus:outline-none focus:ring-2 focus:ring-ink-orange/30 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <GlassInput
            label="Zona del cuerpo"
            value={bodyPlacement}
            onChange={(e) => setBodyPlacement(e.target.value)}
            placeholder="Ej. Antebrazo derecho"
          />
          <div>
            <label className="block text-sm font-medium text-ink-dark/70 mb-1">
              Estilo
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full rounded-xl bg-white/30 backdrop-blur-sm border border-white/30 px-4 py-3 text-sm text-ink-dark focus:outline-none focus:ring-2 focus:ring-ink-orange/30"
            >
              <option value="">Seleccionar...</option>
              {TATTOO_STYLES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <GlassInput
            label="Tamaño"
            value={sizeCm}
            onChange={(e) => setSizeCm(e.target.value)}
            placeholder="Ej. 15x10 cm"
          />
          <GlassInput
            label="Nº de sesiones"
            value={sessionCount}
            onChange={(e) => setSessionCount(e.target.value)}
            type="number"
            min="1"
            max="20"
          />
        </div>
      </section>

      <div className="border-t border-white/20" />

      {/* Sección Precio */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-ink-dark/50 uppercase tracking-wide">
          Precio
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <GlassInput
            label="Precio estimado"
            value={estimatedPrice}
            onChange={(e) => setEstimatedPrice(e.target.value)}
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
          />
          <GlassInput
            label="Depósito / Seña"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </div>
        <GlassInput
          label="Notas de precio"
          value={priceNotes}
          onChange={(e) => setPriceNotes(e.target.value)}
          placeholder="Ej. Precio puede variar según el detalle final"
        />
      </section>

      <div className="border-t border-white/20" />

      {/* Sección Validez */}
      {!quote && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-ink-dark/50 uppercase tracking-wide">
            Validez de la cotización
          </h2>
          <div className="flex gap-2">
            {([7, 14, 30] as const).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setValidityDays(days)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  validityDays === days
                    ? 'bg-ink-orange text-white border-ink-orange'
                    : 'bg-white/20 text-ink-dark/60 border-white/30 hover:bg-white/30'
                }`}
              >
                {days} días
              </button>
            ))}
          </div>
          <p className="text-xs text-ink-dark/40">
            La cotización vencerá el{' '}
            {new Date(Date.now() + validityDays * 86400000).toLocaleDateString('es-CL', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </section>
      )}

      {!quote && <div className="border-t border-white/20" />}

      {/* Sección Aviso automático al cliente (chatbot WSP) */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-green-600" />
            <h2 className="text-sm font-semibold text-ink-dark/70">
              Aviso automático al cliente
            </h2>
          </div>
          {/* Toggle switch */}
          <button
            type="button"
            role="switch"
            aria-checked={wspEnabled}
            onClick={() => setWspEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              wspEnabled ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                wspEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {wspEnabled && (
          <div className="rounded-xl bg-green-50/60 border border-green-200/60 p-4 flex flex-col gap-3">
            <p className="text-xs text-green-700/80 leading-relaxed">
              Nuestro chatbot enviará un mensaje de WhatsApp al cliente recordándole su cita
              y con recomendaciones previas al tatuaje. Selecciona con cuánta anticipación:
            </p>
            <div className="flex flex-wrap gap-2">
              {REMINDER_HOUR_OPTIONS.map(({ value, label }) => {
                const active = selectedHours.includes(value)
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleHour(value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      active
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white/60 text-ink-dark/60 border-white/40 hover:bg-white/80'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-green-600/60 italic">
              Próximamente disponible — la preferencia se guarda para cuando se active.
            </p>
          </div>
        )}

        {!wspEnabled && (
          <p className="text-xs text-ink-dark/40 leading-relaxed">
            Activa para que el chatbot envíe recordatorios de cita y recomendaciones
            previas al tatuaje directamente al cliente por WhatsApp.
          </p>
        )}
      </section>

      <div className="border-t border-white/20" />

      {/* Sección Notas */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-ink-dark/50 uppercase tracking-wide">
          Notas internas
        </h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Notas privadas sobre esta cotización..."
          className="w-full rounded-xl bg-white/30 backdrop-blur-sm border border-white/30 px-4 py-3 text-sm text-ink-dark placeholder:text-ink-dark/40 focus:outline-none focus:ring-2 focus:ring-ink-orange/30 resize-none"
        />
      </section>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <GlassButton
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          className="flex-1"
        >
          Cancelar
        </GlassButton>
        <GlassButton
          type="submit"
          variant="primary"
          disabled={isPending}
          className="flex-1"
        >
          {isPending
            ? quote ? 'Guardando...' : 'Creando...'
            : quote ? 'Guardar cambios' : 'Crear cotización'}
        </GlassButton>
      </div>
    </form>
  )
}

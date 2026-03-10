'use client'

import { useState } from 'react'
import {
  User,
  Scissors,
  CalendarDays,
  Clock,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { GlassButton, GlassCard } from '@/shared/components'
import { submitPublicBooking } from '../services/booking-service'
import type { BookingFormData } from '../types/booking'

interface BookingConfirmationProps {
  formData: BookingFormData
  onReset: () => void
}

interface SummaryRowProps {
  icon: React.ReactNode
  label: string
  value: string
}

function SummaryRow({ icon, label, value }: SummaryRowProps) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-white/20 last:border-0">
      <span className="flex-shrink-0 text-ink-orange mt-0.5" aria-hidden="true">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-ink-dark mt-0.5">{value}</p>
      </div>
    </div>
  )
}

function formatDisplayDate(date: string): string {
  try {
    return format(parseISO(date), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
  } catch {
    return date
  }
}

export function BookingConfirmation({ formData, onReset }: BookingConfirmationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [appointmentId, setAppointmentId] = useState<string | null>(null)

  const isSuccess = appointmentId !== null

  async function handleConfirm() {
    setIsSubmitting(true)
    setSubmitError(null)

    const result = await submitPublicBooking(formData)

    if (result.success && result.appointmentId) {
      setAppointmentId(result.appointmentId)
    } else {
      setSubmitError(result.error ?? 'Error al procesar la reserva. Intenta de nuevo.')
    }

    setIsSubmitting(false)
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center text-center py-4 gap-5">
        <div className="flex items-center justify-center h-20 w-20 rounded-full bg-green-100 border-4 border-green-200">
          <CheckCircle2 className="h-10 w-10 text-green-500" aria-hidden="true" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-ink-dark">Tu cita ha sido reservada</h2>
          <p className="text-sm text-gray-500 mt-1">
            Recibiremos tu solicitud y te confirmaremos por correo o telefono.
          </p>
        </div>

        <GlassCard hover={false} padding="p-5" className="w-full text-left">
          <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">
            Resumen de tu reserva
          </p>
          <SummaryRow
            icon={<User className="h-4 w-4" />}
            label="Artista"
            value={formData.artistName}
          />
          <SummaryRow
            icon={<Scissors className="h-4 w-4" />}
            label="Servicio"
            value={formData.serviceName}
          />
          <SummaryRow
            icon={<CalendarDays className="h-4 w-4" />}
            label="Fecha"
            value={formatDisplayDate(formData.date)}
          />
          <SummaryRow
            icon={<Clock className="h-4 w-4" />}
            label="Horario"
            value={`${formData.startTime} – ${formData.endTime}`}
          />
          <SummaryRow
            icon={<Mail className="h-4 w-4" />}
            label="Correo"
            value={formData.clientEmail}
          />
        </GlassCard>

        <p className="text-xs text-gray-400">
          Codigo de reserva: <span className="font-mono text-ink-orange">{appointmentId.slice(0, 8).toUpperCase()}</span>
        </p>

        <GlassButton variant="secondary" size="md" onClick={onReset}>
          Hacer otra reserva
        </GlassButton>
      </div>
    )
  }

  // Confirmation form
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-gray-500 text-center">
        Revisa los detalles de tu cita antes de confirmar.
      </p>

      <GlassCard hover={false} padding="p-5">
        <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">
          Detalles de la cita
        </p>
        <SummaryRow
          icon={<User className="h-4 w-4" />}
          label="Artista"
          value={formData.artistName}
        />
        <SummaryRow
          icon={<Scissors className="h-4 w-4" />}
          label="Servicio"
          value={formData.serviceName}
        />
        <SummaryRow
          icon={<CalendarDays className="h-4 w-4" />}
          label="Fecha"
          value={formatDisplayDate(formData.date)}
        />
        <SummaryRow
          icon={<Clock className="h-4 w-4" />}
          label="Horario"
          value={`${formData.startTime} – ${formData.endTime}`}
        />
        {formData.bodyPlacement && (
          <SummaryRow
            icon={<MapPin className="h-4 w-4" />}
            label="Zona del cuerpo"
            value={formData.bodyPlacement}
          />
        )}
      </GlassCard>

      <GlassCard hover={false} padding="p-5">
        <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">
          Tus datos
        </p>
        <SummaryRow
          icon={<User className="h-4 w-4" />}
          label="Nombre"
          value={formData.clientName}
        />
        <SummaryRow
          icon={<Mail className="h-4 w-4" />}
          label="Correo"
          value={formData.clientEmail}
        />
        <SummaryRow
          icon={<Phone className="h-4 w-4" />}
          label="Telefono"
          value={formData.clientPhone}
        />
      </GlassCard>

      {formData.notes && (
        <GlassCard hover={false} padding="p-5">
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
            Descripcion del tatuaje
          </p>
          <p className="text-sm text-ink-dark">{formData.notes}</p>
        </GlassCard>
      )}

      {/* Error state */}
      {submitError && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-2xl bg-red-50/80 border border-red-200 text-red-600"
        >
          <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm font-medium">{submitError}</p>
        </div>
      )}

      <GlassButton
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleConfirm}
        isLoading={isSubmitting}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Confirmando...' : 'Confirmar Reserva'}
      </GlassButton>

      <p className="text-xs text-center text-gray-400">
        Al confirmar, aceptas que el estudio contacte contigo para coordinar los detalles.
      </p>
    </div>
  )
}

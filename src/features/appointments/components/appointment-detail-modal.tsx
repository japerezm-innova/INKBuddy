'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  X,
  Clock,
  User,
  Palette,
  MapPin,
  FileText,
  Phone,
  Mail,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  PlayCircle,
  Edit,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/shared/lib/utils'
import { useAppointmentStore } from '../store/appointment-store'
import { updateAppointment } from '../services/appointment-service'
import { AppointmentStatusBadge } from './appointment-status-badge'
import type { Appointment, AppointmentStatus } from '../types/appointment'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toLocalDateTimeInputs(isoString: string) {
  const d = new Date(isoString)
  const date = format(d, 'yyyy-MM-dd')
  const time = format(d, 'HH:mm')
  return { date, time }
}

function combineDateTime(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString()
}

// ---------------------------------------------------------------------------
// Status action buttons config
// ---------------------------------------------------------------------------

const STATUS_ACTIONS: Record<
  AppointmentStatus,
  { label: string; next: AppointmentStatus; icon: React.ReactNode; className: string }[]
> = {
  pending: [
    {
      label: 'Confirmar',
      next: 'confirmed',
      icon: <CheckCircle className="h-4 w-4" />,
      className: 'bg-emerald-500/80 hover:bg-emerald-500 text-white',
    },
    {
      label: 'Cancelar',
      next: 'cancelled',
      icon: <XCircle className="h-4 w-4" />,
      className: 'bg-red-400/70 hover:bg-red-400 text-white',
    },
  ],
  confirmed: [
    {
      label: 'Iniciar',
      next: 'in_progress',
      icon: <PlayCircle className="h-4 w-4" />,
      className: 'bg-blue-500/80 hover:bg-blue-500 text-white',
    },
    {
      label: 'Cancelar',
      next: 'cancelled',
      icon: <XCircle className="h-4 w-4" />,
      className: 'bg-red-400/70 hover:bg-red-400 text-white',
    },
  ],
  in_progress: [
    {
      label: 'Completar',
      next: 'completed',
      icon: <CheckCircle className="h-4 w-4" />,
      className: 'bg-emerald-500/80 hover:bg-emerald-500 text-white',
    },
  ],
  completed: [],
  cancelled: [],
  no_show: [],
}

// ---------------------------------------------------------------------------
// Modal content
// ---------------------------------------------------------------------------

interface ModalContentProps {
  appointment: Appointment
  onClose: () => void
  onUpdate: (updated: Partial<Appointment>) => void
}

function ModalContent({ appointment, onClose, onUpdate }: ModalContentProps) {
  const [isPending, startTransition] = useTransition()
  const [rescheduling, setRescheduling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startInputs = toLocalDateTimeInputs(appointment.starts_at)
  const endInputs = toLocalDateTimeInputs(appointment.ends_at)

  const [startDate, setStartDate] = useState(startInputs.date)
  const [startTime, setStartTime] = useState(startInputs.time)
  const [endTime, setEndTime] = useState(endInputs.time)

  const clientDisplay =
    appointment.client?.full_name ?? appointment.client_name ?? 'Cliente sin nombre'
  const artistDisplay = appointment.artist?.full_name ?? 'Artista no asignado'
  const serviceDisplay = appointment.service?.name ?? null
  const startAt = parseISO(appointment.starts_at)
  const endAt = parseISO(appointment.ends_at)

  const actions = STATUS_ACTIONS[appointment.status] ?? []

  function handleStatusChange(next: AppointmentStatus) {
    setError(null)
    startTransition(async () => {
      const result = await updateAppointment(appointment.id, { status: next })
      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        onUpdate({ status: next })
      }
    })
  }

  function handleReschedule() {
    setError(null)
    const newStart = combineDateTime(startDate, startTime)
    const newEnd = combineDateTime(startDate, endTime)
    if (newEnd <= newStart) {
      setError('La hora de fin debe ser despues de la hora de inicio')
      return
    }
    startTransition(async () => {
      const result = await updateAppointment(appointment.id, {
        starts_at: newStart,
        ends_at: newEnd,
      })
      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        onUpdate({ starts_at: newStart, ends_at: newEnd })
        setRescheduling(false)
      }
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <AppointmentStatusBadge status={appointment.status} />
          </div>
          <h2 className="text-xl font-bold text-ink-dark truncate">{clientDisplay}</h2>
          {serviceDisplay && (
            <p className="text-sm text-ink-dark/60 mt-0.5">{serviceDisplay}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/appointments/${appointment.id}/edit`}
            className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/30 border border-white/40 hover:bg-white/50 transition-colors"
            aria-label="Editar cita"
          >
            <Edit className="h-4 w-4 text-ink-dark/60" />
          </Link>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/30 border border-white/40 hover:bg-white/50 transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4 text-ink-dark/60" />
          </button>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Time */}
        <div className="flex items-center gap-2.5 bg-white/50 rounded-2xl p-3">
          <Clock className="h-4 w-4 text-ink-orange shrink-0" />
          <div>
            <p className="text-xs text-ink-dark/50">Horario</p>
            <p className="text-sm font-semibold text-ink-dark">
              {format(startAt, 'HH:mm')} – {format(endAt, 'HH:mm')}
            </p>
            <p className="text-xs text-ink-dark/50 capitalize">
              {format(startAt, 'EEEE d MMMM', { locale: es })}
            </p>
          </div>
        </div>

        {/* Artist */}
        <div className="flex items-center gap-2.5 bg-white/50 rounded-2xl p-3">
          <User className="h-4 w-4 text-ink-orange shrink-0" />
          <div>
            <p className="text-xs text-ink-dark/50">Artista</p>
            <p className="text-sm font-semibold text-ink-dark">{artistDisplay}</p>
          </div>
        </div>

        {/* Body placement */}
        {appointment.body_placement && (
          <div className="flex items-center gap-2.5 bg-white/50 rounded-2xl p-3">
            <MapPin className="h-4 w-4 text-ink-orange shrink-0" />
            <div>
              <p className="text-xs text-ink-dark/50">Zona</p>
              <p className="text-sm font-semibold text-ink-dark">{appointment.body_placement}</p>
            </div>
          </div>
        )}

        {/* Service */}
        {serviceDisplay && (
          <div className="flex items-center gap-2.5 bg-white/50 rounded-2xl p-3">
            <Palette className="h-4 w-4 text-ink-orange shrink-0" />
            <div>
              <p className="text-xs text-ink-dark/50">Servicio</p>
              <p className="text-sm font-semibold text-ink-dark">{serviceDisplay}</p>
            </div>
          </div>
        )}

        {/* Price */}
        {appointment.price != null && (
          <div className="flex items-center gap-2.5 bg-white/50 rounded-2xl p-3">
            <DollarSign className="h-4 w-4 text-ink-orange shrink-0" />
            <div>
              <p className="text-xs text-ink-dark/50">Precio</p>
              <p className="text-sm font-semibold text-ink-dark">
                ${appointment.price.toLocaleString('es-MX')}
                {appointment.deposit != null && appointment.deposit > 0 && (
                  <span className="text-xs text-ink-dark/50 font-normal ml-1">
                    (Deposito: ${appointment.deposit.toLocaleString('es-MX')})
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Phone */}
        {(appointment.client_phone ?? appointment.client?.phone) && (
          <div className="flex items-center gap-2.5 bg-white/50 rounded-2xl p-3">
            <Phone className="h-4 w-4 text-ink-orange shrink-0" />
            <div>
              <p className="text-xs text-ink-dark/50">Telefono</p>
              <p className="text-sm font-semibold text-ink-dark">
                {appointment.client_phone ?? appointment.client?.phone}
              </p>
            </div>
          </div>
        )}

        {/* Email */}
        {appointment.client_email && (
          <div className="flex items-center gap-2.5 bg-white/50 rounded-2xl p-3">
            <Mail className="h-4 w-4 text-ink-orange shrink-0" />
            <div>
              <p className="text-xs text-ink-dark/50">Email</p>
              <p className="text-sm font-semibold text-ink-dark truncate">
                {appointment.client_email}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      {appointment.notes && (
        <div className="flex gap-2.5 bg-white/50 rounded-2xl p-3">
          <FileText className="h-4 w-4 text-ink-orange shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-ink-dark/50 mb-1">Notas</p>
            <p className="text-sm text-ink-dark/80 whitespace-pre-wrap">{appointment.notes}</p>
          </div>
        </div>
      )}

      {/* Reschedule section */}
      <div className="border-t border-white/30 pt-4">
        <button
          onClick={() => setRescheduling((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium text-ink-orange hover:text-ink-orange/80 transition-colors"
        >
          <Calendar className="h-4 w-4" />
          {rescheduling ? 'Cancelar cambio de horario' : 'Cambiar horario'}
        </button>

        {rescheduling && (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-3 sm:col-span-1 space-y-1">
                <label className="text-xs text-ink-dark/50 font-medium">Fecha</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white/30 border border-white/40 rounded-xl px-3 py-2 text-sm text-ink-dark focus:outline-none focus:ring-2 focus:ring-ink-orange/40"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-ink-dark/50 font-medium">Inicio</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-white/30 border border-white/40 rounded-xl px-3 py-2 text-sm text-ink-dark focus:outline-none focus:ring-2 focus:ring-ink-orange/40"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-ink-dark/50 font-medium">Fin</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-white/30 border border-white/40 rounded-xl px-3 py-2 text-sm text-ink-dark focus:outline-none focus:ring-2 focus:ring-ink-orange/40"
                />
              </div>
            </div>
            <button
              onClick={handleReschedule}
              disabled={isPending}
              className="w-full py-2.5 rounded-2xl bg-ink-orange text-white text-sm font-medium hover:bg-ink-orange/90 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Guardando...' : 'Guardar nuevo horario'}
            </button>
          </div>
        )}
      </div>

      {/* Status actions */}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action.next}
              onClick={() => handleStatusChange(action.next)}
              disabled={isPending}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-medium transition-colors disabled:opacity-50',
                action.className
              )}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50/50 rounded-xl px-3 py-2">{error}</p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Modal wrapper
// ---------------------------------------------------------------------------

interface Props {
  appointments: Appointment[]
}

export function AppointmentDetailModal({ appointments }: Props) {
  const { selectedAppointmentId, setSelectedAppointmentId } = useAppointmentStore()
  const [localAppointment, setLocalAppointment] = useState<Appointment | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const baseAppointment = appointments.find((a) => a.id === selectedAppointmentId) ?? null

  // Merge base data with local optimistic updates
  useEffect(() => {
    if (baseAppointment) {
      setLocalAppointment((prev) =>
        prev?.id === baseAppointment.id ? { ...baseAppointment, ...prev } : baseAppointment
      )
    } else {
      setLocalAppointment(null)
    }
  }, [baseAppointment])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSelectedAppointmentId(null)
    }
    if (selectedAppointmentId) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [selectedAppointmentId, setSelectedAppointmentId])

  if (!selectedAppointmentId || !localAppointment) return null

  function handleClose() {
    setSelectedAppointmentId(null)
  }

  function handleUpdate(updated: Partial<Appointment>) {
    setLocalAppointment((prev) => (prev ? { ...prev, ...updated } : prev))
  }

  return (
    /* Backdrop */
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) handleClose()
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Detalle de cita"
      style={{ backgroundColor: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(3px)' }}
    >
      {/* Glass panel */}
      <div
        className={cn(
          'w-full sm:max-w-lg max-h-[90vh] overflow-y-auto',
          'bg-white/75 backdrop-blur-xl border border-white/60 shadow-glass-lg',
          'rounded-t-3xl sm:rounded-3xl',
          'p-5 sm:p-6',
          'animate-slide-up sm:animate-none'
        )}
      >
        <ModalContent
          appointment={localAppointment}
          onClose={handleClose}
          onUpdate={handleUpdate}
        />
      </div>
    </div>
  )
}

'use client'

import { format, parseISO } from 'date-fns'
import { Clock, User, Palette, MapPin } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { Appointment, AppointmentStatus } from '@/features/appointments/types/appointment'
import { AppointmentStatusBadge } from './appointment-status-badge'

interface AppointmentCardProps {
  appointment: Appointment
  onClick?: (appointment: Appointment) => void
}

const STATUS_BORDER: Record<AppointmentStatus, string> = {
  pending: 'border-l-yellow-400',
  confirmed: 'border-l-emerald-400',
  in_progress: 'border-l-blue-500',
  completed: 'border-l-gray-400',
  cancelled: 'border-l-red-400',
  no_show: 'border-l-ink-dark/40',
}

export function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
  const startsAt = parseISO(appointment.starts_at)
  const endsAt = parseISO(appointment.ends_at)

  const startTime = format(startsAt, 'HH:mm')
  const endTime = format(endsAt, 'HH:mm')

  const clientDisplay =
    appointment.client?.full_name ??
    appointment.client_name ??
    'Cliente sin nombre'

  const artistDisplay =
    appointment.artist?.full_name ?? 'Artista no asignado'

  const serviceDisplay = appointment.service?.name ?? null

  const handleClick = () => {
    onClick?.(appointment)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.(appointment)
    }
  }

  return (
    <article
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      aria-label={`Cita con ${clientDisplay} a las ${startTime}`}
      className={cn(
        'relative bg-white/30 backdrop-blur-xl border border-white/25 rounded-2xl shadow-glass',
        'border-l-4 transition-all duration-200',
        STATUS_BORDER[appointment.status],
        onClick &&
          'cursor-pointer hover:bg-white/45 hover:shadow-glass-lg hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50'
      )}
    >
      <div className="p-4">
        {/* Header: time range + status badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-ink-dark/60">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <time
              dateTime={appointment.starts_at}
              className="text-sm font-semibold text-ink-dark"
            >
              {startTime}
            </time>
            <span className="text-xs text-ink-dark/40">-</span>
            <time dateTime={appointment.ends_at} className="text-xs">
              {endTime}
            </time>
          </div>
          <AppointmentStatusBadge status={appointment.status} />
        </div>

        {/* Client name */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <User className="h-3.5 w-3.5 text-ink-orange shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold text-ink-dark truncate">
            {clientDisplay}
          </span>
        </div>

        {/* Service + artist row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
          {serviceDisplay && (
            <div className="flex items-center gap-1 text-xs text-ink-dark/60">
              <Palette className="h-3 w-3 text-ink-coral shrink-0" aria-hidden="true" />
              <span className="truncate">{serviceDisplay}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-ink-dark/60">
            <span className="text-ink-dark/40">por</span>
            <span className="font-medium text-ink-dark/70 truncate">{artistDisplay}</span>
          </div>
        </div>

        {/* Body placement */}
        {appointment.body_placement && (
          <div className="flex items-center gap-1 mt-1.5 text-xs text-ink-dark/50">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{appointment.body_placement}</span>
          </div>
        )}
      </div>
    </article>
  )
}

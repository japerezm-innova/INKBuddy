'use client'

import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarX, ChevronRight } from 'lucide-react'
import { GlassCard } from '@/shared/components'
import { AppointmentStatusBadge } from '@/features/appointments/components/appointment-status-badge'
import type { Appointment } from '@/features/appointments/types/appointment'

interface TodayAppointmentsProps {
  appointments: Appointment[]
}

function getClientDisplayName(appointment: Appointment): string {
  if (appointment.client?.full_name) return appointment.client.full_name
  if (appointment.client_name) return appointment.client_name
  return 'Cliente sin nombre'
}

function getServiceDisplayName(appointment: Appointment): string {
  if (appointment.service?.name) return appointment.service.name
  return 'Servicio no especificado'
}

interface AppointmentItemProps {
  appointment: Appointment
}

function AppointmentItem({ appointment }: AppointmentItemProps) {
  const startTime = format(parseISO(appointment.starts_at), 'HH:mm', {
    locale: es,
  })
  const endTime = format(parseISO(appointment.ends_at), 'HH:mm', {
    locale: es,
  })
  const clientName = getClientDisplayName(appointment)
  const serviceName = getServiceDisplayName(appointment)

  return (
    <li>
      <Link
        href={`/appointments/${appointment.id}`}
        className="flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 hover:bg-white/30 group"
        aria-label={`Ver cita de ${clientName} a las ${startTime}`}
      >
        {/* Time block */}
        <div
          className="flex-shrink-0 w-16 text-center"
          aria-hidden="true"
        >
          <p className="text-sm font-bold text-ink-dark leading-none">
            {startTime}
          </p>
          <p className="text-xs text-ink-dark/40 mt-0.5">{endTime}</p>
        </div>

        {/* Vertical divider */}
        <div
          className="w-px self-stretch bg-gradient-to-b from-ink-orange/40 to-ink-pink/40 rounded-full"
          aria-hidden="true"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink-dark truncate">
            {clientName}
          </p>
          <p className="text-xs text-ink-dark/50 truncate mt-0.5">
            {serviceName}
          </p>
        </div>

        {/* Status + chevron */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <AppointmentStatusBadge status={appointment.status} />
          <ChevronRight
            className="h-4 w-4 text-ink-dark/30 group-hover:text-ink-orange transition-colors duration-200"
            aria-hidden="true"
          />
        </div>
      </Link>
    </li>
  )
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center"
      aria-label="Sin citas programadas para hoy"
    >
      <div
        className="h-12 w-12 rounded-2xl bg-white/40 flex items-center justify-center mb-3"
        aria-hidden="true"
      >
        <CalendarX className="h-6 w-6 text-ink-dark/30" />
      </div>
      <p className="text-sm font-medium text-ink-dark/50">
        No hay citas programadas para hoy
      </p>
      <p className="text-xs text-ink-dark/35 mt-1">
        Disfruta tu dia libre o agenda una nueva cita
      </p>
    </div>
  )
}

export function TodayAppointments({ appointments }: TodayAppointmentsProps) {
  return (
    <GlassCard padding="p-5">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-ink-dark">Citas de Hoy</h2>
        <Link
          href="/appointments"
          className="text-xs font-medium text-ink-orange hover:text-ink-coral transition-colors duration-200"
          aria-label="Ver todas las citas"
        >
          Ver todas
        </Link>
      </header>

      {appointments.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="divide-y divide-white/20 -mx-1" aria-label="Lista de citas de hoy">
          {appointments.map((appointment) => (
            <AppointmentItem key={appointment.id} appointment={appointment} />
          ))}
        </ul>
      )}
    </GlassCard>
  )
}

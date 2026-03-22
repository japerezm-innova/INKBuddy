'use client'

import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarX, ChevronRight, WifiOff } from 'lucide-react'
import { GlassCard } from '@/shared/components'
import { AppointmentStatusBadge } from '@/features/appointments/components/appointment-status-badge'
import type { Appointment } from '@/features/appointments/types/appointment'

interface TodayAppointmentsProps {
  appointments: Appointment[]
  isFromCache?: boolean
  cachedAt?: string | null
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

export function TodayAppointments({ appointments, isFromCache, cachedAt }: TodayAppointmentsProps) {
  const cachedTime = cachedAt ? new Date(cachedAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : null

  return (
    <GlassCard padding="p-5">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-ink-dark">Citas de Hoy</h2>
          {isFromCache && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100/60 text-amber-700 text-[10px] font-medium">
              <WifiOff className="h-2.5 w-2.5" aria-hidden="true" />
              {cachedTime ? `Cache ${cachedTime}` : 'Offline'}
            </span>
          )}
        </div>
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

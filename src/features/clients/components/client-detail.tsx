'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO, differenceInYears } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Phone,
  Mail,
  Calendar,
  Briefcase,
  ArrowLeft,
  Pencil,
  Trash2,
  CalendarDays,
  Clock,
} from 'lucide-react'
import { GlassCard, GlassButton } from '@/shared/components'
import { cn } from '@/shared/lib/utils'
import { getClientById, getClientAppointments, deleteClient } from '../services/client-service'
import { AppointmentCard } from '@/features/appointments/components/appointment-card'
import type { ClientWithStats } from '../types/client'
import type { Appointment } from '@/features/appointments/types/appointment'

interface ClientDetailProps {
  clientId: string
}

const SOURCE_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  referral: 'Referido',
  walk_in: 'Walk-in',
  website: 'Web',
  other: 'Otro',
}

const GENDER_LABELS: Record<string, string> = {
  male: 'Masculino',
  female: 'Femenino',
  other: 'Otro',
  prefer_not_to_say: 'Prefiero no decir',
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) {
    return (parts[0]?.substring(0, 2) ?? '??').toUpperCase()
  }
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

export function ClientDetail({ clientId }: ClientDetailProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)

  const [client, setClient] = useState<ClientWithStats | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    startTransition(async () => {
      const [clientResult, apptResult] = await Promise.all([
        getClientById(clientId),
        getClientAppointments(clientId),
      ])

      if (clientResult.error) {
        setLoadError(clientResult.error)
      } else {
        setClient(clientResult.data ?? null)
      }

      if (!apptResult.error) {
        setAppointments(apptResult.data ?? [])
      }

      setIsLoading(false)
    })
  }, [clientId])

  const handleDelete = () => {
    if (!confirm('¿Eliminar este cliente? Esta accion no se puede deshacer.')) return

    setIsDeleting(true)
    setDeleteError(null)

    startTransition(async () => {
      const result = await deleteClient(clientId)
      if (result.error) {
        setDeleteError(result.error)
        setIsDeleting(false)
      } else {
        router.push('/clients')
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 animate-pulse" aria-busy="true" aria-label="Cargando perfil">
        <div className="h-10 w-32 rounded-xl bg-white/20" />
        <div className="h-40 rounded-3xl bg-white/20" />
        <div className="h-24 rounded-3xl bg-white/20" />
        <div className="h-64 rounded-3xl bg-white/20" />
      </div>
    )
  }

  if (loadError || !client) {
    return (
      <div className="flex flex-col gap-4 items-center py-16 text-center">
        <p className="text-lg font-semibold text-ink-dark">Cliente no encontrado</p>
        <p className="text-sm text-ink-dark/50">{loadError ?? 'No se pudo cargar el perfil.'}</p>
        <GlassButton variant="secondary" onClick={() => router.push('/clients')}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a clientes
        </GlassButton>
      </div>
    )
  }

  const initials = getInitials(client.full_name)
  const age = client.birth_date
    ? differenceInYears(new Date(), parseISO(client.birth_date))
    : null

  const formattedLastVisit = client.last_appointment_date
    ? format(parseISO(client.last_appointment_date), "d 'de' MMMM yyyy", { locale: es })
    : null

  return (
    <div className="flex flex-col gap-6">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.push('/clients')}
        className="flex items-center gap-2 text-sm font-medium text-ink-dark/60 hover:text-ink-dark transition-colors w-fit"
        aria-label="Volver a la lista de clientes"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Clientes
      </button>

      {/* Header card */}
      <GlassCard padding="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div
              className="h-16 w-16 rounded-2xl gradient-accent flex items-center justify-center shadow-warm shrink-0"
              aria-hidden="true"
            >
              <span className="text-white font-bold text-xl">{initials}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink-dark leading-tight">
                {client.full_name}
              </h1>
              {client.source && (
                <span className="text-sm text-ink-dark/50 font-medium">
                  via {SOURCE_LABELS[client.source] ?? client.source}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={() => router.push(`/clients/${clientId}/edit`)}
              aria-label="Editar cliente"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Editar
            </GlassButton>
            <GlassButton
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={isDeleting}
              aria-label="Eliminar cliente"
              className="text-red-500 hover:text-red-600 hover:bg-red-50/50"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </GlassButton>
          </div>
        </div>

        {/* Contact info */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-5">
          {client.phone && (
            <a
              href={`tel:${client.phone}`}
              className="flex items-center gap-2 text-sm text-ink-dark/70 hover:text-ink-orange transition-colors"
            >
              <Phone className="h-3.5 w-3.5 text-ink-orange" aria-hidden="true" />
              {client.phone}
            </a>
          )}
          {client.email && (
            <a
              href={`mailto:${client.email}`}
              className="flex items-center gap-2 text-sm text-ink-dark/70 hover:text-ink-coral transition-colors"
            >
              <Mail className="h-3.5 w-3.5 text-ink-coral" aria-hidden="true" />
              {client.email}
            </a>
          )}
        </div>

        {/* Delete error */}
        {deleteError && (
          <p role="alert" className="mt-3 text-sm text-red-600 font-medium">
            {deleteError}
          </p>
        )}
      </GlassCard>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard padding="p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-accent flex items-center justify-center shadow-warm shrink-0">
              <CalendarDays className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink-dark">{client.total_appointments}</p>
              <p className="text-xs text-ink-dark/50 font-medium">Citas totales</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard padding="p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-accent flex items-center justify-center shadow-warm shrink-0">
              <Clock className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold text-ink-dark leading-tight">
                {formattedLastVisit ?? '—'}
              </p>
              <p className="text-xs text-ink-dark/50 font-medium">Ultima visita</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Client info */}
      <GlassCard padding="p-5" hover={false}>
        <h2 className="text-base font-bold text-ink-dark mb-4">Informacion del cliente</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {client.gender && (
            <div>
              <dt className="text-xs font-medium text-ink-dark/40 uppercase tracking-wide mb-1">
                Genero
              </dt>
              <dd className="text-sm text-ink-dark/80">
                {GENDER_LABELS[client.gender] ?? client.gender}
              </dd>
            </div>
          )}

          {client.birth_date && (
            <div>
              <dt className="text-xs font-medium text-ink-dark/40 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" aria-hidden="true" />
                Fecha de nacimiento
              </dt>
              <dd className="text-sm text-ink-dark/80">
                {format(parseISO(client.birth_date), "d 'de' MMMM yyyy", { locale: es })}
                {age !== null && (
                  <span className="text-ink-dark/40 ml-1">({age} anos)</span>
                )}
              </dd>
            </div>
          )}

          {client.profession && (
            <div>
              <dt className="text-xs font-medium text-ink-dark/40 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Briefcase className="h-3 w-3" aria-hidden="true" />
                Profesion
              </dt>
              <dd className="text-sm text-ink-dark/80">{client.profession}</dd>
            </div>
          )}

          <div>
            <dt className="text-xs font-medium text-ink-dark/40 uppercase tracking-wide mb-1">
              Cliente desde
            </dt>
            <dd className="text-sm text-ink-dark/80">
              {format(parseISO(client.created_at), "d 'de' MMMM yyyy", { locale: es })}
            </dd>
          </div>
        </dl>

        {client.notes && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <dt className="text-xs font-medium text-ink-dark/40 uppercase tracking-wide mb-2">
              Notas
            </dt>
            <dd className="text-sm text-ink-dark/70 whitespace-pre-wrap leading-relaxed">
              {client.notes}
            </dd>
          </div>
        )}
      </GlassCard>

      {/* Appointment history */}
      <section>
        <h2 className="text-base font-bold text-ink-dark mb-4">
          Historial de citas
          {appointments.length > 0 && (
            <span className="ml-2 text-sm font-normal text-ink-dark/40">
              ({appointments.length})
            </span>
          )}
        </h2>

        {appointments.length === 0 ? (
          <GlassCard padding="p-6" hover={false}>
            <p className="text-sm text-ink-dark/50 text-center">
              Este cliente aun no tiene citas registradas.
            </p>
          </GlassCard>
        ) : (
          <div
            className={cn('flex flex-col gap-3')}
            role="list"
            aria-label="Historial de citas"
          >
            {appointments.map((appt) => (
              <div key={appt.id} role="listitem">
                <AppointmentCard appointment={appt} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

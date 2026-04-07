import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowLeft,
  Clock,
  User,
  Palette,
  MapPin,
  FileText,
  Phone,
  Mail,
  DollarSign,
  Calendar,
  Edit,
  ExternalLink,
} from 'lucide-react'
import { GlassCard } from '@/shared/components'
import { getAppointmentById } from '@/features/appointments/services/appointment-service'
import { AppointmentStatusBadge } from '@/features/appointments/components/appointment-status-badge'
import { buildGoogleCalendarUrl } from '@/shared/lib/calendar-url'

interface Props {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: 'Detalle de Cita | INKBuddy',
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | null | undefined
}) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="h-4 w-4 text-ink-orange mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs text-ink-dark/50">{label}</p>
        <p className="text-sm font-medium text-ink-dark">{value}</p>
      </div>
    </div>
  )
}

export default async function AppointmentDetailPage({ params }: Props) {
  const { id } = await params
  const { data: appointment, error } = await getAppointmentById(id)

  if (error || !appointment) notFound()

  const startDate = format(parseISO(appointment.starts_at), "EEEE d 'de' MMMM, yyyy", { locale: es })
  const startTime = format(parseISO(appointment.starts_at), 'HH:mm', { locale: es })
  const endTime = format(parseISO(appointment.ends_at), 'HH:mm', { locale: es })
  const clientName = appointment.client?.full_name ?? appointment.client_name ?? 'Cliente sin nombre'
  const artistName = appointment.artist?.full_name ?? 'Sin artista'
  const serviceName = appointment.service?.name ?? 'Sesión de tatuaje'
  const calendarUrl = buildGoogleCalendarUrl(appointment)

  const priceStr = appointment.price
    ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(appointment.price)
    : null

  const depositStr = appointment.deposit
    ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(appointment.deposit)
    : null

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        href="/appointments"
        className="inline-flex items-center gap-1.5 text-sm text-ink-dark/60 hover:text-ink-orange transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a la agenda
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-dark">{clientName}</h1>
          <p className="text-sm text-ink-dark/50 mt-0.5 capitalize">{startDate}</p>
        </div>
        <AppointmentStatusBadge status={appointment.status} />
      </div>

      {/* Detail card */}
      <GlassCard padding="p-5 md:p-6">
        <div className="divide-y divide-white/20">
          <DetailRow icon={Calendar} label="Fecha" value={`${startDate}`} />
          <DetailRow icon={Clock} label="Horario" value={`${startTime} – ${endTime}`} />
          <DetailRow icon={Palette} label="Servicio" value={serviceName} />
          <DetailRow icon={User} label="Artista" value={artistName} />
          <DetailRow icon={MapPin} label="Zona del cuerpo" value={appointment.body_placement} />
          <DetailRow icon={DollarSign} label="Precio" value={priceStr} />
          {depositStr && <DetailRow icon={DollarSign} label="Deposito" value={depositStr} />}
          <DetailRow icon={Phone} label="Telefono" value={appointment.client_phone ?? appointment.client?.phone} />
          <DetailRow icon={Mail} label="Email" value={appointment.client_email} />
          <DetailRow icon={FileText} label="Notas" value={appointment.notes} />
        </div>
      </GlassCard>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mt-6">
        <Link
          href={`/appointments/${appointment.id}/edit`}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-2xl text-sm font-semibold gradient-accent text-white shadow-warm hover:shadow-warm-lg hover:scale-[1.02] transition-all duration-200"
        >
          <Edit className="h-4 w-4" aria-hidden="true" />
          Editar
        </Link>
        <a
          href={calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-2xl text-sm font-medium bg-white/30 backdrop-blur-sm border border-white/30 text-ink-dark hover:bg-white/50 transition-all duration-200"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          Google Calendar
        </a>
      </div>
    </div>
  )
}

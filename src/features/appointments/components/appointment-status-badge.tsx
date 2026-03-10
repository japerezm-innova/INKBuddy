import { cn } from '@/shared/lib/utils'
import type { AppointmentStatus } from '@/features/appointments/types/appointment'

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus
  className?: string
}

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; className: string }
> = {
  pending: {
    label: 'Pendiente',
    className: 'bg-yellow-100/80 text-yellow-800 border border-yellow-200/60',
  },
  confirmed: {
    label: 'Confirmada',
    className: 'bg-emerald-100/80 text-emerald-800 border border-emerald-200/60',
  },
  in_progress: {
    label: 'En curso',
    className: 'bg-blue-100/80 text-blue-800 border border-blue-200/60',
  },
  completed: {
    label: 'Completada',
    className: 'bg-gray-100/80 text-gray-600 border border-gray-200/60',
  },
  cancelled: {
    label: 'Cancelada',
    className: 'bg-red-100/80 text-red-700 border border-red-200/60',
  },
  no_show: {
    label: 'No asistio',
    className: 'bg-ink-dark/10 text-ink-dark/70 border border-ink-dark/15',
  },
}

export function AppointmentStatusBadge({
  status,
  className,
}: AppointmentStatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-sm',
        config.className,
        className
      )}
      aria-label={`Estado: ${config.label}`}
    >
      {config.label}
    </span>
  )
}

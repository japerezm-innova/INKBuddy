'use client'

import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  AlertTriangle,
  Bell,
  CalendarCheck,
  CalendarX,
  CheckCircle,
  ClipboardList,
  Star,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { Notification, NotificationTemplate } from '../types/notification'

// ---------------------------------------------------------------------------
// Template configuration map
// ---------------------------------------------------------------------------

interface TemplateConfig {
  icon: React.ElementType
  iconColor: string
  label: (payload: Record<string, unknown>) => string
}

const TEMPLATE_CONFIG: Record<NotificationTemplate, TemplateConfig> = {
  booking_confirmation: {
    icon: CalendarCheck,
    iconColor: 'text-ink-orange',
    label: (p) =>
      `Cita confirmada con ${String(p['artist_name'] ?? 'tu artista')} el ${formatDate(String(p['starts_at'] ?? ''))}`,
  },
  appointment_reminder: {
    icon: Bell,
    iconColor: 'text-ink-coral',
    label: (p) =>
      `Recordatorio: tienes cita con ${String(p['artist_name'] ?? 'tu artista')} el ${formatDate(String(p['starts_at'] ?? ''))}`,
  },
  appointment_cancelled: {
    icon: CalendarX,
    iconColor: 'text-red-400',
    label: (p) =>
      `Cita cancelada con ${String(p['artist_name'] ?? 'tu artista')} el ${formatDate(String(p['starts_at'] ?? ''))}`,
  },
  appointment_completed: {
    icon: CheckCircle,
    iconColor: 'text-green-500',
    label: (p) =>
      `Sesión completada con ${String(p['artist_name'] ?? 'tu artista')}. Gracias por visitarnos.`,
  },
  stock_alert: {
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    label: (p) =>
      `Stock bajo: ${String(p['product_name'] ?? 'producto')} tiene solo ${String(p['current_stock'] ?? '?')} unidades`,
  },
  new_booking_request: {
    icon: Star,
    iconColor: 'text-ink-pink',
    label: (p) =>
      `Nueva solicitud de ${String(p['client_name'] ?? 'un cliente')} para ${formatDate(String(p['starts_at'] ?? ''))}`,
  },
  task_assigned: {
    icon: ClipboardList,
    iconColor: 'text-ink-peach',
    label: (p) =>
      `Se te asignó la tarea: ${String(p['task_title'] ?? 'Sin título')}`,
  },
}

function formatDate(iso: string): string {
  if (!iso) return 'fecha desconocida'
  try {
    return new Intl.DateTimeFormat('es', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function formatRelativeTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: es })
  } catch {
    return ''
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface NotificationItemProps {
  notification: Notification
  onMarkRead: (id: string) => void
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const config = TEMPLATE_CONFIG[notification.template]
  const isUnread = notification.status === 'pending' || notification.status === 'sent'

  const Icon = config.icon
  const message = config.label(notification.payload)

  function handleClick() {
    if (isUnread) {
      onMarkRead(notification.id)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-left flex items-start gap-3 px-4 py-3 rounded-2xl transition-all duration-200',
        isUnread
          ? 'bg-white/20 hover:bg-white/30'
          : 'bg-transparent hover:bg-white/10 opacity-70'
      )}
      aria-label={`${isUnread ? 'Notificacion no leida: ' : ''}${message}`}
    >
      {/* Template icon */}
      <span
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
          isUnread ? 'bg-white/30' : 'bg-white/15'
        )}
        aria-hidden="true"
      >
        <Icon className={cn('h-4 w-4', config.iconColor)} />
      </span>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm leading-snug', isUnread ? 'text-ink-dark font-medium' : 'text-ink-dark/70')}>
          {message}
        </p>
        <p className="mt-0.5 text-xs text-ink-dark/40">
          {formatRelativeTime(notification.created_at)}
        </p>
      </div>

      {/* Unread indicator */}
      {isUnread && (
        <span
          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-ink-orange"
          aria-hidden="true"
        />
      )}
    </button>
  )
}

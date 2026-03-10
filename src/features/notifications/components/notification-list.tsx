'use client'

import { BellOff } from 'lucide-react'
import { GlassButton } from '@/shared/components'
import { cn, glass } from '@/shared/lib/utils'
import type { Notification } from '../types/notification'
import { NotificationItem } from './notification-item'

interface NotificationListProps {
  notifications: Notification[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  className?: string
}

export function NotificationList({
  notifications,
  onMarkRead,
  onMarkAllRead,
  className,
}: NotificationListProps) {
  const hasUnread = notifications.some(
    (n) => n.status === 'pending' || n.status === 'sent'
  )

  return (
    <div
      className={cn(
        glass.card,
        'flex flex-col overflow-hidden p-0',
        className
      )}
      role="region"
      aria-label="Lista de notificaciones"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/15 px-4 py-3">
        <h2 className="text-sm font-semibold text-ink-dark">Notificaciones</h2>

        {hasUnread && (
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={onMarkAllRead}
            className="text-xs text-ink-orange hover:text-ink-orange"
          >
            Marcar todo como leido
          </GlassButton>
        )}
      </div>

      {/* Notification items */}
      {notifications.length === 0 ? (
        <EmptyState />
      ) : (
        <ul
          className="flex max-h-[420px] flex-col gap-1 overflow-y-auto p-2"
          role="list"
        >
          {notifications.map((notification) => (
            <li key={notification.id} role="listitem">
              <NotificationItem
                notification={notification}
                onMarkRead={onMarkRead}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <span
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20"
        aria-hidden="true"
      >
        <BellOff className="h-6 w-6 text-ink-dark/30" />
      </span>
      <p className="text-sm text-ink-dark/50">No hay notificaciones</p>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useNotifications } from '../hooks/use-notifications'
import { NotificationList } from './notification-list'

interface NotificationBellProps {
  className?: string
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } =
    useNotifications()
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  function toggleDropdown() {
    setIsOpen((prev) => !prev)
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Bell trigger button */}
      <button
        onClick={toggleDropdown}
        aria-label={
          unreadCount > 0
            ? `Notificaciones, ${unreadCount} sin leer`
            : 'Notificaciones'
        }
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200',
          'bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20',
          isOpen && 'bg-white/25 shadow-glass'
        )}
        disabled={isLoading}
      >
        <Bell
          className={cn(
            'h-4.5 w-4.5 transition-colors',
            isOpen ? 'text-ink-orange' : 'text-ink-dark/60'
          )}
          aria-hidden="true"
        />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-ink-orange text-[10px] font-bold text-white"
            aria-hidden="true"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Panel de notificaciones"
          className="absolute right-0 top-11 z-50 w-80 origin-top-right"
        >
          <NotificationList
            notifications={notifications}
            onMarkRead={markAsRead}
            onMarkAllRead={markAllAsRead}
          />
        </div>
      )}
    </div>
  )
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getInAppNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notification-service'
import type { Notification } from '../types/notification'

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  const fetchNotifications = useCallback(async () => {
    const { data } = await getInAppNotifications()
    setNotifications(data ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => {
    // Initial fetch
    void fetchNotifications()

    // Supabase realtime subscription
    const supabase = createClient()

    const subscription = supabase
      .channel('notifications:in_app')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: 'channel=eq.in_app',
        },
        () => {
          // Re-fetch on any change that matches the filter
          void fetchNotifications()
        }
      )
      .subscribe()

    channelRef.current = subscription

    return () => {
      void supabase.removeChannel(subscription)
    }
  }, [fetchNotifications])

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 'delivered' as const } : n))
    )

    const { error } = await markNotificationRead(id)

    if (error) {
      // Rollback on failure
      void fetchNotifications()
    }
  }, [fetchNotifications])

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) =>
        n.status === 'pending' || n.status === 'sent'
          ? { ...n, status: 'delivered' as const }
          : n
      )
    )

    const { error } = await markAllNotificationsRead()

    if (error) {
      // Rollback on failure
      void fetchNotifications()
    }
  }, [fetchNotifications])

  const unreadCount = notifications.filter(
    (n) => n.status === 'pending' || n.status === 'sent'
  ).length

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  }
}

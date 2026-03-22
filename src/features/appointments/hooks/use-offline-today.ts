'use client'

import { useState, useEffect, useCallback } from 'react'
import { useNetworkStatus } from '@/shared/lib/offline/network-status'
import {
  getOfflineData,
  setOfflineData,
  STORAGE_KEYS,
} from '@/shared/lib/offline/offline-storage'
import { getTodayAppointments } from '@/features/dashboard/services/dashboard-service'
import type { Appointment } from '../types/appointment'

interface CacheMeta {
  cachedAt: string
  date: string
}

export function useOfflineTodayAppointments() {
  const { isOnline } = useNetworkStatus()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFromCache, setIsFromCache] = useState(false)
  const [cachedAt, setCachedAt] = useState<string | null>(null)

  const fallbackToCache = useCallback(async () => {
    const cached = await getOfflineData<Appointment[]>(STORAGE_KEYS.TODAY_APPOINTMENTS)
    const meta = await getOfflineData<CacheMeta>(STORAGE_KEYS.TODAY_APPOINTMENTS_META)
    const today = new Date().toISOString().split('T')[0]

    if (cached && meta && meta.date === today) {
      setAppointments(cached)
      setIsFromCache(true)
      setCachedAt(meta.cachedAt)
    } else {
      setAppointments([])
      setIsFromCache(true)
      setCachedAt(null)
      setError('No hay datos en cache para hoy')
    }
    setIsLoading(false)
  }, [])

  const fetchAndCache = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    if (isOnline) {
      const result = await getTodayAppointments()
      if (result.error) {
        await fallbackToCache()
        return
      }
      const data = result.data ?? []
      setAppointments(data)
      setIsFromCache(false)
      setCachedAt(null)
      setIsLoading(false)

      const today = new Date().toISOString().split('T')[0] as string
      await setOfflineData(STORAGE_KEYS.TODAY_APPOINTMENTS, data)
      await setOfflineData(STORAGE_KEYS.TODAY_APPOINTMENTS_META, {
        cachedAt: new Date().toISOString(),
        date: today,
      } satisfies CacheMeta)
    } else {
      await fallbackToCache()
    }
  }, [isOnline, fallbackToCache])

  useEffect(() => {
    fetchAndCache()
  }, [fetchAndCache])

  return { appointments, isLoading, error, isFromCache, cachedAt, refetch: fetchAndCache }
}

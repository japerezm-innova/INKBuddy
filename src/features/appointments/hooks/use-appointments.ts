'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAppointments } from '../services/appointment-service'
import type { Appointment } from '../types/appointment'

export interface UseAppointmentsFilters {
  artistId?: string
  status?: string
  dateRange?: {
    start: string
    end: string
  }
}

export interface UseAppointmentsReturn {
  appointments: Appointment[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useAppointments(
  filters?: UseAppointmentsFilters
): UseAppointmentsReturn {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stable ref to filters to avoid unnecessary effect re-runs
  const filtersRef = useRef(filters)
  filtersRef.current = filters

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const currentFilters = filtersRef.current

    const { data, error: fetchError } = await getAppointments({
      artistId: currentFilters?.artistId,
      status: currentFilters?.status,
      startDate: currentFilters?.dateRange?.start,
      endDate: currentFilters?.dateRange?.end,
    })

    if (fetchError) {
      setError(fetchError)
      setAppointments([])
    } else {
      setAppointments(data ?? [])
    }

    setIsLoading(false)
  }, [])

  // Fetch on mount
  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  // Re-fetch when filter values change
  const artistId = filters?.artistId
  const status = filters?.status
  const rangeStart = filters?.dateRange?.start
  const rangeEnd = filters?.dateRange?.end

  useEffect(() => {
    fetchAppointments()
  }, [artistId, status, rangeStart, rangeEnd, fetchAppointments])

  // Subscribe to realtime changes on the appointments table
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('appointments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
        },
        () => {
          // Refetch on any INSERT, UPDATE or DELETE
          fetchAppointments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchAppointments])

  return {
    appointments,
    isLoading,
    error,
    refetch: fetchAppointments,
  }
}

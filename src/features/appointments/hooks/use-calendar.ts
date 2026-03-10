'use client'

import {
  addDays,
  addWeeks,
  format,
  startOfWeek,
  subDays,
  subWeeks,
} from 'date-fns'
import { useCallback } from 'react'
import { useAppointmentStore } from '../store/appointment-store'
import type { CalendarViewMode } from '../types/appointment'

export interface UseCalendarReturn {
  selectedDate: Date
  viewMode: CalendarViewMode
  weekDates: Date[]
  setSelectedDate: (date: Date) => void
  setViewMode: (mode: CalendarViewMode) => void
  goToNextDay: () => void
  goToPrevDay: () => void
  goToNextWeek: () => void
  goToPrevWeek: () => void
  goToToday: () => void
  formatDate: (date: Date, pattern?: string) => string
}

/**
 * Returns the 7 dates of the ISO week containing the given date.
 * Week starts on Monday (locale weekStartsOn: 1).
 */
function computeWeekDates(date: Date): Date[] {
  const monday = startOfWeek(date, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

export function useCalendar(): UseCalendarReturn {
  const { selectedDate, viewMode, setSelectedDate, setViewMode } =
    useAppointmentStore()

  const weekDates = computeWeekDates(selectedDate)

  const goToNextDay = useCallback(() => {
    setSelectedDate(addDays(selectedDate, 1))
  }, [selectedDate, setSelectedDate])

  const goToPrevDay = useCallback(() => {
    setSelectedDate(subDays(selectedDate, 1))
  }, [selectedDate, setSelectedDate])

  const goToNextWeek = useCallback(() => {
    setSelectedDate(addWeeks(selectedDate, 1))
  }, [selectedDate, setSelectedDate])

  const goToPrevWeek = useCallback(() => {
    setSelectedDate(subWeeks(selectedDate, 1))
  }, [selectedDate, setSelectedDate])

  const goToToday = useCallback(() => {
    setSelectedDate(new Date())
  }, [setSelectedDate])

  const formatDate = useCallback(
    (date: Date, pattern = 'yyyy-MM-dd'): string => {
      return format(date, pattern)
    },
    []
  )

  return {
    selectedDate,
    viewMode,
    weekDates,
    setSelectedDate,
    setViewMode,
    goToNextDay,
    goToPrevDay,
    goToNextWeek,
    goToPrevWeek,
    goToToday,
    formatDate,
  }
}

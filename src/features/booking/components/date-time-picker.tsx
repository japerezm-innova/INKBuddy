'use client'

import { useState, useEffect } from 'react'
import { format, addDays, isToday, isBefore, startOfDay, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarDays, Clock, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { GlassButton } from '@/shared/components'
import { getPublicAvailableSlots } from '../services/booking-service'
import type { PublicTimeSlot } from '../types/booking'

interface DateTimePickerProps {
  artistId: string
  durationMinutes: number
  selectedDate: string
  selectedStartTime: string
  onSelect: (date: string, startTime: string, endTime: string) => void
}

const DAYS_VISIBLE = 7

function buildDateList(referenceDate: Date): Date[] {
  return Array.from({ length: DAYS_VISIBLE }, (_, i) => addDays(referenceDate, i))
}

export function DateTimePicker({
  artistId,
  durationMinutes,
  selectedDate,
  selectedStartTime,
  onSelect,
}: DateTimePickerProps) {
  const today = startOfDay(new Date())
  const [weekStart, setWeekStart] = useState<Date>(today)
  const [currentDate, setCurrentDate] = useState<Date | null>(
    selectedDate ? parseISO(selectedDate) : null
  )
  const [slots, setSlots] = useState<PublicTimeSlot[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)

  const visibleDays = buildDateList(weekStart)

  const canGoPrev = isBefore(today, weekStart)

  function handlePrevWeek() {
    const prev = addDays(weekStart, -DAYS_VISIBLE)
    setWeekStart(isBefore(prev, today) ? today : prev)
  }

  function handleNextWeek() {
    setWeekStart(addDays(weekStart, DAYS_VISIBLE))
  }

  function handleDaySelect(day: Date) {
    setCurrentDate(day)
    setSlots([])
    setSlotsError(null)
  }

  // Fetch slots when date or artist changes
  useEffect(() => {
    if (!currentDate || !artistId) return

    const dateStr = format(currentDate, 'yyyy-MM-dd')

    async function fetchSlots() {
      setIsLoadingSlots(true)
      setSlotsError(null)

      const result = await getPublicAvailableSlots(artistId, dateStr, durationMinutes)

      if (result.error) {
        setSlotsError(result.error)
      } else {
        setSlots(result.data ?? [])
      }

      setIsLoadingSlots(false)
    }

    void fetchSlots()
  }, [currentDate, artistId, durationMinutes])

  const selectedDateStr = currentDate ? format(currentDate, 'yyyy-MM-dd') : ''

  return (
    <div className="flex flex-col gap-6">
      {/* Week Navigation */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-ink-dark flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-ink-orange" aria-hidden="true" />
            Selecciona una fecha
          </h3>
          <div className="flex gap-1">
            <button
              onClick={handlePrevWeek}
              disabled={!canGoPrev}
              aria-label="Semana anterior"
              className={cn(
                'h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-200',
                'bg-white/30 backdrop-blur-md border border-white/25',
                canGoPrev
                  ? 'hover:bg-white/50 hover:border-ink-orange/30 text-ink-dark'
                  : 'opacity-30 cursor-not-allowed text-gray-400'
              )}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              onClick={handleNextWeek}
              aria-label="Semana siguiente"
              className="h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-200 bg-white/30 backdrop-blur-md border border-white/25 hover:bg-white/50 hover:border-ink-orange/30 text-ink-dark"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Day pills */}
        <div role="radiogroup" aria-label="Seleccionar dia" className="grid grid-cols-7 gap-1.5">
          {visibleDays.map((day) => {
            const dayStr = format(day, 'yyyy-MM-dd')
            const isSelected = dayStr === selectedDateStr
            const isDayToday = isToday(day)

            return (
              <button
                key={dayStr}
                role="radio"
                aria-checked={isSelected}
                aria-label={format(day, "EEEE d 'de' MMMM", { locale: es })}
                onClick={() => handleDaySelect(day)}
                className={cn(
                  'flex flex-col items-center justify-center p-2 rounded-2xl border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50',
                  isSelected
                    ? 'gradient-accent text-white border-transparent shadow-warm scale-105'
                    : 'bg-white/30 backdrop-blur-md border-white/25 text-ink-dark hover:border-ink-orange/30 hover:bg-white/50'
                )}
              >
                <span className="text-xs font-medium uppercase tracking-wide opacity-80">
                  {format(day, 'EEE', { locale: es }).slice(0, 3)}
                </span>
                <span className="text-base font-bold leading-tight">{format(day, 'd')}</span>
                {isDayToday && !isSelected && (
                  <span
                    aria-hidden="true"
                    className="mt-0.5 h-1 w-1 rounded-full bg-ink-orange"
                  />
                )}
              </button>
            )
          })}
        </div>

        {currentDate && (
          <p className="mt-2 text-center text-xs text-gray-500 capitalize">
            {format(currentDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        )}
      </div>

      {/* Time Slots */}
      {currentDate && (
        <div>
          <h3 className="text-sm font-semibold text-ink-dark flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-ink-orange" aria-hidden="true" />
            Horarios disponibles
          </h3>

          {isLoadingSlots && (
            <div className="flex items-center justify-center py-8 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-ink-orange" aria-hidden="true" />
              <p className="text-sm text-gray-500">Cargando horarios...</p>
            </div>
          )}

          {!isLoadingSlots && slotsError && (
            <div className="flex items-center justify-center gap-2 py-6 text-red-500">
              <AlertCircle className="h-5 w-5" aria-hidden="true" />
              <p className="text-sm font-medium">{slotsError}</p>
            </div>
          )}

          {!isLoadingSlots && !slotsError && slots.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">
                No hay horarios disponibles para este dia.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Prueba con otra fecha.
              </p>
            </div>
          )}

          {!isLoadingSlots && !slotsError && slots.length > 0 && (
            <div
              role="radiogroup"
              aria-label="Seleccionar horario"
              className="grid grid-cols-3 sm:grid-cols-4 gap-2"
            >
              {slots.map((slot) => {
                const isSelected =
                  selectedDate === selectedDateStr && selectedStartTime === slot.start

                return (
                  <button
                    key={`${slot.start}-${slot.end}`}
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`${slot.start} a ${slot.end}`}
                    onClick={() => onSelect(selectedDateStr, slot.start, slot.end)}
                    className={cn(
                      'py-2.5 px-3 rounded-2xl text-sm font-medium border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50',
                      isSelected
                        ? 'gradient-accent text-white border-transparent shadow-warm scale-105'
                        : 'bg-white/30 backdrop-blur-md border-white/25 text-ink-dark hover:border-ink-orange/30 hover:bg-white/50'
                    )}
                  >
                    {slot.start}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {!currentDate && (
        <div className="text-center py-6">
          <p className="text-sm text-gray-400">Selecciona una fecha para ver los horarios disponibles.</p>
        </div>
      )}
    </div>
  )
}

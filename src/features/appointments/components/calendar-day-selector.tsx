'use client'

import { format, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

interface CalendarDaySelectorProps {
  selectedDate: Date
  weekDates: Date[]
  onDateSelect: (date: Date) => void
  onPrevWeek: () => void
  onNextWeek: () => void
}

export function CalendarDaySelector({
  selectedDate,
  weekDates,
  onDateSelect,
  onPrevWeek,
  onNextWeek,
}: CalendarDaySelectorProps) {
  const monthYear = format(weekDates[0] ?? selectedDate, 'MMMM yyyy', {
    locale: es,
  })

  return (
    <div className="bg-white/30 backdrop-blur-xl border border-white/25 rounded-3xl shadow-glass p-4">
      {/* Month / year header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-ink-dark capitalize tracking-wide">
          {monthYear}
        </h2>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevWeek}
            aria-label="Semana anterior"
            className={cn(
              'h-8 w-8 flex items-center justify-center rounded-xl',
              'bg-white/15 hover:bg-white/30 border border-white/20',
              'text-ink-dark/60 hover:text-ink-dark',
              'transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50'
            )}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onNextWeek}
            aria-label="Semana siguiente"
            className={cn(
              'h-8 w-8 flex items-center justify-center rounded-xl',
              'bg-white/15 hover:bg-white/30 border border-white/20',
              'text-ink-dark/60 hover:text-ink-dark',
              'transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50'
            )}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Day circles row */}
      <div
        role="group"
        aria-label="Selector de dia de la semana"
        className="flex items-center justify-between gap-1"
      >
        {weekDates.map((date, index) => {
          const isActive = isSameDay(date, selectedDate)
          const dayLabel = DAY_LABELS[index] ?? format(date, 'EEEEE', { locale: es })
          const dayNumber = format(date, 'd')
          const fullLabel = format(date, 'EEEE d MMMM', { locale: es })

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onDateSelect(date)}
              aria-label={fullLabel}
              aria-pressed={isActive}
              className={cn(
                'flex flex-col items-center gap-1 py-1.5 px-2 rounded-2xl',
                'transition-all duration-200 min-w-0 flex-1',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50',
                isActive
                  ? 'gradient-accent shadow-warm text-white'
                  : 'hover:bg-white/20 text-ink-dark/60 hover:text-ink-dark'
              )}
            >
              <span
                className={cn(
                  'text-[10px] font-medium uppercase tracking-wider',
                  isActive ? 'text-white/80' : 'text-ink-dark/40'
                )}
              >
                {dayLabel}
              </span>
              <span
                className={cn(
                  'text-sm font-bold leading-none',
                  isActive ? 'text-white' : 'text-ink-dark'
                )}
              >
                {dayNumber}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

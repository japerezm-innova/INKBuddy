'use client'

import { useState, useEffect } from 'react'
import { format, parseISO, isSameDay, getHours, differenceInMinutes } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, CalendarX } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/shared/lib/utils'
import { GlassButton } from '@/shared/components'
import { useCalendar } from '@/features/appointments/hooks/use-calendar'
import { useAppointments } from '@/features/appointments/hooks/use-appointments'
import { useAppointmentStore } from '@/features/appointments/store/appointment-store'
import type { Appointment, AppointmentStatus } from '@/features/appointments/types/appointment'
import { CalendarDaySelector } from './calendar-day-selector'
import { AppointmentCard } from './appointment-card'
import { AppointmentDetailModal } from './appointment-detail-modal'

// Hours displayed in the day view timeline
const TIMELINE_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

// Status colors for week mini-cards
const STATUS_BORDER_WEEK: Record<AppointmentStatus, string> = {
  pending: 'border-l-yellow-400',
  confirmed: 'border-l-emerald-400',
  in_progress: 'border-l-blue-500',
  completed: 'border-l-gray-400',
  cancelled: 'border-l-red-400',
  no_show: 'border-l-ink-dark/40',
}

const STATUS_BG_WEEK: Record<AppointmentStatus, string> = {
  pending: 'bg-yellow-50/60',
  confirmed: 'bg-emerald-50/60',
  in_progress: 'bg-blue-50/60',
  completed: 'bg-gray-50/60',
  cancelled: 'bg-red-50/40',
  no_show: 'bg-gray-100/40',
}

// Duration label helper
function getDurationLabel(appointment: Appointment): string | null {
  const mins = differenceInMinutes(parseISO(appointment.ends_at), parseISO(appointment.starts_at))
  if (mins <= 30) return 'Consulta'
  if (mins <= 60) return '1h'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h${m}m` : `${h}h`
}

function groupByHour(appointments: Appointment[]): Map<number, Appointment[]> {
  const map = new Map<number, Appointment[]>()
  for (const apt of appointments) {
    const hour = getHours(parseISO(apt.starts_at))
    const existing = map.get(hour) ?? []
    map.set(hour, [...existing, apt])
  }
  return map
}

function groupByDay(
  appointments: Appointment[],
  weekDates: Date[]
): Map<string, Appointment[]> {
  const map = new Map<string, Appointment[]>()
  for (const date of weekDates) {
    map.set(format(date, 'yyyy-MM-dd'), [])
  }
  for (const apt of appointments) {
    const key = format(parseISO(apt.starts_at), 'yyyy-MM-dd')
    if (map.has(key)) {
      map.set(key, [...(map.get(key) ?? []), apt])
    }
  }
  return map
}

// --- Sub-components ---

function AppointmentSkeleton() {
  return (
    <div className="bg-white/20 rounded-2xl h-24 animate-pulse border border-white/20" />
  )
}

function EmptyDay() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center">
        <CalendarX className="h-6 w-6 text-ink-dark/30" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-ink-dark/40">
        No hay citas para este dia
      </p>
    </div>
  )
}

interface DayViewProps {
  appointments: Appointment[]
  onSelectAppointment: (apt: Appointment) => void
}

function CurrentTimeLine() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const hour = now.getHours()
  const minutes = now.getMinutes()

  // Only show if within timeline range
  if (hour < TIMELINE_HOURS[0]! || hour > TIMELINE_HOURS[TIMELINE_HOURS.length - 1]!) return null

  // Position: each hour slot is min-h-[3.5rem] = 56px
  const hourIndex = hour - TIMELINE_HOURS[0]!
  const topPx = hourIndex * 56 + (minutes / 60) * 56

  return (
    <div
      className="absolute left-0 right-0 z-10 pointer-events-none flex items-center"
      style={{ top: `${topPx}px` }}
      aria-hidden="true"
    >
      <div className="w-12 flex justify-end pr-1">
        <span className="text-[10px] font-bold text-red-500 tabular-nums">
          {String(hour).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
        </span>
      </div>
      <div className="relative flex items-center flex-1">
        <div className="h-2.5 w-2.5 rounded-full bg-red-500 -ml-1 shrink-0" />
        <div className="flex-1 h-[2px] bg-red-500/70" />
      </div>
    </div>
  )
}

function DayView({ appointments, onSelectAppointment }: DayViewProps) {
  const byHour = groupByHour(appointments)
  const isToday = isSameDay(new Date(), new Date()) // always true for current render

  if (appointments.length === 0) return <EmptyDay />

  return (
    <div className="relative flex flex-col gap-0">
      {/* Real-time indicator line */}
      <CurrentTimeLine />

      {TIMELINE_HOURS.map((hour) => {
        const apts = byHour.get(hour) ?? []
        return (
          <div key={hour} className="flex gap-3 min-h-[3.5rem]">
            {/* Hour label */}
            <div className="w-12 shrink-0 flex items-start pt-1">
              <span className="text-xs font-medium text-ink-dark/40 tabular-nums">
                {String(hour).padStart(2, '0')}:00
              </span>
            </div>

            {/* Divider + appointments */}
            <div className="flex-1 border-t border-white/20 pt-1 pb-2 flex flex-col gap-2">
              {apts.map((apt) => {
                const duration = getDurationLabel(apt)
                return (
                  <div key={apt.id} className="relative">
                    <AppointmentCard
                      appointment={apt}
                      onClick={onSelectAppointment}
                    />
                    {/* Duration badge */}
                    {duration && (
                      <span className={cn(
                        'absolute top-2 right-24 text-[10px] font-medium px-1.5 py-0.5 rounded-md',
                        differenceInMinutes(parseISO(apt.ends_at), parseISO(apt.starts_at)) <= 30
                          ? 'bg-violet-100/80 text-violet-700'
                          : 'bg-sky-100/80 text-sky-700'
                      )}>
                        {duration}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface WeekViewProps {
  appointments: Appointment[]
  weekDates: Date[]
  onSelectAppointment: (apt: Appointment) => void
  onSelectDate: (date: Date) => void
}

function WeekView({
  appointments,
  weekDates,
  onSelectAppointment,
  onSelectDate,
}: WeekViewProps) {
  const byDay = groupByDay(appointments, weekDates)

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {weekDates.map((date) => {
        const key = format(date, 'yyyy-MM-dd')
        const dayApts = byDay.get(key) ?? []
        const dayLabel = format(date, 'EEE', { locale: es })
        const dayNumber = format(date, 'd')
        const isToday = isSameDay(date, new Date())

        return (
          <div key={key} className="flex flex-col gap-1 min-w-0">
            {/* Day header */}
            <button
              type="button"
              onClick={() => onSelectDate(date)}
              aria-label={format(date, 'EEEE d MMMM', { locale: es })}
              className={cn(
                'flex flex-col items-center py-1.5 rounded-xl transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50',
                isToday
                  ? 'bg-ink-orange/10 text-ink-orange'
                  : 'hover:bg-white/20 text-ink-dark/60'
              )}
            >
              <span className="text-[9px] font-medium uppercase tracking-wider capitalize">
                {dayLabel}
              </span>
              <span
                className={cn(
                  'text-sm font-bold',
                  isToday && 'text-ink-orange'
                )}
              >
                {dayNumber}
              </span>
            </button>

            {/* Appointment mini-cards */}
            <div className="flex flex-col gap-1">
              {dayApts.length === 0 ? (
                <div className="h-12 rounded-xl border border-dashed border-white/20" />
              ) : (
                dayApts.map((apt) => (
                  <button
                    key={apt.id}
                    type="button"
                    onClick={() => onSelectAppointment(apt)}
                    aria-label={`Cita: ${apt.client_name ?? apt.client?.full_name ?? 'Cliente'} - ${format(parseISO(apt.starts_at), 'HH:mm')}`}
                    className={cn(
                      'w-full text-left p-1.5 rounded-xl',
                      'border border-white/25 backdrop-blur-sm',
                      'border-l-2',
                      STATUS_BORDER_WEEK[apt.status],
                      STATUS_BG_WEEK[apt.status],
                      'hover:bg-white/45 transition-all duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50',
                      'truncate'
                    )}
                  >
                    <p className="text-[10px] font-semibold text-ink-dark truncate">
                      {format(parseISO(apt.starts_at), 'HH:mm')}
                    </p>
                    <p className="text-[10px] text-ink-dark/60 truncate">
                      {apt.client_name ?? apt.client?.full_name ?? '—'}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// --- Main component ---

export function CalendarView() {
  const {
    selectedDate,
    viewMode,
    weekDates,
    setSelectedDate,
    setViewMode,
    goToPrevWeek,
    goToNextWeek,
  } = useCalendar()

  const { setSelectedAppointmentId } = useAppointmentStore()

  const rangeStart = weekDates[0] ?? selectedDate
  const rangeEnd = weekDates[6] ?? selectedDate

  const { appointments, isLoading } = useAppointments({
    dateRange: {
      start: format(
        viewMode === 'week' ? rangeStart : selectedDate,
        'yyyy-MM-dd'
      ),
      end:
        format(
          viewMode === 'week' ? rangeEnd : selectedDate,
          'yyyy-MM-dd'
        ) + 'T23:59:59',
    },
  })

  const dayAppointments = appointments.filter((apt) =>
    isSameDay(parseISO(apt.starts_at), selectedDate)
  )

  const handleSelectAppointment = (apt: Appointment) => {
    setSelectedAppointmentId(apt.id)
  }

  return (
    <div className="relative flex flex-col gap-4">
      {/* Day selector */}
      <CalendarDaySelector
        selectedDate={selectedDate}
        weekDates={weekDates}
        onDateSelect={setSelectedDate}
        onPrevWeek={goToPrevWeek}
        onNextWeek={goToNextWeek}
      />

      {/* View mode toggle */}
      <div role="group" aria-label="Modo de vista" className="flex gap-2">
        <GlassButton
          variant={viewMode === 'day' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewMode('day')}
          aria-pressed={viewMode === 'day'}
        >
          Dia
        </GlassButton>
        <GlassButton
          variant={viewMode === 'week' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewMode('week')}
          aria-pressed={viewMode === 'week'}
        >
          Semana
        </GlassButton>
      </div>

      {/* Calendar content */}
      <div className="bg-white/20 backdrop-blur-xl border border-white/20 rounded-3xl p-4 min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <AppointmentSkeleton />
            <AppointmentSkeleton />
            <AppointmentSkeleton />
          </div>
        ) : viewMode === 'day' ? (
          <DayView
            appointments={dayAppointments}
            onSelectAppointment={handleSelectAppointment}
          />
        ) : (
          <WeekView
            appointments={appointments}
            weekDates={weekDates}
            onSelectAppointment={handleSelectAppointment}
            onSelectDate={(date) => {
              setSelectedDate(date)
              setViewMode('day')
            }}
          />
        )}
      </div>

      {/* Floating action button */}
      <Link
        href="/appointments/new"
        aria-label="Crear nueva cita"
        className={cn(
          'fixed bottom-24 right-5 md:bottom-8 md:right-8 z-50',
          'h-14 w-14 flex items-center justify-center',
          'gradient-accent rounded-full shadow-warm-lg',
          'hover:scale-105 hover:shadow-warm transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50 focus-visible:ring-offset-2'
        )}
      >
        <Plus className="h-6 w-6 text-white" aria-hidden="true" />
      </Link>

      {/* Appointment detail modal */}
      <AppointmentDetailModal appointments={appointments} />
    </div>
  )
}

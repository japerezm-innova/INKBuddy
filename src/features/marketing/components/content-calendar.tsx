'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react'
import { GlassCard, GlassButton } from '@/shared/components'
import { cn } from '@/shared/lib/utils'
import Link from 'next/link'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { getCalendarPosts } from '../services/marketing-service'
import { POST_STATUS_LABELS } from '../constants/tattoo-marketing'
import type { CalendarPost } from '../types/marketing'

// Ordered Mon-Sun (Monday first, index 0)
const WEEK_DAYS_FULL = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
const WEEK_DAYS_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

// Convert JS getDay() (0=Sun...6=Sat) to Monday-first offset (0=Mon...6=Sun)
function mondayFirstOffset(date: Date): number {
  const day = getDay(date) // 0=Sun, 1=Mon, ..., 6=Sat
  return day === 0 ? 6 : day - 1
}

function CalendarSkeleton() {
  return (
    <GlassCard>
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
        {WEEK_DAYS_FULL.map((d, i) => (
          <div key={d} className="text-center text-xs font-medium text-ink-dark/50 py-2">
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{WEEK_DAYS_SHORT[i]}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="h-12 sm:h-14 rounded-xl bg-white/10 animate-pulse"
          />
        ))}
      </div>
    </GlassCard>
  )
}

export function ContentCalendar() {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState<Date>(today)
  const [posts, setPosts] = useState<CalendarPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const fetchPosts = useCallback(async (date: Date) => {
    setIsLoading(true)
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    const result = await getCalendarPosts(month, year)
    setPosts(result.data ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchPosts(currentDate)
  }, [currentDate, fetchPosts])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startOffset = mondayFirstOffset(monthStart)

  const postsForDay = (day: Date): CalendarPost[] =>
    posts.filter((p) => p.date === format(day, 'yyyy-MM-dd'))

  const selectedDayPosts = selectedDay ? postsForDay(selectedDay) : []

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-ink-orange flex-shrink-0" aria-hidden="true" />
          <h2 className="text-base sm:text-lg font-semibold text-ink-dark capitalize truncate">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </h2>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => setCurrentDate(today)}
            aria-label="Ir al mes actual"
          >
            Hoy
          </GlassButton>

          <GlassButton
            variant="ghost"
            size="icon"
            onClick={() => setCurrentDate((d) => subMonths(d, 1))}
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </GlassButton>

          <GlassButton
            variant="ghost"
            size="icon"
            onClick={() => setCurrentDate((d) => addMonths(d, 1))}
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </GlassButton>
        </div>
      </div>

      {/* Calendar grid */}
      {isLoading ? (
        <CalendarSkeleton />
      ) : (
        <GlassCard>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
            {WEEK_DAYS_FULL.map((d, i) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-ink-dark/50 py-2"
              >
                <span className="hidden sm:inline">{d}</span>
                <span className="sm:hidden">{WEEK_DAYS_SHORT[i]}</span>
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {/* Empty cells for offset */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="h-12 sm:h-14" />
            ))}

            {monthDays.map((day) => {
              const dayPosts = postsForDay(day)
              const isToday = isSameDay(day, today)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isSelected = selectedDay ? isSameDay(day, selectedDay) : false

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  aria-label={`${format(day, 'd MMMM yyyy', { locale: es })}${dayPosts.length > 0 ? `, ${dayPosts.length} publicacion${dayPosts.length > 1 ? 'es' : ''}` : ''}`}
                  aria-pressed={isSelected}
                  className={cn(
                    'h-12 sm:h-14 rounded-xl p-1 sm:p-1.5 flex flex-col items-start transition-all duration-200 cursor-pointer text-left',
                    'hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50',
                    isToday && 'border border-ink-orange/50',
                    isSelected && 'bg-white/20',
                    !isCurrentMonth && 'opacity-40'
                  )}
                >
                  <span className={cn(
                    'text-xs font-medium leading-none mb-1',
                    isToday ? 'text-ink-orange' : 'text-ink-dark/80'
                  )}>
                    {format(day, 'd')}
                  </span>

                  {/* Status dots */}
                  {dayPosts.length > 0 && (
                    <div className="flex flex-wrap gap-0.5">
                      {dayPosts.slice(0, 4).map((post) => {
                        const statusInfo = POST_STATUS_LABELS[post.status]
                        return (
                          <span
                            key={post.id}
                            className={cn('h-1.5 w-1.5 rounded-full', statusInfo?.color ?? 'bg-gray-400')}
                            aria-hidden="true"
                          />
                        )
                      })}
                      {dayPosts.length > 4 && (
                        <span className="text-[9px] text-ink-dark/50 leading-none mt-0.5">
                          +{dayPosts.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </GlassCard>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-1">
        {Object.entries(POST_STATUS_LABELS).map(([key, value]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={cn('h-2.5 w-2.5 rounded-full', value.color)} aria-hidden="true" />
            <span className="text-xs text-ink-dark/60">{value.label}</span>
          </div>
        ))}
      </div>

      {/* Selected day detail */}
      <GlassCard>
        <div className="flex items-start sm:items-center justify-between gap-2 mb-4">
          <h3 className="font-semibold text-ink-dark text-sm sm:text-base capitalize min-w-0 truncate">
            {selectedDay
              ? format(selectedDay, "EEEE d 'de' MMMM", { locale: es })
              : 'Detalle del dia'}
          </h3>

          {selectedDay && (
            <Link
              href={`/marketing/posts/new?date=${format(selectedDay, 'yyyy-MM-dd')}`}
              aria-label="Agregar nueva publicacion"
              className="flex-shrink-0"
            >
              <GlassButton size="sm">
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden xs:inline">Agregar Post</span>
                <span className="xs:hidden">Nuevo</span>
              </GlassButton>
            </Link>
          )}
        </div>

        {!selectedDay && (
          <p className="text-sm text-ink-dark/50 text-center py-6">
            Selecciona un dia para ver detalles
          </p>
        )}

        {selectedDay && selectedDayPosts.length === 0 && (
          <p className="text-sm text-ink-dark/50 text-center py-6">
            Sin publicaciones para este dia
          </p>
        )}

        {selectedDay && selectedDayPosts.length > 0 && (
          <ul className="space-y-2" aria-label="Publicaciones del dia seleccionado">
            {selectedDayPosts.map((post) => {
              const statusInfo = POST_STATUS_LABELS[post.status]
              return (
                <li key={post.id}>
                  <Link href={`/marketing/posts/${post.id}`}>
                    <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-2xl hover:bg-white/15 transition-colors duration-200 cursor-pointer">
                      <span
                        className={cn('mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0', statusInfo?.color ?? 'bg-gray-400')}
                        aria-hidden="true"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-ink-dark truncate">
                          {post.caption
                            ? post.caption.slice(0, 40) + (post.caption.length > 40 ? '...' : '')
                            : 'Sin descripcion'}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-ink-dark/60">
                            {post.post_type}
                          </span>
                          {post.platform && (
                            <span className="text-xs text-ink-dark/40 capitalize">
                              {post.platform}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-ink-dark/50 flex-shrink-0 hidden sm:inline">
                        {statusInfo?.label}
                      </span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </GlassCard>
    </div>
  )
}

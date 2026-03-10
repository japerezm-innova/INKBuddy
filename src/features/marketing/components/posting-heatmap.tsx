'use client'

import { useState, useEffect } from 'react'
import { GlassCard } from '@/shared/components'
import { cn } from '@/shared/lib/utils'
import { getHeatmapData } from '../services/recommendations-service'
import { DAY_NAMES_ES } from '../constants/tattoo-marketing'
import type { SocialPlatform } from '../types/marketing'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  platform: SocialPlatform
  className?: string
}

interface TooltipState {
  visible: boolean
  text: string
  x: number
  y: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Hours to show as column headers (every 3h)
const HEADER_HOURS = [0, 3, 6, 9, 12, 15, 18, 21] as const

const SCORE_STYLES: Record<number, string> = {
  0: 'bg-white/10',
  1: 'bg-yellow-400/30',
  2: 'bg-orange-400/50',
  3: 'bg-red-400/70',
}

const SCORE_LABELS: Record<number, string> = {
  0: 'Sin datos',
  1: 'Bajo',
  2: 'Medio',
  3: 'Mejor',
}

// Day order: Mon (1) ... Sat (6), Sun (0)
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PostingHeatmap({ platform, className }: Props) {
  const [matrix, setMatrix] = useState<number[][]>([])
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    text: '',
    x: 0,
    y: 0,
  })

  useEffect(() => {
    setMatrix(getHeatmapData(platform))
  }, [platform])

  function handleCellMouseEnter(
    event: React.MouseEvent<HTMLButtonElement>,
    dayIndex: number,
    hour: number,
    score: number
  ) {
    const rect = event.currentTarget.getBoundingClientRect()
    const dayName = DAY_NAMES_ES[dayIndex]
    const hourStr = String(hour).padStart(2, '0')
    const scoreLabel = SCORE_LABELS[score] ?? 'Sin datos'
    setTooltip({
      visible: true,
      text: `${dayName} ${hourStr}:00 - ${scoreLabel}`,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    })
  }

  function handleCellMouseLeave() {
    setTooltip((prev) => ({ ...prev, visible: false }))
  }

  const platformLabel = platform === 'instagram' ? 'Instagram' : 'TikTok'

  return (
    <section className={cn(className)} aria-label="Mapa de calor de horarios">
      <GlassCard>
        <h2 className="text-base font-semibold text-ink-dark mb-1">
          Mejores Horarios para Publicar
        </h2>
        <p className="text-xs text-ink-dark/50 mb-4">{platformLabel}</p>

        <div className="overflow-x-auto">
          <div className="min-w-[360px]">
            {/* Hour headers */}
            <div className="flex items-center mb-1 pl-10">
              {Array.from({ length: 24 }, (_, h) => {
                const showLabel = HEADER_HOURS.includes(h as typeof HEADER_HOURS[number])
                return (
                  <div
                    key={h}
                    className="w-3 md:w-4 flex-shrink-0 text-center"
                    aria-hidden="true"
                  >
                    {showLabel && (
                      <span className="text-[9px] text-ink-dark/40 font-medium">
                        {String(h).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Rows: Mon-Sat-Sun */}
            {DAY_ORDER.map((dayIndex) => {
              const dayName = DAY_NAMES_ES[dayIndex]
              const row = matrix[dayIndex] ?? Array(24).fill(0)

              return (
                <div key={dayIndex} className="flex items-center gap-0.5 mb-0.5">
                  {/* Day label */}
                  <span
                    className="w-9 text-right pr-1.5 text-[10px] font-medium text-ink-dark/50 flex-shrink-0"
                    aria-hidden="true"
                  >
                    {dayName}
                  </span>

                  {/* Cells */}
                  {row.map((score, hour) => (
                    <button
                      key={hour}
                      type="button"
                      className={cn(
                        'w-3 h-3 md:w-4 md:h-4 rounded-sm flex-shrink-0 transition-transform duration-100 hover:scale-110 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-orange/50',
                        SCORE_STYLES[score] ?? SCORE_STYLES[0]
                      )}
                      aria-label={`${dayName} ${String(hour).padStart(2, '0')}:00 - ${SCORE_LABELS[score] ?? 'Sin datos'}`}
                      onMouseEnter={(e) => handleCellMouseEnter(e, dayIndex, hour, score)}
                      onMouseLeave={handleCellMouseLeave}
                      onFocus={(e) => handleCellMouseEnter(e as unknown as React.MouseEvent<HTMLButtonElement>, dayIndex, hour, score)}
                      onBlur={handleCellMouseLeave}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div
          className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-white/20"
          aria-label="Leyenda del mapa de calor"
        >
          {([0, 1, 2, 3] as const).map((score) => (
            <div key={score} className="flex items-center gap-1.5">
              <div
                className={cn('w-3 h-3 rounded-sm', SCORE_STYLES[score])}
                aria-hidden="true"
              />
              <span className="text-xs text-ink-dark/60">{SCORE_LABELS[score]}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Floating tooltip (rendered via fixed positioning) */}
      {tooltip.visible && (
        <div
          role="tooltip"
          className="fixed z-50 pointer-events-none bg-ink-dark/90 text-white text-xs rounded-lg px-2.5 py-1.5 shadow-lg -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}
    </section>
  )
}

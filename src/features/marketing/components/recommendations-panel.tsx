'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Clock,
  Hash,
  Lightbulb,
  ImageIcon,
  BarChart2,
  Star,
} from 'lucide-react'
import { GlassCard, GlassButton } from '@/shared/components'
import { cn } from '@/shared/lib/utils'
import {
  getBestPostingTimes,
  getNextContentSuggestion,
  evaluateEngagementRate,
} from '../services/recommendations-service'
import {
  CONTENT_STRATEGIES,
  ENGAGEMENT_BENCHMARKS,
} from '../constants/tattoo-marketing'
import type { SocialPlatform } from '../types/marketing'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  platform: SocialPlatform
  avgEngagement?: number
  unpublishedCount?: number
  recentPostTypes?: string[]
  className?: string
}

// ---------------------------------------------------------------------------
// Quick tips (static)
// ---------------------------------------------------------------------------

const QUICK_TIPS = [
  'Los Reels obtienen 2x mas alcance que las imagenes estaticas.',
  'La tasa de guardado es la metrica mas importante para tatuadores.',
  'Publica disenos disponibles para impulsar reservas directas.',
  'Responde comentarios en los primeros 30 minutos para mejorar el algoritmo.',
  'Usa entre 20-25 hashtags por publicacion para maximo alcance.',
] as const

// ---------------------------------------------------------------------------
// Score indicator dots
// ---------------------------------------------------------------------------

function ScoreDots({ score }: { score: number }) {
  return (
    <span className="flex gap-0.5" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn(
            'h-2 w-2 rounded-full',
            i <= score ? 'bg-amber-400' : 'bg-white/20'
          )}
        />
      ))}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Engagement bar
// ---------------------------------------------------------------------------

function EngagementBar({ rate }: { rate: number }) {
  const { low, average, good, great } = ENGAGEMENT_BENCHMARKS.engagement_rate

  const segments = [
    { label: 'Bajo', max: low, color: 'bg-red-400' },
    { label: 'Promedio', max: average, color: 'bg-yellow-400' },
    { label: 'Bueno', max: good, color: 'bg-green-400' },
    { label: 'Excelente', max: great, color: 'bg-emerald-400' },
  ]

  // Cap position at 100% of the bar width (great = 100%)
  const positionPct = Math.min((rate / great) * 100, 100)

  return (
    <div aria-label={`Tasa de engagement: ${rate}%`}>
      <div className="relative h-3 rounded-full overflow-hidden flex">
        {segments.map((seg, i) => (
          <div
            key={i}
            className={cn('flex-1', seg.color)}
            aria-hidden="true"
          />
        ))}

        {/* Marker */}
        <div
          className="absolute top-0 h-3 w-0.5 bg-ink-dark/80 rounded-full transform -translate-x-1/2"
          style={{ left: `${positionPct}%` }}
          aria-hidden="true"
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-1">
        {segments.map((seg) => (
          <span key={seg.label} className="text-[10px] text-ink-dark/40">
            {seg.max}%
          </span>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function RecommendationsPanel({
  platform,
  avgEngagement,
  unpublishedCount = 0,
  recentPostTypes = [],
  className,
}: Props) {
  const [bestTimes, setBestTimes] = useState<
    { day: string; time: string; score: number }[]
  >([])
  const [contentSuggestion, setContentSuggestion] = useState(
    () => getNextContentSuggestion(recentPostTypes)
  )

  useEffect(() => {
    setBestTimes(getBestPostingTimes(platform, 3))
  }, [platform])

  useEffect(() => {
    setContentSuggestion(getNextContentSuggestion(recentPostTypes))
  }, [recentPostTypes])

  const engagementEval = avgEngagement !== undefined
    ? evaluateEngagementRate(avgEngagement)
    : null

  return (
    <aside className={cn('space-y-4', className)} aria-label="Panel de recomendaciones">

      {/* 1. Best posting times */}
      <GlassCard padding="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-ink-orange" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-ink-dark">Mejores Horarios</h3>
        </div>

        <ul className="space-y-2">
          {bestTimes.map((slot, i) => (
            <li key={i} className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink-dark">
                {slot.day} {slot.time}
              </span>
              <ScoreDots score={slot.score} />
            </li>
          ))}
          {bestTimes.length === 0 && (
            <li className="text-xs text-ink-dark/40">Sin datos disponibles</li>
          )}
        </ul>
      </GlassCard>

      {/* 2. Recommended content */}
      <GlassCard padding="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-amber-500" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-ink-dark">Contenido Recomendado</h3>
        </div>

        {/* Top suggestion */}
        <div className="bg-amber-50/40 border border-amber-200/40 rounded-2xl p-3 mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-ink-dark">
              {contentSuggestion.label}
            </span>
            <span className="text-xs font-bold text-amber-600 bg-amber-100/60 px-2 py-0.5 rounded-full">
              {contentSuggestion.engagementMultiplier}x engagement
            </span>
          </div>
          <p className="text-xs text-ink-dark/60">{contentSuggestion.tip}</p>
        </div>

        {/* All strategies */}
        <ol className="space-y-1.5">
          {CONTENT_STRATEGIES.map((strategy) => (
            <li key={strategy.type} className="flex items-center gap-2">
              <span className="w-4 text-xs font-bold text-ink-dark/40 text-right flex-shrink-0">
                {strategy.rank}.
              </span>
              <span className="text-xs text-ink-dark/70 flex-1 leading-tight">
                {strategy.label}
              </span>
              <span className="text-xs text-ink-dark/40 flex-shrink-0">
                {strategy.engagementMultiplier}x
              </span>
            </li>
          ))}
        </ol>
      </GlassCard>

      {/* 3. Engagement vs industry */}
      <GlassCard padding="p-5">
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 className="h-4 w-4 text-blue-500" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-ink-dark">
            Tu Engagement vs Industria
          </h3>
        </div>

        {avgEngagement !== undefined && engagementEval ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-dark/60">Tasa actual</span>
              <span className={cn('text-sm font-bold', engagementEval.color)}>
                {avgEngagement}% &mdash; {engagementEval.label}
              </span>
            </div>
            <EngagementBar rate={avgEngagement} />
          </div>
        ) : (
          <p className="text-xs text-ink-dark/40">
            Agrega metricas para ver tu rendimiento vs la industria.
          </p>
        )}
      </GlassCard>

      {/* 4. Unpublished pieces */}
      <GlassCard padding="p-5">
        <div className="flex items-center gap-2 mb-3">
          <ImageIcon className="h-4 w-4 text-purple-500" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-ink-dark">Piezas sin Publicar</h3>
        </div>

        {unpublishedCount > 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-ink-dark/70">
              Tienes{' '}
              <span className="font-bold text-ink-dark">{unpublishedCount}</span>{' '}
              {unpublishedCount === 1 ? 'pieza' : 'piezas'} en tu portafolio sin
              publicar.
            </p>
            <Link href="/marketing">
              <GlassButton variant="primary" size="sm" className="w-full">
                Ver piezas disponibles
              </GlassButton>
            </Link>
          </div>
        ) : (
          <p className="text-xs text-ink-dark/40">
            Todas tus piezas ya fueron publicadas.
          </p>
        )}
      </GlassCard>

      {/* 5. Quick tips */}
      <GlassCard padding="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-4 w-4 text-yellow-500" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-ink-dark">Tips Rapidos</h3>
        </div>

        <ul className="space-y-2.5">
          {QUICK_TIPS.map((tip, i) => (
            <li key={i} className="flex items-start gap-2">
              <Hash
                className="h-3 w-3 text-ink-orange flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span className="text-xs text-ink-dark/70 leading-relaxed">{tip}</span>
            </li>
          ))}
        </ul>
      </GlassCard>
    </aside>
  )
}

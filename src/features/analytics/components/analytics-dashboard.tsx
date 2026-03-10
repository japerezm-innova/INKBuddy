'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DollarSign,
  CalendarCheck,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { GlassCard, GlassButton, StatCard } from '@/shared/components'
import { cn } from '@/shared/lib/utils'
import { getAnalyticsData } from '../services/analytics-service'
import { BarChart } from './bar-chart'
import { DonutChart } from './donut-chart'
import { TrendLine } from './trend-line'
import type { AnalyticsData, DateRange, DateRangePreset } from '../types/analytics'

// ---------------------------------------------------------------------------
// Date range presets
// ---------------------------------------------------------------------------

interface PresetOption {
  key: DateRangePreset
  label: string
}

const DATE_PRESETS: PresetOption[] = [
  { key: 'last7', label: 'Ultimos 7 dias' },
  { key: 'last30', label: 'Ultimos 30 dias' },
  { key: 'thisMonth', label: 'Este mes' },
  { key: 'last3months', label: 'Ultimos 3 meses' },
]

function presetToRange(preset: DateRangePreset): DateRange {
  const now = new Date()
  const to = now.toISOString().split('T')[0] as string

  switch (preset) {
    case 'last7': {
      const from = new Date(now)
      from.setDate(from.getDate() - 7)
      return { from: from.toISOString().split('T')[0] as string, to }
    }
    case 'last30': {
      const from = new Date(now)
      from.setDate(from.getDate() - 30)
      return { from: from.toISOString().split('T')[0] as string, to }
    }
    case 'thisMonth': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: from.toISOString().split('T')[0] as string, to }
    }
    case 'last3months': {
      const from = new Date(now)
      from.setMonth(from.getMonth() - 3)
      return { from: from.toISOString().split('T')[0] as string, to }
    }
  }
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Cargando analytics">
      {/* Preset buttons skeleton */}
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-28 bg-white/30 rounded-2xl" />
        ))}
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-white/30 rounded-3xl" />
        ))}
      </div>

      {/* Donut charts skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-64 bg-white/30 rounded-3xl" />
        ))}
      </div>

      {/* Bar charts skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-48 bg-white/30 rounded-3xl" />
        ))}
      </div>

      {/* Trend line skeleton */}
      <div className="h-40 bg-white/30 rounded-3xl" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function AnalyticsError({ message }: { message: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 gap-3 text-center"
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle className="h-10 w-10 text-red-400" aria-hidden="true" />
      <p className="text-ink-dark/70 font-medium">Error al cargar analytics</p>
      <p className="text-sm text-ink-dark/40">{message}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Currency formatter
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// ---------------------------------------------------------------------------
// Main dashboard
// ---------------------------------------------------------------------------

export function AnalyticsDashboard() {
  const [activePreset, setActivePreset] = useState<DateRangePreset>('last30')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async (preset: DateRangePreset) => {
    setIsLoading(true)
    setError(null)

    const range = presetToRange(preset)
    const result = await getAnalyticsData(range)

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setData(result.data)
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadData(activePreset)
  }, [activePreset, loadData])

  const handlePresetChange = (preset: DateRangePreset) => {
    setActivePreset(preset)
  }

  if (isLoading) return <AnalyticsSkeleton />
  if (error) return <AnalyticsError message={error} />
  if (!data) return null

  // Derived values
  const completionRate =
    data.appointments.total > 0
      ? Math.round((data.appointments.completed / data.appointments.total) * 100)
      : 0

  const trendIsPositive = data.revenue.trend >= 0
  const trendAbs = Math.abs(data.revenue.trend)

  // Sparkline data
  const sparklineData = data.appointmentsByDay.map((d) => d.count)

  // Format bar chart data for services
  const servicesBarData = data.topServices.map((s) => ({
    label: s.name,
    value: s.count,
    color: '#FF6B35',
  }))

  // Format bar chart data for revenue by artist
  const artistBarData = data.revenueByArtist.map((a, i) => {
    const colors = ['#FF6B35', '#FF6B8A', '#4ECDC4', '#45B7D1', '#96CEB4']
    return {
      label: a.name,
      value: a.revenue,
      color: colors[i % colors.length] as string,
    }
  })

  // Format bar chart data for professions
  const professionBarData = data.demographics.topProfessions.map((p, i) => {
    const colors = ['#FF8C61', '#FFB088', '#4ECDC4', '#45B7D1', '#96CEB4']
    return {
      label: p.label,
      value: p.value,
      color: colors[i % colors.length] as string,
    }
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Date range selector */}
      <section aria-label="Rango de fechas">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Seleccionar rango de fechas"
        >
          {DATE_PRESETS.map((preset) => (
            <GlassButton
              key={preset.key}
              variant={activePreset === preset.key ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handlePresetChange(preset.key)}
              aria-pressed={activePreset === preset.key}
            >
              {preset.label}
            </GlassButton>
          ))}
        </div>
      </section>

      {/* Row 1: Stat cards */}
      <section aria-label="Resumen de metricas">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title="Ingresos este mes"
            value={formatCurrency(data.revenue.thisMonth)}
            icon={DollarSign}
            trend={{ value: trendAbs, isPositive: trendIsPositive }}
          />
          <StatCard
            title="Citas en periodo"
            value={data.appointments.total}
            icon={CalendarCheck}
          />
          <StatCard
            title="Tasa de completado"
            value={`${completionRate}%`}
            icon={CheckCircle2}
          />
          <StatCard
            title="Canceladas / No-show"
            value={data.appointments.cancelled + data.appointments.noShow}
            icon={data.appointments.cancelled + data.appointments.noShow > 0 ? TrendingDown : TrendingUp}
          />
        </div>
      </section>

      {/* Row 2: Donut charts */}
      <section aria-label="Demograficos de clientes">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard hover={false} padding="p-5">
            <DonutChart
              data={data.demographics.gender}
              title="Genero de clientes"
              size={160}
            />
          </GlassCard>

          <GlassCard hover={false} padding="p-5">
            <DonutChart
              data={data.demographics.source}
              title="Origen de clientes"
              size={160}
            />
          </GlassCard>
        </div>
      </section>

      {/* Row 3: Top services + Revenue by artist */}
      <section aria-label="Servicios y artistas">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard hover={false} padding="p-5">
            {servicesBarData.length === 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-ink-dark/70 uppercase tracking-wide">
                  Servicios mas populares
                </h3>
                <p className="text-sm text-ink-dark/40 py-4 text-center">
                  Sin datos disponibles
                </p>
              </div>
            ) : (
              <BarChart
                data={servicesBarData}
                title="Servicios mas populares"
                formatValue={(v) => `${v} citas`}
              />
            )}
          </GlassCard>

          <GlassCard hover={false} padding="p-5">
            {artistBarData.length === 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-ink-dark/70 uppercase tracking-wide">
                  Ingresos por artista
                </h3>
                <p className="text-sm text-ink-dark/40 py-4 text-center">
                  Sin datos disponibles
                </p>
              </div>
            ) : (
              <BarChart
                data={artistBarData}
                title="Ingresos por artista"
                formatValue={formatCurrency}
              />
            )}
          </GlassCard>
        </div>
      </section>

      {/* Row 4: Top professions */}
      <section aria-label="Profesiones de clientes">
        <GlassCard hover={false} padding="p-5">
          {professionBarData.length === 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-ink-dark/70 uppercase tracking-wide">
                Top profesiones de clientes
              </h3>
              <p className="text-sm text-ink-dark/40 py-4 text-center">
                Sin datos de profesion disponibles
              </p>
            </div>
          ) : (
            <BarChart
              data={professionBarData}
              title="Top profesiones de clientes"
              formatValue={(v) => `${v} clientes`}
            />
          )}
        </GlassCard>
      </section>

      {/* Row 5: Appointments trend */}
      <section aria-label="Tendencia de citas">
        <GlassCard hover={false} padding="p-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink-dark/70 uppercase tracking-wide">
                Citas por dia (ultimos 30 dias)
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-ink-dark/50">
                <div
                  className="h-2 w-6 rounded-full"
                  style={{ backgroundColor: '#FF6B35', opacity: 0.8 }}
                  aria-hidden="true"
                />
                <span>Citas</span>
              </div>
            </div>

            <TrendLine
              data={sparklineData}
              color="#FF6B35"
              height={100}
            />

            {/* X-axis labels: first, middle, last */}
            {data.appointmentsByDay.length > 0 && (
              <div className="flex justify-between text-xs text-ink-dark/40 -mt-1">
                <span>
                  {format(
                    parseISO(data.appointmentsByDay[0]?.date ?? new Date().toISOString().split('T')[0] as string),
                    'd MMM',
                    { locale: es }
                  )}
                </span>
                <span>
                  {format(
                    parseISO(
                      data.appointmentsByDay[
                        Math.floor(data.appointmentsByDay.length / 2)
                      ]?.date ?? new Date().toISOString().split('T')[0] as string
                    ),
                    'd MMM',
                    { locale: es }
                  )}
                </span>
                <span>
                  {format(
                    parseISO(
                      data.appointmentsByDay[data.appointmentsByDay.length - 1]?.date ??
                        new Date().toISOString().split('T')[0] as string
                    ),
                    'd MMM',
                    { locale: es }
                  )}
                </span>
              </div>
            )}

            {/* Summary stats below the chart */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/20">
              <div className="text-center">
                <p className="text-xl font-bold text-ink-dark">
                  {data.appointments.total}
                </p>
                <p className="text-xs text-ink-dark/50 mt-0.5">Total citas</p>
              </div>
              <div className="text-center border-x border-white/20">
                <p className="text-xl font-bold text-emerald-600">
                  {data.appointments.completed}
                </p>
                <p className="text-xs text-ink-dark/50 mt-0.5">Completadas</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-red-400">
                  {data.appointments.cancelled}
                </p>
                <p className="text-xs text-ink-dark/50 mt-0.5">Canceladas</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Revenue comparison note */}
      <section aria-label="Comparativa de ingresos">
        <GlassCard hover={false} padding="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-ink-dark/70 uppercase tracking-wide mb-1">
                Comparativa mensual de ingresos
              </h3>
              <p className="text-xs text-ink-dark/40">
                Comparacion entre este mes y el mes anterior
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-ink-dark/50 mb-1">Mes anterior</p>
                <p className="text-lg font-bold text-ink-dark">
                  {formatCurrency(data.revenue.lastMonth)}
                </p>
              </div>

              <div
                className={cn(
                  'flex items-center gap-1 px-3 py-2 rounded-2xl text-sm font-bold',
                  trendIsPositive
                    ? 'bg-emerald-100/60 text-emerald-700'
                    : 'bg-red-100/60 text-red-600'
                )}
                aria-label={`${trendIsPositive ? 'Aumento' : 'Disminucion'} de ${trendAbs}%`}
              >
                {trendIsPositive ? (
                  <TrendingUp className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <TrendingDown className="h-4 w-4" aria-hidden="true" />
                )}
                {trendAbs}%
              </div>

              <div className="text-center">
                <p className="text-xs text-ink-dark/50 mb-1">Este mes</p>
                <p className="text-lg font-bold text-ink-orange">
                  {formatCurrency(data.revenue.thisMonth)}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </section>
    </div>
  )
}

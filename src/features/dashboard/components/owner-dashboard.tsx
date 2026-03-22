'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { StatsGrid } from './stats-grid'
import { TodayAppointments } from './today-appointments'
import { QuickActions } from './quick-actions'
import type { Profile } from '@/features/auth/types/auth'
import type { DashboardStats } from '../types/dashboard'
import { getDashboardStats } from '../services/dashboard-service'
import { useOfflineTodayAppointments } from '@/features/appointments/hooks/use-offline-today'

interface OwnerDashboardProps {
  profile: Profile
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos dias'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Cargando dashboard">
      {/* Greeting skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-white/40 rounded-2xl" />
        <div className="h-4 w-40 bg-white/30 rounded-xl" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 bg-white/30 rounded-3xl" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 h-64 bg-white/30 rounded-3xl" />
        <div className="lg:col-span-2 h-64 bg-white/30 rounded-3xl" />
      </div>
    </div>
  )
}

export function OwnerDashboard({ profile }: OwnerDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    appointments,
    isLoading: isLoadingAppointments,
    isFromCache,
    cachedAt,
  } = useOfflineTodayAppointments()

  const isLoading = isLoadingStats && isLoadingAppointments

  const greeting = getGreeting()
  const firstName = profile.full_name?.split(' ')[0] ?? 'Usuario'
  const todayFormatted = format(new Date(), "EEEE, d 'de' MMMM yyyy", {
    locale: es,
  })

  useEffect(() => {
    async function loadStats() {
      setIsLoadingStats(true)
      setError(null)

      const statsResult = await getDashboardStats()

      if (statsResult.error) {
        setError(statsResult.error)
      } else if (statsResult.data) {
        setStats(statsResult.data)
      }

      setIsLoadingStats(false)
    }

    loadStats()
  }, [])

  if (isLoading) return <DashboardSkeleton />

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 text-center"
        role="alert"
        aria-live="assertive"
      >
        <p className="text-ink-dark/60 font-medium">
          Error al cargar el dashboard
        </p>
        <p className="text-sm text-ink-dark/40 mt-1">{error}</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Greeting */}
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-ink-dark">
          {greeting},{' '}
          <span className="text-gradient">{firstName}</span>
        </h1>
        <p className="text-sm text-ink-dark/50 mt-1 capitalize">
          {todayFormatted}
        </p>
      </header>

      {/* Stats Grid */}
      {stats && <StatsGrid stats={stats} variant="full" />}

      {/* Main Content: Today's appointments + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Today's appointments takes more space */}
        <div className="lg:col-span-3">
          <TodayAppointments appointments={appointments} isFromCache={isFromCache} cachedAt={cachedAt} />
        </div>

        {/* Quick actions sidebar */}
        <div className="lg:col-span-2">
          <QuickActions variant="full" />
        </div>
      </div>
    </div>
  )
}

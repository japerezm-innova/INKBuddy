'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { StatsGrid } from './stats-grid'
import { TodayAppointments } from './today-appointments'
import { QuickActions } from './quick-actions'
import type { Profile } from '@/features/auth/types/auth'
import type { DashboardStats } from '../types/dashboard'
import type { Appointment } from '@/features/appointments/types/appointment'
import { getDashboardStats, getTodayAppointments } from '../services/dashboard-service'

interface ArtistDashboardProps {
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
        <div className="h-8 w-56 bg-white/40 rounded-2xl" />
        <div className="h-4 w-36 bg-white/30 rounded-xl" />
      </div>

      {/* Stats skeleton - 3 cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 bg-white/30 rounded-3xl" />
        ))}
      </div>

      {/* Appointments skeleton */}
      <div className="h-72 bg-white/30 rounded-3xl" />
    </div>
  )
}

export function ArtistDashboard({ profile }: ArtistDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const greeting = getGreeting()
  const firstName = profile.full_name?.split(' ')[0] ?? 'Artista'
  const todayFormatted = format(new Date(), "EEEE, d 'de' MMMM yyyy", {
    locale: es,
  })

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      setError(null)

      const [statsResult, appointmentsResult] = await Promise.all([
        getDashboardStats(),
        getTodayAppointments(),
      ])

      if (statsResult.error) {
        setError(statsResult.error)
      } else if (statsResult.data) {
        setStats(statsResult.data)
      }

      if (appointmentsResult.data) {
        setAppointments(appointmentsResult.data)
      }

      setIsLoading(false)
    }

    loadData()
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
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
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

      {/* Stats Grid - artist subset only */}
      {stats && <StatsGrid stats={stats} variant="artist" />}

      {/* Today's appointments - full width */}
      <TodayAppointments appointments={appointments} />

      {/* Quick actions - artist subset */}
      <QuickActions variant="artist" />
    </div>
  )
}

'use client'

import {
  CalendarDays,
  Calendar,
  UserPlus,
  DollarSign,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { StatCard } from '@/shared/components'
import type { DashboardStats } from '../types/dashboard'

interface StatsGridProps {
  stats: DashboardStats
  variant?: 'full' | 'artist'
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function StatsGrid({ stats, variant = 'full' }: StatsGridProps) {
  const isArtist = variant === 'artist'

  return (
    <section
      aria-label="Estadisticas del dashboard"
      className={
        isArtist
          ? 'grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4'
          : 'grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4'
      }
    >
      {/* Citas Hoy - always visible */}
      <StatCard
        title="Citas Hoy"
        value={stats.appointmentsToday}
        icon={CalendarDays}
      />

      {/* Esta Semana - always visible */}
      <StatCard
        title="Esta Semana"
        value={stats.appointmentsThisWeek}
        icon={Calendar}
      />

      {/* Pendientes - always visible */}
      <StatCard
        title="Pendientes"
        value={stats.pendingAppointments}
        icon={Clock}
      />

      {/* Owner-only stats */}
      {!isArtist && (
        <>
          <StatCard
            title="Nuevos Clientes"
            value={stats.newClientsThisMonth}
            icon={UserPlus}
          />

          <StatCard
            title="Ingresos del Mes"
            value={formatCurrency(stats.revenueThisMonth)}
            icon={DollarSign}
          />

          <StatCard
            title="Alertas Stock"
            value={stats.lowStockAlerts}
            icon={AlertTriangle}
            className={
              stats.lowStockAlerts > 0
                ? 'ring-1 ring-red-300/60'
                : undefined
            }
          />
        </>
      )}
    </section>
  )
}

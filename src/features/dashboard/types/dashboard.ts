import type { Appointment } from '@/features/appointments/types/appointment'

export interface DashboardStats {
  appointmentsToday: number
  appointmentsThisWeek: number
  newClientsThisMonth: number
  revenueThisMonth: number
  pendingAppointments: number
  lowStockAlerts: number
}

export interface DashboardData {
  stats: DashboardStats
  todayAppointments: Appointment[]
  upcomingAppointments: Appointment[]
}

export type DashboardStatKey = keyof DashboardStats

'use server'

import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/features/auth/types/auth'
import type { Appointment } from '@/features/appointments/types/appointment'
import type { DashboardStats } from '../types/dashboard'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const APPOINTMENT_SELECT = `
  *,
  artist:profiles!artist_id(id, full_name, avatar_url),
  client:clients!client_id(id, full_name, phone),
  service:services!service_id(id, name, duration_minutes)
` as const

type AuthProfileResult =
  | { profile: Profile; error: null }
  | { profile: null; error: string }

async function getAuthenticatedProfile(): Promise<AuthProfileResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { profile: null, error: 'No autenticado' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !data) {
    return { profile: null, error: 'Perfil no encontrado' }
  }

  return { profile: data as Profile, error: null }
}

// ---------------------------------------------------------------------------
// getDashboardStats
// ---------------------------------------------------------------------------

export async function getDashboardStats(): Promise<{
  data?: DashboardStats
  error?: string
}> {
  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()
  const studioId = profile.studio_id

  const now = new Date()
  const today = now.toISOString().split('T')[0] as string

  // Start of current week (Monday)
  const startOfWeekDate = new Date(now)
  const day = startOfWeekDate.getDay()
  const diff = day === 0 ? -6 : 1 - day
  startOfWeekDate.setDate(startOfWeekDate.getDate() + diff)
  startOfWeekDate.setHours(0, 0, 0, 0)
  const weekStart = startOfWeekDate.toISOString()

  // End of current week (Sunday)
  const endOfWeekDate = new Date(startOfWeekDate)
  endOfWeekDate.setDate(endOfWeekDate.getDate() + 6)
  endOfWeekDate.setHours(23, 59, 59, 999)
  const weekEnd = endOfWeekDate.toISOString()

  // Start of current month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // Run all count queries in parallel
  const [
    todayResult,
    weekResult,
    clientsResult,
    revenueResult,
    pendingResult,
    stockResult,
  ] = await Promise.all([
    // Appointments today (non-cancelled)
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('studio_id', studioId)
      .gte('starts_at', `${today}T00:00:00`)
      .lt('starts_at', `${today}T23:59:59`)
      .not('status', 'eq', 'cancelled'),

    // Appointments this week (non-cancelled)
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('studio_id', studioId)
      .gte('starts_at', weekStart)
      .lte('starts_at', weekEnd)
      .not('status', 'eq', 'cancelled'),

    // New clients this month
    supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('studio_id', studioId)
      .gte('created_at', monthStart),

    // Completed appointments this month (for revenue)
    supabase
      .from('appointments')
      .select('price')
      .eq('studio_id', studioId)
      .eq('status', 'completed')
      .gte('starts_at', monthStart),

    // Pending appointments
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('studio_id', studioId)
      .eq('status', 'pending'),

    // Low stock alerts: fetch all items and filter in JS (column-to-column comparison)
    supabase
      .from('inventory_items')
      .select('id, current_stock, minimum_stock')
      .eq('studio_id', studioId),
  ])

  // Calculate revenue from completed appointments
  const revenueThisMonth =
    (revenueResult.data ?? []).reduce(
      (sum: number, appt: { price: number | null }) =>
        sum + (appt.price ?? 0),
      0
    )

  // Count items where current_stock <= minimum_stock
  const inventoryItems = (stockResult.data ?? []) as {
    id: string
    current_stock: number
    minimum_stock: number
  }[]

  const lowStockCount = inventoryItems.filter(
    (item) => item.current_stock <= item.minimum_stock
  ).length

  const stats: DashboardStats = {
    appointmentsToday: todayResult.count ?? 0,
    appointmentsThisWeek: weekResult.count ?? 0,
    newClientsThisMonth: clientsResult.count ?? 0,
    revenueThisMonth,
    pendingAppointments: pendingResult.count ?? 0,
    lowStockAlerts: lowStockCount ?? 0,
  }

  return { data: stats }
}

// ---------------------------------------------------------------------------
// getTodayAppointments
// ---------------------------------------------------------------------------

export async function getTodayAppointments(): Promise<{
  data?: Appointment[]
  error?: string
}> {
  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0] as string

  let query = supabase
    .from('appointments')
    .select(APPOINTMENT_SELECT)
    .eq('studio_id', profile.studio_id)
    .gte('starts_at', `${today}T00:00:00`)
    .lt('starts_at', `${today}T23:59:59`)
    .not('status', 'eq', 'cancelled')
    .order('starts_at', { ascending: true })

  // Artists only see their own appointments
  if (profile.role === 'artist') {
    query = query.eq('artist_id', profile.id)
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message }
  }

  return { data: (data ?? []) as Appointment[] }
}

// ---------------------------------------------------------------------------
// getUpcomingAppointments
// ---------------------------------------------------------------------------

export async function getUpcomingAppointments(limit: number = 5): Promise<{
  data?: Appointment[]
  error?: string
}> {
  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()
  const now = new Date().toISOString()

  let query = supabase
    .from('appointments')
    .select(APPOINTMENT_SELECT)
    .eq('studio_id', profile.studio_id)
    .gt('starts_at', now)
    .not('status', 'in', '("cancelled","completed")')
    .order('starts_at', { ascending: true })
    .limit(limit)

  if (profile.role === 'artist') {
    query = query.eq('artist_id', profile.id)
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message }
  }

  return { data: (data ?? []) as Appointment[] }
}

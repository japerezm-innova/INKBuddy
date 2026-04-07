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

  // Use Chile timezone for all date calculations
  const TIMEZONE = 'America/Santiago'
  const now = new Date()
  const localDate = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }))
  const yyyy = localDate.getFullYear()
  const mm = String(localDate.getMonth() + 1).padStart(2, '0')
  const dd = String(localDate.getDate()).padStart(2, '0')
  const today = `${yyyy}-${mm}-${dd}`

  // Start of current week (Monday) in local timezone
  const startOfWeekDate = new Date(localDate)
  const day = startOfWeekDate.getDay()
  const diff = day === 0 ? -6 : 1 - day
  startOfWeekDate.setDate(startOfWeekDate.getDate() + diff)
  const weekStartStr = `${startOfWeekDate.getFullYear()}-${String(startOfWeekDate.getMonth() + 1).padStart(2, '0')}-${String(startOfWeekDate.getDate()).padStart(2, '0')}`
  const weekStart = `${weekStartStr}T00:00:00-04:00`

  // End of current week (Sunday)
  const endOfWeekDate = new Date(startOfWeekDate)
  endOfWeekDate.setDate(endOfWeekDate.getDate() + 6)
  const weekEndStr = `${endOfWeekDate.getFullYear()}-${String(endOfWeekDate.getMonth() + 1).padStart(2, '0')}-${String(endOfWeekDate.getDate()).padStart(2, '0')}`
  const weekEnd = `${weekEndStr}T23:59:59-04:00`

  // Start of current month in local timezone
  const monthStart = `${yyyy}-${mm}-01T00:00:00-04:00`

  // Run all count queries in parallel
  const [
    todayResult,
    weekResult,
    clientsResult,
    revenueResult,
    pendingResult,
    stockResult,
  ] = await Promise.all([
    // Appointments today (non-cancelled) — timezone-aware
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('studio_id', studioId)
      .gte('starts_at', `${today}T00:00:00-04:00`)
      .lt('starts_at', `${today}T23:59:59-04:00`)
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

    // All non-cancelled appointments this month (for revenue — counts on booking)
    supabase
      .from('appointments')
      .select('price')
      .eq('studio_id', studioId)
      .not('status', 'eq', 'cancelled')
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

  // Use Chile timezone for "today"
  const now = new Date()
  const localDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Santiago' }))
  const yyyy = localDate.getFullYear()
  const mm = String(localDate.getMonth() + 1).padStart(2, '0')
  const dd = String(localDate.getDate()).padStart(2, '0')
  const today = `${yyyy}-${mm}-${dd}`

  let query = supabase
    .from('appointments')
    .select(APPOINTMENT_SELECT)
    .eq('studio_id', profile.studio_id)
    .gte('starts_at', `${today}T00:00:00-04:00`)
    .lt('starts_at', `${today}T23:59:59-04:00`)
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

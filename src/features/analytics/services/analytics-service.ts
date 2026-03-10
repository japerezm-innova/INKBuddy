'use server'

import { createClient } from '@/lib/supabase/server'
import type { AnalyticsData, DateRange } from '../types/analytics'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getAuthenticatedStudioId(): Promise<{
  studioId: string | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { studioId: null, error: 'No autenticado' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('studio_id, role')
    .eq('id', user.id)
    .single()

  if (error || !data) {
    return { studioId: null, error: 'Perfil no encontrado' }
  }

  if (data.role !== 'owner') {
    return { studioId: null, error: 'Acceso denegado' }
  }

  return { studioId: data.studio_id as string, error: null }
}

function getDefaultDateRange(): DateRange {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return {
    from: from.toISOString().split('T')[0] as string,
    to: to.toISOString().split('T')[0] as string,
  }
}

const GENDER_LABELS: Record<string, string> = {
  male: 'Masculino',
  female: 'Femenino',
  other: 'Otro',
  prefer_not_to_say: 'Prefiere no decir',
}

const GENDER_COLORS: Record<string, string> = {
  male: '#45B7D1',
  female: '#FF6B8A',
  other: '#96CEB4',
  prefer_not_to_say: '#FFB088',
}

const SOURCE_LABELS: Record<string, string> = {
  walk_in: 'Visita directa',
  instagram: 'Instagram',
  referral: 'Referido',
  website: 'Sitio web',
  other: 'Otro',
}

const SOURCE_COLORS: Record<string, string> = {
  walk_in: '#FF6B35',
  instagram: '#FF6B8A',
  referral: '#4ECDC4',
  website: '#45B7D1',
  other: '#96CEB4',
}

// ---------------------------------------------------------------------------
// getAnalyticsData
// ---------------------------------------------------------------------------

export async function getAnalyticsData(
  dateRange?: DateRange
): Promise<{ data?: AnalyticsData; error?: string }> {
  const { studioId, error: authError } = await getAuthenticatedStudioId()
  if (authError || !studioId) return { error: authError ?? 'No autorizado' }

  const range = dateRange ?? getDefaultDateRange()
  const fromISO = `${range.from}T00:00:00`
  const toISO = `${range.to}T23:59:59`

  const supabase = await createClient()

  // Month boundaries for revenue comparison
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

  // Last 30 days for daily chart
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString()

  const [
    revenueThisMonthResult,
    revenueLastMonthResult,
    appointmentStatusResult,
    genderResult,
    sourceResult,
    professionResult,
    topServicesResult,
    revenueByArtistResult,
    appointmentsByDayResult,
  ] = await Promise.all([
    // 1. Revenue this month (completed appointments)
    supabase
      .from('appointments')
      .select('price')
      .eq('studio_id', studioId)
      .eq('status', 'completed')
      .gte('starts_at', thisMonthStart)
      .lte('starts_at', thisMonthEnd),

    // 2. Revenue last month (completed appointments)
    supabase
      .from('appointments')
      .select('price')
      .eq('studio_id', studioId)
      .eq('status', 'completed')
      .gte('starts_at', lastMonthStart)
      .lte('starts_at', lastMonthEnd),

    // 3. Appointment counts by status (in range)
    supabase
      .from('appointments')
      .select('status')
      .eq('studio_id', studioId)
      .gte('starts_at', fromISO)
      .lte('starts_at', toISO),

    // 4. Gender distribution from clients
    supabase
      .from('clients')
      .select('gender')
      .eq('studio_id', studioId),

    // 5. Source distribution from clients
    supabase
      .from('clients')
      .select('source')
      .eq('studio_id', studioId),

    // 6. Top professions (raw, top 5 aggregated in JS)
    supabase
      .from('clients')
      .select('profession')
      .eq('studio_id', studioId)
      .not('profession', 'is', null),

    // 7. Top services: appointment count per service (in range)
    supabase
      .from('appointments')
      .select('service:services!service_id(name)')
      .eq('studio_id', studioId)
      .gte('starts_at', fromISO)
      .lte('starts_at', toISO)
      .not('service_id', 'is', null),

    // 8. Revenue by artist (completed, in range)
    supabase
      .from('appointments')
      .select('price, artist:profiles!artist_id(full_name)')
      .eq('studio_id', studioId)
      .eq('status', 'completed')
      .gte('starts_at', fromISO)
      .lte('starts_at', toISO),

    // 9. Appointments per day (last 30 days)
    supabase
      .from('appointments')
      .select('starts_at')
      .eq('studio_id', studioId)
      .gte('starts_at', thirtyDaysAgoISO)
      .not('status', 'eq', 'cancelled'),
  ])

  // --- Process Revenue ---
  const revenueThisMonth = (revenueThisMonthResult.data ?? []).reduce(
    (sum: number, appt: { price: number | null }) => sum + (appt.price ?? 0),
    0
  )
  const revenueLastMonth = (revenueLastMonthResult.data ?? []).reduce(
    (sum: number, appt: { price: number | null }) => sum + (appt.price ?? 0),
    0
  )
  const revenueTrend =
    revenueLastMonth === 0
      ? revenueThisMonth > 0 ? 100 : 0
      : Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)

  // --- Process Appointment Status ---
  const apptRows = appointmentStatusResult.data ?? []
  const statusCounts = apptRows.reduce(
    (acc: Record<string, number>, row: { status: string }) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // --- Process Gender ---
  const genderRows = genderResult.data ?? []
  const genderCounts = genderRows.reduce(
    (acc: Record<string, number>, row: { gender: string | null }) => {
      const key = row.gender ?? 'prefer_not_to_say'
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
  const genderData = Object.entries(genderCounts)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      label: GENDER_LABELS[key] ?? key,
      value,
      color: GENDER_COLORS[key] ?? '#FFB088',
    }))

  // --- Process Source ---
  const sourceRows = sourceResult.data ?? []
  const sourceCounts = sourceRows.reduce(
    (acc: Record<string, number>, row: { source: string | null }) => {
      const key = row.source ?? 'other'
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
  const sourceData = Object.entries(sourceCounts)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      label: SOURCE_LABELS[key] ?? key,
      value,
      color: SOURCE_COLORS[key] ?? '#FFB088',
    }))

  // --- Process Top Professions ---
  const professionRows = professionResult.data ?? []
  const professionCounts = professionRows.reduce(
    (acc: Record<string, number>, row: { profession: string | null }) => {
      if (!row.profession) return acc
      const normalized = row.profession.trim().toLowerCase()
      if (!normalized) return acc
      // Capitalize first letter for display
      const display = normalized.charAt(0).toUpperCase() + normalized.slice(1)
      acc[display] = (acc[display] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
  const topProfessions = Object.entries(professionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([label, value]) => ({ label, value }))

  // --- Process Top Services ---
  type ServiceRow = { service: { name: string } | null }
  const serviceRows = (topServicesResult.data ?? []) as unknown as ServiceRow[]
  const serviceCounts = serviceRows.reduce(
    (acc: Record<string, number>, row: ServiceRow) => {
      const name = row.service?.name
      if (!name) return acc
      acc[name] = (acc[name] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
  const topServices = Object.entries(serviceCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  // --- Process Revenue by Artist ---
  type ArtistRow = { price: number | null; artist: { full_name: string | null } | null }
  const artistRows = (revenueByArtistResult.data ?? []) as unknown as ArtistRow[]
  const artistRevenue = artistRows.reduce(
    (acc: Record<string, number>, row: ArtistRow) => {
      const name = row.artist?.full_name ?? 'Sin nombre'
      acc[name] = (acc[name] ?? 0) + (row.price ?? 0)
      return acc
    },
    {} as Record<string, number>
  )
  const revenueByArtist = Object.entries(artistRevenue)
    .sort(([, a], [, b]) => b - a)
    .map(([name, revenue]) => ({ name, revenue }))

  // --- Process Appointments by Day ---
  const dayRows = appointmentsByDayResult.data ?? []
  const dayCounts = dayRows.reduce(
    (acc: Record<string, number>, row: { starts_at: string }) => {
      const date = row.starts_at.split('T')[0] as string
      acc[date] = (acc[date] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // Build a full 30-day array (fill missing days with 0)
  const appointmentsByDay: { date: string; count: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateKey = d.toISOString().split('T')[0] as string
    appointmentsByDay.push({ date: dateKey, count: dayCounts[dateKey] ?? 0 })
  }

  const analyticsData: AnalyticsData = {
    revenue: {
      thisMonth: revenueThisMonth,
      lastMonth: revenueLastMonth,
      trend: revenueTrend,
    },
    appointments: {
      total: apptRows.length,
      completed: statusCounts['completed'] ?? 0,
      cancelled: statusCounts['cancelled'] ?? 0,
      noShow: statusCounts['no_show'] ?? 0,
    },
    demographics: {
      gender: genderData,
      source: sourceData,
      topProfessions,
    },
    topServices,
    revenueByArtist,
    appointmentsByDay,
  }

  return { data: analyticsData }
}

'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type {
  Appointment,
  ArtistAvailability,
  CreateAppointmentInput,
  Service,
  TimeSlot,
  UpdateAppointmentInput,
} from '../types/appointment'
import type { Profile } from '@/features/auth/types/auth'
import { sendBookingEmails } from '@/features/notifications/services/notification-service'
import { _deductStockInternal } from '@/features/inventory/services/inventory-service'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const appointmentStatusSchema = z.enum([
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
])

const createAppointmentSchema = z.object({
  client_id: z.string().uuid().optional(),
  artist_id: z.string().uuid(),
  service_id: z.string().uuid().optional(),
  starts_at: z.string().datetime({ offset: true }),
  ends_at: z.string().datetime({ offset: true }),
  price: z.number().nonnegative().optional(),
  deposit: z.number().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
  client_name: z.string().min(1).max(200).optional(),
  client_phone: z.string().max(50).optional(),
  client_email: z.string().email().optional(),
  body_placement: z.string().max(200).optional(),
  design_reference_urls: z.array(z.string().url()).optional(),
  consent_accepted: z.boolean().optional(),
  consent_accepted_at: z.string().optional(),
  consent_name: z.string().max(200).optional(),
})

const updateAppointmentSchema = z.object({
  status: appointmentStatusSchema.optional(),
  starts_at: z.string().datetime({ offset: true }).optional(),
  ends_at: z.string().datetime({ offset: true }).optional(),
  price: z.number().nonnegative().optional(),
  deposit: z.number().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
  client_name: z.string().min(1).max(200).optional(),
  client_phone: z.string().max(50).optional(),
  body_placement: z.string().max(200).optional(),
})

const availabilitySlotSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  is_available: z.boolean(),
})

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
// Appointments
// ---------------------------------------------------------------------------

export interface GetAppointmentsFilters {
  artistId?: string
  status?: string
  startDate?: string
  endDate?: string
}

export async function getAppointments(
  filters?: GetAppointmentsFilters
): Promise<{ data?: Appointment[]; error?: string }> {
  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  let query = supabase
    .from('appointments')
    .select(APPOINTMENT_SELECT)
    .eq('studio_id', profile.studio_id)
    .order('starts_at', { ascending: true })

  if (filters?.artistId) {
    query = query.eq('artist_id', filters.artistId)
  }

  if (filters?.status) {
    const parsed = appointmentStatusSchema.safeParse(filters.status)
    if (parsed.success) {
      query = query.eq('status', parsed.data)
    }
  }

  if (filters?.startDate) {
    query = query.gte('starts_at', filters.startDate)
  }

  if (filters?.endDate) {
    query = query.lte('starts_at', filters.endDate)
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message }
  }

  return { data: (data ?? []) as Appointment[] }
}

export async function getAppointmentById(
  id: string
): Promise<{ data?: Appointment; error?: string }> {
  if (!id) return { error: 'ID requerido' }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('appointments')
    .select(APPOINTMENT_SELECT)
    .eq('id', id)
    .eq('studio_id', profile.studio_id)
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data: data as Appointment }
}

export async function createAppointment(
  input: CreateAppointmentInput
): Promise<{ data?: Appointment; error?: string }> {
  const parsed = createAppointmentSchema.safeParse(input)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { error: firstError?.message ?? 'Datos inválidos' }
  }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      ...parsed.data,
      studio_id: profile.studio_id,
      status: 'pending',
    })
    .select(APPOINTMENT_SELECT)
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/appointments')

  const appointment = data as Appointment

  // Send email notifications (fire-and-forget — don't block response)
  if (profile.email) {
    const supabase2 = await createClient()
    const { data: studio } = await supabase2
      .from('studios')
      .select('name')
      .eq('id', profile.studio_id)
      .single()

    sendBookingEmails(appointment, studio?.name ?? 'Tu estudio', profile.email).catch((err) => {
      console.error('[INKBuddy] Email send failed:', err)
    })
  }

  return { data: appointment }
}

export async function updateAppointment(
  id: string,
  input: UpdateAppointmentInput
): Promise<{ data?: Appointment; error?: string }> {
  if (!id) return { error: 'ID requerido' }

  const parsed = updateAppointmentSchema.safeParse(input)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { error: firstError?.message ?? 'Datos inválidos' }
  }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('appointments')
    .update({
      ...parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('studio_id', profile.studio_id)
    .select(APPOINTMENT_SELECT)
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/appointments')
  revalidatePath(`/appointments/${id}`)

  return { data: data as Appointment }
}

export async function cancelAppointment(
  id: string
): Promise<{ data?: Appointment; error?: string }> {
  return updateAppointment(id, { status: 'cancelled' })
}

export async function deleteAppointment(
  id: string
): Promise<{ error?: string }> {
  if (!id) return { error: 'ID requerido' }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id)
    .eq('studio_id', profile.studio_id)

  if (error) return { error: error.message }

  revalidatePath('/appointments')
  return {}
}

export async function completeAppointment(
  id: string
): Promise<{ data?: Appointment; error?: string }> {
  return updateAppointment(id, { status: 'completed' })
}

// ---------------------------------------------------------------------------
// Smart Inventory: Auto-complete expired confirmed appointments
// ---------------------------------------------------------------------------

export async function autoCompleteExpiredAppointments(): Promise<{
  processed: number
}> {
  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { processed: 0 }

  const supabase = await createClient()

  // Check if smart inventory is enabled for this studio
  const { data: studio } = await supabase
    .from('studios')
    .select('settings')
    .eq('id', profile.studio_id)
    .single()

  const settings = (studio?.settings ?? {}) as Record<string, unknown>
  if (!settings.smart_inventory_enabled) return { processed: 0 }

  // Find confirmed appointments past their end time
  const now = new Date().toISOString()
  const { data: expiredAppts } = await supabase
    .from('appointments')
    .select('id, service_id, artist_id')
    .eq('studio_id', profile.studio_id)
    .eq('status', 'confirmed')
    .lt('ends_at', now)

  if (!expiredAppts || expiredAppts.length === 0) return { processed: 0 }

  let processed = 0

  for (const appt of expiredAppts) {
    // Mark as completed
    await supabase
      .from('appointments')
      .update({ status: 'completed', updated_at: now })
      .eq('id', appt.id)

    // Deduct inventory if service has a recipe
    if (appt.service_id) {
      const { data: materials } = await supabase
        .from('service_materials')
        .select('item_id, quantity_per_session')
        .eq('service_id', appt.service_id)
        .eq('studio_id', profile.studio_id)

      if (materials && materials.length > 0) {
        for (const mat of materials) {
          await _deductStockInternal(
            profile.studio_id,
            mat.item_id,
            mat.quantity_per_session,
            appt.id,
            appt.artist_id ?? profile.id
          )
        }
      }
    }

    processed++
  }

  if (processed > 0) {
    revalidatePath('/appointments')
    revalidatePath('/inventory')
    revalidatePath('/dashboard')
  }

  return { processed }
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export async function getServices(): Promise<{ data?: Service[]; error?: string }> {
  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('studio_id', profile.studio_id)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    return { error: error.message }
  }

  return { data: (data ?? []) as Service[] }
}

// ---------------------------------------------------------------------------
// Artists
// ---------------------------------------------------------------------------

export async function getArtists(): Promise<{ data?: Profile[]; error?: string }> {
  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('studio_id', profile.studio_id)
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  if (error) {
    return { error: error.message }
  }

  return { data: (data ?? []) as Profile[] }
}

// ---------------------------------------------------------------------------
// Artist Availability
// ---------------------------------------------------------------------------

export async function getArtistAvailability(
  artistId: string
): Promise<{ data?: ArtistAvailability[]; error?: string }> {
  if (!artistId) return { error: 'Artist ID requerido' }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('artist_availability')
    .select('*')
    .eq('artist_id', artistId)
    .eq('studio_id', profile.studio_id)
    .order('day_of_week', { ascending: true })

  if (error) {
    return { error: error.message }
  }

  return { data: (data ?? []) as ArtistAvailability[] }
}

export async function updateArtistAvailability(
  artistId: string,
  slots: {
    day_of_week: number
    start_time: string
    end_time: string
    is_available: boolean
  }[]
): Promise<{ error?: string }> {
  if (!artistId) return { error: 'Artist ID requerido' }

  const parsedSlots = z.array(availabilitySlotSchema).safeParse(slots)

  if (!parsedSlots.success) {
    const firstError = parsedSlots.error.issues[0]
    return { error: firstError?.message ?? 'Slots inválidos' }
  }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  // Delete existing availability for this artist in this studio
  const { error: deleteError } = await supabase
    .from('artist_availability')
    .delete()
    .eq('artist_id', artistId)
    .eq('studio_id', profile.studio_id)

  if (deleteError) {
    return { error: deleteError.message }
  }

  if (parsedSlots.data.length === 0) {
    return {}
  }

  // Insert new availability slots
  const rows = parsedSlots.data.map((slot) => ({
    ...slot,
    artist_id: artistId,
    studio_id: profile.studio_id,
  }))

  const { error: insertError } = await supabase
    .from('artist_availability')
    .insert(rows)

  if (insertError) {
    return { error: insertError.message }
  }

  revalidatePath('/appointments')

  return {}
}

// ---------------------------------------------------------------------------
// Available Slots
// ---------------------------------------------------------------------------

/**
 * Parses a time string "HH:MM" or "HH:MM:SS" into total minutes from midnight.
 */
function timeToMinutes(time: string): number {
  const parts = time.split(':')
  const hours = parseInt(parts[0] ?? '0', 10)
  const minutes = parseInt(parts[1] ?? '0', 10)
  return hours * 60 + minutes
}

/**
 * Converts a total-minutes-from-midnight value back to "HH:MM" string.
 */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0')
  const m = (minutes % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

/**
 * Builds an ISO datetime string for a given date and local time string.
 * date format: "YYYY-MM-DD", time format: "HH:MM"
 */
function buildISODateTime(date: string, time: string): string {
  return `${date}T${time}:00.000Z`
}

export async function getAvailableSlots(
  artistId: string,
  date: string,
  durationMinutes: number
): Promise<{ data?: TimeSlot[]; error?: string }> {
  if (!artistId) return { error: 'Artist ID requerido' }
  if (!date) return { error: 'Fecha requerida' }
  if (durationMinutes <= 0) return { error: 'Duración inválida' }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  // 1. Determine the day of week (0 = Sunday ... 6 = Saturday)
  const dateObj = new Date(`${date}T00:00:00Z`)
  const dayOfWeek = dateObj.getUTCDay()

  // 2. Get artist availability for this day
  const { data: availabilityRows, error: availError } = await supabase
    .from('artist_availability')
    .select('*')
    .eq('artist_id', artistId)
    .eq('studio_id', profile.studio_id)
    .eq('day_of_week', dayOfWeek)
    .eq('is_available', true)

  if (availError) {
    return { error: availError.message }
  }

  if (!availabilityRows || availabilityRows.length === 0) {
    return { data: [] }
  }

  // 3. Check if date is blocked
  const { data: blockedRows, error: blockedError } = await supabase
    .from('artist_blocked_dates')
    .select('id')
    .eq('artist_id', artistId)
    .eq('studio_id', profile.studio_id)
    .eq('blocked_date', date)

  if (blockedError) {
    return { error: blockedError.message }
  }

  if (blockedRows && blockedRows.length > 0) {
    return { data: [] }
  }

  // 4. Get existing appointments for this artist on this date
  const dayStart = `${date}T00:00:00.000Z`
  const dayEnd = `${date}T23:59:59.999Z`

  const { data: existingAppointments, error: apptError } = await supabase
    .from('appointments')
    .select('starts_at, ends_at')
    .eq('artist_id', artistId)
    .eq('studio_id', profile.studio_id)
    .not('status', 'in', '("cancelled","no_show")')
    .gte('starts_at', dayStart)
    .lte('starts_at', dayEnd)

  if (apptError) {
    return { error: apptError.message }
  }

  // 5. Build busy intervals in minutes from midnight
  const busyIntervals: { start: number; end: number }[] = (
    existingAppointments ?? []
  ).map((appt) => {
    const startTime = new Date(appt.starts_at as string)
      .toISOString()
      .substring(11, 16)
    const endTime = new Date(appt.ends_at as string)
      .toISOString()
      .substring(11, 16)
    return {
      start: timeToMinutes(startTime),
      end: timeToMinutes(endTime),
    }
  })

  // 6. Generate slots from each availability window
  const slots: TimeSlot[] = []

  for (const avail of availabilityRows as ArtistAvailability[]) {
    const windowStart = timeToMinutes(avail.start_time)
    const windowEnd = timeToMinutes(avail.end_time)

    let cursor = windowStart

    while (cursor + durationMinutes <= windowEnd) {
      const slotStart = cursor
      const slotEnd = cursor + durationMinutes

      // Check if this slot overlaps with any busy interval
      const isOverlapping = busyIntervals.some(
        (busy) => slotStart < busy.end && slotEnd > busy.start
      )

      slots.push({
        start: buildISODateTime(date, minutesToTime(slotStart)),
        end: buildISODateTime(date, minutesToTime(slotEnd)),
        available: !isOverlapping,
      })

      cursor += 30 // Step in 30-minute increments
    }
  }

  return { data: slots }
}

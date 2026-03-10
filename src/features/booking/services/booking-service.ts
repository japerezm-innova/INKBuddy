'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { BookingFormData, PublicArtist, PublicService, PublicTimeSlot } from '../types/booking'

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

const bookingSchema = z.object({
  artistId: z.string().uuid('ID de artista inválido'),
  artistName: z.string().min(1),
  serviceId: z.string().uuid('ID de servicio inválido'),
  serviceName: z.string().min(1),
  serviceDurationMinutes: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  startTime: z.string().min(1, 'Hora de inicio requerida'),
  endTime: z.string().min(1, 'Hora de fin requerida'),
  clientName: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(200),
  clientEmail: z.string().email('Email inválido'),
  clientPhone: z.string().min(6, 'Teléfono inválido').max(50),
  bodyPlacement: z.string().max(200).optional().default(''),
  notes: z.string().max(2000).optional().default(''),
  designReferenceUrls: z.string().max(2000).optional().default(''),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeToMinutes(time: string): number {
  const parts = time.split(':')
  const hours = parseInt(parts[0] ?? '0', 10)
  const minutes = parseInt(parts[1] ?? '0', 10)
  return hours * 60 + minutes
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0')
  const m = (minutes % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

// ---------------------------------------------------------------------------
// Public Artists
// ---------------------------------------------------------------------------

export async function getPublicArtists(): Promise<{
  data?: PublicArtist[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, specialties, bio')
      .eq('is_active', true)
      .order('full_name', { ascending: true })

    if (error) {
      return { error: error.message }
    }

    return { data: (data ?? []) as PublicArtist[] }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error al cargar artistas' }
  }
}

// ---------------------------------------------------------------------------
// Public Services
// ---------------------------------------------------------------------------

export async function getPublicServices(): Promise<{
  data?: PublicService[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('services')
      .select('id, name, description, duration_minutes, price_min, price_max')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      return { error: error.message }
    }

    return { data: (data ?? []) as PublicService[] }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error al cargar servicios' }
  }
}

// ---------------------------------------------------------------------------
// Public Available Slots
// ---------------------------------------------------------------------------

export async function getPublicAvailableSlots(
  artistId: string,
  date: string,
  durationMinutes: number
): Promise<{ data?: PublicTimeSlot[]; error?: string }> {
  if (!artistId) return { error: 'Artist ID requerido' }
  if (!date) return { error: 'Fecha requerida' }
  if (durationMinutes <= 0) return { error: 'Duración inválida' }

  try {
    const supabase = await createClient()

    // 1. Day of week (0 = Sunday … 6 = Saturday)
    const dateObj = new Date(`${date}T00:00:00Z`)
    const dayOfWeek = dateObj.getUTCDay()

    // 2. Fetch artist availability for this day
    const { data: availabilityRows, error: availError } = await supabase
      .from('artist_availability')
      .select('start_time, end_time')
      .eq('artist_id', artistId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true)

    if (availError) {
      return { error: availError.message }
    }

    if (!availabilityRows || availabilityRows.length === 0) {
      return { data: [] }
    }

    // 3. Check blocked dates
    const { data: blockedRows, error: blockedError } = await supabase
      .from('artist_blocked_dates')
      .select('id')
      .eq('artist_id', artistId)
      .eq('blocked_date', date)

    if (blockedError) {
      return { error: blockedError.message }
    }

    if (blockedRows && blockedRows.length > 0) {
      return { data: [] }
    }

    // 4. Fetch existing appointments for this artist on this date
    const dayStart = `${date}T00:00:00.000Z`
    const dayEnd = `${date}T23:59:59.999Z`

    const { data: existingAppointments, error: apptError } = await supabase
      .from('appointments')
      .select('starts_at, ends_at')
      .eq('artist_id', artistId)
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
      const startTime = new Date(appt.starts_at as string).toISOString().substring(11, 16)
      const endTime = new Date(appt.ends_at as string).toISOString().substring(11, 16)
      return {
        start: timeToMinutes(startTime),
        end: timeToMinutes(endTime),
      }
    })

    // 6. Generate available slots from each availability window
    const slots: PublicTimeSlot[] = []

    for (const avail of availabilityRows as { start_time: string; end_time: string }[]) {
      const windowStart = timeToMinutes(avail.start_time)
      const windowEnd = timeToMinutes(avail.end_time)
      let cursor = windowStart

      while (cursor + durationMinutes <= windowEnd) {
        const slotStart = cursor
        const slotEnd = cursor + durationMinutes

        const isOverlapping = busyIntervals.some(
          (busy) => slotStart < busy.end && slotEnd > busy.start
        )

        if (!isOverlapping) {
          slots.push({
            start: minutesToTime(slotStart),
            end: minutesToTime(slotEnd),
          })
        }

        cursor += 30 // 30-minute step increments
      }
    }

    return { data: slots }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error al cargar disponibilidad' }
  }
}

// ---------------------------------------------------------------------------
// Submit Public Booking
// ---------------------------------------------------------------------------

export async function submitPublicBooking(
  data: BookingFormData
): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
  const parsed = bookingSchema.safeParse(data)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { success: false, error: firstError?.message ?? 'Datos inválidos' }
  }

  const {
    artistId,
    serviceId,
    date,
    startTime,
    endTime,
    clientName,
    clientEmail,
    clientPhone,
    bodyPlacement,
    notes,
    designReferenceUrls,
  } = parsed.data

  // Build ISO datetime strings — treat times as UTC for consistency
  const startsAt = `${date}T${startTime}:00.000Z`
  const endsAt = `${date}T${endTime}:00.000Z`

  // Parse design reference URLs from comma/newline separated string
  const referenceUrls = designReferenceUrls
    ? designReferenceUrls
        .split(/[\n,]+/)
        .map((u) => u.trim())
        .filter((u) => u.length > 0)
    : []

  try {
    const supabase = await createClient()

    // Get studio_id from the artist profile (required field on appointments table)
    const { data: artistProfile, error: artistError } = await supabase
      .from('profiles')
      .select('studio_id')
      .eq('id', artistId)
      .single()

    if (artistError || !artistProfile) {
      return { success: false, error: 'Artista no encontrado' }
    }

    const studioId = (artistProfile as { studio_id: string }).studio_id

    // Insert appointment directly with client fields embedded
    // (Public RLS policy allows creating appointments without authentication)
    const { data: appointment, error: insertError } = await supabase
      .from('appointments')
      .insert({
        studio_id: studioId,
        artist_id: artistId,
        service_id: serviceId,
        status: 'pending',
        starts_at: startsAt,
        ends_at: endsAt,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        body_placement: bodyPlacement || null,
        notes: notes || null,
        design_reference_urls: referenceUrls.length > 0 ? referenceUrls : null,
      })
      .select('id')
      .single()

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    return {
      success: true,
      appointmentId: (appointment as { id: string }).id,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al crear la reserva',
    }
  }
}

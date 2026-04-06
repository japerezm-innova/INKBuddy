'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/features/auth/types/auth'
import type { Appointment } from '@/features/appointments/types/appointment'
import { resend, FROM_EMAIL } from '@/shared/lib/resend'
import { buildOwnerNotificationEmail, buildClientConfirmationEmail } from './email-templates'
import { buildGoogleCalendarUrl } from '@/shared/lib/calendar-url'
import type {
  CreateNotificationInput,
  Notification,
  NotificationChannel,
  NotificationProvider,
  NotificationStatus,
} from '../types/notification'
import { emailProvider } from './providers/email-provider'
import { whatsappProvider } from './providers/whatsapp-provider'
import { inAppProvider } from './providers/in-app-provider'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createNotificationSchema = z.object({
  recipient_type: z.enum(['client', 'artist', 'owner']),
  recipient_id: z.string().min(1),
  channel: z.enum(['email', 'whatsapp', 'push', 'in_app']),
  template: z.enum([
    'booking_confirmation',
    'appointment_reminder',
    'appointment_cancelled',
    'appointment_completed',
    'stock_alert',
    'new_booking_request',
    'task_assigned',
  ]),
  payload: z.record(z.string(), z.unknown()),
  scheduled_for: z.string().datetime({ offset: true }).optional(),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
// Provider Registry (Strategy Pattern)
// ---------------------------------------------------------------------------

const PROVIDERS: Record<string, NotificationProvider> = {
  email: emailProvider,
  whatsapp: whatsappProvider,
  in_app: inAppProvider,
}

export function getProviderForChannel(channel: NotificationChannel): NotificationProvider {
  const provider = PROVIDERS[channel]

  if (!provider) {
    // Fallback: log-only provider for unimplemented channels (e.g. push)
    return {
      channel,
      async send(notification: Notification) {
        // Provider not implemented — silently return error
        return { success: false, error: `Provider for channel '${channel}' not implemented` }
      },
    }
  }

  return provider
}

// ---------------------------------------------------------------------------
// Dispatch (internal)
// ---------------------------------------------------------------------------

async function dispatchNotification(notification: Notification): Promise<void> {
  const supabase = await createClient()
  const provider = getProviderForChannel(notification.channel)
  const result = await provider.send(notification)

  const updatePayload = result.success
    ? { status: 'sent' as const, sent_at: new Date().toISOString(), error_message: null }
    : { status: 'failed' as const, error_message: result.error ?? 'Unknown error' }

  await supabase
    .from('notifications')
    .update(updatePayload)
    .eq('id', notification.id)
}

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

export async function createNotification(
  input: CreateNotificationInput
): Promise<{ data?: Notification; error?: string }> {
  const parsed = createNotificationSchema.safeParse(input)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { error: firstError?.message ?? 'Datos inválidos' }
  }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      studio_id: profile.studio_id,
      recipient_type: parsed.data.recipient_type,
      recipient_id: parsed.data.recipient_id,
      channel: parsed.data.channel,
      template: parsed.data.template,
      payload: parsed.data.payload,
      status: 'pending',
      scheduled_for: parsed.data.scheduled_for ?? null,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  const notification = data as Notification

  // Attempt immediate dispatch (fire-and-forget — errors are stored in DB)
  await dispatchNotification(notification)

  revalidatePath('/notifications')

  // Return the freshest version after dispatch updated status
  const { data: fresh } = await supabase
    .from('notifications')
    .select()
    .eq('id', notification.id)
    .single()

  return { data: (fresh ?? notification) as Notification }
}

export async function getNotifications(filters?: {
  channel?: NotificationChannel
  status?: NotificationStatus
}): Promise<{ data?: Notification[]; error?: string }> {
  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('studio_id', profile.studio_id)
    .order('created_at', { ascending: false })

  if (filters?.channel) {
    query = query.eq('channel', filters.channel)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message }
  }

  return { data: (data ?? []) as Notification[] }
}

export async function getInAppNotifications(): Promise<{
  data?: Notification[]
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) return { error: 'No autenticado' }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('channel', 'in_app')
    .eq('recipient_id', user.id)
    .in('status', ['pending', 'sent'])
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    return { error: error.message }
  }

  return { data: (data ?? []) as Notification[] }
}

export async function markNotificationRead(
  id: string
): Promise<{ error?: string }> {
  if (!id) return { error: 'ID requerido' }

  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('notifications')
    .update({ status: 'delivered' })
    .eq('id', id)
    .eq('recipient_id', user.id)
    .eq('channel', 'in_app')

  if (error) {
    return { error: error.message }
  }

  return {}
}

export async function markAllNotificationsRead(): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('notifications')
    .update({ status: 'delivered' })
    .eq('recipient_id', user.id)
    .eq('channel', 'in_app')
    .in('status', ['pending', 'sent'])

  if (error) {
    return { error: error.message }
  }

  return {}
}

export async function sendAppointmentReminder(
  appointmentId: string
): Promise<{ data?: Notification; error?: string }> {
  if (!appointmentId) return { error: 'Appointment ID requerido' }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { data: appt, error: apptError } = await supabase
    .from('appointments')
    .select(`
      *,
      artist:profiles!artist_id(id, full_name),
      service:services!service_id(id, name)
    `)
    .eq('id', appointmentId)
    .eq('studio_id', profile.studio_id)
    .single()

  if (apptError || !appt) {
    return { error: apptError?.message ?? 'Cita no encontrada' }
  }

  const appointment = appt as Appointment & {
    artist?: { id: string; full_name: string | null }
    service?: { id: string; name: string } | null
  }

  const recipientId = appointment.client_id ?? appointment.client_email ?? 'unknown'
  const payload: Record<string, unknown> = {
    appointment_id: appointment.id,
    client_name: appointment.client_name,
    artist_name: appointment.artist?.full_name ?? 'Tu artista',
    service_name: appointment.service?.name ?? 'Sesión de tatuaje',
    starts_at: appointment.starts_at,
    ends_at: appointment.ends_at,
  }

  return createNotification({
    recipient_type: 'client',
    recipient_id: recipientId,
    channel: 'in_app',
    template: 'appointment_reminder',
    payload,
  })
}

export async function sendBookingConfirmation(
  appointmentId: string
): Promise<{ data?: Notification; error?: string }> {
  if (!appointmentId) return { error: 'Appointment ID requerido' }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { data: appt, error: apptError } = await supabase
    .from('appointments')
    .select(`
      *,
      artist:profiles!artist_id(id, full_name),
      service:services!service_id(id, name)
    `)
    .eq('id', appointmentId)
    .eq('studio_id', profile.studio_id)
    .single()

  if (apptError || !appt) {
    return { error: apptError?.message ?? 'Cita no encontrada' }
  }

  const appointment = appt as Appointment & {
    artist?: { id: string; full_name: string | null }
    service?: { id: string; name: string } | null
  }

  const recipientId = appointment.client_id ?? appointment.client_email ?? 'unknown'
  const payload: Record<string, unknown> = {
    appointment_id: appointment.id,
    client_name: appointment.client_name,
    artist_name: appointment.artist?.full_name ?? 'Tu artista',
    service_name: appointment.service?.name ?? 'Sesión de tatuaje',
    starts_at: appointment.starts_at,
    ends_at: appointment.ends_at,
    deposit: appointment.deposit,
    price: appointment.price,
    notes: appointment.notes,
  }

  return createNotification({
    recipient_type: 'client',
    recipient_id: recipientId,
    channel: 'in_app',
    template: 'booking_confirmation',
    payload,
  })
}

// ---------------------------------------------------------------------------
// Email notifications via Resend (owner + client)
// ---------------------------------------------------------------------------

export async function sendBookingEmails(
  appointment: Appointment & {
    artist?: { id: string; full_name: string | null } | null
    service?: { id: string; name: string; duration_minutes: number } | null
  },
  studioName: string,
  ownerEmail: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return // silently skip if not configured

  const calendarUrl = buildGoogleCalendarUrl(appointment)
  const ownerEmail_ = buildOwnerNotificationEmail(appointment, studioName)
  const clientEmail = appointment.client_email
    ? buildClientConfirmationEmail(appointment, studioName, calendarUrl)
    : null

  const sends: Promise<unknown>[] = [
    resend.emails.send({
      from: FROM_EMAIL,
      to: ownerEmail,
      subject: ownerEmail_.subject,
      html: ownerEmail_.html,
    }),
  ]

  if (clientEmail && appointment.client_email) {
    sends.push(
      resend.emails.send({
        from: FROM_EMAIL,
        to: appointment.client_email,
        subject: clientEmail.subject,
        html: clientEmail.html,
      })
    )
  }

  await Promise.allSettled(sends) // don't throw — email failure shouldn't break appointment creation
}

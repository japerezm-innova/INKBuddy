'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { Client, ClientWithStats, CreateClientInput, UpdateClientInput, ClientFilter } from '../types/client'
import type { Appointment } from '@/features/appointments/types/appointment'
import type { Profile } from '@/features/auth/types/auth'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const genderSchema = z.enum(['male', 'female', 'other', 'prefer_not_to_say']).nullable().optional()

const sourceSchema = z
  .enum(['walk_in', 'instagram', 'referral', 'website', 'other'])
  .nullable()
  .optional()

const createClientSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
  email: z.string().email('Email inválido').max(200).optional(),
  phone: z.string().max(50).optional(),
  gender: genderSchema,
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)').optional(),
  profession: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  source: sourceSchema,
})

const updateClientSchema = createClientSchema.partial()

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

const APPOINTMENT_SELECT = `
  *,
  artist:profiles!artist_id(id, full_name, avatar_url),
  client:clients!client_id(id, full_name, phone),
  service:services!service_id(id, name, duration_minutes)
` as const

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

export async function getClients(
  filter?: ClientFilter
): Promise<{ data?: Client[]; error?: string }> {
  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  let query = supabase
    .from('clients')
    .select('*')
    .eq('studio_id', profile.studio_id)
    .order('full_name', { ascending: true })

  if (filter?.search) {
    const term = `%${filter.search}%`
    query = query.or(`full_name.ilike.${term},phone.ilike.${term},email.ilike.${term}`)
  }

  if (filter?.source) {
    query = query.eq('source', filter.source)
  }

  if (filter?.gender) {
    query = query.eq('gender', filter.gender)
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message }
  }

  return { data: (data ?? []) as Client[] }
}

export async function getClientById(
  id: string
): Promise<{ data?: ClientWithStats; error?: string }> {
  if (!id) return { error: 'ID requerido' }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { data: clientData, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('studio_id', profile.studio_id)
    .single()

  if (clientError || !clientData) {
    return { error: clientError?.message ?? 'Cliente no encontrado' }
  }

  const { data: appointmentsData, error: apptError } = await supabase
    .from('appointments')
    .select('id, starts_at')
    .eq('client_id', id)
    .eq('studio_id', profile.studio_id)
    .not('status', 'in', '("cancelled","no_show")')
    .order('starts_at', { ascending: false })

  if (apptError) {
    return { error: apptError.message }
  }

  const total_appointments = appointmentsData?.length ?? 0
  const last_appointment_date =
    appointmentsData && appointmentsData.length > 0
      ? (appointmentsData[0]?.starts_at as string)
      : null

  const clientWithStats: ClientWithStats = {
    ...(clientData as Client),
    total_appointments,
    last_appointment_date,
  }

  return { data: clientWithStats }
}

export async function getClientAppointments(
  clientId: string
): Promise<{ data?: Appointment[]; error?: string }> {
  if (!clientId) return { error: 'Client ID requerido' }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('appointments')
    .select(APPOINTMENT_SELECT)
    .eq('client_id', clientId)
    .eq('studio_id', profile.studio_id)
    .order('starts_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { data: (data ?? []) as Appointment[] }
}

export async function createClient_(
  input: CreateClientInput
): Promise<{ data?: Client; error?: string }> {
  const parsed = createClientSchema.safeParse(input)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { error: firstError?.message ?? 'Datos inválidos' }
  }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .insert({
      ...parsed.data,
      studio_id: profile.studio_id,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/clients')

  return { data: data as Client }
}

export async function updateClient(
  id: string,
  input: UpdateClientInput
): Promise<{ data?: Client; error?: string }> {
  if (!id) return { error: 'ID requerido' }

  const parsed = updateClientSchema.safeParse(input)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { error: firstError?.message ?? 'Datos inválidos' }
  }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .update({
      ...parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('studio_id', profile.studio_id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)

  return { data: data as Client }
}

export async function deleteClient(
  id: string
): Promise<{ error?: string }> {
  if (!id) return { error: 'ID requerido' }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  if (profile.role !== 'owner') {
    return { error: 'Solo los propietarios pueden eliminar clientes' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
    .eq('studio_id', profile.studio_id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/clients')

  return {}
}

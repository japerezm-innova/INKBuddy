'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Quote, CreateQuoteInput, UpdateQuoteInput, QuoteStatus } from '../types/quote'
import type { Profile } from '@/features/auth/types/auth'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createQuoteSchema = z.object({
  client_name: z.string().min(1).max(200),
  client_phone: z.string().max(50).optional(),
  client_email: z.string().email().optional().or(z.literal('')),
  client_id: z.string().uuid().optional(),
  studio_id: z.string().uuid().optional(),
  title: z.string().max(200).optional(),
  design_description: z.string().max(2000).optional(),
  body_placement: z.string().max(200).optional(),
  style: z.string().max(100).optional(),
  size_cm: z.string().max(50).optional(),
  session_count: z.number().int().min(1).optional(),
  estimated_price: z.number().nonnegative().optional(),
  deposit_amount: z.number().nonnegative().optional(),
  price_notes: z.string().max(500).optional(),
  valid_until: z.string().optional(),
  notes: z.string().max(2000).optional(),
  whatsapp_reminders_enabled: z.boolean().optional(),
  whatsapp_reminder_hours: z.array(z.number().int().positive()).optional(),
})

const updateQuoteSchema = createQuoteSchema.partial().extend({
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']).optional(),
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

function buildQuoteNumber(id: string): string {
  const now = new Date()
  const yy = String(now.getUTCFullYear()).slice(2)
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(now.getUTCDate()).padStart(2, '0')
  const suffix = id.slice(0, 4).toUpperCase()
  return `COT-${yy}${mm}${dd}-${suffix}`
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function createQuote(
  input: CreateQuoteInput
): Promise<{ data?: Quote; error?: string }> {
  const parsed = createQuoteSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  // Insert with placeholder quote_number (will update after we have the id)
  const { data, error } = await supabase
    .from('quotes')
    .insert({
      ...parsed.data,
      studio_id: parsed.data.studio_id ?? profile.studio_id,
      created_by: profile.id,
      quote_number: 'COT-TEMP',
      title: parsed.data.title ?? 'Cotización de Tatuaje',
      session_count: parsed.data.session_count ?? 1,
      whatsapp_reminders_enabled: parsed.data.whatsapp_reminders_enabled ?? false,
      whatsapp_reminder_hours: parsed.data.whatsapp_reminder_hours ?? [24],
    })
    .select('*')
    .single()

  if (error) return { error: error.message }

  const quote = data as Quote

  // Update with real quote_number
  const quoteNumber = buildQuoteNumber(quote.id)
  const { data: updated, error: updateError } = await supabase
    .from('quotes')
    .update({ quote_number: quoteNumber })
    .eq('id', quote.id)
    .select('*')
    .single()

  if (updateError) return { error: updateError.message }

  revalidatePath('/quotes')
  return { data: updated as Quote }
}

export async function updateQuote(
  id: string,
  input: UpdateQuoteInput
): Promise<{ data?: Quote; error?: string }> {
  if (!id) return { error: 'ID requerido' }

  const parsed = updateQuoteSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('quotes')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('studio_id', profile.studio_id)
    .select('*')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/quotes')
  revalidatePath(`/quotes/${id}`)
  return { data: data as Quote }
}

export async function updateQuoteStatus(
  id: string,
  status: QuoteStatus
): Promise<{ data?: Quote; error?: string }> {
  return updateQuote(id, { status })
}

export async function deleteQuote(
  id: string
): Promise<{ error?: string }> {
  if (!id) return { error: 'ID requerido' }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', id)
    .eq('studio_id', profile.studio_id)

  if (error) return { error: error.message }

  revalidatePath('/quotes')
  return {}
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export interface GetQuotesFilters {
  status?: QuoteStatus
}

export async function getQuotes(
  filters?: GetQuotesFilters
): Promise<{ data?: Quote[]; error?: string }> {
  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  let query = supabase
    .from('quotes')
    .select('*')
    .eq('studio_id', profile.studio_id)
    .order('created_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query
  if (error) return { error: error.message }
  return { data: (data ?? []) as Quote[] }
}

export async function getQuoteById(
  id: string
): Promise<{ data?: Quote; error?: string }> {
  if (!id) return { error: 'ID requerido' }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .eq('studio_id', profile.studio_id)
    .single()

  if (error) return { error: error.message }
  return { data: data as Quote }
}

export async function getQuotePublic(
  id: string
): Promise<{ data?: Quote; error?: string }> {
  if (!id) return { error: 'ID requerido' }

  // Use anon client — no auth required for public quote view
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return { error: error.message }
  return { data: data as Quote }
}

export async function getStudioName(
  studioId: string
): Promise<string> {
  if (!studioId) return 'INKBuddy Studio'

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data } = await supabase
    .from('studios')
    .select('name')
    .eq('id', studioId)
    .single()

  return (data as { name: string } | null)?.name ?? 'INKBuddy Studio'
}

/**
 * Public action — no auth required.
 * Allows a client to accept or reject a 'sent' quote via the public link.
 */
export async function respondToQuotePublic(
  id: string,
  status: 'accepted' | 'rejected'
): Promise<{ data?: Quote; error?: string }> {
  if (!id) return { error: 'ID requerido' }

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('quotes')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'sent')
    .select('*')
    .single()

  if (error) return { error: error.message }
  return { data: data as Quote }
}

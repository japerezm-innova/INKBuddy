'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { HashtagCollection, CreateHashtagCollectionInput } from '../types/marketing'
import { PRESET_HASHTAG_SETS } from '../constants/tattoo-marketing'

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

async function getAuthenticatedStudioId(): Promise<{
  studioId: string | null
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { studioId: null, error: 'No autenticado' }
  const { data, error } = await supabase
    .from('profiles')
    .select('studio_id, role')
    .eq('id', user.id)
    .single()
  if (error || !data) return { studioId: null, error: 'Perfil no encontrado' }
  return { studioId: data.studio_id as string, error: null }
}

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const createHashtagCollectionSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  hashtags: z.array(z.string()).min(1, 'Se requiere al menos un hashtag'),
  category: z.string().optional(),
})

const updateHashtagCollectionSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional(),
  hashtags: z.array(z.string()).min(1, 'Se requiere al menos un hashtag').optional(),
  category: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

export async function getHashtagCollections(): Promise<{
  data?: HashtagCollection[]
  error?: string
}> {
  const { studioId, error: authError } = await getAuthenticatedStudioId()
  if (authError || !studioId) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hashtag_collections')
    .select('*')
    .eq('studio_id', studioId)
    .order('is_preset', { ascending: false })
    .order('usage_count', { ascending: false })

  if (error) return { error: error.message }
  return { data: data as HashtagCollection[] }
}

export async function createHashtagCollection(
  input: CreateHashtagCollectionInput
): Promise<{ data?: HashtagCollection; error?: string }> {
  const { studioId, error: authError } = await getAuthenticatedStudioId()
  if (authError || !studioId) return { error: authError ?? 'No autenticado' }

  const parsed = createHashtagCollectionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hashtag_collections')
    .insert({
      studio_id: studioId,
      name: parsed.data.name,
      hashtags: parsed.data.hashtags,
      category: parsed.data.category ?? null,
      is_preset: false,
      usage_count: 0,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/marketing/hashtags')
  return { data: data as HashtagCollection }
}

export async function updateHashtagCollection(
  id: string,
  input: Partial<CreateHashtagCollectionInput>
): Promise<{ data?: HashtagCollection; error?: string }> {
  const { studioId, error: authError } = await getAuthenticatedStudioId()
  if (authError || !studioId) return { error: authError ?? 'No autenticado' }

  const parsed = updateHashtagCollectionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hashtag_collections')
    .update(parsed.data)
    .eq('id', id)
    .eq('studio_id', studioId)
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/marketing/hashtags')
  return { data: data as HashtagCollection }
}

export async function deleteHashtagCollection(
  id: string
): Promise<{ error?: string }> {
  const { studioId, error: authError } = await getAuthenticatedStudioId()
  if (authError || !studioId) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('hashtag_collections')
    .delete()
    .eq('id', id)
    .eq('studio_id', studioId)
    .eq('is_preset', false)

  if (error) return { error: error.message }

  revalidatePath('/marketing/hashtags')
  return {}
}

export async function incrementUsageCount(
  id: string
): Promise<{ error?: string }> {
  const { studioId, error: authError } = await getAuthenticatedStudioId()
  if (authError || !studioId) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  // Fetch current count first, then increment (idempotent-safe pattern)
  const { data: current, error: fetchError } = await supabase
    .from('hashtag_collections')
    .select('usage_count')
    .eq('id', id)
    .eq('studio_id', studioId)
    .single()

  if (fetchError || !current) return { error: fetchError?.message ?? 'Coleccion no encontrada' }

  const { error } = await supabase
    .from('hashtag_collections')
    .update({ usage_count: (current.usage_count as number) + 1 })
    .eq('id', id)
    .eq('studio_id', studioId)

  if (error) return { error: error.message }
  return {}
}

export async function seedPresetHashtags(): Promise<{
  data?: { seeded: boolean; count: number }
  error?: string
}> {
  const { studioId, error: authError } = await getAuthenticatedStudioId()
  if (authError || !studioId) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  // Check if any preset rows already exist for this studio (idempotent guard)
  const { data: existing, error: checkError } = await supabase
    .from('hashtag_collections')
    .select('id')
    .eq('studio_id', studioId)
    .eq('is_preset', true)
    .limit(1)

  if (checkError) return { error: checkError.message }
  if (existing && existing.length > 0) {
    return { data: { seeded: false, count: 0 } }
  }

  const rows = PRESET_HASHTAG_SETS.map((preset) => ({
    studio_id: studioId,
    name: preset.name,
    hashtags: preset.hashtags,
    category: preset.category,
    is_preset: true,
    usage_count: 0,
  }))

  const { error: insertError } = await supabase
    .from('hashtag_collections')
    .insert(rows)

  if (insertError) return { error: insertError.message }

  revalidatePath('/marketing/hashtags')
  return { data: { seeded: true, count: rows.length } }
}

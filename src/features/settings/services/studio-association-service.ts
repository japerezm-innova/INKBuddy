'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface StudioItem {
  id: string
  name: string
  is_primary: boolean
}

async function getAuthenticatedUserId(): Promise<{ userId: string | null; error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return { userId: null, error: 'No autenticado' }
  return { userId: user.id, error: null }
}

export async function getMyStudios(): Promise<{ data?: StudioItem[]; error?: string }> {
  const { userId, error: authError } = await getAuthenticatedUserId()
  if (authError || !userId) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('artist_studios')
    .select('is_primary, studios(id, name)')
    .eq('artist_id', userId)
    .order('is_primary', { ascending: false })

  if (error) return { error: error.message }

  const studios: StudioItem[] = (data ?? []).map((row) => {
    const studio = row.studios as unknown as { id: string; name: string }
    return {
      id: studio.id,
      name: studio.name,
      is_primary: row.is_primary,
    }
  })

  return { data: studios }
}

export async function addStudioAssociation(
  studioId: string
): Promise<{ error?: string }> {
  const { userId, error: authError } = await getAuthenticatedUserId()
  if (authError || !userId) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('artist_studios')
    .insert({ artist_id: userId, studio_id: studioId, is_primary: false })

  if (error) return { error: error.message }

  revalidatePath('/settings')
  return {}
}

export async function removeStudioAssociation(
  studioId: string
): Promise<{ error?: string }> {
  const { userId, error: authError } = await getAuthenticatedUserId()
  if (authError || !userId) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  // Don't allow removing if it's the only studio
  const { data: existing } = await supabase
    .from('artist_studios')
    .select('id')
    .eq('artist_id', userId)

  if ((existing ?? []).length <= 1) {
    return { error: 'No puedes eliminar tu único estudio asociado' }
  }

  const { error } = await supabase
    .from('artist_studios')
    .delete()
    .eq('artist_id', userId)
    .eq('studio_id', studioId)

  if (error) return { error: error.message }

  revalidatePath('/settings')
  return {}
}

export async function setPrimaryStudio(
  studioId: string
): Promise<{ error?: string }> {
  const { userId, error: authError } = await getAuthenticatedUserId()
  if (authError || !userId) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  // Set all to false, then set the target to true
  await supabase
    .from('artist_studios')
    .update({ is_primary: false })
    .eq('artist_id', userId)

  const { error: primaryError } = await supabase
    .from('artist_studios')
    .update({ is_primary: true })
    .eq('artist_id', userId)
    .eq('studio_id', studioId)

  if (primaryError) return { error: primaryError.message }

  // Update profile.studio_id to the new primary studio
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ studio_id: studioId, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (profileError) return { error: profileError.message }

  revalidatePath('/settings')
  revalidatePath('/quotes')
  return {}
}

export async function searchStudios(
  query: string
): Promise<{ data?: StudioItem[]; error?: string }> {
  if (!query.trim()) return { data: [] }

  const { userId, error: authError } = await getAuthenticatedUserId()
  if (authError || !userId) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('studios')
    .select('id, name')
    .ilike('name', `%${query}%`)
    .limit(8)

  if (error) return { error: error.message }

  return {
    data: (data ?? []).map((s) => ({ id: s.id, name: s.name, is_primary: false })),
  }
}

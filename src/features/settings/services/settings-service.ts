'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { StudioSettings } from '../types/settings'
import { DEFAULT_STUDIO_SETTINGS } from '../types/settings'

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
  if (data.role !== 'owner') return { studioId: null, error: 'Acceso denegado' }

  return { studioId: data.studio_id as string, error: null }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const platformsSchema = z.object({
  instagram: z.boolean(),
  tiktok: z.boolean(),
  facebook: z.boolean(),
})

const studioSettingsSchema = z.object({
  platforms: platformsSchema,
})

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

export async function getStudioSettings(): Promise<{
  data?: StudioSettings
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'No autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('studio_id')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Perfil no encontrado' }

  const { data, error } = await supabase
    .from('studios')
    .select('settings')
    .eq('id', profile.studio_id)
    .single()

  if (error) return { error: error.message }

  const rawSettings = (data?.settings ?? {}) as Partial<StudioSettings>
  const mergedSettings: StudioSettings = {
    ...DEFAULT_STUDIO_SETTINGS,
    ...rawSettings,
    platforms: {
      ...DEFAULT_STUDIO_SETTINGS.platforms,
      ...(rawSettings.platforms ?? {}),
    },
  }

  return { data: mergedSettings }
}

export async function getCalendarToken(): Promise<{
  data?: string
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'No autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('studio_id')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Perfil no encontrado' }

  const { data, error } = await supabase
    .from('studios')
    .select('calendar_token')
    .eq('id', profile.studio_id)
    .single()

  if (error) return { error: error.message }
  return { data: data?.calendar_token as string }
}

export async function regenerateCalendarToken(): Promise<{
  data?: string
  error?: string
}> {
  const { studioId, error: authError } = await getAuthenticatedStudioId()
  if (authError || !studioId) return { error: authError ?? 'No autorizado' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('studios')
    .update({
      calendar_token: crypto.randomUUID(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', studioId)
    .select('calendar_token')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { data: data?.calendar_token as string }
}

export async function updateStudioSettings(
  settings: StudioSettings
): Promise<{ data?: StudioSettings; error?: string }> {
  const { studioId, error: authError } = await getAuthenticatedStudioId()
  if (authError || !studioId) return { error: authError ?? 'No autorizado' }

  const parsed = studioSettingsSchema.safeParse(settings)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('studios')
    .update({
      settings: parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', studioId)
    .select('settings')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/settings')
  revalidatePath('/marketing')
  return { data: data.settings as StudioSettings }
}

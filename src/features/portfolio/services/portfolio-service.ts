'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/features/auth/types/auth'
import type {
  PortfolioItem,
  CreatePortfolioInput,
  PortfolioFilter,
} from '../types/portfolio'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createPortfolioSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  image_url: z.string().url('La URL de la imagen no es válida'),
  style: z.string().max(100).optional(),
  body_placement: z.string().max(200).optional(),
  is_available_design: z.boolean().optional(),
  is_public: z.boolean().optional(),
})

const updatePortfolioSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  image_url: z.string().url('La URL de la imagen no es válida').optional(),
  style: z.string().max(100).optional(),
  body_placement: z.string().max(200).optional(),
  is_available_design: z.boolean().optional(),
  is_public: z.boolean().optional(),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PORTFOLIO_SELECT = `
  *,
  artist:profiles!artist_id(id, full_name, avatar_url)
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
// Public queries (no auth required)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Public portfolio by studio slug (for shareable URLs)
// ---------------------------------------------------------------------------

export interface PublicArtistProfile {
  studioName: string
  studioSlug: string
  artistName: string | null
  artistBio: string | null
  artistAvatar: string | null
}

export async function getPublicPortfolioBySlug(slug: string): Promise<{
  data?: PortfolioItem[]
  artist?: PublicArtistProfile
  error?: string
}> {
  if (!slug) return { error: 'Slug requerido' }

  const supabase = await createClient()

  // Get studio by slug
  const { data: studio, error: studioError } = await supabase
    .from('studios')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  if (studioError || !studio) return { error: 'Portafolio no encontrado' }

  // Get studio owner (first owner profile)
  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('full_name, bio, avatar_url')
    .eq('studio_id', studio.id)
    .eq('role', 'owner')
    .single()

  // Get public portfolio items for this studio
  const { data: items, error: itemsError } = await supabase
    .from('portfolio_items')
    .select('*, artist:profiles!artist_id(id, full_name, avatar_url)')
    .eq('studio_id', studio.id)
    .eq('is_public', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (itemsError) return { error: itemsError.message }

  return {
    data: (items ?? []) as PortfolioItem[],
    artist: {
      studioName: studio.name,
      studioSlug: studio.slug,
      artistName: ownerProfile?.full_name ?? null,
      artistBio: ownerProfile?.bio ?? null,
      artistAvatar: ownerProfile?.avatar_url ?? null,
    },
  }
}

export async function getPublicPortfolio(
  filter?: PortfolioFilter
): Promise<{ data?: PortfolioItem[]; error?: string }> {
  const supabase = await createClient()

  let query = supabase
    .from('portfolio_items')
    .select(PORTFOLIO_SELECT)
    .eq('is_public', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (filter?.style) {
    query = query.eq('style', filter.style)
  }

  if (filter?.artistId) {
    query = query.eq('artist_id', filter.artistId)
  }

  if (filter?.availableOnly) {
    query = query.eq('is_available_design', true)
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message }
  }

  return { data: (data ?? []) as PortfolioItem[] }
}

// ---------------------------------------------------------------------------
// Authenticated queries
// ---------------------------------------------------------------------------

export async function getPortfolioItems(
  filter?: PortfolioFilter
): Promise<{ data?: PortfolioItem[]; error?: string }> {
  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  let query = supabase
    .from('portfolio_items')
    .select(PORTFOLIO_SELECT)
    .eq('studio_id', profile.studio_id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (filter?.style) {
    query = query.eq('style', filter.style)
  }

  if (filter?.artistId) {
    query = query.eq('artist_id', filter.artistId)
  }

  if (filter?.availableOnly) {
    query = query.eq('is_available_design', true)
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message }
  }

  return { data: (data ?? []) as PortfolioItem[] }
}

export async function getPortfolioById(
  id: string
): Promise<{ data?: PortfolioItem; error?: string }> {
  if (!id) return { error: 'ID requerido' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('portfolio_items')
    .select(PORTFOLIO_SELECT)
    .eq('id', id)
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data: data as PortfolioItem }
}

export async function createPortfolioItem(
  input: CreatePortfolioInput
): Promise<{ data?: PortfolioItem; error?: string }> {
  const parsed = createPortfolioSchema.safeParse(input)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { error: firstError?.message ?? 'Datos inválidos' }
  }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  // Determine next sort_order
  const { count } = await supabase
    .from('portfolio_items')
    .select('id', { count: 'exact', head: true })
    .eq('studio_id', profile.studio_id)

  const sortOrder = (count ?? 0) + 1

  const { data, error } = await supabase
    .from('portfolio_items')
    .insert({
      ...parsed.data,
      studio_id: profile.studio_id,
      artist_id: profile.id,
      sort_order: sortOrder,
      is_available_design: parsed.data.is_available_design ?? false,
      is_public: parsed.data.is_public ?? true,
    })
    .select(PORTFOLIO_SELECT)
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/portfolio')
  revalidatePath('/(main)/portfolio/manage')

  return { data: data as PortfolioItem }
}

export async function updatePortfolioItem(
  id: string,
  input: Partial<CreatePortfolioInput>
): Promise<{ data?: PortfolioItem; error?: string }> {
  if (!id) return { error: 'ID requerido' }

  const parsed = updatePortfolioSchema.safeParse(input)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { error: firstError?.message ?? 'Datos inválidos' }
  }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('portfolio_items')
    .update(parsed.data)
    .eq('id', id)
    .eq('studio_id', profile.studio_id)
    .select(PORTFOLIO_SELECT)
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/portfolio')
  revalidatePath('/(main)/portfolio/manage')

  return { data: data as PortfolioItem }
}

export async function deletePortfolioItem(
  id: string
): Promise<{ error?: string }> {
  if (!id) return { error: 'ID requerido' }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('portfolio_items')
    .delete()
    .eq('id', id)
    .eq('studio_id', profile.studio_id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/portfolio')
  revalidatePath('/(main)/portfolio/manage')

  return {}
}

export async function getPortfolioStyles(): Promise<{
  data?: string[]
  error?: string
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('portfolio_items')
    .select('style')
    .eq('is_public', true)
    .not('style', 'is', null)

  if (error) {
    return { error: error.message }
  }

  const styles = [
    ...new Set(
      (data ?? [])
        .map((row) => row.style as string | null)
        .filter((s): s is string => s !== null && s.trim() !== '')
    ),
  ].sort()

  return { data: styles }
}

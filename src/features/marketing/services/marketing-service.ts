'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  SocialAccount,
  CreateAccountInput,
  SocialPost,
  CreatePostInput,
  PostMetrics,
  CreateMetricsInput,
  AccountSnapshot,
  CreateSnapshotInput,
  MarketingDashboardData,
  CalendarPost,
} from '../types/marketing'

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

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const createAccountSchema = z.object({
  platform: z.enum(['instagram', 'tiktok']),
  username: z.string().min(1, 'Username requerido'),
  profile_url: z.string().url().optional(),
  followers_count: z.number().int().min(0).optional(),
  following_count: z.number().int().min(0).optional(),
  posts_count: z.number().int().min(0).optional(),
  bio: z.string().optional(),
  is_business_account: z.boolean().optional(),
})

const createPostSchema = z.object({
  account_id: z.string().uuid().optional(),
  portfolio_item_id: z.string().uuid().optional(),
  post_type: z.enum(['image', 'carousel', 'reel', 'story', 'tiktok_video']),
  caption: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  scheduled_for: z.string().datetime().optional(),
  status: z.enum(['idea', 'draft', 'scheduled', 'posted', 'archived']).optional(),
  external_url: z.string().url().optional(),
  image_url: z.string().url().optional(),
  content_notes: z.string().optional(),
})

const createMetricsSchema = z.object({
  post_id: z.string().uuid(),
  likes: z.number().int().min(0).default(0),
  comments: z.number().int().min(0).default(0),
  saves: z.number().int().min(0).default(0),
  shares: z.number().int().min(0).default(0),
  reach: z.number().int().min(0).default(0),
  impressions: z.number().int().min(0).default(0),
})

const createSnapshotSchema = z.object({
  account_id: z.string().uuid(),
  followers_count: z.number().int().min(0),
  following_count: z.number().int().min(0).optional(),
  posts_count: z.number().int().min(0).optional(),
  avg_engagement_rate: z.number().min(0).optional(),
  profile_visits: z.number().int().min(0).optional(),
  website_clicks: z.number().int().min(0).optional(),
})

// ---------------------------------------------------------------------------
// Social Accounts
// ---------------------------------------------------------------------------

export async function getSocialAccounts(): Promise<{
  data?: SocialAccount[]
  error?: string
}> {
  const { studioId, error: authError } = await getAuthenticatedStudioId()
  if (authError || !studioId) return { error: authError ?? 'No autorizado' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('studio_id', studioId)
    .order('platform')
    .order('created_at')

  if (error) return { error: error.message }
  return { data: data as SocialAccount[] }
}

export async function createSocialAccount(
  input: CreateAccountInput
): Promise<{ data?: SocialAccount; error?: string }> {
  const { studioId, error: authError } = await getAuthenticatedStudioId()
  if (authError || !studioId) return { error: authError ?? 'No autorizado' }

  const parsed = createAccountSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('social_accounts')
    .insert({ ...parsed.data, studio_id: studioId })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/marketing')
  return { data: data as SocialAccount }
}

export async function updateSocialAccount(
  id: string,
  input: Partial<CreateAccountInput>
): Promise<{ data?: SocialAccount; error?: string }> {
  const { studioId, error: authError } = await getAuthenticatedStudioId()
  if (authError || !studioId) return { error: authError ?? 'No autorizado' }

  const parsed = createAccountSchema.partial().safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('social_accounts')
    .update(parsed.data)
    .eq('id', id)
    .eq('studio_id', studioId)
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/marketing')
  return { data: data as SocialAccount }
}

export async function deleteSocialAccount(
  id: string
): Promise<{ error?: string }> {
  const { studioId, error: authError } = await getAuthenticatedStudioId()
  if (authError || !studioId) return { error: authError ?? 'No autorizado' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('social_accounts')
    .delete()
    .eq('id', id)
    .eq('studio_id', studioId)

  if (error) return { error: error.message }

  revalidatePath('/marketing')
  return {}
}

// ---------------------------------------------------------------------------
// Social Posts
// ---------------------------------------------------------------------------

export async function getSocialPosts(filter?: {
  status?: string
  accountId?: string
}): Promise<{ data?: SocialPost[]; error?: string }> {
  const { studioId, error: authError } = await getAuthenticatedStudioId()
  if (authError || !studioId) return { error: authError ?? 'No autorizado' }

  const supabase = await createClient()
  let query = supabase
    .from('social_posts')
    .select('*, account:social_accounts(*), portfolio_item:portfolio_items(id, title, image_url, style)')
    .eq('studio_id', studioId)

  if (filter?.status) query = query.eq('status', filter.status)
  if (filter?.accountId) query = query.eq('account_id', filter.accountId)

  const { data, error } = await query
    .order('scheduled_for', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { data: data as unknown as SocialPost[] }
}

export async function createSocialPost(
  input: CreatePostInput
): Promise<{ data?: SocialPost; error?: string }> {
  const { studioId, error: authError } = await getAuthenticatedStudioId()
  if (authError || !studioId) return { error: authError ?? 'No autorizado' }

  const parsed = createPostSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('social_posts')
    .insert({ ...parsed.data, studio_id: studioId })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/marketing')
  return { data: data as SocialPost }
}

export async function updateSocialPost(
  id: string,
  input: Partial<CreatePostInput>
): Promise<{ data?: SocialPost; error?: string }> {
  const { studioId, error: authError } = await getAuthenticatedStudioId()
  if (authError || !studioId) return { error: authError ?? 'No autorizado' }

  const parsed = createPostSchema.partial().safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('social_posts')
    .update(parsed.data)
    .eq('id', id)
    .eq('studio_id', studioId)
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/marketing')
  return { data: data as SocialPost }
}

export async function deleteSocialPost(id: string): Promise<{ error?: string }> {
  const { studioId, error: authError } = await getAuthenticatedStudioId()
  if (authError || !studioId) return { error: authError ?? 'No autorizado' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('social_posts')
    .delete()
    .eq('id', id)
    .eq('studio_id', studioId)

  if (error) return { error: error.message }

  revalidatePath('/marketing')
  return {}
}

// ---------------------------------------------------------------------------
// Post Metrics
// ---------------------------------------------------------------------------

export async function recordPostMetrics(
  input: CreateMetricsInput
): Promise<{ data?: PostMetrics; error?: string }> {
  const { error: authError } = await getAuthenticatedStudioId()
  if (authError) return { error: authError }

  const parsed = createMetricsSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const total = parsed.data.likes + parsed.data.comments + parsed.data.saves + parsed.data.shares
  const engagement_rate =
    parsed.data.reach > 0 ? Math.round((total / parsed.data.reach) * 10000) / 100 : 0

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('social_post_metrics')
    .insert({ ...parsed.data, engagement_rate, measured_at: new Date().toISOString() })
    .select()
    .single()

  if (error) return { error: error.message }
  return { data: data as PostMetrics }
}

export async function getPostMetrics(
  postId: string
): Promise<{ data?: PostMetrics[]; error?: string }> {
  const { error: authError } = await getAuthenticatedStudioId()
  if (authError) return { error: authError }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('social_post_metrics')
    .select('*')
    .eq('post_id', postId)
    .order('measured_at', { ascending: false })

  if (error) return { error: error.message }
  return { data: data as PostMetrics[] }
}

// ---------------------------------------------------------------------------
// Account Snapshots
// ---------------------------------------------------------------------------

export async function recordAccountSnapshot(
  input: CreateSnapshotInput
): Promise<{ data?: AccountSnapshot; error?: string }> {
  const { error: authError } = await getAuthenticatedStudioId()
  if (authError) return { error: authError }

  const parsed = createSnapshotSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const measuredAtDate = new Date().toISOString().split('T')[0]

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('social_account_snapshots')
    .upsert(
      { ...parsed.data, measured_at: measuredAtDate },
      { onConflict: 'account_id,measured_at' }
    )
    .select()
    .single()

  if (error) return { error: error.message }
  return { data: data as AccountSnapshot }
}

export async function getAccountSnapshots(
  accountId: string,
  days = 30
): Promise<{ data?: AccountSnapshot[]; error?: string }> {
  const { error: authError } = await getAuthenticatedStudioId()
  if (authError) return { error: authError }

  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceDate = since.toISOString().split('T')[0] as string

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('social_account_snapshots')
    .select('*')
    .eq('account_id', accountId)
    .gte('measured_at', sinceDate)
    .order('measured_at', { ascending: true })

  if (error) return { error: error.message }
  return { data: data as AccountSnapshot[] }
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function getMarketingDashboardData(): Promise<{
  data?: MarketingDashboardData
  error?: string
}> {
  const { studioId, error: authError } = await getAuthenticatedStudioId()
  if (authError || !studioId) return { error: authError ?? 'No autorizado' }

  const supabase = await createClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoDate = thirtyDaysAgo.toISOString().split('T')[0] as string

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const oneWeekAgoISO = oneWeekAgo.toISOString()

  const nowISO = new Date().toISOString()

  // First get account IDs for snapshot query
  const { data: accountRows } = await supabase
    .from('social_accounts')
    .select('id')
    .eq('studio_id', studioId)

  const accountIds = (accountRows ?? []).map((a) => a.id as string)

  const [
    accountsResult,
    recentPostsResult,
    snapshotsResult,
    postsThisWeekResult,
    upcomingResult,
    unpublishedResult,
  ] = await Promise.all([
    // 1. All accounts
    supabase.from('social_accounts').select('*').eq('studio_id', studioId),

    // 2. Recent posted posts (last 10)
    supabase
      .from('social_posts')
      .select('*, account:social_accounts(*)')
      .eq('studio_id', studioId)
      .eq('status', 'posted')
      .order('posted_at', { ascending: false })
      .limit(10),

    // 3. Snapshots for last 30 days (all accounts)
    accountIds.length > 0
      ? supabase
          .from('social_account_snapshots')
          .select('*, account:social_accounts(platform)')
          .in('account_id', accountIds)
          .gte('measured_at', thirtyDaysAgoDate)
          .order('measured_at', { ascending: true })
      : Promise.resolve({ data: [], error: null }),

    // 4. Posts created this week
    supabase
      .from('social_posts')
      .select('id')
      .eq('studio_id', studioId)
      .gte('created_at', oneWeekAgoISO),

    // 5. Upcoming scheduled posts
    supabase
      .from('social_posts')
      .select('*, account:social_accounts(*)')
      .eq('studio_id', studioId)
      .eq('status', 'scheduled')
      .gt('scheduled_for', nowISO)
      .order('scheduled_for', { ascending: true }),

    // 6. Unpublished portfolio items
    supabase
      .from('portfolio_items')
      .select('id, title, image_url, style, created_at')
      .eq('studio_id', studioId),
  ])

  type SnapshotRow = {
    account_id: string
    followers_count: number
    avg_engagement_rate: number
    measured_at: string
    account: { platform: string } | null
  }

  const snapshots = (snapshotsResult.data ?? []) as unknown as SnapshotRow[]

  const followerGrowth = snapshots.map((s) => ({
    date: s.measured_at,
    followers: s.followers_count,
    platform: (s.account?.platform ?? 'instagram') as 'instagram' | 'tiktok',
  }))

  // Average engagement per day across all accounts
  const engagementByDate = snapshots.reduce(
    (acc: Record<string, { total: number; count: number }>, s) => {
      const key = s.measured_at
      if (!acc[key]) acc[key] = { total: 0, count: 0 }
      acc[key]!.total += s.avg_engagement_rate ?? 0
      acc[key]!.count += 1
      return acc
    },
    {}
  )
  const engagementOverTime = Object.entries(engagementByDate).map(([date, val]) => ({
    date,
    rate: val.count > 0 ? Math.round((val.total / val.count) * 100) / 100 : 0,
  }))

  const accounts = (accountsResult.data ?? []) as SocialAccount[]
  const totalFollowers = accounts.reduce((sum, a) => sum + (a.followers_count ?? 0), 0)
  const avgEngagement =
    accounts.length > 0
      ? Math.round(
          (snapshots
            .filter((s) => s.measured_at === snapshots[snapshots.length - 1]?.measured_at)
            .reduce((sum, s) => sum + (s.avg_engagement_rate ?? 0), 0) /
            accounts.length) *
            100
        ) / 100
      : 0

  return {
    data: {
      accounts,
      recentPosts: (recentPostsResult.data ?? []) as unknown as SocialPost[],
      followerGrowth,
      engagementOverTime,
      upcomingScheduled: (upcomingResult.data ?? []) as unknown as SocialPost[],
      unpublishedPortfolio: (unpublishedResult.data ?? []) as {
        id: string
        title: string | null
        image_url: string
        style: string | null
        created_at: string
      }[],
      totalFollowers,
      avgEngagement,
      postsThisWeek: (postsThisWeekResult.data ?? []).length,
    },
  }
}

// ---------------------------------------------------------------------------
// Unpublished Portfolio Items
// ---------------------------------------------------------------------------

export async function getUnpublishedPortfolioItems(): Promise<{
  data?: { id: string; title: string | null; image_url: string; style: string | null; created_at: string }[]
  error?: string
}> {
  const { studioId, error: authError } = await getAuthenticatedStudioId()
  if (authError || !studioId) return { error: authError ?? 'No autorizado' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('portfolio_items')
    .select('id, title, image_url, style, created_at')
    .eq('studio_id', studioId)
    .not(
      'id',
      'in',
      `(SELECT portfolio_item_id FROM social_posts WHERE portfolio_item_id IS NOT NULL AND studio_id = '${studioId}')`
    )
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return {
    data: data as {
      id: string
      title: string | null
      image_url: string
      style: string | null
      created_at: string
    }[],
  }
}

// ---------------------------------------------------------------------------
// Calendar Posts
// ---------------------------------------------------------------------------

export async function getCalendarPosts(
  month: number,
  year: number
): Promise<{ data?: CalendarPost[]; error?: string }> {
  const { studioId, error: authError } = await getAuthenticatedStudioId()
  if (authError || !studioId) return { error: authError ?? 'No autorizado' }

  const startDate = new Date(year, month - 1, 1).toISOString()
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('social_posts')
    .select('id, scheduled_for, posted_at, status, post_type, caption, image_url, account:social_accounts(platform)')
    .eq('studio_id', studioId)
    .or(
      `scheduled_for.gte.${startDate},scheduled_for.lte.${endDate},posted_at.gte.${startDate},posted_at.lte.${endDate}`
    )
    .order('scheduled_for', { ascending: true, nullsFirst: false })

  if (error) return { error: error.message }

  type RawRow = {
    id: string
    scheduled_for: string | null
    posted_at: string | null
    status: string
    post_type: string
    caption: string | null
    image_url: string | null
    account: { platform: string } | null
  }

  const rows = (data ?? []) as unknown as RawRow[]
  const calendarPosts: CalendarPost[] = rows.map((row) => ({
    id: row.id,
    date: (row.scheduled_for ?? row.posted_at ?? '').split('T')[0] as string,
    status: row.status as CalendarPost['status'],
    post_type: row.post_type as CalendarPost['post_type'],
    caption: row.caption,
    image_url: row.image_url,
    platform: (row.account?.platform ?? null) as CalendarPost['platform'],
  }))

  return { data: calendarPosts }
}

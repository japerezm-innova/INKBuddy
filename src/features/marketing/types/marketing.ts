// ---------------------------------------------------------------------------
// Enums / Literals
// ---------------------------------------------------------------------------

export type SocialPlatform = 'instagram' | 'tiktok'

export type PostType = 'image' | 'carousel' | 'reel' | 'story' | 'tiktok_video'

export type PostStatus = 'idea' | 'draft' | 'scheduled' | 'posted' | 'archived'

// ---------------------------------------------------------------------------
// Social Account
// ---------------------------------------------------------------------------

export interface SocialAccount {
  id: string
  studio_id: string
  platform: SocialPlatform
  username: string
  profile_url: string | null
  followers_count: number
  following_count: number
  posts_count: number
  bio: string | null
  is_business_account: boolean
  access_token: string | null
  last_synced_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateAccountInput {
  platform: SocialPlatform
  username: string
  profile_url?: string
  followers_count?: number
  following_count?: number
  posts_count?: number
  bio?: string
  is_business_account?: boolean
}

// ---------------------------------------------------------------------------
// Social Post
// ---------------------------------------------------------------------------

export interface SocialPost {
  id: string
  studio_id: string
  account_id: string | null
  portfolio_item_id: string | null
  post_type: PostType
  caption: string | null
  hashtags: string[]
  posted_at: string | null
  scheduled_for: string | null
  status: PostStatus
  external_url: string | null
  image_url: string | null
  content_notes: string | null
  created_at: string
  updated_at: string
  // Joined relations (optional)
  account?: SocialAccount
  portfolio_item?: {
    id: string
    title: string | null
    image_url: string
    style: string | null
  }
  latest_metrics?: PostMetrics
}

export interface CreatePostInput {
  account_id?: string
  portfolio_item_id?: string
  post_type: PostType
  caption?: string
  hashtags?: string[]
  scheduled_for?: string
  status?: PostStatus
  external_url?: string
  image_url?: string
  content_notes?: string
}

// ---------------------------------------------------------------------------
// Post Metrics
// ---------------------------------------------------------------------------

export interface PostMetrics {
  id: string
  post_id: string
  likes: number
  comments: number
  saves: number
  shares: number
  reach: number
  impressions: number
  engagement_rate: number
  measured_at: string
}

export interface CreateMetricsInput {
  post_id: string
  likes?: number
  comments?: number
  saves?: number
  shares?: number
  reach?: number
  impressions?: number
}

// ---------------------------------------------------------------------------
// Account Snapshot
// ---------------------------------------------------------------------------

export interface AccountSnapshot {
  id: string
  account_id: string
  followers_count: number
  following_count: number
  posts_count: number
  avg_engagement_rate: number
  profile_visits: number
  website_clicks: number
  measured_at: string
}

export interface CreateSnapshotInput {
  account_id: string
  followers_count: number
  following_count?: number
  posts_count?: number
  avg_engagement_rate?: number
  profile_visits?: number
  website_clicks?: number
}

// ---------------------------------------------------------------------------
// Hashtag Collection
// ---------------------------------------------------------------------------

export interface HashtagCollection {
  id: string
  studio_id: string
  name: string
  hashtags: string[]
  category: string | null
  usage_count: number
  is_preset: boolean
  created_at: string
}

export interface CreateHashtagCollectionInput {
  name: string
  hashtags: string[]
  category?: string
}

// ---------------------------------------------------------------------------
// Dashboard aggregates
// ---------------------------------------------------------------------------

export interface MarketingDashboardData {
  accounts: SocialAccount[]
  recentPosts: SocialPost[]
  followerGrowth: { date: string; followers: number; platform: SocialPlatform }[]
  engagementOverTime: { date: string; rate: number }[]
  upcomingScheduled: SocialPost[]
  unpublishedPortfolio: {
    id: string
    title: string | null
    image_url: string
    style: string | null
    created_at: string
  }[]
  totalFollowers: number
  avgEngagement: number
  postsThisWeek: number
}

// ---------------------------------------------------------------------------
// Calendar view
// ---------------------------------------------------------------------------

export interface CalendarPost {
  id: string
  date: string
  status: PostStatus
  post_type: PostType
  caption: string | null
  image_url: string | null
  platform: SocialPlatform | null
}

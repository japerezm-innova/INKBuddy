-- =============================================
-- INKBuddy: Marketing Intelligence Tables
-- 5 tables for social media tracking
-- =============================================

-- 1. social_accounts
CREATE TABLE public.social_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok')),
  username TEXT NOT NULL,
  profile_url TEXT,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  bio TEXT,
  is_business_account BOOLEAN DEFAULT false,
  access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(studio_id, platform, username)
);

CREATE INDEX idx_social_accounts_studio ON public.social_accounts(studio_id);

-- 2. social_posts
CREATE TABLE public.social_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.social_accounts(id) ON DELETE SET NULL,
  portfolio_item_id UUID REFERENCES public.portfolio_items(id) ON DELETE SET NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('image', 'carousel', 'reel', 'story', 'tiktok_video')),
  caption TEXT,
  hashtags TEXT[] DEFAULT '{}',
  posted_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'draft', 'scheduled', 'posted', 'archived')),
  external_url TEXT,
  image_url TEXT,
  content_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_social_posts_studio ON public.social_posts(studio_id);
CREATE INDEX idx_social_posts_account ON public.social_posts(account_id);
CREATE INDEX idx_social_posts_portfolio ON public.social_posts(portfolio_item_id);
CREATE INDEX idx_social_posts_status ON public.social_posts(status);
CREATE INDEX idx_social_posts_scheduled ON public.social_posts(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- 3. social_post_metrics
CREATE TABLE public.social_post_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  engagement_rate NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN reach > 0
      THEN ROUND(((likes + comments + saves + shares)::NUMERIC / reach) * 100, 2)
      ELSE 0
    END
  ) STORED,
  measured_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_post_metrics_post ON public.social_post_metrics(post_id);
CREATE INDEX idx_post_metrics_measured ON public.social_post_metrics(measured_at);

-- 4. social_account_snapshots
CREATE TABLE public.social_account_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  avg_engagement_rate NUMERIC(5,2) DEFAULT 0,
  profile_visits INTEGER DEFAULT 0,
  website_clicks INTEGER DEFAULT 0,
  measured_at DATE DEFAULT CURRENT_DATE NOT NULL,
  UNIQUE(account_id, measured_at)
);

CREATE INDEX idx_account_snapshots_account ON public.social_account_snapshots(account_id);
CREATE INDEX idx_account_snapshots_measured ON public.social_account_snapshots(measured_at);

-- 5. hashtag_collections
CREATE TABLE public.hashtag_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  category TEXT,
  usage_count INTEGER DEFAULT 0,
  is_preset BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_hashtag_collections_studio ON public.hashtag_collections(studio_id);
CREATE INDEX idx_hashtag_collections_category ON public.hashtag_collections(category);

-- =============================================
-- RLS Policies
-- =============================================

ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio members view social accounts" ON public.social_accounts
  FOR SELECT USING (studio_id = public.get_user_studio_id());

CREATE POLICY "Owners manage social accounts" ON public.social_accounts
  FOR ALL USING (studio_id = public.get_user_studio_id() AND public.is_owner());

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio members view social posts" ON public.social_posts
  FOR SELECT USING (studio_id = public.get_user_studio_id());

CREATE POLICY "Studio members create social posts" ON public.social_posts
  FOR INSERT WITH CHECK (studio_id = public.get_user_studio_id());

CREATE POLICY "Studio members update social posts" ON public.social_posts
  FOR UPDATE USING (studio_id = public.get_user_studio_id());

CREATE POLICY "Owners delete social posts" ON public.social_posts
  FOR DELETE USING (studio_id = public.get_user_studio_id() AND public.is_owner());

ALTER TABLE public.social_post_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio members view post metrics" ON public.social_post_metrics
  FOR SELECT USING (post_id IN (
    SELECT id FROM public.social_posts WHERE studio_id = public.get_user_studio_id()
  ));

CREATE POLICY "Studio members manage post metrics" ON public.social_post_metrics
  FOR ALL USING (post_id IN (
    SELECT id FROM public.social_posts WHERE studio_id = public.get_user_studio_id()
  ));

ALTER TABLE public.social_account_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio members view account snapshots" ON public.social_account_snapshots
  FOR SELECT USING (account_id IN (
    SELECT id FROM public.social_accounts WHERE studio_id = public.get_user_studio_id()
  ));

CREATE POLICY "Studio members manage account snapshots" ON public.social_account_snapshots
  FOR ALL USING (account_id IN (
    SELECT id FROM public.social_accounts WHERE studio_id = public.get_user_studio_id()
  ));

ALTER TABLE public.hashtag_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio members view hashtag collections" ON public.hashtag_collections
  FOR SELECT USING (studio_id = public.get_user_studio_id());

CREATE POLICY "Studio members create hashtag collections" ON public.hashtag_collections
  FOR INSERT WITH CHECK (studio_id = public.get_user_studio_id());

CREATE POLICY "Studio members update hashtag collections" ON public.hashtag_collections
  FOR UPDATE USING (studio_id = public.get_user_studio_id());

CREATE POLICY "Owners delete hashtag collections" ON public.hashtag_collections
  FOR DELETE USING (studio_id = public.get_user_studio_id() AND public.is_owner());

-- =============================================
-- Triggers (updated_at)
-- =============================================

CREATE TRIGGER update_social_accounts_updated_at
  BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

CREATE TRIGGER update_social_posts_updated_at
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

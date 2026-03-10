'use client'

import { useState, useEffect } from 'react'
import { BarChart2, Users, TrendingUp, Save, Heart, MessageCircle, Bookmark, Share2, Eye, CheckCircle } from 'lucide-react'
import { GlassCard, GlassButton, GlassInput } from '@/shared/components'
import { cn } from '@/shared/lib/utils'
import {
  getSocialAccounts,
  recordAccountSnapshot,
  recordPostMetrics,
  getSocialPosts,
} from '../services/marketing-service'
import { calculateEngagementRate, evaluateEngagementRate } from '../services/recommendations-service'
import type { SocialAccount, SocialPost } from '../types/marketing'
import { PLATFORM_INFO } from '../constants/tattoo-marketing'

interface Props {
  postId?: string
  className?: string
}

type ActiveTab = 'account' | 'post'

export function MetricsInputForm({ postId, className }: Props) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('account')
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [selectedPostId, setSelectedPostId] = useState(postId ?? '')

  // Account metric fields
  const [followersCount, setFollowersCount] = useState('')
  const [followingCount, setFollowingCount] = useState('')
  const [postsCount, setPostsCount] = useState('')
  const [avgEngagement, setAvgEngagement] = useState('')
  const [profileVisits, setProfileVisits] = useState('')
  const [websiteClicks, setWebsiteClicks] = useState('')

  // Post metric fields
  const [likes, setLikes] = useState('')
  const [comments, setComments] = useState('')
  const [saves, setSaves] = useState('')
  const [shares, setShares] = useState('')
  const [reach, setReach] = useState('')
  const [impressions, setImpressions] = useState('')

  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      const [accountsResult, postsResult] = await Promise.all([
        getSocialAccounts(),
        getSocialPosts({ status: 'posted' }),
      ])
      if (accountsResult.data) {
        setAccounts(accountsResult.data)
        if (accountsResult.data[0]) setSelectedAccountId(accountsResult.data[0].id)
      }
      if (postsResult.data) {
        setPosts(postsResult.data)
        if (!postId && postsResult.data[0]) setSelectedPostId(postsResult.data[0].id)
      }
    }
    void fetchData()
  }, [postId])

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId)

  const liveEngagementRate = calculateEngagementRate(
    Number(likes) || 0,
    Number(comments) || 0,
    Number(saves) || 0,
    Number(shares) || 0,
    selectedAccount?.followers_count ?? 1
  )
  const engagementEval = evaluateEngagementRate(liveEngagementRate)

  async function handleSaveAccount() {
    if (!selectedAccountId) return
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    const result = await recordAccountSnapshot({
      account_id: selectedAccountId,
      followers_count: Number(followersCount) || 0,
      following_count: Number(followingCount) || 0,
      posts_count: Number(postsCount) || 0,
      avg_engagement_rate: Number(avgEngagement) || 0,
      profile_visits: Number(profileVisits) || 0,
      website_clicks: Number(websiteClicks) || 0,
    })

    setIsSaving(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('Metricas guardadas')
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  async function handleSavePost() {
    if (!selectedPostId) return
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    const result = await recordPostMetrics({
      post_id: selectedPostId,
      likes: Number(likes) || 0,
      comments: Number(comments) || 0,
      saves: Number(saves) || 0,
      shares: Number(shares) || 0,
      reach: Number(reach) || 0,
      impressions: Number(impressions) || 0,
    })

    setIsSaving(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('Metricas guardadas')
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  return (
    <GlassCard className={cn('flex flex-col gap-6', className)} padding="p-6">
      {/* Tab switcher */}
      <div className="flex gap-2 p-1 rounded-2xl bg-white/10 border border-white/15">
        <GlassButton
          variant={activeTab === 'account' ? 'primary' : 'ghost'}
          size="sm"
          className="flex-1"
          onClick={() => { setActiveTab('account'); setError(null); setSuccess(null) }}
        >
          <Users className="h-4 w-4" />
          Metricas de Cuenta
        </GlassButton>
        <GlassButton
          variant={activeTab === 'post' ? 'primary' : 'ghost'}
          size="sm"
          className="flex-1"
          onClick={() => { setActiveTab('post'); setError(null); setSuccess(null) }}
        >
          <BarChart2 className="h-4 w-4" />
          Metricas de Post
        </GlassButton>
      </div>

      {/* Account metrics tab */}
      {activeTab === 'account' && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="account-select" className="text-sm font-medium text-ink-dark/80">
              Cuenta
            </label>
            <select
              id="account-select"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="h-11 px-4 text-sm text-ink-dark bg-white/15 backdrop-blur-md border border-white/20 focus:border-ink-orange/50 focus:ring-2 focus:ring-ink-orange/20 rounded-xl transition-all duration-200 outline-none"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {PLATFORM_INFO[acc.platform].label} — @{acc.username}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <GlassInput
              label="Seguidores"
              type="number"
              min="0"
              icon={Users}
              value={followersCount}
              onChange={(e) => setFollowersCount(e.target.value)}
              placeholder="0"
            />
            <GlassInput
              label="Siguiendo"
              type="number"
              min="0"
              value={followingCount}
              onChange={(e) => setFollowingCount(e.target.value)}
              placeholder="0"
            />
            <GlassInput
              label="Publicaciones"
              type="number"
              min="0"
              value={postsCount}
              onChange={(e) => setPostsCount(e.target.value)}
              placeholder="0"
            />
            <GlassInput
              label="Engagement Promedio (%)"
              type="number"
              min="0"
              step="0.01"
              icon={TrendingUp}
              value={avgEngagement}
              onChange={(e) => setAvgEngagement(e.target.value)}
              placeholder="0.00"
            />
            <GlassInput
              label="Visitas al Perfil"
              type="number"
              min="0"
              icon={Eye}
              value={profileVisits}
              onChange={(e) => setProfileVisits(e.target.value)}
              placeholder="0"
            />
            <GlassInput
              label="Clicks al Sitio"
              type="number"
              min="0"
              value={websiteClicks}
              onChange={(e) => setWebsiteClicks(e.target.value)}
              placeholder="0"
            />
          </div>

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          <GlassButton
            variant="primary"
            onClick={handleSaveAccount}
            isLoading={isSaving}
            disabled={!selectedAccountId}
            className="w-full"
          >
            {success ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-300" />
                {success}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Metricas
              </>
            )}
          </GlassButton>
        </div>
      )}

      {/* Post metrics tab */}
      {activeTab === 'post' && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="post-select" className="text-sm font-medium text-ink-dark/80">
              Post publicado
            </label>
            <select
              id="post-select"
              value={selectedPostId}
              onChange={(e) => setSelectedPostId(e.target.value)}
              className="h-11 px-4 text-sm text-ink-dark bg-white/15 backdrop-blur-md border border-white/20 focus:border-ink-orange/50 focus:ring-2 focus:ring-ink-orange/20 rounded-xl transition-all duration-200 outline-none"
            >
              {posts.map((post) => (
                <option key={post.id} value={post.id}>
                  {post.caption
                    ? post.caption.slice(0, 40) + (post.caption.length > 40 ? '...' : '')
                    : 'Sin caption'}{' '}
                  {post.posted_at ? `(${new Date(post.posted_at).toLocaleDateString('es-ES')})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <GlassInput
              label="Likes"
              type="number"
              min="0"
              icon={Heart}
              value={likes}
              onChange={(e) => setLikes(e.target.value)}
              placeholder="0"
            />
            <GlassInput
              label="Comentarios"
              type="number"
              min="0"
              icon={MessageCircle}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="0"
            />
            <GlassInput
              label="Guardados"
              type="number"
              min="0"
              icon={Bookmark}
              value={saves}
              onChange={(e) => setSaves(e.target.value)}
              placeholder="0"
            />
            <GlassInput
              label="Compartidos"
              type="number"
              min="0"
              icon={Share2}
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="0"
            />
            <GlassInput
              label="Alcance"
              type="number"
              min="0"
              icon={Eye}
              value={reach}
              onChange={(e) => setReach(e.target.value)}
              placeholder="0"
            />
            <GlassInput
              label="Impresiones"
              type="number"
              min="0"
              icon={BarChart2}
              value={impressions}
              onChange={(e) => setImpressions(e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Live engagement rate */}
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/10 border border-white/15">
            <div className="flex items-center gap-2 text-sm text-ink-dark/70">
              <TrendingUp className="h-4 w-4" />
              Engagement estimado
            </div>
            <span className={cn('text-sm font-semibold', engagementEval.color)}>
              {liveEngagementRate.toFixed(2)}% — {engagementEval.label}
            </span>
          </div>

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          <GlassButton
            variant="primary"
            onClick={handleSavePost}
            isLoading={isSaving}
            disabled={!selectedPostId}
            className="w-full"
          >
            {success ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-300" />
                {success}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Metricas
              </>
            )}
          </GlassButton>
        </div>
      )}
    </GlassCard>
  )
}

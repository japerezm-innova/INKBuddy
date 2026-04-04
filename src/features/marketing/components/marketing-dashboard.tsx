'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Users,
  TrendingUp,
  Calendar,
  Clock,
  Megaphone,
  ExternalLink,
  ImageIcon,
  Plus,
  Edit,
  Trash2,
  Instagram,
  AtSign,
} from 'lucide-react'
import { GlassCard, GlassButton, StatCard } from '@/shared/components'
import { cn } from '@/shared/lib/utils'
import { TrendLine } from '@/features/analytics/components/trend-line'
import {
  getMarketingDashboardData,
  deleteSocialAccount,
} from '../services/marketing-service'
import { seedPresetHashtags } from '../services/hashtag-service'
import type { MarketingDashboardData, SocialAccount } from '../types/marketing'
import { PLATFORM_INFO, POST_STATUS_LABELS } from '../constants/tattoo-marketing'
import { PostingHeatmap } from './posting-heatmap'
import { AccountSetupModal } from './account-setup-modal'

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function MarketingDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Cargando dashboard">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-white/30" />
          <div className="h-7 w-32 rounded-xl bg-white/30" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-28 rounded-2xl bg-white/30" />
          ))}
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/30 backdrop-blur-xl border border-white/25 rounded-3xl p-5 h-28" />
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="bg-white/30 backdrop-blur-xl border border-white/25 rounded-3xl p-6 h-52" />

      {/* Heatmap skeleton */}
      <div className="bg-white/30 backdrop-blur-xl border border-white/25 rounded-3xl p-6 h-48" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MarketingDashboard() {
  const [data, setData] = useState<MarketingDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activePlatform, setActivePlatform] = useState<'instagram' | 'tiktok'>('instagram')
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<SocialAccount | undefined>(undefined)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const [dashboardResult] = await Promise.all([
      getMarketingDashboardData(),
      seedPresetHashtags(),
    ])

    if (dashboardResult.error) {
      setError(dashboardResult.error)
    } else if (dashboardResult.data) {
      setData(dashboardResult.data)
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleDeleteAccount(id: string) {
    setDeletingId(id)
    const result = await deleteSocialAccount(id)
    if (!result.error) {
      await loadData()
    }
    setDeletingId(null)
  }

  function handleOpenAdd() {
    setEditingAccount(undefined)
    setShowAccountModal(true)
  }

  function handleOpenEdit(account: SocialAccount) {
    setEditingAccount(account)
    setShowAccountModal(true)
  }

  if (isLoading) return <MarketingDashboardSkeleton />

  if (error) {
    return (
      <GlassCard className="text-center py-12">
        <p className="text-red-500 font-medium mb-4">{error}</p>
        <GlassButton variant="secondary" size="sm" onClick={loadData}>
          Reintentar
        </GlassButton>
      </GlassCard>
    )
  }

  if (!data) return null

  const followerGrowthValues = data.followerGrowth
    .filter((d) => d.platform === activePlatform)
    .map((d) => d.followers)

  const platformAccount = data.accounts.find((a) => a.platform === activePlatform)

  const hasAccounts = data.accounts.length > 0

  return (
    <main className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="gradient-accent rounded-2xl p-2.5 shadow-warm"
            aria-hidden="true"
          >
            <Megaphone className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-ink-dark">Marketing</h1>
        </div>

        <nav className="flex flex-wrap gap-2" aria-label="Acciones rapidas de marketing">
          <Link href="/marketing/posts/new">
            <GlassButton variant="primary" size="sm">
              Planificar Post
            </GlassButton>
          </Link>
          <Link href="/marketing/calendar">
            <GlassButton variant="secondary" size="sm">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              Calendario
            </GlassButton>
          </Link>
          <Link href="/marketing/hashtags">
            <GlassButton variant="secondary" size="sm">
              Hashtags
            </GlassButton>
          </Link>
        </nav>
      </header>

      {/* Accounts section */}
      <section aria-label="Cuentas de redes sociales">
        {!hasAccounts ? (
          <GlassCard className="text-center py-10">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-ink-orange/10 flex items-center justify-center">
                <AtSign className="h-8 w-8 text-ink-orange" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-ink-dark">Conecta tus redes sociales</h2>
                <p className="text-sm text-ink-dark/50 mt-1 max-w-sm mx-auto">
                  Agrega tu cuenta de Instagram o TikTok para empezar a planificar tu contenido y ver tus metricas.
                </p>
              </div>
              <GlassButton variant="primary" size="lg" onClick={handleOpenAdd}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Agregar Cuenta
              </GlassButton>
            </div>
          </GlassCard>
        ) : (
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-ink-dark">Cuentas Conectadas</h2>
              <GlassButton variant="primary" size="sm" onClick={handleOpenAdd}>
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Agregar
              </GlassButton>
            </div>
            <ul className="space-y-2">
              {data.accounts.map((account) => {
                const platformInfo = PLATFORM_INFO[account.platform]
                return (
                  <li key={account.id} className="flex items-center gap-3 bg-white/20 rounded-2xl p-3">
                    <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center text-white', platformInfo.bgColor)}>
                      <AtSign className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink-dark truncate">@{account.username}</p>
                      <p className="text-xs text-ink-dark/50">
                        {platformInfo.label} &middot; {account.followers_count.toLocaleString('es')} seguidores
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(account)}
                        className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/40 transition-colors"
                        aria-label={`Editar @${account.username}`}
                      >
                        <Edit className="h-3.5 w-3.5 text-ink-dark/60" />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        disabled={deletingId === account.id}
                        className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/20 hover:bg-red-50/50 transition-colors"
                        aria-label={`Eliminar @${account.username}`}
                      >
                        <Trash2 className={cn('h-3.5 w-3.5', deletingId === account.id ? 'text-ink-dark/30 animate-pulse' : 'text-red-400')} />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </GlassCard>
        )}
      </section>

      {/* Account Setup Modal */}
      <AccountSetupModal
        isOpen={showAccountModal}
        onClose={() => { setShowAccountModal(false); setEditingAccount(undefined) }}
        onSaved={loadData}
        existingAccount={editingAccount}
      />

      {/* Stats grid */}
      <section aria-label="Metricas principales" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Seguidores"
          value={data.totalFollowers.toLocaleString('es')}
          icon={Users}
        />
        <StatCard
          title="Engagement Promedio"
          value={`${data.avgEngagement}%`}
          icon={TrendingUp}
        />
        <StatCard
          title="Posts esta Semana"
          value={data.postsThisWeek}
          icon={Calendar}
        />
        <StatCard
          title="Programados"
          value={data.upcomingScheduled.length}
          icon={Clock}
        />
      </section>

      {/* Follower growth chart */}
      <section aria-label="Crecimiento de seguidores">
        <GlassCard>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-base font-semibold text-ink-dark">
              Crecimiento de Seguidores
            </h2>
            <div className="flex gap-2" role="group" aria-label="Seleccionar plataforma">
              {(['instagram', 'tiktok'] as const).map((platform) => (
                <GlassButton
                  key={platform}
                  variant={activePlatform === platform ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setActivePlatform(platform)}
                  aria-pressed={activePlatform === platform}
                >
                  {PLATFORM_INFO[platform].label}
                </GlassButton>
              ))}
            </div>
          </div>

          {platformAccount && (
            <p className="text-xs text-ink-dark/50 mb-3">
              @{platformAccount.username} &mdash;{' '}
              <span className="font-semibold">
                {platformAccount.followers_count.toLocaleString('es')}
              </span>{' '}
              seguidores
            </p>
          )}

          <TrendLine
            data={followerGrowthValues.length > 0 ? followerGrowthValues : [0]}
            color={activePlatform === 'instagram' ? '#e879f9' : '#22d3ee'}
            height={120}
            className="w-full"
          />
        </GlassCard>
      </section>

      {/* Posting heatmap */}
      <PostingHeatmap platform={activePlatform} />

      {/* Upcoming posts */}
      <section aria-label="Proximas publicaciones">
        <GlassCard>
          <h2 className="text-base font-semibold text-ink-dark mb-4">
            Proximas Publicaciones
          </h2>

          {data.upcomingScheduled.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-ink-dark/50 text-sm mb-3">
                No hay publicaciones programadas
              </p>
              <Link href="/marketing/posts/new">
                <GlassButton variant="primary" size="sm">
                  Crear primera publicacion
                </GlassButton>
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {data.upcomingScheduled.map((post) => {
                const statusInfo = POST_STATUS_LABELS[post.status]
                const scheduledDate = post.scheduled_for
                  ? new Date(post.scheduled_for).toLocaleDateString('es', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—'
                const captionPreview = post.caption
                  ? post.caption.slice(0, 80) + (post.caption.length > 80 ? '...' : '')
                  : 'Sin descripcion'

                return (
                  <li key={post.id}>
                    <div className="flex items-center gap-3 bg-white/20 rounded-2xl p-3">
                      {/* Thumbnail */}
                      <div className="h-12 w-12 rounded-xl bg-white/30 flex-shrink-0 overflow-hidden">
                        {post.image_url ? (
                          <Image
                            src={post.image_url}
                            alt={captionPreview}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-ink-dark/30" aria-hidden="true" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-ink-dark truncate">{captionPreview}</p>
                        <p className="text-xs text-ink-dark/50 mt-0.5">{scheduledDate}</p>
                      </div>

                      {/* Status badge */}
                      {statusInfo && (
                        <span
                          className={cn(
                            'flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full text-white',
                            statusInfo.color
                          )}
                        >
                          {statusInfo.label}
                        </span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </GlassCard>
      </section>

      {/* Unpublished portfolio */}
      <section aria-label="Piezas sin publicar">
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-ink-dark">
              Piezas sin Publicar
            </h2>
            {data.unpublishedPortfolio.length > 0 && (
              <span className="text-xs font-medium text-ink-dark/50 bg-white/30 px-2 py-1 rounded-full">
                {data.unpublishedPortfolio.length} disponibles
              </span>
            )}
          </div>

          {data.unpublishedPortfolio.length === 0 ? (
            <p className="text-center text-ink-dark/50 text-sm py-6">
              Todas las piezas del portafolio ya fueron publicadas
            </p>
          ) : (
            <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {data.unpublishedPortfolio.map((item) => (
                <li key={item.id}>
                  <div className="group relative bg-white/20 rounded-2xl overflow-hidden">
                    <div className="aspect-square relative">
                      <Image
                        src={item.image_url}
                        alt={item.title ?? 'Pieza de portafolio'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </div>

                    <div className="p-2">
                      {item.title && (
                        <p className="text-xs font-medium text-ink-dark truncate">
                          {item.title}
                        </p>
                      )}
                      {item.style && (
                        <span className="inline-block text-xs text-ink-dark/60 bg-white/30 rounded-full px-2 py-0.5 mt-1">
                          {item.style}
                        </span>
                      )}
                      <Link
                        href={`/marketing/posts/new?portfolioId=${item.id}`}
                        className="block mt-2"
                      >
                        <GlassButton
                          variant="primary"
                          size="sm"
                          className="w-full text-xs"
                        >
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          Publicar
                        </GlassButton>
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </section>
    </main>
  )
}

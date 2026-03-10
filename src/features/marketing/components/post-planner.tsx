'use client'

import { useState, useEffect } from 'react'
import { Image, Hash, Clock, Save, ArrowLeft, Sparkles, Copy, X } from 'lucide-react'
import { GlassCard, GlassButton, GlassInput } from '@/shared/components'
import { cn, glass } from '@/shared/lib/utils'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import {
  createSocialPost,
  updateSocialPost,
  getSocialAccounts,
} from '../services/marketing-service'
import { getHashtagCollections } from '../services/hashtag-service'
import { suggestHashtags, getBestPostingTimes } from '../services/recommendations-service'
import {
  PLATFORM_LIMITS,
  POST_TYPE_LABELS,
  POST_STATUS_LABELS,
  PLATFORM_INFO,
} from '../constants/tattoo-marketing'
import type {
  SocialPost,
  PostType,
  PostStatus,
  SocialAccount,
  HashtagCollection,
} from '../types/marketing'

interface Props {
  existingPost?: SocialPost
}

const POST_TYPES: PostType[] = ['image', 'carousel', 'reel', 'story', 'tiktok_video']
const POST_STATUSES: PostStatus[] = ['idea', 'draft', 'scheduled', 'posted']

export function PostPlanner({ existingPost }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const portfolioIdParam = searchParams.get('portfolioId')

  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [hashtagCollections, setHashtagCollections] = useState<HashtagCollection[]>([])

  // Form state
  const [accountId, setAccountId] = useState(existingPost?.account_id ?? '')
  const [postType, setPostType] = useState<PostType>(existingPost?.post_type ?? 'image')
  const [caption, setCaption] = useState(existingPost?.caption ?? '')
  const [hashtags, setHashtags] = useState<string[]>(existingPost?.hashtags ?? [])
  const [scheduledFor, setScheduledFor] = useState(
    existingPost?.scheduled_for ? existingPost.scheduled_for.slice(0, 16) : ''
  )
  const [status, setStatus] = useState<PostStatus>(existingPost?.status ?? 'draft')
  const [imageUrl, setImageUrl] = useState(existingPost?.image_url ?? '')
  const [contentNotes, setContentNotes] = useState(existingPost?.content_notes ?? '')
  const [portfolioItemId, setPortfolioItemId] = useState(existingPost?.portfolio_item_id ?? '')

  const [hashtagInput, setHashtagInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showHashtagPicker, setShowHashtagPicker] = useState(false)

  // Derived
  const selectedAccount = accounts.find((a) => a.id === accountId)
  const platform = selectedAccount?.platform ?? 'instagram'
  const limits = PLATFORM_LIMITS[platform]
  const captionLength = caption.length
  const captionPct = captionLength / limits.captionMaxLength

  const bestTimes = getBestPostingTimes(platform, 1)
  const topTime = bestTimes[0]

  useEffect(() => {
    async function load() {
      const [accsResult, collectionsResult] = await Promise.all([
        getSocialAccounts(),
        getHashtagCollections(),
      ])
      const accs = accsResult.data ?? []
      setAccounts(accs)
      setHashtagCollections(collectionsResult.data ?? [])

      // Pre-select first account if no existing post
      if (!existingPost && accs.length > 0 && !accountId) {
        setAccountId(accs[0]!.id)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!portfolioIdParam) return
    setPortfolioItemId(portfolioIdParam)
    // If the post already has an image from the portfolio, trust it
    if (existingPost?.portfolio_item?.image_url) {
      setImageUrl(existingPost.portfolio_item.image_url)
      const style = existingPost.portfolio_item.style
      const suggested = suggestHashtags(style)
      setHashtags(suggested.slice(0, 30))
    }
  }, [portfolioIdParam, existingPost])

  function addHashtag(tag: string) {
    const normalized = tag.startsWith('#') ? tag : `#${tag}`
    if (!normalized || hashtags.includes(normalized) || hashtags.length >= 30) return
    setHashtags((prev) => [...prev, normalized])
  }

  function removeHashtag(tag: string) {
    setHashtags((prev) => prev.filter((h) => h !== tag))
  }

  function handleHashtagInputAdd() {
    const trimmed = hashtagInput.trim()
    if (!trimmed) return
    addHashtag(trimmed)
    setHashtagInput('')
  }

  function handleSuggestHashtags() {
    const suggested = suggestHashtags(contentNotes || null)
    const merged = Array.from(new Set([...hashtags, ...suggested])).slice(0, 30)
    setHashtags(merged)
  }

  function addCollectionHashtags(collection: HashtagCollection) {
    const merged = Array.from(new Set([...hashtags, ...collection.hashtags])).slice(0, 30)
    setHashtags(merged)
    setShowHashtagPicker(false)
  }

  async function handleSave(saveStatus: PostStatus) {
    setIsSaving(true)
    setError(null)

    const payload = {
      account_id: accountId || undefined,
      portfolio_item_id: portfolioItemId || undefined,
      post_type: postType,
      caption: caption || undefined,
      hashtags,
      scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : undefined,
      status: saveStatus,
      image_url: imageUrl || undefined,
      content_notes: contentNotes || undefined,
    }

    const result = existingPost
      ? await updateSocialPost(existingPost.id, payload)
      : await createSocialPost(payload)

    if (result.error) {
      setError(result.error)
      setIsSaving(false)
      return
    }

    router.push('/marketing')
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Back */}
      <Link
        href="/marketing"
        className="inline-flex items-center gap-2 text-sm text-ink-dark/60 hover:text-ink-dark transition-colors"
        aria-label="Volver a marketing"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a Marketing
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-4">

          {/* Platform & Type */}
          <GlassCard>
            <h2 className="font-semibold text-ink-dark mb-4">Plataforma y tipo</h2>

            <div className="space-y-4">
              {/* Account selector */}
              <div>
                <label htmlFor="account-select" className="text-sm font-medium text-ink-dark/80 block mb-1.5">
                  Cuenta
                </label>
                <select
                  id="account-select"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className={cn(
                    glass.input,
                    'w-full h-11 px-4 text-sm text-ink-dark outline-none appearance-none'
                  )}
                >
                  <option value="">Sin cuenta</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      @{acc.username} ({acc.platform === 'instagram' ? 'Instagram' : 'TikTok'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Post type */}
              <div>
                <p className="text-sm font-medium text-ink-dark/80 mb-2">Tipo de publicacion</p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de publicacion">
                  {POST_TYPES.map((type) => (
                    <GlassButton
                      key={type}
                      variant={postType === type ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setPostType(type)}
                      aria-pressed={postType === type}
                    >
                      {POST_TYPE_LABELS[type]}
                    </GlassButton>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-sm font-medium text-ink-dark/80 mb-2">Estado</p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Estado">
                  {POST_STATUSES.map((s) => (
                    <GlassButton
                      key={s}
                      variant={status === s ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setStatus(s)}
                      aria-pressed={status === s}
                    >
                      {POST_STATUS_LABELS[s]?.label}
                    </GlassButton>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Image */}
          <GlassCard>
            <h2 className="font-semibold text-ink-dark mb-4 flex items-center gap-2">
              <Image className="h-4 w-4 text-ink-orange" aria-hidden="true" />
              Imagen
            </h2>

            {imageUrl && (
              <div className="relative mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Vista previa de la imagen"
                  loading="lazy"
                  className="rounded-2xl max-h-64 w-full object-cover"
                />
                <button
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                  aria-label="Eliminar imagen"
                >
                  <X className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                </button>
              </div>
            )}

            <GlassInput
              type="url"
              placeholder="https://... URL de la imagen"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              aria-label="URL de la imagen"
            />
          </GlassCard>

          {/* Caption */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-ink-dark">Caption</h2>
              <span
                className={cn(
                  'text-xs font-medium tabular-nums',
                  captionPct >= 1 ? 'text-red-500' : captionPct >= 0.9 ? 'text-yellow-500' : 'text-ink-dark/40'
                )}
                aria-live="polite"
                aria-label={`${captionLength} de ${limits.captionMaxLength} caracteres`}
              >
                {captionLength}/{limits.captionMaxLength}
              </span>
            </div>

            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Escribe tu caption aqui..."
              rows={5}
              maxLength={limits.captionMaxLength}
              className={cn(
                glass.input,
                'w-full resize-none rounded-2xl p-4 text-sm text-ink-dark outline-none'
              )}
              aria-label="Caption de la publicacion"
            />

            <GlassInput
              type="text"
              placeholder="Notas de contenido (estilo, referencias...)"
              value={contentNotes}
              onChange={(e) => setContentNotes(e.target.value)}
              className="mt-3"
              aria-label="Notas de contenido"
            />
          </GlassCard>

          {/* Hashtags */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-ink-dark flex items-center gap-2">
                <Hash className="h-4 w-4 text-ink-orange" aria-hidden="true" />
                Hashtags
              </h2>
              <span className="text-xs text-ink-dark/40">{hashtags.length}/30</span>
            </div>

            {/* Chips */}
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4" role="list" aria-label="Hashtags seleccionados">
                {hashtags.map((tag) => (
                  <span
                    key={tag}
                    role="listitem"
                    className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-sm text-ink-dark/80"
                  >
                    {tag}
                    <button
                      onClick={() => removeHashtag(tag)}
                      className="ml-0.5 hover:text-red-500 transition-colors"
                      aria-label={`Eliminar ${tag}`}
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {/* Suggest & Collection buttons */}
              <div className="flex flex-wrap gap-2">
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={handleSuggestHashtags}
                  disabled={hashtags.length >= 30}
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Sugerir
                </GlassButton>

                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHashtagPicker((v) => !v)}
                  aria-expanded={showHashtagPicker}
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  Colecciones
                </GlassButton>
              </div>

              {/* Collection picker */}
              {showHashtagPicker && hashtagCollections.length > 0 && (
                <div className="rounded-2xl border border-white/20 bg-white/10 p-3 space-y-1" role="listbox" aria-label="Colecciones de hashtags">
                  {hashtagCollections.map((col) => (
                    <button
                      key={col.id}
                      onClick={() => addCollectionHashtags(col)}
                      role="option"
                      aria-selected={false}
                      className="w-full text-left px-3 py-2 text-sm rounded-xl hover:bg-white/15 transition-colors text-ink-dark/80"
                    >
                      {col.name}
                      <span className="ml-2 text-xs text-ink-dark/40">{col.hashtags.length} hashtags</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Manual input */}
              <div className="flex gap-2">
                <GlassInput
                  type="text"
                  placeholder="#tatuaje"
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleHashtagInputAdd()}
                  aria-label="Agregar hashtag"
                />
                <GlassButton
                  variant="secondary"
                  size="sm"
                  onClick={handleHashtagInputAdd}
                  disabled={hashtags.length >= 30}
                  aria-label="Agregar hashtag"
                  className="flex-shrink-0"
                >
                  Agregar
                </GlassButton>
              </div>
            </div>
          </GlassCard>

          {/* Scheduling */}
          <GlassCard>
            <h2 className="font-semibold text-ink-dark mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-ink-orange" aria-hidden="true" />
              Programacion
            </h2>

            <GlassInput
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              label="Fecha y hora de publicacion"
              aria-label="Fecha y hora de publicacion"
            />

            {topTime && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-ink-orange/10 border border-ink-orange/20">
                <Clock className="h-4 w-4 text-ink-orange flex-shrink-0" aria-hidden="true" />
                <span className="text-xs text-ink-dark/70">
                  Mejor horario: <strong className="text-ink-dark">{topTime.day} a las {topTime.time}</strong>
                </span>
              </div>
            )}
          </GlassCard>
        </div>

        {/* RIGHT COLUMN - Preview */}
        <div className="lg:col-span-1">
          <GlassCard className="sticky top-6">
            <h2 className="font-semibold text-ink-dark mb-4">Vista previa</h2>

            <div className="max-w-[280px] mx-auto">
              {/* Platform badge */}
              {selectedAccount && (
                <div className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white mb-3',
                  PLATFORM_INFO[platform].bgColor
                )}>
                  {PLATFORM_INFO[platform].label}
                </div>
              )}

              {/* Phone frame */}
              <div className="border-2 border-white/20 rounded-[2rem] p-3 bg-black/20">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt="Preview de imagen del post"
                    loading="lazy"
                    className="w-full h-36 object-cover rounded-2xl"
                  />
                ) : (
                  <div
                    className="w-full h-36 rounded-2xl bg-white/10 flex items-center justify-center"
                    aria-label="Sin imagen"
                  >
                    <Image className="h-8 w-8 text-white/30" aria-hidden="true" />
                  </div>
                )}

                {/* Caption preview */}
                <div className="mt-3 px-1 space-y-2">
                  {selectedAccount && (
                    <p className="text-xs font-semibold text-white/80">@{selectedAccount.username}</p>
                  )}
                  {caption && (
                    <p className="text-xs text-white/60 line-clamp-3 leading-relaxed">{caption}</p>
                  )}
                  {hashtags.length > 0 && (
                    <span className="inline-block text-xs text-blue-300/70">
                      {hashtags.length} hashtag{hashtags.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p role="alert" className="text-sm text-red-500 font-medium px-1">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-2">
        <GlassButton
          variant="ghost"
          size="lg"
          onClick={() => handleSave('draft')}
          isLoading={isSaving}
          disabled={isSaving}
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          Guardar Borrador
        </GlassButton>

        <GlassButton
          variant="primary"
          size="lg"
          onClick={() => handleSave(scheduledFor ? 'scheduled' : 'posted')}
          isLoading={isSaving}
          disabled={isSaving}
        >
          Publicar
        </GlassButton>
      </div>
    </div>
  )
}

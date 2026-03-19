'use client'

import { useState } from 'react'
import { Sparkles, Copy, Check, Clock, RefreshCw, Wand2, Send } from 'lucide-react'
import { GlassCard, GlassButton } from '@/shared/components'
import { cn } from '@/shared/lib/utils'

type Tone = 'profesional' | 'casual' | 'artistico'
type Platform = 'instagram' | 'tiktok'

interface CaptionResult {
  caption: string
  hashtags: string
  style: string
  bestTime: string
  full: string
}

interface Props {
  imageUrl: string
  platform?: Platform
  onApplyCaption?: (caption: string) => void
  onApplyHashtags?: (hashtags: string[]) => void
}

const TONES: { value: Tone; label: string; emoji: string }[] = [
  { value: 'profesional', label: 'Profesional', emoji: '💼' },
  { value: 'casual', label: 'Casual', emoji: '😎' },
  { value: 'artistico', label: 'Artistico', emoji: '🎨' },
]

export function CaptionGenerator({ imageUrl, platform = 'instagram', onApplyCaption, onApplyHashtags }: Props) {
  const [tone, setTone] = useState<Tone>('profesional')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<CaptionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [editInput, setEditInput] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  async function handleEdit() {
    if (!editInput.trim() || !result) return
    setIsEditing(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          tone,
          platform,
          editInstruction: editInput.trim(),
          currentCaption: result.caption,
          currentHashtags: result.hashtags,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Error editando caption')
      }

      const data: CaptionResult = await res.json()
      setResult(data)
      setEditInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setIsEditing(false)
    }
  }

  async function handleGenerate() {
    if (!imageUrl) return
    setIsGenerating(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/ai/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, tone, platform }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Error generando caption')
      }

      const data: CaptionResult = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setIsGenerating(false)
    }
  }

  async function copyToClipboard(text: string, field: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      // Fallback for mobile
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    }
  }

  function CopyButton({ text, field, label }: { text: string; field: string; label: string }) {
    const isCopied = copiedField === field
    return (
      <button
        onClick={() => copyToClipboard(text, field)}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
          isCopied
            ? 'bg-green-500/20 text-green-700'
            : 'bg-white/20 text-ink-dark/70 hover:bg-white/30'
        )}
        aria-label={`Copiar ${label}`}
      >
        {isCopied ? (
          <Check className="h-3 w-3" aria-hidden="true" />
        ) : (
          <Copy className="h-3 w-3" aria-hidden="true" />
        )}
        {isCopied ? 'Copiado' : label}
      </button>
    )
  }

  if (!imageUrl) {
    return (
      <GlassCard>
        <div className="flex items-center gap-3 text-ink-dark/50">
          <Wand2 className="h-5 w-5" aria-hidden="true" />
          <p className="text-sm">Agrega una imagen para generar un caption con IA</p>
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard>
      <h2 className="font-semibold text-ink-dark mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-ink-orange" aria-hidden="true" />
        Caption con IA
      </h2>

      {/* Tone selector */}
      <div className="mb-4">
        <p className="text-sm font-medium text-ink-dark/80 mb-2">Tono</p>
        <div className="flex gap-2" role="group" aria-label="Seleccionar tono">
          {TONES.map((t) => (
            <GlassButton
              key={t.value}
              variant={tone === t.value ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setTone(t.value)}
              aria-pressed={tone === t.value}
            >
              <span aria-hidden="true">{t.emoji}</span> {t.label}
            </GlassButton>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <GlassButton
        variant="primary"
        size="lg"
        onClick={handleGenerate}
        isLoading={isGenerating}
        disabled={isGenerating}
        className="w-full"
      >
        {isGenerating ? (
          'Analizando tatuaje...'
        ) : result ? (
          <>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Regenerar
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Generar Caption
          </>
        )}
      </GlassButton>

      {/* Error */}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-500 font-medium">
          {error}
        </p>
      )}

      {/* Result */}
      {result && (
        <div className="mt-4 space-y-4">
          {/* Caption */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-ink-dark/80">Caption</p>
              <div className="flex gap-2">
                <CopyButton text={result.caption} field="caption" label="Copiar" />
                {onApplyCaption && (
                  <button
                    onClick={() => onApplyCaption(result.caption)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-ink-orange/20 text-ink-orange hover:bg-ink-orange/30 transition-all"
                  >
                    Usar
                  </button>
                )}
              </div>
            </div>
            <div className="rounded-2xl bg-white/20 p-4 text-sm text-ink-dark leading-relaxed whitespace-pre-wrap">
              {result.caption}
            </div>
          </div>

          {/* Edit/Refine */}
          <div>
            <p className="text-sm font-medium text-ink-dark/80 mb-2">Editar caption</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={editInput}
                onChange={(e) => setEditInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isEditing && handleEdit()}
                placeholder="Ej: hazlo mas corto, agrega emojis, cambiale el tono..."
                className="flex-1 rounded-xl bg-white/20 border border-white/30 px-3 py-2 text-sm text-ink-dark placeholder:text-ink-dark/40 focus:outline-none focus:ring-2 focus:ring-ink-orange/50"
                disabled={isEditing}
              />
              <GlassButton
                variant="primary"
                size="sm"
                onClick={handleEdit}
                disabled={isEditing || !editInput.trim()}
                isLoading={isEditing}
              >
                {isEditing ? null : <Send className="h-3.5 w-3.5" aria-hidden="true" />}
              </GlassButton>
            </div>
          </div>

          {/* Hashtags */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-ink-dark/80">Hashtags</p>
              <div className="flex gap-2">
                <CopyButton text={result.hashtags} field="hashtags" label="Copiar" />
                {onApplyHashtags && (
                  <button
                    onClick={() => {
                      const tags = result.hashtags
                        .split(/\s+/)
                        .filter((t) => t.startsWith('#'))
                      onApplyHashtags(tags)
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-ink-orange/20 text-ink-orange hover:bg-ink-orange/30 transition-all"
                  >
                    Usar
                  </button>
                )}
              </div>
            </div>
            <div className="rounded-2xl bg-white/20 p-4 text-sm text-ink-dark/70 leading-relaxed break-all">
              {result.hashtags}
            </div>
          </div>

          {/* Best time */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-ink-orange/10 border border-ink-orange/20">
            <Clock className="h-4 w-4 text-ink-orange flex-shrink-0" aria-hidden="true" />
            <span className="text-xs text-ink-dark/70">
              Mejor horario: <strong className="text-ink-dark">{result.bestTime}</strong>
            </span>
          </div>

          {/* Style detected */}
          <p className="text-xs text-ink-dark/40">
            Estilo detectado: <span className="capitalize">{result.style}</span>
          </p>

          {/* Copy all */}
          <GlassButton
            variant="secondary"
            size="lg"
            onClick={() => copyToClipboard(result.full, 'full')}
            className="w-full"
          >
            {copiedField === 'full' ? (
              <>
                <Check className="h-4 w-4" aria-hidden="true" />
                Todo copiado
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" aria-hidden="true" />
                Copiar Todo (Caption + Hashtags)
              </>
            )}
          </GlassButton>
        </div>
      )}
    </GlassCard>
  )
}

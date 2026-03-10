'use client'

import { useState, useId } from 'react'
import { Link2, FileText, Palette, MapPin, Loader2, Check } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { GlassInput } from '@/shared/components'
import { createPortfolioItem, updatePortfolioItem } from '../services/portfolio-service'
import type { PortfolioItem, CreatePortfolioInput } from '../types/portfolio'

// Common tattoo styles for the selector
const TATTOO_STYLES = [
  'Tradicional',
  'Neo-tradicional',
  'Realismo',
  'Blackwork',
  'Geometrico',
  'Acuarela',
  'Japones',
  'Tribal',
  'Linework',
  'Ornamental',
  'Minimalista',
  'Lettering',
  'Old School',
  'New School',
  'Otro',
] as const

const BODY_PLACEMENTS = [
  'Brazo',
  'Antebrazo',
  'Muneca',
  'Mano',
  'Pierna',
  'Muslo',
  'Pantorrilla',
  'Tobillo',
  'Pie',
  'Espalda',
  'Pecho',
  'Costillas',
  'Cuello',
  'Cabeza',
  'Hombro',
  'Otro',
] as const

interface PortfolioUploadProps {
  item?: PortfolioItem
  onSuccess?: (item: PortfolioItem) => void
  onCancel?: () => void
}

interface FormState {
  image_url: string
  title: string
  description: string
  style: string
  body_placement: string
  is_available_design: boolean
  is_public: boolean
}

function buildInitialState(item?: PortfolioItem): FormState {
  return {
    image_url: item?.image_url ?? '',
    title: item?.title ?? '',
    description: item?.description ?? '',
    style: item?.style ?? '',
    body_placement: item?.body_placement ?? '',
    is_available_design: item?.is_available_design ?? false,
    is_public: item?.is_public ?? true,
  }
}

interface ToggleSwitchProps {
  id: string
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function ToggleSwitch({
  id,
  label,
  description,
  checked,
  onChange,
}: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <label
          htmlFor={id}
          className="text-sm font-medium text-ink-dark/80 cursor-pointer"
        >
          {label}
        </label>
        {description && (
          <p className="text-xs text-ink-dark/50 mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full',
          'transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50',
          checked ? 'bg-ink-orange' : 'bg-white/30 border border-white/40'
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'inline-block h-4 w-4 rounded-full bg-white shadow-sm',
            'transition-transform duration-200',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  )
}

export function PortfolioUpload({
  item,
  onSuccess,
  onCancel,
}: PortfolioUploadProps) {
  const uid = useId()
  const isEditing = !!item

  const [form, setForm] = useState<FormState>(buildInitialState(item))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (key === 'image_url') setImageError(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.image_url.trim()) {
      setImageError('La URL de la imagen es obligatoria')
      return
    }

    setIsLoading(true)
    setError(null)

    const input: CreatePortfolioInput = {
      image_url: form.image_url.trim(),
      ...(form.title.trim() && { title: form.title.trim() }),
      ...(form.description.trim() && { description: form.description.trim() }),
      ...(form.style && { style: form.style }),
      ...(form.body_placement && { body_placement: form.body_placement }),
      is_available_design: form.is_available_design,
      is_public: form.is_public,
    }

    const result = isEditing
      ? await updatePortfolioItem(item.id, input)
      : await createPortfolioItem(input)

    setIsLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    if (result.data) {
      onSuccess?.(result.data)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={isEditing ? 'Editar trabajo de portfolio' : 'Agregar trabajo al portfolio'}
      className="flex flex-col gap-5"
    >
      {/* Image URL */}
      <GlassInput
        id={`${uid}-image-url`}
        label="URL de la imagen *"
        type="url"
        placeholder="https://ejemplo.com/tatuaje.jpg"
        value={form.image_url}
        onChange={(e) => updateField('image_url', e.target.value)}
        icon={Link2}
        error={imageError ?? undefined}
        required
        aria-required="true"
      />

      {/* Image preview */}
      {form.image_url && !imageError && (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-white/20 border border-white/25">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={form.image_url}
            alt="Vista previa"
            className="w-full h-full object-cover"
            onError={() => setImageError('No se pudo cargar la imagen. Verifica la URL.')}
          />
        </div>
      )}

      {/* Title */}
      <GlassInput
        id={`${uid}-title`}
        label="Titulo"
        type="text"
        placeholder="Ej: Dragon tradicional japones"
        value={form.title}
        onChange={(e) => updateField('title', e.target.value)}
        icon={FileText}
        maxLength={200}
      />

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${uid}-description`}
          className="text-sm font-medium text-ink-dark/80"
        >
          Descripcion
        </label>
        <textarea
          id={`${uid}-description`}
          placeholder="Describe el trabajo: tecnica, detalles, inspiracion..."
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          maxLength={2000}
          rows={3}
          className={cn(
            'w-full px-4 py-3 text-sm text-ink-dark rounded-xl resize-none',
            'bg-white/15 backdrop-blur-md border border-white/20',
            'focus:border-ink-orange/50 focus:ring-2 focus:ring-ink-orange/20',
            'outline-none transition-all duration-200',
            'placeholder:text-gray-400'
          )}
        />
      </div>

      {/* Style selector */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${uid}-style`}
          className="text-sm font-medium text-ink-dark/80"
        >
          <Palette className="inline h-4 w-4 text-ink-orange mr-1.5" aria-hidden="true" />
          Estilo
        </label>
        <select
          id={`${uid}-style`}
          value={form.style}
          onChange={(e) => updateField('style', e.target.value)}
          className={cn(
            'w-full h-11 px-4 text-sm text-ink-dark rounded-xl',
            'bg-white/15 backdrop-blur-md border border-white/20',
            'focus:border-ink-orange/50 focus:ring-2 focus:ring-ink-orange/20',
            'outline-none transition-all duration-200',
            !form.style && 'text-gray-400'
          )}
        >
          <option value="">Seleccionar estilo...</option>
          {TATTOO_STYLES.map((style) => (
            <option key={style} value={style}>
              {style}
            </option>
          ))}
        </select>
      </div>

      {/* Body placement selector */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${uid}-placement`}
          className="text-sm font-medium text-ink-dark/80"
        >
          <MapPin className="inline h-4 w-4 text-ink-coral mr-1.5" aria-hidden="true" />
          Colocacion en el cuerpo
        </label>
        <select
          id={`${uid}-placement`}
          value={form.body_placement}
          onChange={(e) => updateField('body_placement', e.target.value)}
          className={cn(
            'w-full h-11 px-4 text-sm text-ink-dark rounded-xl',
            'bg-white/15 backdrop-blur-md border border-white/20',
            'focus:border-ink-orange/50 focus:ring-2 focus:ring-ink-orange/20',
            'outline-none transition-all duration-200',
            !form.body_placement && 'text-gray-400'
          )}
        >
          <option value="">Seleccionar zona...</option>
          {BODY_PLACEMENTS.map((placement) => (
            <option key={placement} value={placement}>
              {placement}
            </option>
          ))}
        </select>
      </div>

      {/* Toggles */}
      <div
        className={cn(
          'flex flex-col gap-4 p-4 rounded-2xl',
          'bg-white/15 backdrop-blur-sm border border-white/20'
        )}
      >
        <ToggleSwitch
          id={`${uid}-available`}
          label="Disponible para reservar"
          description="Los clientes podran reservar una cita para este diseno"
          checked={form.is_available_design}
          onChange={(v) => updateField('is_available_design', v)}
        />
        <div className="h-px bg-white/20" aria-hidden="true" />
        <ToggleSwitch
          id={`${uid}-public`}
          label="Publico"
          description="Visible en el portafolio publico del estudio"
          checked={form.is_public}
          onChange={(v) => updateField('is_public', v)}
        />
      </div>

      {/* Global error */}
      {error && (
        <p role="alert" className="text-sm text-red-500 font-medium">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className={cn(
              'flex-1 h-11 rounded-2xl text-sm font-medium',
              'bg-white/15 hover:bg-white/25 backdrop-blur-md',
              'border border-white/20 text-ink-dark',
              'transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50',
              'disabled:opacity-50 disabled:pointer-events-none'
            )}
          >
            Cancelar
          </button>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            'flex-1 h-11 rounded-2xl text-sm font-medium',
            'inline-flex items-center justify-center gap-2',
            'gradient-accent text-white shadow-warm',
            'hover:shadow-warm-lg hover:scale-[1.02]',
            'transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50',
            'disabled:opacity-50 disabled:pointer-events-none disabled:scale-100'
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="h-4 w-4" aria-hidden="true" />
          )}
          {isEditing ? 'Guardar cambios' : 'Agregar al portfolio'}
        </button>
      </div>
    </form>
  )
}

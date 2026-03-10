'use client'

import { useCallback } from 'react'
import { User, Mail, Phone, MapPin, FileText, Link, AlertCircle } from 'lucide-react'
import { GlassInput } from '@/shared/components'
import type { BookingFormData } from '../types/booking'

interface BookingDetailsFormProps {
  formData: Pick<
    BookingFormData,
    'clientName' | 'clientEmail' | 'clientPhone' | 'bodyPlacement' | 'notes' | 'designReferenceUrls'
  >
  onChange: (data: Partial<BookingFormData>) => void
  errors: Partial<Record<keyof BookingFormData, string>>
}

export function BookingDetailsForm({ formData, onChange, errors }: BookingDetailsFormProps) {
  const handleChange = useCallback(
    (field: keyof BookingFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange({ [field]: e.target.value })
    },
    [onChange]
  )

  return (
    <div className="flex flex-col gap-5">
      {/* Required fields notice */}
      <p className="text-xs text-gray-500 flex items-center gap-1">
        <AlertCircle className="h-3.5 w-3.5 text-ink-orange" aria-hidden="true" />
        Los campos marcados con <span className="text-ink-orange font-semibold">*</span> son obligatorios.
      </p>

      {/* Name */}
      <GlassInput
        label="Nombre completo *"
        id="client-name"
        icon={User}
        type="text"
        placeholder="Tu nombre y apellido"
        value={formData.clientName}
        onChange={handleChange('clientName')}
        error={errors.clientName}
        autoComplete="name"
        required
        aria-required="true"
      />

      {/* Email */}
      <GlassInput
        label="Correo electronico *"
        id="client-email"
        icon={Mail}
        type="email"
        placeholder="tu@email.com"
        value={formData.clientEmail}
        onChange={handleChange('clientEmail')}
        error={errors.clientEmail}
        autoComplete="email"
        required
        aria-required="true"
      />

      {/* Phone */}
      <GlassInput
        label="Telefono *"
        id="client-phone"
        icon={Phone}
        type="tel"
        placeholder="+1 234 567 8900"
        value={formData.clientPhone}
        onChange={handleChange('clientPhone')}
        error={errors.clientPhone}
        autoComplete="tel"
        required
        aria-required="true"
      />

      {/* Body placement */}
      <GlassInput
        label="Zona del cuerpo"
        id="body-placement"
        icon={MapPin}
        type="text"
        placeholder="Ej: antebrazo izquierdo, espalda alta..."
        value={formData.bodyPlacement}
        onChange={handleChange('bodyPlacement')}
        error={errors.bodyPlacement}
      />

      {/* Notes / tattoo description */}
      <div className="flex flex-col gap-1.5 w-full">
        <label
          htmlFor="notes"
          className="text-sm font-medium text-ink-dark/80 flex items-center gap-2"
        >
          <FileText className="h-4 w-4 text-ink-dark/40" aria-hidden="true" />
          Descripcion del tatuaje
        </label>
        <textarea
          id="notes"
          rows={3}
          placeholder="Describe tu idea, estilo deseado, colores, referencias..."
          value={formData.notes}
          onChange={handleChange('notes')}
          className="w-full px-4 py-3 text-sm text-ink-dark bg-white/15 backdrop-blur-md border border-white/20 focus:border-ink-orange/50 focus:ring-2 focus:ring-ink-orange/20 rounded-xl transition-all duration-200 placeholder:text-gray-400 outline-none resize-none"
          aria-describedby={errors.notes ? 'notes-error' : undefined}
        />
        {errors.notes && (
          <p id="notes-error" role="alert" className="text-xs text-red-500 font-medium">
            {errors.notes}
          </p>
        )}
      </div>

      {/* Design reference URLs */}
      <div className="flex flex-col gap-1.5 w-full">
        <label
          htmlFor="design-refs"
          className="text-sm font-medium text-ink-dark/80 flex items-center gap-2"
        >
          <Link className="h-4 w-4 text-ink-dark/40" aria-hidden="true" />
          Referencias de diseno (URLs)
        </label>
        <textarea
          id="design-refs"
          rows={2}
          placeholder="Pega URLs de imagenes de referencia, una por linea o separadas por coma..."
          value={formData.designReferenceUrls}
          onChange={handleChange('designReferenceUrls')}
          className="w-full px-4 py-3 text-sm text-ink-dark bg-white/15 backdrop-blur-md border border-white/20 focus:border-ink-orange/50 focus:ring-2 focus:ring-ink-orange/20 rounded-xl transition-all duration-200 placeholder:text-gray-400 outline-none resize-none"
          aria-describedby="design-refs-hint"
        />
        <p id="design-refs-hint" className="text-xs text-gray-400">
          Puedes pegar links de Instagram, Pinterest, etc.
        </p>
      </div>
    </div>
  )
}

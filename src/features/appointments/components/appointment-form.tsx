'use client'

import { useEffect, useState, useCallback } from 'react'
import { format, parseISO, addMinutes } from 'date-fns'
import {
  User,
  Phone,
  Mail,
  MapPin,
  Link as LinkIcon,
  DollarSign,
  Clock,
  Calendar,
} from 'lucide-react'
import { GlassButton, GlassInput } from '@/shared/components'
import { cn, glass } from '@/shared/lib/utils'
import {
  createAppointment,
  updateAppointment,
  getServices,
  getArtists,
} from '@/features/appointments/services/appointment-service'
import type { Profile } from '@/features/auth/types/auth'
import type {
  Appointment,
  Service,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from '@/features/appointments/types/appointment'

interface AppointmentFormProps {
  appointment?: Appointment
  onSuccess?: (appointment: Appointment) => void
}

interface FormState {
  client_name: string
  client_phone: string
  client_email: string
  artist_id: string
  service_id: string
  date: string
  start_time: string
  end_time: string
  price: string
  deposit: string
  body_placement: string
  notes: string
  design_reference_urls: string
}

interface FormErrors {
  client_name?: string
  artist_id?: string
  date?: string
  start_time?: string
  end_time?: string
}

function buildInitialState(appointment?: Appointment): FormState {
  if (appointment) {
    const starts = parseISO(appointment.starts_at)
    const ends = parseISO(appointment.ends_at)
    return {
      client_name: appointment.client_name ?? appointment.client?.full_name ?? '',
      client_phone: appointment.client_phone ?? appointment.client?.phone ?? '',
      client_email: appointment.client_email ?? '',
      artist_id: appointment.artist_id,
      service_id: appointment.service_id ?? '',
      date: format(starts, 'yyyy-MM-dd'),
      start_time: format(starts, 'HH:mm'),
      end_time: format(ends, 'HH:mm'),
      price: appointment.price != null ? String(appointment.price) : '',
      deposit: appointment.deposit != null ? String(appointment.deposit) : '',
      body_placement: appointment.body_placement ?? '',
      notes: appointment.notes ?? '',
      design_reference_urls: appointment.design_reference_urls?.join(', ') ?? '',
    }
  }

  const now = new Date()
  return {
    client_name: '',
    client_phone: '',
    client_email: '',
    artist_id: '',
    service_id: '',
    date: format(now, 'yyyy-MM-dd'),
    start_time: format(now, 'HH:mm'),
    end_time: format(addMinutes(now, 60), 'HH:mm'),
    price: '',
    deposit: '',
    body_placement: '',
    notes: '',
    design_reference_urls: '',
  }
}

function validate(state: FormState): FormErrors {
  const errors: FormErrors = {}
  if (!state.client_name.trim()) {
    errors.client_name = 'El nombre del cliente es requerido'
  }
  if (!state.artist_id) {
    errors.artist_id = 'Debes seleccionar un artista'
  }
  if (!state.date) {
    errors.date = 'La fecha es requerida'
  }
  if (!state.start_time) {
    errors.start_time = 'La hora de inicio es requerida'
  }
  if (!state.end_time) {
    errors.end_time = 'La hora de fin es requerida'
  }
  return errors
}

// Simple select that matches the glass aesthetic
interface GlassSelectProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  children: React.ReactNode
}

function GlassSelect({
  id,
  label,
  value,
  onChange,
  error,
  children,
}: GlassSelectProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={id} className="text-sm font-medium text-ink-dark/80">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          glass.input,
          'w-full h-11 px-4 text-sm text-ink-dark outline-none appearance-none cursor-pointer',
          error && 'border-red-400/60 focus:border-red-400/80'
        )}
      >
        {children}
      </select>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-500 font-medium">
          {error}
        </p>
      )}
    </div>
  )
}

// Textarea that matches the glass aesthetic
interface GlassTextareaProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}

function GlassTextarea({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: GlassTextareaProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={id} className="text-sm font-medium text-ink-dark/80">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          glass.input,
          'w-full px-4 py-3 text-sm text-ink-dark outline-none resize-none'
        )}
      />
    </div>
  )
}

export function AppointmentForm({ appointment, onSuccess }: AppointmentFormProps) {
  const isEditMode = Boolean(appointment)

  const [form, setForm] = useState<FormState>(() => buildInitialState(appointment))
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [artists, setArtists] = useState<Profile[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [isLoadingMeta, setIsLoadingMeta] = useState(true)

  const setField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
      if (errors[key as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [key]: undefined }))
      }
    },
    [errors]
  )

  // Auto-calculate end time when service changes
  const handleServiceChange = useCallback(
    (serviceId: string) => {
      setField('service_id', serviceId)
      if (serviceId && form.start_time) {
        const svc = services.find((s) => s.id === serviceId)
        if (svc && form.date) {
          const [h, m] = form.start_time.split(':').map(Number)
          const startDate = new Date(form.date)
          startDate.setHours(h ?? 0, m ?? 0, 0, 0)
          const endDate = addMinutes(startDate, svc.duration_minutes)
          setField('end_time', format(endDate, 'HH:mm'))
        }
      }
    },
    [services, form.start_time, form.date, setField]
  )

  useEffect(() => {
    async function loadMeta() {
      setIsLoadingMeta(true)
      const [artistsResult, servicesResult] = await Promise.all([
        getArtists(),
        getServices(),
      ])
      if (artistsResult.data) {
        setArtists(artistsResult.data)
      }
      if (servicesResult.data) {
        setServices(servicesResult.data)
      }
      setIsLoadingMeta(false)
    }
    loadMeta()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)

    try {
      // Build local datetime and convert to ISO with offset
      const startLocal = new Date(`${form.date}T${form.start_time}:00`)
      const endLocal = new Date(`${form.date}T${form.end_time}:00`)
      const starts_at = startLocal.toISOString()
      const ends_at = endLocal.toISOString()

      const designUrls = form.design_reference_urls
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean)

      if (isEditMode && appointment) {
        const input: UpdateAppointmentInput = {
          starts_at,
          ends_at,
          client_name: form.client_name.trim() || undefined,
          client_phone: form.client_phone.trim() || undefined,
          body_placement: form.body_placement.trim() || undefined,
          notes: form.notes.trim() || undefined,
          price: form.price ? Number(form.price) : undefined,
          deposit: form.deposit ? Number(form.deposit) : undefined,
        }
        const { data, error } = await updateAppointment(appointment.id, input)
        if (error) {
          setServerError(error)
        } else if (data) {
          onSuccess?.(data)
        }
      } else {
        const input: CreateAppointmentInput = {
          artist_id: form.artist_id,
          service_id: form.service_id || undefined,
          starts_at,
          ends_at,
          client_name: form.client_name.trim() || undefined,
          client_phone: form.client_phone.trim() || undefined,
          client_email: form.client_email.trim() || undefined,
          body_placement: form.body_placement.trim() || undefined,
          notes: form.notes.trim() || undefined,
          price: form.price ? Number(form.price) : undefined,
          deposit: form.deposit ? Number(form.deposit) : undefined,
          design_reference_urls: designUrls.length > 0 ? designUrls : undefined,
        }
        const { data, error } = await createAppointment(input)
        if (error) {
          setServerError(error)
        } else if (data) {
          onSuccess?.(data)
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Formulario de cita">
      <div className="flex flex-col gap-5">
        {/* --- Client section --- */}
        <fieldset>
          <legend className="text-xs font-semibold text-ink-orange uppercase tracking-wider mb-3">
            Datos del cliente
          </legend>
          <div className="flex flex-col gap-3">
            <GlassInput
              label="Nombre completo"
              id="client_name"
              icon={User}
              value={form.client_name}
              onChange={(e) => setField('client_name', e.target.value)}
              placeholder="Maria Garcia"
              error={errors.client_name}
              required
              aria-required="true"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <GlassInput
                label="Telefono"
                id="client_phone"
                icon={Phone}
                type="tel"
                value={form.client_phone}
                onChange={(e) => setField('client_phone', e.target.value)}
                placeholder="+34 600 000 000"
              />
              <GlassInput
                label="Email"
                id="client_email"
                icon={Mail}
                type="email"
                value={form.client_email}
                onChange={(e) => setField('client_email', e.target.value)}
                placeholder="cliente@email.com"
              />
            </div>
          </div>
        </fieldset>

        {/* --- Session section --- */}
        <fieldset>
          <legend className="text-xs font-semibold text-ink-orange uppercase tracking-wider mb-3">
            Sesion
          </legend>
          <div className="flex flex-col gap-3">
            {/* Artist selector */}
            <GlassSelect
              id="artist_id"
              label="Artista"
              value={form.artist_id}
              onChange={(v) => setField('artist_id', v)}
              error={errors.artist_id}
            >
              <option value="">
                {isLoadingMeta ? 'Cargando artistas...' : 'Selecciona un artista'}
              </option>
              {artists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name ?? 'Sin nombre'}
                </option>
              ))}
            </GlassSelect>

            {/* Service selector */}
            <GlassSelect
              id="service_id"
              label="Servicio"
              value={form.service_id}
              onChange={handleServiceChange}
            >
              <option value="">
                {isLoadingMeta ? 'Cargando servicios...' : 'Selecciona un servicio (opcional)'}
              </option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.duration_minutes} min)
                </option>
              ))}
            </GlassSelect>

            {/* Date */}
            <GlassInput
              label="Fecha"
              id="date"
              icon={Calendar}
              type="date"
              value={form.date}
              onChange={(e) => setField('date', e.target.value)}
              error={errors.date}
              required
              aria-required="true"
            />

            {/* Time range */}
            <div className="grid grid-cols-2 gap-3">
              <GlassInput
                label="Hora inicio"
                id="start_time"
                icon={Clock}
                type="time"
                value={form.start_time}
                onChange={(e) => setField('start_time', e.target.value)}
                error={errors.start_time}
                required
                aria-required="true"
              />
              <GlassInput
                label="Hora fin"
                id="end_time"
                icon={Clock}
                type="time"
                value={form.end_time}
                onChange={(e) => setField('end_time', e.target.value)}
                error={errors.end_time}
                required
                aria-required="true"
              />
            </div>
          </div>
        </fieldset>

        {/* --- Pricing section --- */}
        <fieldset>
          <legend className="text-xs font-semibold text-ink-orange uppercase tracking-wider mb-3">
            Precio
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <GlassInput
              label="Precio total"
              id="price"
              icon={DollarSign}
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setField('price', e.target.value)}
              placeholder="150.00"
            />
            <GlassInput
              label="Deposito"
              id="deposit"
              icon={DollarSign}
              type="number"
              min="0"
              step="0.01"
              value={form.deposit}
              onChange={(e) => setField('deposit', e.target.value)}
              placeholder="50.00"
            />
          </div>
        </fieldset>

        {/* --- Details section --- */}
        <fieldset>
          <legend className="text-xs font-semibold text-ink-orange uppercase tracking-wider mb-3">
            Detalles del tattoo
          </legend>
          <div className="flex flex-col gap-3">
            <GlassInput
              label="Zona del cuerpo"
              id="body_placement"
              icon={MapPin}
              value={form.body_placement}
              onChange={(e) => setField('body_placement', e.target.value)}
              placeholder="Ej: antebrazo izquierdo"
            />
            <GlassInput
              label="Referencias de diseno (URLs separadas por coma)"
              id="design_reference_urls"
              icon={LinkIcon}
              type="url"
              value={form.design_reference_urls}
              onChange={(e) => setField('design_reference_urls', e.target.value)}
              placeholder="https://pinterest.com/pin/..., https://..."
            />
            <GlassTextarea
              id="notes"
              label="Notas adicionales"
              value={form.notes}
              onChange={(v) => setField('notes', v)}
              placeholder="Instrucciones especiales, preferencias del cliente..."
              rows={3}
            />
          </div>
        </fieldset>

        {/* Server error */}
        {serverError && (
          <div
            role="alert"
            className="rounded-xl bg-red-100/60 border border-red-200/60 px-4 py-3 text-sm text-red-700 font-medium"
          >
            {serverError}
          </div>
        )}

        {/* Submit */}
        <GlassButton
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          className="w-full mt-1"
        >
          {isEditMode ? 'Actualizar Cita' : 'Crear Cita'}
        </GlassButton>
      </div>
    </form>
  )
}

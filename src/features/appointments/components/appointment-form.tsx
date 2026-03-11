'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
  CheckCircle,
} from 'lucide-react'
import { GlassButton, GlassInput } from '@/shared/components'
import { cn, glass } from '@/shared/lib/utils'
import {
  createAppointment,
  updateAppointment,
  getServices,
  getArtists,
} from '@/features/appointments/services/appointment-service'
import { buildGoogleCalendarUrl } from '@/shared/lib/calendar-url'
import { ConsentCheckbox } from './consent-checkbox'
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
  consent_accepted: boolean
}

interface FormErrors {
  client_name?: string
  artist_id?: string
  date?: string
  start_time?: string
  end_time?: string
  consent?: string
}

function recalcEndTime(startTime: string, date: string, durationMinutes: number): string {
  if (!startTime || !date) return ''
  const [h, m] = startTime.split(':').map(Number)
  const startDate = new Date(date)
  startDate.setHours(h ?? 0, m ?? 0, 0, 0)
  return format(addMinutes(startDate, durationMinutes), 'HH:mm')
}

function buildInitialDuration(appointment?: Appointment): number {
  if (appointment) {
    const starts = new Date(appointment.starts_at)
    const ends = new Date(appointment.ends_at)
    const diff = Math.round((ends.getTime() - starts.getTime()) / 60000)
    return diff > 0 ? diff : 60
  }
  return 60
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
      consent_accepted: false,
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
    consent_accepted: false,
  }
}

function validate(state: FormState, isEditMode: boolean): FormErrors {
  const errors: FormErrors = {}
  if (!state.client_name.trim()) errors.client_name = 'El nombre del cliente es requerido'
  if (!state.artist_id) errors.artist_id = 'Debes seleccionar un artista'
  if (!state.date) errors.date = 'La fecha es requerida'
  if (!state.start_time) errors.start_time = 'La hora de inicio es requerida'
  if (!state.end_time) errors.end_time = 'La hora de fin es requerida'
  if (!isEditMode && !state.consent_accepted) {
    errors.consent = 'El cliente debe aceptar el consentimiento para continuar'
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

function GlassSelect({ id, label, value, onChange, error, children }: GlassSelectProps) {
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

function GlassTextarea({ id, label, value, onChange, placeholder, rows = 3 }: GlassTextareaProps) {
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
        className={cn(glass.input, 'w-full px-4 py-3 text-sm text-ink-dark outline-none resize-none')}
      />
    </div>
  )
}

// Duration selector (hours + minutes)
interface DurationSelectProps {
  durationMinutes: number
  onChange: (minutes: number) => void
}

function DurationSelect({ durationMinutes, onChange }: DurationSelectProps) {
  const hours = Math.floor(durationMinutes / 60)
  const mins = durationMinutes % 60

  function handleHours(h: number) {
    onChange(h * 60 + mins)
  }
  function handleMins(m: number) {
    const newTotal = hours * 60 + m
    onChange(newTotal > 0 ? newTotal : 15)
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <span className="text-sm font-medium text-ink-dark/80">Duracion</span>
      <div className="grid grid-cols-2 gap-2">
        <select
          value={hours}
          onChange={(e) => handleHours(Number(e.target.value))}
          className={cn(
            glass.input,
            'w-full h-11 px-4 text-sm text-ink-dark outline-none appearance-none cursor-pointer'
          )}
        >
          {Array.from({ length: 13 }, (_, i) => (
            <option key={i} value={i}>
              {i}h
            </option>
          ))}
        </select>
        <select
          value={mins}
          onChange={(e) => handleMins(Number(e.target.value))}
          className={cn(
            glass.input,
            'w-full h-11 px-4 text-sm text-ink-dark outline-none appearance-none cursor-pointer'
          )}
        >
          {[0, 15, 30, 45].map((m) => (
            <option key={m} value={m}>
              {m}min
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

// Success screen shown after creating an appointment
interface SuccessScreenProps {
  appointment: Appointment
  onViewAgenda: () => void
}

function SuccessScreen({ appointment, onViewAgenda }: SuccessScreenProps) {
  const gcalUrl = buildGoogleCalendarUrl(appointment)

  return (
    <div className="flex flex-col items-center gap-5 py-8 text-center">
      <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-emerald-500" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-ink-dark">Cita creada!</h3>
        <p className="text-sm text-ink-dark/60 mt-1">La cita ha sido registrada correctamente.</p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <a
          href={gcalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 h-11 px-5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-ink-dark text-sm font-medium transition-all duration-200"
        >
          <Calendar className="h-4 w-4 text-ink-orange" />
          Agregar a Google Calendar
        </a>
        <GlassButton variant="primary" size="md" className="w-full" onClick={onViewAgenda}>
          Ver agenda
        </GlassButton>
      </div>
    </div>
  )
}

export function AppointmentForm({ appointment, onSuccess }: AppointmentFormProps) {
  const router = useRouter()
  const isEditMode = Boolean(appointment)

  const [form, setForm] = useState<FormState>(() => buildInitialState(appointment))
  const [durationMinutes, setDurationMinutes] = useState<number>(() =>
    buildInitialDuration(appointment)
  )
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successAppointment, setSuccessAppointment] = useState<Appointment | null>(null)

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

  // Auto-navigate after showing success
  useEffect(() => {
    if (!successAppointment) return
    const timer = setTimeout(() => router.push('/appointments'), 3000)
    return () => clearTimeout(timer)
  }, [successAppointment, router])

  // Handle duration change → recalc end_time
  const handleDurationChange = useCallback(
    (newDuration: number) => {
      setDurationMinutes(newDuration)
      if (form.start_time && form.date) {
        const newEnd = recalcEndTime(form.start_time, form.date, newDuration)
        setForm((prev) => ({ ...prev, end_time: newEnd }))
      }
    },
    [form.start_time, form.date]
  )

  // Handle start_time change → keep duration, recalc end_time
  const handleStartTimeChange = useCallback(
    (newStart: string) => {
      const newEnd = form.date
        ? recalcEndTime(newStart, form.date, durationMinutes)
        : form.end_time
      setForm((prev) => ({ ...prev, start_time: newStart, end_time: newEnd }))
      setErrors((prev) => ({ ...prev, start_time: undefined, end_time: undefined }))
    },
    [form.date, form.end_time, durationMinutes]
  )

  // Handle service change → update duration, recalc end_time
  const handleServiceChange = useCallback(
    (serviceId: string) => {
      if (serviceId) {
        const svc = services.find((s) => s.id === serviceId)
        if (svc && form.date && form.start_time) {
          const newDuration = svc.duration_minutes
          setDurationMinutes(newDuration)
          const newEnd = recalcEndTime(form.start_time, form.date, newDuration)
          setForm((prev) => ({ ...prev, service_id: serviceId, end_time: newEnd }))
          return
        }
      }
      setField('service_id', serviceId)
    },
    [services, form.start_time, form.date, setField]
  )

  useEffect(() => {
    async function loadMeta() {
      setIsLoadingMeta(true)
      const [artistsResult, servicesResult] = await Promise.all([getArtists(), getServices()])
      if (artistsResult.data) setArtists(artistsResult.data)
      if (servicesResult.data) setServices(servicesResult.data)
      setIsLoadingMeta(false)
    }
    loadMeta()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const validationErrors = validate(form, isEditMode)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)

    try {
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
          consent_accepted: form.consent_accepted,
          consent_accepted_at: form.consent_accepted ? new Date().toISOString() : undefined,
        }
        const { data, error } = await createAppointment(input)
        if (error) {
          setServerError(error)
        } else if (data) {
          if (onSuccess) {
            onSuccess(data)
          } else {
            setSuccessAppointment(data)
          }
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (successAppointment) {
    return (
      <SuccessScreen
        appointment={successAppointment}
        onViewAgenda={() => router.push('/appointments')}
      />
    )
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

            <GlassInput
              label="Hora inicio"
              id="start_time"
              icon={Clock}
              type="time"
              value={form.start_time}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              error={errors.start_time}
              required
              aria-required="true"
            />

            <DurationSelect durationMinutes={durationMinutes} onChange={handleDurationChange} />

            <GlassInput
              label="Hora fin (auto-calculada)"
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

        {/* --- Consent (new appointments only) --- */}
        {!isEditMode && (
          <ConsentCheckbox
            value={form.consent_accepted}
            onChange={(v) => {
              setForm((prev) => ({ ...prev, consent_accepted: v }))
              if (errors.consent) setErrors((prev) => ({ ...prev, consent: undefined }))
            }}
            error={errors.consent}
          />
        )}

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

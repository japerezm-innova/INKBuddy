'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { GlassInput, GlassButton } from '@/shared/components'
import { cn } from '@/shared/lib/utils'
import { createClient_, updateClient } from '../services/client-service'
import type { Client, CreateClientInput } from '../types/client'

interface ClientFormProps {
  client?: Client
  onSuccess?: (client: Client) => void
}

type GenderOption = {
  value: NonNullable<Client['gender']>
  label: string
}

type SourceOption = {
  value: NonNullable<Client['source']>
  label: string
}

const GENDER_OPTIONS: GenderOption[] = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
  { value: 'other', label: 'Otro' },
  { value: 'prefer_not_to_say', label: 'Prefiero no decir' },
]

const SOURCE_OPTIONS: SourceOption[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'referral', label: 'Referido' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'website', label: 'Web' },
  { value: 'other', label: 'Otro' },
]

export function ClientForm({ client, onSuccess }: ClientFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [fullName, setFullName] = useState(client?.full_name ?? '')
  const [email, setEmail] = useState(client?.email ?? '')
  const [phone, setPhone] = useState(client?.phone ?? '')
  const [gender, setGender] = useState<Client['gender']>(client?.gender ?? null)
  const [birthDate, setBirthDate] = useState(client?.birth_date ?? '')
  const [profession, setProfession] = useState(client?.profession ?? '')
  const [source, setSource] = useState<Client['source']>(client?.source ?? null)
  const [notes, setNotes] = useState(client?.notes ?? '')

  const isEditMode = !!client

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!fullName.trim()) {
      setError('El nombre completo es requerido')
      return
    }

    const input: CreateClientInput = {
      full_name: fullName.trim(),
      ...(email.trim() && { email: email.trim() }),
      ...(phone.trim() && { phone: phone.trim() }),
      ...(gender && { gender }),
      ...(birthDate && { birth_date: birthDate }),
      ...(profession.trim() && { profession: profession.trim() }),
      ...(source && { source }),
      ...(notes.trim() && { notes: notes.trim() }),
    }

    startTransition(async () => {
      if (isEditMode) {
        const result = await updateClient(client.id, input)
        if (result.error) {
          setError(result.error)
          return
        }
        if (result.data) {
          onSuccess?.(result.data)
          router.push(`/clients/${client.id}`)
        }
      } else {
        const result = await createClient_(input)
        if (result.error) {
          setError(result.error)
          return
        }
        if (result.data) {
          onSuccess?.(result.data)
          router.push(`/clients/${result.data.id}`)
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Full name */}
      <GlassInput
        label="Nombre completo *"
        id="full_name"
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Ana Garcia"
        required
        autoComplete="name"
      />

      {/* Email + Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <GlassInput
          label="Email"
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ana@example.com"
          autoComplete="email"
        />
        <GlassInput
          label="Telefono"
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+52 55 1234 5678"
          autoComplete="tel"
        />
      </div>

      {/* Gender pills */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink-dark/80">Genero</span>
        <div className="flex flex-wrap gap-2">
          {GENDER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setGender(gender === opt.value ? null : opt.value)}
              aria-pressed={gender === opt.value}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 border',
                gender === opt.value
                  ? 'gradient-accent text-white border-transparent shadow-warm'
                  : 'bg-white/15 backdrop-blur-md border-white/20 text-ink-dark/70 hover:bg-white/25'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Birth date + Profession */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <GlassInput
          label="Fecha de nacimiento"
          id="birth_date"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />
        <GlassInput
          label="Profesion"
          id="profession"
          type="text"
          value={profession}
          onChange={(e) => setProfession(e.target.value)}
          placeholder="Diseñadora grafica"
        />
      </div>

      {/* Source pills */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink-dark/80">Como nos encontro</span>
        <div className="flex flex-wrap gap-2">
          {SOURCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSource(source === opt.value ? null : opt.value)}
              aria-pressed={source === opt.value}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 border',
                source === opt.value
                  ? 'gradient-accent text-white border-transparent shadow-warm'
                  : 'bg-white/15 backdrop-blur-md border-white/20 text-ink-dark/70 hover:bg-white/25'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-ink-dark/80">
          Notas
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Alergias, preferencias, referencias de estilo..."
          className={cn(
            'w-full px-4 py-3 text-sm text-ink-dark rounded-xl resize-none outline-none',
            'bg-white/15 backdrop-blur-md border border-white/20',
            'focus:border-ink-orange/50 focus:ring-2 focus:ring-ink-orange/20',
            'transition-all duration-200 placeholder:text-gray-400'
          )}
        />
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="px-4 py-3 rounded-xl bg-red-100/80 border border-red-200/60 text-red-700 text-sm font-medium"
        >
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <GlassButton
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={isPending}
          className="flex-1"
        >
          Cancelar
        </GlassButton>
        <GlassButton
          type="submit"
          variant="primary"
          isLoading={isPending}
          className="flex-1"
        >
          {isEditMode ? 'Guardar cambios' : 'Crear cliente'}
        </GlassButton>
      </div>
    </form>
  )
}

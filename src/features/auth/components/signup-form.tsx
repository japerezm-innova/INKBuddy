'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Mail, Lock, Crown, Palette } from 'lucide-react'
import { GlassButton, GlassInput } from '@/shared/components'
import { cn } from '@/shared/lib/utils'
import { signupWithEmail } from '@/features/auth/services/auth-service'
import type { Role } from '@/features/auth/types/auth'

interface FormState {
  fullName: string
  email: string
  password: string
  role: Role
}

interface RoleOption {
  value: Role
  label: string
  description: string
  Icon: React.ComponentType<{ className?: string }>
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'owner',
    label: 'Soy Dueno del Estudio',
    description: 'Gestiono mi negocio',
    Icon: Crown,
  },
  {
    value: 'artist',
    label: 'Soy Artista',
    description: 'Trabajo como tatuador',
    Icon: Palette,
  },
]

export function SignupForm() {
  const router = useRouter()

  const [form, setForm] = useState<FormState>({
    fullName: '',
    email: '',
    password: '',
    role: 'owner',
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleRoleSelect(role: Role) {
    setForm((prev) => ({ ...prev, role }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await signupWithEmail(
        form.email,
        form.password,
        form.fullName,
        form.role
      )

      if (result.error) {
        setError(result.error)
        return
      }

      router.push('/login')
    } catch {
      setError('Ocurrio un error inesperado. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <GlassInput
        label="Nombre completo"
        id="fullName"
        name="fullName"
        type="text"
        autoComplete="name"
        placeholder="Juan Garcia"
        icon={User}
        value={form.fullName}
        onChange={handleChange}
        required
        disabled={isLoading}
      />

      <GlassInput
        label="Correo electronico"
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="tu@correo.com"
        icon={Mail}
        value={form.email}
        onChange={handleChange}
        required
        disabled={isLoading}
      />

      <GlassInput
        label="Contrasena"
        id="password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        icon={Lock}
        value={form.password}
        onChange={handleChange}
        required
        disabled={isLoading}
      />

      <fieldset>
        <legend className="mb-3 text-sm font-medium text-ink-dark/80">
          Tu rol en el estudio
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {ROLE_OPTIONS.map(({ value, label, description, Icon }) => {
            const isSelected = form.role === value

            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleRoleSelect(value)}
                disabled={isLoading}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50',
                  'disabled:pointer-events-none disabled:opacity-50',
                  isSelected
                    ? 'border-ink-orange bg-ink-orange/10 shadow-sm'
                    : 'border-white/25 bg-white/15 backdrop-blur-md hover:bg-white/25'
                )}
              >
                <Icon
                  className={cn(
                    'h-6 w-6 transition-colors duration-200',
                    isSelected ? 'text-ink-orange' : 'text-ink-dark/50'
                  )}
                />
                <span
                  className={cn(
                    'text-xs font-semibold leading-tight transition-colors duration-200',
                    isSelected ? 'text-ink-orange' : 'text-ink-dark/70'
                  )}
                >
                  {label}
                </span>
                <span className="text-[11px] text-gray-400 leading-tight">
                  {description}
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200/60 bg-red-50/40 px-4 py-3 backdrop-blur-sm"
        >
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      )}

      <GlassButton
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        className="w-full mt-1"
      >
        Crear Cuenta
      </GlassButton>

      <p className="text-center text-sm text-gray-500">
        Ya tienes cuenta?{' '}
        <Link
          href="/login"
          className="font-semibold text-ink-orange hover:text-ink-coral transition-colors duration-200 underline-offset-2 hover:underline"
        >
          Inicia Sesion
        </Link>
      </p>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock } from 'lucide-react'
import { GlassButton, GlassInput } from '@/shared/components'
import { loginWithEmail } from '@/features/auth/services/auth-service'

interface FormState {
  email: string
  password: string
}

export function LoginForm() {
  const router = useRouter()

  const [form, setForm] = useState<FormState>({ email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await loginWithEmail(form.email, form.password)

      if (result.error) {
        setError(result.error)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Ocurrio un error inesperado. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
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
        autoComplete="current-password"
        placeholder="••••••••"
        icon={Lock}
        value={form.password}
        onChange={handleChange}
        required
        disabled={isLoading}
      />

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
        Iniciar Sesion
      </GlassButton>

      <p className="text-center text-sm text-gray-500">
        No tienes cuenta?{' '}
        <Link
          href="/signup"
          className="font-semibold text-ink-orange hover:text-ink-coral transition-colors duration-200 underline-offset-2 hover:underline"
        >
          Registrate
        </Link>
      </p>
    </form>
  )
}

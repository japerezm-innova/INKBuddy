import { LoginForm } from '@/features/auth/components'

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Bienvenido de vuelta</h1>
      <p className="text-gray-500 mb-8">Inicia sesion en tu cuenta</p>
      <LoginForm />
    </div>
  )
}

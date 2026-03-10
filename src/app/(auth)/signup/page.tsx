import { SignupForm } from '@/features/auth/components'

export default function SignupPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Crea tu cuenta</h1>
      <p className="text-gray-500 mb-8">Configura tu estudio en minutos</p>
      <SignupForm />
    </div>
  )
}

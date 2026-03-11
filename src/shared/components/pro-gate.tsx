import { Lock } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/features/auth/services/auth-service'

interface ProGateProps {
  children: React.ReactNode
}

function FreemiumOverlay() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center">
      <div className="h-16 w-16 rounded-full bg-ink-orange/20 flex items-center justify-center mb-2">
        <Lock className="h-7 w-7 text-ink-orange" />
      </div>
      <h2 className="text-xl font-bold text-ink-dark">Función Pro</h2>
      <p className="text-sm text-ink-dark/60 max-w-xs">
        Esta función está disponible en el plan Pro. Activa tu código de acceso en Configuración.
      </p>
      <Link
        href="/settings"
        className="mt-2 px-6 py-3 rounded-2xl bg-ink-orange text-white font-medium text-sm hover:bg-ink-orange/90 transition-colors"
      >
        Activar código Pro
      </Link>
    </div>
  )
}

export async function ProGate({ children }: ProGateProps) {
  const { data: profile } = await getProfile()
  if (!profile) return null

  const supabase = await createClient()
  const { data: studio } = await supabase
    .from('studios')
    .select('plan')
    .eq('id', profile.studio_id)
    .single()

  if (studio?.plan === 'pro') {
    return <>{children}</>
  }

  return <FreemiumOverlay />
}

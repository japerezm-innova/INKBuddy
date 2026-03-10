import { redirect } from 'next/navigation'
import { getProfile } from '@/features/auth/services/auth-service'
import { HashtagManager } from '@/features/marketing/components'
import { Hash } from 'lucide-react'

export const metadata = {
  title: 'Hashtags | Marketing | INKBuddy',
  description: 'Gestiona tus colecciones de hashtags',
}

export default async function HashtagsPage() {
  const { data: profile } = await getProfile()

  if (!profile || profile.role !== 'owner') {
    redirect('/dashboard')
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <header className="mb-6 flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-2xl gradient-accent flex items-center justify-center shadow-warm shrink-0"
          aria-hidden="true"
        >
          <Hash className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-ink-dark">
            Colecciones de Hashtags
          </h1>
          <p className="text-sm text-ink-dark/50 mt-0.5">
            Hashtags optimizados por estilo de tatuaje
          </p>
        </div>
      </header>

      <main>
        <HashtagManager />
      </main>
    </div>
  )
}

import { redirect } from 'next/navigation'
import { getProfile } from '@/features/auth/services/auth-service'
import { PostPlanner, MetricsInputForm } from '@/features/marketing/components'
import { Send } from 'lucide-react'

export const metadata = {
  title: 'Editar Publicacion | Marketing | INKBuddy',
  description: 'Edita tu publicacion de redes sociales',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: PageProps) {
  const { data: profile } = await getProfile()

  if (!profile || profile.role !== 'owner') {
    redirect('/dashboard')
  }

  const { id } = await params

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <header className="mb-6 flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-2xl gradient-accent flex items-center justify-center shadow-warm shrink-0"
          aria-hidden="true"
        >
          <Send className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-ink-dark">
            Editar Publicacion
          </h1>
          <p className="text-sm text-ink-dark/50 mt-0.5">
            Modifica tu publicacion
          </p>
        </div>
      </header>

      <main className="space-y-6">
        <PostPlanner />
        <MetricsInputForm postId={id} />
      </main>
    </div>
  )
}

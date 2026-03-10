import { redirect } from 'next/navigation'
import { getProfile } from '@/features/auth/services/auth-service'
import { ContentCalendar } from '@/features/marketing/components'
import { Calendar } from 'lucide-react'

export const metadata = {
  title: 'Calendario | Marketing | INKBuddy',
  description: 'Planifica tu contenido en redes sociales',
}

export default async function CalendarPage() {
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
          <Calendar className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-ink-dark">
            Calendario de Contenido
          </h1>
          <p className="text-sm text-ink-dark/50 mt-0.5">
            Planifica tus publicaciones
          </p>
        </div>
      </header>

      <main>
        <ContentCalendar />
      </main>
    </div>
  )
}

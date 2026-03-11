import { redirect } from 'next/navigation'
import { getProfile } from '@/features/auth/services/auth-service'
import { MarketingDashboard, RecommendationsPanel } from '@/features/marketing/components'
import { ProGate } from '@/shared/components'
import { Megaphone } from 'lucide-react'

export const metadata = {
  title: 'Marketing | INKBuddy',
  description: 'Optimiza tu presencia en Instagram y TikTok',
}

export default async function MarketingPage() {
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
          <Megaphone className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-ink-dark">
            Marketing
          </h1>
          <p className="text-sm text-ink-dark/50 mt-0.5">
            Optimiza tu presencia en redes sociales
          </p>
        </div>
      </header>

      <main className="space-y-6">
        <ProGate>
          <MarketingDashboard />
          <RecommendationsPanel platform="instagram" />
        </ProGate>
      </main>
    </div>
  )
}

import { redirect } from 'next/navigation'
import { getProfile } from '@/features/auth/services/auth-service'
import { AnalyticsDashboard } from '@/features/analytics/components'
import { ProGate } from '@/shared/components'
import { BarChart3 } from 'lucide-react'

export const metadata = {
  title: 'Analytics | INKBuddy',
  description: 'Reportes demograficos e insights de negocio para tu estudio',
}

export default async function AnalyticsPage() {
  const { data: profile } = await getProfile()

  if (!profile || profile.role !== 'owner') {
    redirect('/dashboard')
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Page header */}
      <header className="mb-6 flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-2xl gradient-accent flex items-center justify-center shadow-warm shrink-0"
          aria-hidden="true"
        >
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-ink-dark">
            Analytics
          </h1>
          <p className="text-sm text-ink-dark/50 mt-0.5">
            Reportes demograficos e insights de tu estudio
          </p>
        </div>
      </header>

      <main>
        <ProGate>
          <AnalyticsDashboard />
        </ProGate>
      </main>
    </div>
  )
}

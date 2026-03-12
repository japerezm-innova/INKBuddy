import { AppShell } from '@/shared/components/app-shell'
import { getProfile } from '@/features/auth/services/auth-service'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: profile } = await getProfile()

  return (
    <AppShell
      userName={profile?.full_name ?? null}
      userEmail={profile?.email ?? null}
    >
      {children}
    </AppShell>
  )
}

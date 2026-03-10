import { redirect } from 'next/navigation'
import { getProfile } from '@/features/auth/services/auth-service'
import { OwnerDashboard } from '@/features/dashboard/components'
import { ArtistDashboard } from '@/features/dashboard/components'

export const metadata = {
  title: 'Dashboard | INKBuddy',
  description: 'Panel de control de tu estudio de tatuajes',
}

export default async function DashboardPage() {
  const { data: profile, error } = await getProfile()

  if (error || !profile) {
    redirect('/login')
  }

  return profile.role === 'owner' ? (
    <OwnerDashboard profile={profile} />
  ) : (
    <ArtistDashboard profile={profile} />
  )
}

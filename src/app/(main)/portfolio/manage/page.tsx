import type { Metadata } from 'next'
import { getProfile } from '@/features/auth/services/auth-service'
import { createClient } from '@/lib/supabase/server'
import { ManagePortfolioContent } from './manage-portfolio-content'

export const metadata: Metadata = {
  title: 'Mi Portafolio | INKBuddy',
  description: 'Gestiona los trabajos de tu portafolio de tatuaje.',
}

export default async function ManagePortfolioPage() {
  const { data: profile } = await getProfile()
  let studioSlug: string | undefined

  if (profile?.studio_id) {
    const supabase = await createClient()
    const { data: studio } = await supabase
      .from('studios')
      .select('slug')
      .eq('id', profile.studio_id)
      .single()
    studioSlug = studio?.slug ?? undefined
  }

  return (
    <div className="p-4 md:p-6">
      <ManagePortfolioContent studioSlug={studioSlug} />
    </div>
  )
}

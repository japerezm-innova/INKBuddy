import type { Metadata } from 'next'
import { ManagePortfolioContent } from './manage-portfolio-content'

export const metadata: Metadata = {
  title: 'Mi Portafolio | INKBuddy',
  description: 'Gestiona los trabajos de tu portafolio de tatuaje.',
}

export default function ManagePortfolioPage() {
  return (
    <div className="p-4 md:p-6">
      <ManagePortfolioContent />
    </div>
  )
}

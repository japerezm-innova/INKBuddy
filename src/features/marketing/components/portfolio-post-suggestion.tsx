'use client'

import { Megaphone, ArrowRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import Link from 'next/link'

interface Props {
  portfolioItemId: string
  style?: string | null
  className?: string
}

export function PortfolioPostSuggestion({ portfolioItemId, className }: Props) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-2xl',
        'bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-white/15',
        className
      )}
    >
      <Megaphone className="h-5 w-5 text-ink-orange shrink-0" aria-hidden="true" />

      <p className="flex-1 text-sm font-medium text-ink-dark/80">
        Publicar en redes
      </p>

      <Link
        href={`/marketing/posts/new?portfolioId=${portfolioItemId}`}
        aria-label="Crear post para este trabajo de portfolio"
        className={cn(
          'inline-flex items-center justify-center h-8 px-3 gap-1.5',
          'text-sm font-medium rounded-2xl transition-all duration-200',
          'bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-ink-dark',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50'
        )}
      >
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

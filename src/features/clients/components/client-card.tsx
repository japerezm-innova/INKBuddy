import { Phone, Mail } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { Client } from '../types/client'

interface ClientCardProps {
  client: Client
  onClick?: () => void
}

const SOURCE_CONFIG: Record<
  NonNullable<Client['source']>,
  { label: string; className: string }
> = {
  instagram: {
    label: 'Instagram',
    className: 'bg-pink-100/80 text-pink-700 border border-pink-200/60',
  },
  referral: {
    label: 'Referido',
    className: 'bg-blue-100/80 text-blue-700 border border-blue-200/60',
  },
  walk_in: {
    label: 'Walk-in',
    className: 'bg-emerald-100/80 text-emerald-700 border border-emerald-200/60',
  },
  website: {
    label: 'Web',
    className: 'bg-violet-100/80 text-violet-700 border border-violet-200/60',
  },
  other: {
    label: 'Otro',
    className: 'bg-gray-100/80 text-gray-600 border border-gray-200/60',
  },
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) {
    return (parts[0]?.substring(0, 2) ?? '??').toUpperCase()
  }
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

export function ClientCard({ client, onClick }: ClientCardProps) {
  const initials = getInitials(client.full_name)
  const sourceConfig = client.source ? SOURCE_CONFIG[client.source] : null

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.()
    }
  }

  return (
    <article
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      aria-label={`Ver perfil de ${client.full_name}`}
      className={cn(
        'bg-white/30 backdrop-blur-xl border border-white/25 rounded-3xl shadow-glass p-5',
        'transition-all duration-300',
        onClick &&
          'cursor-pointer hover:bg-white/40 hover:shadow-glass-lg hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50'
      )}
    >
      {/* Avatar + source badge row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div
          className="h-12 w-12 rounded-2xl gradient-accent flex items-center justify-center shrink-0 shadow-warm"
          aria-hidden="true"
        >
          <span className="text-white font-bold text-sm">{initials}</span>
        </div>

        {sourceConfig && (
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-sm',
              sourceConfig.className
            )}
          >
            {sourceConfig.label}
          </span>
        )}
      </div>

      {/* Name */}
      <h3 className="font-bold text-ink-dark text-base leading-snug mb-3 truncate">
        {client.full_name}
      </h3>

      {/* Contact info */}
      <div className="flex flex-col gap-1.5">
        {client.phone && (
          <div className="flex items-center gap-2 text-sm text-ink-dark/60">
            <Phone className="h-3.5 w-3.5 text-ink-orange shrink-0" aria-hidden="true" />
            <span className="truncate">{client.phone}</span>
          </div>
        )}
        {client.email && (
          <div className="flex items-center gap-2 text-sm text-ink-dark/60">
            <Mail className="h-3.5 w-3.5 text-ink-coral shrink-0" aria-hidden="true" />
            <span className="truncate">{client.email}</span>
          </div>
        )}
      </div>
    </article>
  )
}

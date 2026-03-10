'use client'

import Link from 'next/link'
import {
  CalendarPlus,
  UserPlus,
  Calendar,
  Package,
  type LucideIcon,
} from 'lucide-react'
import { cn, glass } from '@/shared/lib/utils'

interface QuickAction {
  label: string
  href: string
  icon: LucideIcon
  description: string
}

const ALL_ACTIONS: QuickAction[] = [
  {
    label: 'Nueva Cita',
    href: '/appointments/new',
    icon: CalendarPlus,
    description: 'Agendar nueva cita',
  },
  {
    label: 'Nuevo Cliente',
    href: '/clients/new',
    icon: UserPlus,
    description: 'Registrar nuevo cliente',
  },
  {
    label: 'Ver Agenda',
    href: '/appointments',
    icon: Calendar,
    description: 'Ver calendario de citas',
  },
  {
    label: 'Inventario',
    href: '/inventory',
    icon: Package,
    description: 'Gestionar inventario',
  },
]

const ARTIST_ACTIONS: QuickAction[] = [
  {
    label: 'Nueva Cita',
    href: '/appointments/new',
    icon: CalendarPlus,
    description: 'Agendar nueva cita',
  },
  {
    label: 'Ver Agenda',
    href: '/appointments',
    icon: Calendar,
    description: 'Ver calendario de citas',
  },
]

interface QuickActionsProps {
  variant?: 'full' | 'artist'
}

interface ActionCardProps {
  action: QuickAction
}

function ActionCard({ action }: ActionCardProps) {
  const Icon = action.icon

  return (
    <Link
      href={action.href}
      className={cn(
        glass.cardHover,
        'p-4 flex flex-col items-center justify-center gap-2.5',
        'text-center group cursor-pointer'
      )}
      aria-label={action.description}
    >
      <div
        className="h-11 w-11 rounded-2xl gradient-accent flex items-center justify-center shadow-warm group-hover:scale-110 transition-transform duration-200"
        aria-hidden="true"
      >
        <Icon className="h-5 w-5 text-white" />
      </div>
      <span className="text-xs font-semibold text-ink-dark leading-tight">
        {action.label}
      </span>
    </Link>
  )
}

export function QuickActions({ variant = 'full' }: QuickActionsProps) {
  const actions = variant === 'artist' ? ARTIST_ACTIONS : ALL_ACTIONS

  return (
    <section aria-label="Acciones rapidas">
      <h2 className="text-base font-bold text-ink-dark mb-4">
        Acciones Rapidas
      </h2>
      <div
        className={cn(
          'grid gap-3',
          variant === 'artist'
            ? 'grid-cols-2'
            : 'grid-cols-2'
        )}
      >
        {actions.map((action) => (
          <ActionCard key={action.href} action={action} />
        ))}
      </div>
    </section>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  CheckSquare,
  Package,
  Image,
  BarChart3,
  Megaphone,
  Settings,
} from 'lucide-react'
import { cn, glass } from '@/shared/lib/utils'
import { useAuth } from '@/features/auth/hooks/use-auth'

const NAV_ITEMS = [
  { label: 'Dashboard',    icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Citas',        icon: CalendarDays,    href: '/appointments' },
  { label: 'Clientes',     icon: Users,           href: '/clients' },
  { label: 'Tareas',       icon: CheckSquare,     href: '/tasks' },
  { label: 'Inventario',   icon: Package,         href: '/inventory' },
  { label: 'Portafolio',   icon: Image,           href: '/portfolio/manage' },
  { label: 'Analytics',    icon: BarChart3,       href: '/analytics' },
  { label: 'Marketing',   icon: Megaphone,       href: '/marketing' },
  { label: 'Configuracion',icon: Settings,        href: '/settings' },
] as const

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, profile } = useAuth()

  return (
    <aside
      className={cn(
        glass.sidebar,
        'hidden md:flex flex-col fixed left-0 top-0 h-full w-64 z-40 py-6 px-4'
      )}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="mb-8 px-2">
        <span className="text-2xl font-bold text-gradient">INKBuddy</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200',
                    isActive
                      ? 'bg-white/20 text-ink-orange'
                      : 'text-ink-dark/60 hover:bg-white/10 hover:text-ink-dark'
                  )}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User info */}
      <div className="mt-6 pt-4 border-t border-white/15">
        <div className="flex items-center gap-3 px-2">
          <div
            className="h-9 w-9 rounded-full gradient-accent shrink-0 flex items-center justify-center text-xs font-bold text-white"
            aria-hidden="true"
          >
            {getInitials(profile?.full_name ?? null)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-dark truncate">
              {profile?.full_name ?? 'Cargando...'}
            </p>
            <p className="text-xs text-ink-dark/50 truncate">
              {user?.email ?? ''}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}

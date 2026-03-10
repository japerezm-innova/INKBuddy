'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  Image,
  User,
} from 'lucide-react'
import { cn, glass } from '@/shared/lib/utils'

const NAV_ITEMS = [
  { label: 'Home',      icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Calendar',  icon: CalendarDays,    href: '/appointments' },
  { label: 'Tasks',     icon: CheckSquare,     href: '/tasks' },
  { label: 'Portfolio', icon: Image,           href: '/portfolio/manage' },
  { label: 'Profile',   icon: User,            href: '/settings' },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        glass.nav,
        'fixed bottom-0 inset-x-0 z-50 md:hidden'
      )}
      aria-label="Mobile navigation"
    >
      <ul className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors duration-200',
                  isActive
                    ? 'text-ink-orange'
                    : 'text-ink-dark/50 hover:text-ink-dark/80'
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

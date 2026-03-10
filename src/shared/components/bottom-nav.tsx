'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarDays,
  Megaphone,
  Image,
  MoreHorizontal,
} from 'lucide-react'
import { cn, glass } from '@/shared/lib/utils'
import { MobileMoreMenu } from './mobile-more-menu'

const NAV_ITEMS = [
  { label: 'Home',      icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Citas',     icon: CalendarDays,    href: '/appointments' },
  { label: 'Marketing', icon: Megaphone,       href: '/marketing' },
  { label: 'Portfolio', icon: Image,           href: '/portfolio/manage' },
] as const

const MORE_PATHS = ['/tasks', '/clients', '/inventory', '/analytics', '/settings']

export function BottomNav() {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)

  const isMoreActive = MORE_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )

  return (
    <>
      <nav
        className={cn(
          glass.nav,
          'fixed bottom-0 inset-x-0 z-40 md:hidden pb-safe'
        )}
        aria-label="Mobile navigation"
      >
        <ul className="flex items-center justify-around h-16 px-1">
          {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-label={label}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[44px] rounded-xl transition-colors duration-200',
                    isActive
                      ? 'text-ink-orange'
                      : 'text-ink-dark/50 active:text-ink-dark/80'
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span className="text-[10px] font-medium leading-none">{label}</span>
                </Link>
              </li>
            )
          })}

          <li>
            <button
              onClick={() => setShowMore(true)}
              aria-label="Mas opciones"
              aria-expanded={showMore}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[44px] rounded-xl transition-colors duration-200',
                isMoreActive
                  ? 'text-ink-orange'
                  : 'text-ink-dark/50 active:text-ink-dark/80'
              )}
            >
              <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
              <span className="text-[10px] font-medium leading-none">Mas</span>
            </button>
          </li>
        </ul>
      </nav>

      <MobileMoreMenu isOpen={showMore} onClose={() => setShowMore(false)} />
    </>
  )
}

'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  X,
  CheckSquare,
  Users,
  Package,
  BarChart3,
  FileText,
  Settings,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'

const MORE_ITEMS = [
  { label: 'Tareas',        icon: CheckSquare, href: '/tasks' },
  { label: 'Clientes',      icon: Users,       href: '/clients' },
  { label: 'Inventario',    icon: Package,     href: '/inventory' },
  { label: 'Cotizaciones',  icon: FileText,    href: '/quotes' },
  { label: 'Analytics',     icon: BarChart3,   href: '/analytics' },
  { label: 'Configuracion', icon: Settings,    href: '/settings' },
] as const

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function MobileMoreMenu({ isOpen, onClose }: Props) {
  const pathname = usePathname()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 inset-x-0 z-50 md:hidden animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-label="Menu adicional"
      >
        <div className="bg-white/90 backdrop-blur-2xl border-t border-white/30 rounded-t-3xl pb-safe">
          {/* Handle + close */}
          <div className="flex items-center justify-between px-6 pt-3 pb-2">
            <div className="h-1 w-10 rounded-full bg-ink-dark/20 mx-auto" />
            <button
              onClick={onClose}
              className="absolute right-4 top-3 h-8 w-8 flex items-center justify-center rounded-full bg-white/30"
              aria-label="Cerrar menu"
            >
              <X className="h-4 w-4 text-ink-dark/60" />
            </button>
          </div>

          {/* Grid of items */}
          <div className="grid grid-cols-3 gap-2 px-4 pb-6 pt-2">
            {MORE_ITEMS.map(({ label, icon: Icon, href }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={cn(
                    'flex flex-col items-center gap-2 py-4 rounded-2xl transition-colors',
                    isActive
                      ? 'bg-ink-orange/10 text-ink-orange'
                      : 'text-ink-dark/60 active:bg-white/30'
                  )}
                >
                  <Icon className="h-6 w-6" aria-hidden="true" />
                  <span className="text-xs font-medium">{label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

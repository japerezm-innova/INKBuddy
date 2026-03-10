'use client'

import { cn } from '@/shared/lib/utils'
import { WarmBackground } from './warm-background'
import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'

interface AppShellProps {
  children: React.ReactNode
  className?: string
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <WarmBackground>
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content */}
      <main
        className={cn(
          'min-h-screen',
          'md:ml-64',       // offset for sidebar on desktop
          'pb-20 md:pb-0',  // offset for bottom nav on mobile
          className
        )}
      >
        {children}
      </main>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </WarmBackground>
  )
}

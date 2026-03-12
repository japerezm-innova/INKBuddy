'use client'

import { cn } from '@/shared/lib/utils'
import { WarmBackground } from './warm-background'
import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'

interface AppShellProps {
  children: React.ReactNode
  className?: string
  userName?: string | null
  userEmail?: string | null
}

export function AppShell({ children, className, userName, userEmail }: AppShellProps) {
  return (
    <WarmBackground>
      {/* Desktop sidebar */}
      <Sidebar userName={userName ?? null} userEmail={userEmail ?? null} />

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

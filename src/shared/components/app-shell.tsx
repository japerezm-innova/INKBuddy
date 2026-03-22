'use client'

import { cn } from '@/shared/lib/utils'
import { WarmBackground } from './warm-background'
import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'
import { OfflineBanner } from '@/shared/lib/offline/offline-banner'

interface AppShellProps {
  children: React.ReactNode
  className?: string
  userName?: string | null
  userEmail?: string | null
}

export function AppShell({ children, className, userName, userEmail }: AppShellProps) {
  return (
    <WarmBackground>
      <OfflineBanner />

      {/* Desktop sidebar */}
      <Sidebar userName={userName ?? null} userEmail={userEmail ?? null} />

      {/* Mobile top logo */}
      <div className="fixed top-3 right-3 z-50 md:hidden">
        <img
          src="/logo.png"
          alt="InkBuddy"
          className="h-10 w-auto object-contain drop-shadow-md"
        />
      </div>

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

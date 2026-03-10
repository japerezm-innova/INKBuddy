import { cn } from '@/shared/lib/utils'

interface WarmBackgroundProps {
  children: React.ReactNode
  className?: string
}

export function WarmBackground({ children, className }: WarmBackgroundProps) {
  return (
    <div className={cn('relative min-h-screen', className)}>
      {/* Base gradient */}
      <div className="fixed inset-0 gradient-warm" aria-hidden="true" />

      {/* Animated blobs */}
      <div
        className="fixed top-[-10%] left-[-5%] w-[500px] h-[500px] gradient-blob-1 animate-blob opacity-70 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div
        className="fixed top-[40%] right-[-10%] w-[450px] h-[450px] gradient-blob-2 animate-blob-slow opacity-60 rounded-full blur-3xl"
        style={{ animationDelay: '2s' }}
        aria-hidden="true"
      />
      <div
        className="fixed bottom-[-5%] left-[30%] w-[400px] h-[400px] gradient-blob-3 animate-blob opacity-50 rounded-full blur-3xl"
        style={{ animationDelay: '4s' }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

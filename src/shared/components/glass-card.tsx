import { cn, glass } from '@/shared/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  padding?: string
}

export function GlassCard({
  children,
  className,
  hover = true,
  padding = 'p-6',
}: GlassCardProps) {
  return (
    <div
      className={cn(
        hover ? glass.cardHover : glass.card,
        padding,
        className
      )}
    >
      {children}
    </div>
  )
}

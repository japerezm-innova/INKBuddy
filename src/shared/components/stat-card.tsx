import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn, glass } from '@/shared/lib/utils'

interface Trend {
  value: number
  isPositive: boolean
}

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: Trend
  className?: string
}

export function StatCard({ title, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={cn(glass.card, 'p-5 relative overflow-hidden', className)}>
      {/* Icon badge */}
      <div
        className="absolute top-4 right-4 h-10 w-10 rounded-2xl gradient-accent flex items-center justify-center shadow-warm"
        aria-hidden="true"
      >
        <Icon className="h-5 w-5 text-white" />
      </div>

      {/* Value */}
      <p className="text-3xl font-bold text-ink-dark mt-1 leading-none">
        {value}
      </p>

      {/* Title */}
      <p className="text-sm text-ink-dark/50 font-medium mt-1.5">{title}</p>

      {/* Trend */}
      {trend && (
        <div
          className={cn(
            'inline-flex items-center gap-1 mt-3 text-xs font-semibold px-2 py-1 rounded-lg',
            trend.isPositive
              ? 'text-emerald-700 bg-emerald-100/60'
              : 'text-red-600 bg-red-100/60'
          )}
          aria-label={`${trend.isPositive ? 'Up' : 'Down'} ${trend.value}%`}
        >
          {trend.isPositive
            ? <TrendingUp className="h-3 w-3" aria-hidden="true" />
            : <TrendingDown className="h-3 w-3" aria-hidden="true" />
          }
          {trend.value}%
        </div>
      )}
    </div>
  )
}

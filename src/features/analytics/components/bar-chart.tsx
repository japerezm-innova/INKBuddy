import { cn } from '@/shared/lib/utils'

interface BarChartItem {
  label: string
  value: number
  color?: string
}

interface BarChartProps {
  data: BarChartItem[]
  title: string
  formatValue?: (value: number) => string
  className?: string
}

export function BarChart({ data, title, formatValue, className }: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1)

  const defaultFormat = (v: number) => v.toLocaleString('es-MX')

  return (
    <div className={cn('space-y-3', className)} role="img" aria-label={title}>
      <h3 className="text-sm font-semibold text-ink-dark/70 uppercase tracking-wide">
        {title}
      </h3>

      {data.length === 0 ? (
        <p className="text-sm text-ink-dark/40 py-4 text-center">
          Sin datos disponibles
        </p>
      ) : (
        <ul className="space-y-2.5" aria-label={`Grafico de barras: ${title}`}>
          {data.map((item, index) => {
            const widthPercent = Math.max((item.value / maxValue) * 100, 2)
            const displayValue = formatValue
              ? formatValue(item.value)
              : defaultFormat(item.value)

            return (
              <li key={`${item.label}-${index}`} className="flex items-center gap-3">
                {/* Label */}
                <span
                  className="text-xs text-ink-dark/70 font-medium shrink-0 truncate"
                  style={{ width: '30%', minWidth: '5rem' }}
                  title={item.label}
                >
                  {item.label}
                </span>

                {/* Bar track */}
                <div
                  className="flex-1 h-6 bg-white/20 rounded-full overflow-hidden relative"
                  aria-hidden="true"
                >
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: item.color ?? '#FF6B35',
                      opacity: 0.85,
                    }}
                  />
                </div>

                {/* Value */}
                <span className="text-xs font-bold text-ink-dark shrink-0 w-16 text-right">
                  {displayValue}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

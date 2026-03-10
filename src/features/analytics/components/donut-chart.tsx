import { cn } from '@/shared/lib/utils'

interface DonutChartItem {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutChartItem[]
  title: string
  size?: number
  className?: string
}

export function DonutChart({ data, title, size = 180, className }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  // Build conic-gradient stops
  const conicGradient = (() => {
    if (total === 0 || data.length === 0) {
      return 'conic-gradient(#e5e7eb 0deg 360deg)'
    }

    let currentDeg = 0
    const stops: string[] = []

    data.forEach((item) => {
      const deg = (item.value / total) * 360
      stops.push(`${item.color} ${currentDeg}deg ${currentDeg + deg}deg`)
      currentDeg += deg
    })

    return `conic-gradient(${stops.join(', ')})`
  })()

  const holeSize = size * 0.6

  return (
    <div className={cn('space-y-3', className)} role="img" aria-label={title}>
      <h3 className="text-sm font-semibold text-ink-dark/70 uppercase tracking-wide">
        {title}
      </h3>

      <div className="flex flex-col items-center gap-4">
        {/* Donut chart */}
        <div
          className="relative shrink-0 flex items-center justify-center"
          style={{ width: size, height: size }}
          aria-hidden="true"
        >
          {/* Outer ring with conic-gradient */}
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: conicGradient }}
          />
          {/* Inner hole */}
          <div
            className="relative z-10 rounded-full bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center shadow-inner"
            style={{ width: holeSize, height: holeSize }}
          >
            <span className="text-xl font-bold text-ink-dark leading-none">
              {total === 0 ? '—' : total}
            </span>
            <span className="text-xs text-ink-dark/50 mt-0.5">total</span>
          </div>
        </div>

        {/* Legend */}
        {data.length === 0 ? (
          <p className="text-sm text-ink-dark/40 text-center">Sin datos disponibles</p>
        ) : (
          <ul className="w-full space-y-1.5" aria-label={`Leyenda: ${title}`}>
            {data.map((item, index) => {
              const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0
              return (
                <li
                  key={`${item.label}-${index}`}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="shrink-0 h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                    <span className="text-ink-dark/70 truncate font-medium">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-ink-dark font-bold">{item.value}</span>
                    <span className="text-ink-dark/40">({percentage}%)</span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

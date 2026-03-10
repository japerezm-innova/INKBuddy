interface TrendLineProps {
  data: number[]
  color?: string
  height?: number
  className?: string
}

export function TrendLine({
  data,
  color = '#FF6B35',
  height = 80,
  className,
}: TrendLineProps) {
  if (data.length < 2) {
    return (
      <div
        className={className}
        style={{ height }}
        aria-label="Grafico de tendencia - datos insuficientes"
      >
        <p className="text-sm text-ink-dark/40 text-center py-4">
          Sin suficientes datos
        </p>
      </div>
    )
  }

  const width = 600
  const paddingX = 8
  const paddingY = 8
  const chartWidth = width - paddingX * 2
  const chartHeight = height - paddingY * 2

  const minVal = Math.min(...data)
  const maxVal = Math.max(...data)
  const range = maxVal - minVal || 1

  // Map data points to SVG coordinates
  const points = data.map((value, index) => {
    const x = paddingX + (index / (data.length - 1)) * chartWidth
    const y = paddingY + chartHeight - ((value - minVal) / range) * chartHeight
    return { x, y }
  })

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ')

  // Build fill polygon (close back to bottom)
  const firstPoint = points[0]
  const lastPoint = points[points.length - 1]
  const fillPoints = [
    ...(firstPoint ? [`${firstPoint.x},${height}`] : []),
    ...points.map((p) => `${p.x},${p.y}`),
    ...(lastPoint ? [`${lastPoint.x},${height}`] : []),
  ].join(' ')

  // Parse color for fill with opacity
  const fillId = `trend-fill-${Math.random().toString(36).slice(2, 7)}`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ height, width: '100%' }}
      preserveAspectRatio="none"
      aria-label="Grafico de tendencia de citas"
      role="img"
    >
      <defs>
        <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Fill area */}
      <polygon
        points={fillPoints}
        fill={`url(#${fillId})`}
      />

      {/* Line */}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots on data points (only if not too many) */}
      {data.length <= 15 &&
        points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill={color}
            opacity="0.7"
          />
        ))}
    </svg>
  )
}

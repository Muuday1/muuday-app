'use client'

import { useMemo } from 'react'

interface DataPoint {
  label: string
  value: number
}

interface EarningsSparklineProps {
  data: DataPoint[]
  height?: number
  strokeColor?: string
  fillColor?: string
}

export function EarningsSparkline({
  data,
  height = 120,
  strokeColor = '#9FE870',
  fillColor = 'rgba(159, 232, 112, 0.15)',
}: EarningsSparklineProps) {
  const svg = useMemo(() => {
    if (data.length < 2) return null

    const width = 600
    const padding = { top: 10, right: 10, bottom: 30, left: 50 }
    const chartW = width - padding.left - padding.right
    const chartH = height - padding.top - padding.bottom

    const maxValue = Math.max(...data.map(d => d.value), 1)
    const minValue = Math.min(...data.map(d => d.value), 0)
    const range = maxValue - minValue || 1

    const getX = (i: number) => padding.left + (i / (data.length - 1)) * chartW
    const getY = (v: number) => padding.top + chartH - ((v - minValue) / range) * chartH

    // Build area path
    const pathPoints = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.value)}`).join(' ')
    const areaPath = `${pathPoints} L ${getX(data.length - 1)} ${padding.top + chartH} L ${getX(0)} ${padding.top + chartH} Z`

    // Y-axis labels
    const yTicks = 4
    const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
      const v = minValue + (range * i) / yTicks
      return { y: getY(v), value: v }
    })

    // X-axis labels (show first, middle, last)
    const xIndices = [0, Math.floor((data.length - 1) / 2), data.length - 1]

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
        {/* Grid lines */}
        {yLabels.map((t, i) => (
          <g key={`grid-${i}`}>
            <line
              x1={padding.left}
              y1={t.y}
              x2={width - padding.right}
              y2={t.y}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill={fillColor} />

        {/* Line */}
        <path
          d={pathPoints}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((d, i) => (
          <circle
            key={`pt-${i}`}
            cx={getX(i)}
            cy={getY(d.value)}
            r="3.5"
            fill={strokeColor}
            stroke="white"
            strokeWidth="1.5"
          />
        ))}

        {/* Y-axis labels */}
        {yLabels.map((t, i) => (
          <text
            key={`yl-${i}`}
            x={padding.left - 8}
            y={t.y + 4}
            textAnchor="end"
            fontSize="10"
            fill="#94a3b8"
          >
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              maximumFractionDigits: 0,
            }).format(t.value)}
          </text>
        ))}

        {/* X-axis labels */}
        {xIndices.map(i => (
          <text
            key={`xl-${i}`}
            x={getX(i)}
            y={height - 6}
            textAnchor="middle"
            fontSize="10"
            fill="#94a3b8"
          >
            {data[i]?.label}
          </text>
        ))}
      </svg>
    )
  }, [data, height, strokeColor, fillColor])

  if (!svg) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-slate-100 bg-slate-50/50 text-sm text-slate-400">
        Dados insuficientes para exibir gráfico.
      </div>
    )
  }

  return <div className="rounded-lg border border-slate-100 bg-white p-4">{svg}</div>
}

'use client'

import { useId } from 'react'

interface DotPatternProps {
  className?: string
  dotColor?: string
  spacing?: number
  dotSize?: number
}

export function DotPattern({
  className = '',
  dotColor = '#0f172a',
  spacing = 24,
  dotSize = 2,
}: DotPatternProps) {
  const id = useId()
  const patternId = `dotPattern-${id}`

  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id={patternId}
          width={spacing}
          height={spacing}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={spacing / 2} cy={spacing / 2} r={dotSize / 2} fill={dotColor} opacity="0.15" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  )
}

'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

type PriceRangeSliderProps = {
  minLimit: number
  maxLimit: number
  step?: number
  initialMin?: number
  initialMax?: number
  currencyLabel: string
  nameMin: string
  nameMax: string
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function roundToStep(value: number, step: number) {
  return Math.round(value / step) * step
}

export function PriceRangeSlider({
  minLimit,
  maxLimit,
  step = 10,
  initialMin,
  initialMax,
  currencyLabel,
  nameMin,
  nameMax,
}: PriceRangeSliderProps) {
  const sliderId = useId()

  const safeMinLimit = Math.max(0, Math.floor(minLimit))
  const safeMaxLimit = Math.max(safeMinLimit, Math.ceil(maxLimit))

  const [minValue, setMinValue] = useState(() => {
    const raw = initialMin ?? safeMinLimit
    return clamp(roundToStep(raw, step), safeMinLimit, safeMaxLimit)
  })
  const [maxValue, setMaxValue] = useState(() => {
    const raw = initialMax ?? safeMaxLimit
    return clamp(roundToStep(raw, step), safeMinLimit, safeMaxLimit)
  })

  // Keep invariant min <= max
  useEffect(() => {
    if (minValue <= maxValue) return
    setMaxValue(minValue)
  }, [maxValue, minValue])

  const minPercent = useMemo(() => {
    if (safeMaxLimit === safeMinLimit) return 0
    return ((minValue - safeMinLimit) / (safeMaxLimit - safeMinLimit)) * 100
  }, [minValue, safeMaxLimit, safeMinLimit])

  const maxPercent = useMemo(() => {
    if (safeMaxLimit === safeMinLimit) return 100
    return ((maxValue - safeMinLimit) / (safeMaxLimit - safeMinLimit)) * 100
  }, [maxValue, safeMaxLimit, safeMinLimit])

  const display = useMemo(() => {
    const minText = `${currencyLabel} ${minValue}`
    const maxText = `${currencyLabel} ${maxValue}`
    return `${minText} – ${maxText}`
  }, [currencyLabel, maxValue, minValue])

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-neutral-500">Preço</span>
        <span className="text-xs font-semibold text-neutral-800" aria-live="polite">
          {display}
        </span>
      </div>

      <div className="relative h-10">
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-neutral-200" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand-500"
          style={{ left: `${minPercent}%`, width: `${Math.max(0, maxPercent - minPercent)}%` }}
          aria-hidden="true"
        />

        <input
          id={`${sliderId}-min`}
          type="range"
          min={safeMinLimit}
          max={safeMaxLimit}
          step={step}
          value={minValue}
          onChange={event => {
            const next = roundToStep(Number(event.target.value), step)
            setMinValue(clamp(Math.min(next, maxValue), safeMinLimit, safeMaxLimit))
          }}
          aria-label="Preço mínimo"
          className={cn(
            'absolute inset-0 h-10 w-full cursor-pointer bg-transparent',
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-neutral-300 [&::-webkit-slider-thumb]:shadow',
            '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-neutral-300',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20',
          )}
        />

        <input
          id={`${sliderId}-max`}
          type="range"
          min={safeMinLimit}
          max={safeMaxLimit}
          step={step}
          value={maxValue}
          onChange={event => {
            const next = roundToStep(Number(event.target.value), step)
            setMaxValue(clamp(Math.max(next, minValue), safeMinLimit, safeMaxLimit))
          }}
          aria-label="Preço máximo"
          className={cn(
            'absolute inset-0 h-10 w-full cursor-pointer bg-transparent',
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-neutral-300 [&::-webkit-slider-thumb]:shadow',
            '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-neutral-300',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20',
          )}
        />
      </div>

      {/* Keep current values in GET form contract */}
      <input type="hidden" name={nameMin} value={String(minValue)} />
      <input type="hidden" name={nameMax} value={String(maxValue)} />
    </div>
  )
}


'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

type PriceRangeSliderProps = {
  minLimit: number
  maxLimit: number
  step?: number
  initialMin?: number
  initialMax?: number
  valueMin?: number
  valueMax?: number
  currencyLabel: string
  nameMin?: string
  nameMax?: string
  onChange?: (min: number, max: number) => void
  compact?: boolean
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
  step = 1,
  initialMin,
  initialMax,
  valueMin,
  valueMax,
  currencyLabel,
  nameMin,
  nameMax,
  onChange,
  compact = false,
}: PriceRangeSliderProps) {
  const sliderId = useId()

  const safeMinLimit = Math.max(0, Math.floor(minLimit))
  const safeMaxLimit = Math.max(safeMinLimit, Math.ceil(maxLimit))
  const isControlled = typeof valueMin === 'number' && typeof valueMax === 'number'

  const [internalMin, setInternalMin] = useState(() => {
    const raw = initialMin ?? safeMinLimit
    return clamp(roundToStep(raw, step), safeMinLimit, safeMaxLimit)
  })
  const [internalMax, setInternalMax] = useState(() => {
    const raw = initialMax ?? safeMaxLimit
    return clamp(roundToStep(raw, step), safeMinLimit, safeMaxLimit)
  })
  const [activeThumb, setActiveThumb] = useState<'min' | 'max'>('max')

  const minValue = isControlled
    ? clamp(roundToStep(valueMin as number, step), safeMinLimit, safeMaxLimit)
    : internalMin
  const maxValue = isControlled
    ? clamp(roundToStep(valueMax as number, step), safeMinLimit, safeMaxLimit)
    : internalMax

  useEffect(() => {
    if (minValue <= maxValue) return
    if (isControlled) {
      onChange?.(minValue, minValue)
      return
    }
    setInternalMax(minValue)
  }, [isControlled, minValue, maxValue, onChange])

  const minPercent = useMemo(() => {
    if (safeMaxLimit === safeMinLimit) return 0
    return ((minValue - safeMinLimit) / (safeMaxLimit - safeMinLimit)) * 100
  }, [minValue, safeMaxLimit, safeMinLimit])

  const maxPercent = useMemo(() => {
    if (safeMaxLimit === safeMinLimit) return 100
    return ((maxValue - safeMinLimit) / (safeMaxLimit - safeMinLimit)) * 100
  }, [maxValue, safeMaxLimit, safeMinLimit])

  const display = useMemo(() => {
    const minText = `${currencyLabel} ${Math.round(minValue)}`
    const maxText = `${currencyLabel} ${Math.round(maxValue)}`
    return `${minText} - ${maxText}`
  }, [currencyLabel, minValue, maxValue])

  const setValues = (nextMin: number, nextMax: number) => {
    if (isControlled) {
      onChange?.(nextMin, nextMax)
      return
    }
    setInternalMin(nextMin)
    setInternalMax(nextMax)
    onChange?.(nextMin, nextMax)
  }

  return (
    <div className="w-full">
      <div className={cn('mb-1 flex items-center justify-between gap-2', compact && 'mb-0.5')}>
        <span className={cn('text-xs font-medium text-neutral-500', compact && 'text-[11px]')}>
          Preco
        </span>
        <span
          className={cn('text-xs font-semibold text-neutral-800', compact && 'text-[11px]')}
          aria-live="polite"
        >
          {display}
        </span>
      </div>

      <div className={cn('relative', compact ? 'h-8' : 'h-10')}>
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
            const nextMin = clamp(Math.min(next, maxValue), safeMinLimit, safeMaxLimit)
            setValues(nextMin, maxValue)
          }}
          onPointerDown={() => setActiveThumb('min')}
          onFocus={() => setActiveThumb('min')}
          aria-label="Preco minimo"
          className={cn(
            'absolute inset-0 w-full cursor-pointer bg-transparent',
            compact ? 'h-8' : 'h-10',
            activeThumb === 'min' ? 'z-30' : 'z-20',
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
            const nextMax = clamp(Math.max(next, minValue), safeMinLimit, safeMaxLimit)
            setValues(minValue, nextMax)
          }}
          onPointerDown={() => setActiveThumb('max')}
          onFocus={() => setActiveThumb('max')}
          aria-label="Preco maximo"
          className={cn(
            'absolute inset-0 w-full cursor-pointer bg-transparent',
            compact ? 'h-8' : 'h-10',
            activeThumb === 'max' ? 'z-30' : 'z-20',
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-neutral-300 [&::-webkit-slider-thumb]:shadow',
            '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-neutral-300',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20',
          )}
        />
      </div>

      {nameMin ? <input type="hidden" name={nameMin} value={String(minValue)} /> : null}
      {nameMax ? <input type="hidden" name={nameMax} value={String(maxValue)} /> : null}
    </div>
  )
}

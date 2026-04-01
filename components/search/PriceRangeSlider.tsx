'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  onCommit?: (min: number, max: number) => void
  compact?: boolean
}

type ActiveThumb = 'min' | 'max' | null

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
  onCommit,
  compact = false,
}: PriceRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const minRef = useRef<number>(0)
  const maxRef = useRef<number>(0)
  const [activeThumb, setActiveThumb] = useState<ActiveThumb>(null)

  const safeStep = Math.max(1, Math.floor(step))
  const safeMinLimit = Math.max(0, Math.floor(minLimit))
  const safeMaxLimit = Math.max(safeMinLimit, Math.ceil(maxLimit))
  const isControlled = typeof valueMin === 'number' && typeof valueMax === 'number'

  const [internalMin, setInternalMin] = useState(() => {
    const raw = initialMin ?? safeMinLimit
    return clamp(roundToStep(raw, safeStep), safeMinLimit, safeMaxLimit)
  })
  const [internalMax, setInternalMax] = useState(() => {
    const raw = initialMax ?? safeMaxLimit
    return clamp(roundToStep(raw, safeStep), safeMinLimit, safeMaxLimit)
  })

  const minValue = isControlled
    ? clamp(roundToStep(valueMin as number, safeStep), safeMinLimit, safeMaxLimit)
    : internalMin
  const maxValue = isControlled
    ? clamp(roundToStep(valueMax as number, safeStep), safeMinLimit, safeMaxLimit)
    : internalMax

  minRef.current = minValue
  maxRef.current = maxValue

  useEffect(() => {
    if (minValue <= maxValue) return
    if (isControlled) {
      onChange?.(minValue, minValue)
      return
    }
    setInternalMax(minValue)
  }, [isControlled, minValue, maxValue, onChange])

  const valueRange = Math.max(1, safeMaxLimit - safeMinLimit)

  const minPercent = useMemo(() => {
    return ((minValue - safeMinLimit) / valueRange) * 100
  }, [minValue, safeMinLimit, valueRange])

  const maxPercent = useMemo(() => {
    return ((maxValue - safeMinLimit) / valueRange) * 100
  }, [maxValue, safeMinLimit, valueRange])

  const display = useMemo(() => {
    const minText = `${currencyLabel} ${Math.round(minValue)}`
    const maxText =
      maxValue >= safeMaxLimit
        ? `${currencyLabel} ${Math.round(safeMaxLimit)}+`
        : `${currencyLabel} ${Math.round(maxValue)}`
    return `${minText} - ${maxText}`
  }, [currencyLabel, minValue, maxValue, safeMaxLimit])

  const setValues = useCallback((nextMin: number, nextMax: number) => {
    if (isControlled) {
      onChange?.(nextMin, nextMax)
      return
    }

    setInternalMin(nextMin)
    setInternalMax(nextMax)
    onChange?.(nextMin, nextMax)
  }, [isControlled, onChange])

  const getValueFromClientX = useCallback((clientX: number) => {
    const track = trackRef.current
    if (!track) return minValue
    const rect = track.getBoundingClientRect()
    if (rect.width <= 0) return minValue

    const relative = clamp(clientX - rect.left, 0, rect.width)
    const percent = relative / rect.width
    const raw = safeMinLimit + percent * valueRange
    return clamp(roundToStep(raw, safeStep), safeMinLimit, safeMaxLimit)
  }, [minValue, safeMaxLimit, safeMinLimit, safeStep, valueRange])

  useEffect(() => {
    if (!activeThumb) return

    const handlePointerMove = (event: PointerEvent) => {
      const next = getValueFromClientX(event.clientX)
      if (activeThumb === 'min') {
        const nextMin = clamp(Math.min(next, maxValue), safeMinLimit, safeMaxLimit)
        setValues(nextMin, maxValue)
        return
      }

      const nextMax = clamp(Math.max(next, minValue), safeMinLimit, safeMaxLimit)
      setValues(minValue, nextMax)
    }

    const handlePointerUp = () => {
      onCommit?.(minRef.current, maxRef.current)
      setActiveThumb(null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [activeThumb, getValueFromClientX, maxValue, minValue, onCommit, safeMaxLimit, safeMinLimit, setValues])

  const handleKeyDown = (thumb: 'min' | 'max', key: string) => {
    let delta = 0

    if (key === 'ArrowLeft' || key === 'ArrowDown') delta = -safeStep
    if (key === 'ArrowRight' || key === 'ArrowUp') delta = safeStep
    if (key === 'PageDown') delta = -safeStep * 10
    if (key === 'PageUp') delta = safeStep * 10

    if (delta !== 0) {
      if (thumb === 'min') {
        const nextMin = clamp(minValue + delta, safeMinLimit, maxValue)
        setValues(nextMin, maxValue)
        onCommit?.(nextMin, maxValue)
      } else {
        const nextMax = clamp(maxValue + delta, minValue, safeMaxLimit)
        setValues(minValue, nextMax)
        onCommit?.(minValue, nextMax)
      }
      return
    }

    if (key === 'Home') {
      if (thumb === 'min') {
        setValues(safeMinLimit, maxValue)
        onCommit?.(safeMinLimit, maxValue)
      } else {
        setValues(minValue, minValue)
        onCommit?.(minValue, minValue)
      }
      return
    }

    if (key === 'End') {
      if (thumb === 'min') {
        setValues(maxValue, maxValue)
        onCommit?.(maxValue, maxValue)
      } else {
        setValues(minValue, safeMaxLimit)
        onCommit?.(minValue, safeMaxLimit)
      }
    }
  }

  return (
    <div className="w-full">
      <div className={cn('mb-1 flex items-center justify-between gap-2', compact && 'mb-0.5')}>
        <span className={cn('text-xs font-medium text-neutral-500', compact && 'text-[11px]')}>Preço</span>
        <span className={cn('text-xs font-semibold text-neutral-800', compact && 'text-[11px]')} aria-live="polite">
          {display}
        </span>
      </div>

      <div className={cn('relative', compact ? 'h-8' : 'h-10')}>
        <div
          ref={trackRef}
          className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-neutral-200"
          style={{ touchAction: 'none' }}
          onPointerDown={event => {
            event.preventDefault()
            const next = getValueFromClientX(event.clientX)
            const distanceToMin = Math.abs(next - minValue)
            const distanceToMax = Math.abs(next - maxValue)

            if (distanceToMin <= distanceToMax) {
              const nextMin = clamp(Math.min(next, maxValue), safeMinLimit, safeMaxLimit)
              setValues(nextMin, maxValue)
              setActiveThumb('min')
            } else {
              const nextMax = clamp(Math.max(next, minValue), safeMinLimit, safeMaxLimit)
              setValues(minValue, nextMax)
              setActiveThumb('max')
            }
          }}
        />

        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand-500"
          style={{ left: `${minPercent}%`, width: `${Math.max(0, maxPercent - minPercent)}%` }}
          aria-hidden="true"
        />

        <button
          type="button"
          role="slider"
          aria-label="Preço mínimo"
          aria-valuemin={safeMinLimit}
          aria-valuemax={maxValue}
          aria-valuenow={minValue}
          onPointerDown={event => {
            event.preventDefault()
            event.currentTarget.setPointerCapture(event.pointerId)
            setActiveThumb('min')
          }}
          onKeyDown={event => handleKeyDown('min', event.key)}
          className={cn(
            'absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-neutral-300 bg-white shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20',
            activeThumb === 'min' ? 'z-30' : 'z-20',
          )}
          style={{ left: `${minPercent}%`, touchAction: 'none' }}
        />

        <button
          type="button"
          role="slider"
          aria-label="Preço máximo"
          aria-valuemin={minValue}
          aria-valuemax={safeMaxLimit}
          aria-valuenow={maxValue}
          onPointerDown={event => {
            event.preventDefault()
            event.currentTarget.setPointerCapture(event.pointerId)
            setActiveThumb('max')
          }}
          onKeyDown={event => handleKeyDown('max', event.key)}
          className={cn(
            'absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-neutral-300 bg-white shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20',
            activeThumb === 'max' ? 'z-30' : 'z-20',
          )}
          style={{ left: `${maxPercent}%`, touchAction: 'none' }}
        />
      </div>

      {nameMin ? <input type="hidden" name={nameMin} value={String(minValue)} /> : null}
      {nameMax ? <input type="hidden" name={nameMax} value={String(maxValue)} /> : null}
    </div>
  )
}

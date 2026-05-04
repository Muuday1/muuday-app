'use client'

import { cn } from '@/lib/utils'
import { timezoneLabel } from '../../booking-form-helpers'

interface TimezoneToggleProps {
  mode: 'user' | 'professional'
  onChange: (mode: 'user' | 'professional') => void
  userTimezone: string
  professionalTimezone: string
}

export function TimezoneToggle({ mode, onChange, userTimezone, professionalTimezone }: TimezoneToggleProps) {
  return (
    <>
      <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50/70 p-1 text-xs">
        <button
          type="button"
          onClick={() => onChange('user')}
          className={cn(
            'rounded-md px-2 py-1 font-medium transition-colors',
            mode === 'user'
              ? 'bg-white text-[#3d6b1f]'
              : 'text-slate-500 hover:text-slate-700',
          )}
        >
          Ver no meu fuso
        </button>
        <button
          type="button"
          onClick={() => onChange('professional')}
          className={cn(
            'rounded-md px-2 py-1 font-medium transition-colors',
            mode === 'professional'
              ? 'bg-white text-[#3d6b1f]'
              : 'text-slate-500 hover:text-slate-700',
          )}
        >
          Ver no fuso do profissional
        </button>
      </div>
      <p className="mb-5 text-xs text-slate-500">
        Fuso atual de visualização:{' '}
        <span className="font-medium text-slate-700">
          {mode === 'user'
            ? timezoneLabel(userTimezone)
            : timezoneLabel(professionalTimezone)}
        </span>
      </p>
    </>
  )
}

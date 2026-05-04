'use client'

import { cn } from '@/lib/utils'

interface BookingTypeSelectorProps {
  bookingType: 'one_off' | 'recurring' | 'batch'
  onChange: (type: 'one_off' | 'recurring' | 'batch') => void
  canUseRecurring: boolean
  enableRecurring: boolean
  recurringFlagEnabled: boolean | undefined
}

export function BookingTypeSelector({
  bookingType,
  onChange,
  canUseRecurring,
  enableRecurring,
  recurringFlagEnabled,
}: BookingTypeSelectorProps) {
  return (
    <div className="rounded-lg border border-slate-200/80 bg-white p-6">
      <h2 className="mb-3 text-lg font-semibold text-slate-900 font-display">Tipo de agendamento</h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => onChange('one_off')}
          className={cn(
            'rounded-md border px-4 py-3 text-left text-sm transition-all',
            bookingType === 'one_off'
              ? 'border-[#9FE870]/60 bg-[#9FE870]/8 text-[#3d6b1f]'
              : 'border-slate-200 text-slate-700 hover:border-[#9FE870]/40',
          )}
        >
          <p className="font-semibold">Sessão única</p>
          <p className="mt-0.5 text-xs text-slate-500">1 sessão com pagamento único.</p>
        </button>
        <button
          type="button"
          onClick={() => canUseRecurring && onChange('recurring')}
          disabled={!canUseRecurring}
          className={cn(
            'rounded-md border px-4 py-3 text-left text-sm transition-all',
            bookingType === 'recurring'
              ? 'border-[#9FE870]/60 bg-[#9FE870]/8 text-[#3d6b1f]'
              : 'border-slate-200 text-slate-700 hover:border-[#9FE870]/40',
            !canUseRecurring && 'cursor-not-allowed opacity-50',
          )}
        >
          <p className="font-semibold">Recorrente</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {!enableRecurring
              ? 'Este profissional não oferece pacote recorrente.'
              : recurringFlagEnabled === false
                ? 'Pacote recorrente indisponível temporariamente.'
                : 'Mesmo dia e horário, com periodicidade configurável.'}
          </p>
        </button>
        <button
          type="button"
          onClick={() => onChange('batch')}
          className={cn(
            'rounded-md border px-4 py-3 text-left text-sm transition-all',
            bookingType === 'batch'
              ? 'border-[#9FE870]/60 bg-[#9FE870]/8 text-[#3d6b1f]'
              : 'border-slate-200 text-slate-700 hover:border-[#9FE870]/40',
          )}
        >
          <p className="font-semibold">Várias datas</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Escolha datas avulsas e reserve todas de uma vez.
          </p>
        </button>
      </div>
    </div>
  )
}

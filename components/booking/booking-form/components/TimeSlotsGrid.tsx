'use client'

import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DAY_NAMES_PT_FULL } from '../../booking-form-helpers'

interface TimeSlotsGridProps {
  selectedDate: Date
  timeSlots: string[]
  selectedTime: string | null
  onTimeSelect: (time: string) => void
  renderSlotLabel: (time: string) => string
}

export function TimeSlotsGrid({
  selectedDate,
  timeSlots,
  selectedTime,
  onTimeSelect,
  renderSlotLabel,
}: TimeSlotsGridProps) {
  return (
    <div className="rounded-lg border border-slate-200/80 bg-white p-6">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-900 font-display">
        <Clock className="h-5 w-5 text-[#9FE870]" />
        Horários disponíveis
      </h2>
      <p className="mb-5 text-sm text-slate-400">
        {DAY_NAMES_PT_FULL[selectedDate.getDay()]},{' '}
        {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
      </p>

      {timeSlots.length === 0 ? (
        <div className="py-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-slate-50/70">
            <Clock className="h-6 w-6 text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-600">Nenhum horário disponível</p>
          <p className="mt-1 text-xs text-slate-400">
            Todos os horários desta data já foram reservados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {timeSlots.map(time => (
            <button
              key={time}
              onClick={() => onTimeSelect(time)}
              className={cn(
                'rounded-md border px-3 py-2.5 text-sm font-medium transition-all',
                selectedTime === time
                  ? 'border-[#9FE870] bg-[#9FE870] text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-[#9FE870]/40 hover:bg-[#9FE870]/8 hover:text-[#3d6b1f]',
              )}
            >
              {renderSlotLabel(time)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

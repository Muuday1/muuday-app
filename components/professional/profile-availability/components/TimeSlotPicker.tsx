'use client'

import { cn } from '@/lib/utils'
import { DAY_NAMES_PT_FULL } from '../helpers'

interface TimeSlotPickerProps {
  selectedDate: Date
  timeSlots: string[]
  selectedTime: string | null
  onTimeSelect: (time: string) => void
}

export function TimeSlotPicker({ selectedDate, timeSlots, selectedTime, onTimeSelect }: TimeSlotPickerProps) {
  return (
    <div className="mt-5">
      <p className="mb-3 text-sm text-slate-500">
        {DAY_NAMES_PT_FULL[selectedDate.getDay()]},{' '}
        {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
      </p>
      {timeSlots.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum horário disponível para esta data.</p>
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
              {time}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

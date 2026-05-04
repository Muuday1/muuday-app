'use client'

import { cn } from '@/lib/utils'
import { timezoneLabel } from '../../booking-form-helpers'

interface BatchSlotPreview {
  value: string
  userDateTime: string
  professionalDateTime: string
}

interface BatchPanelProps {
  slots: BatchSlotPreview[]
  selectedDate: Date | null
  selectedTime: string | null
  professionalTimezone: string
  onAdd: () => void
  onRemove: (value: string) => void
}

export function BatchPanel({
  slots,
  selectedDate,
  selectedTime,
  professionalTimezone,
  onAdd,
  onRemove,
}: BatchPanelProps) {
  return (
    <div className="rounded-lg border border-slate-200/80 bg-white p-6">
      <h2 className="mb-3 text-lg font-semibold text-slate-900 font-display">
        Lote de sessões avulsas
      </h2>
      <p className="mb-3 text-xs text-slate-500">
        Selecione uma data e um horário e adicione ao lote. Você precisa de pelo menos 2 sessões.
      </p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onAdd}
          disabled={!selectedDate || !selectedTime}
          className={cn(
            'rounded-md px-4 py-2 text-xs font-semibold transition',
            selectedDate && selectedTime
              ? 'bg-[#9FE870] text-white hover:bg-[#8ed85f]'
              : 'cursor-not-allowed bg-slate-100 text-slate-400',
          )}
        >
          Adicionar ao lote
        </button>
        <span className="text-xs text-slate-500">
          {slots.length} sessão(ões) adicionada(s)
        </span>
      </div>
      {slots.length > 0 ? (
        <ul className="space-y-2">
          {slots.map(item => (
            <li
              key={item.value}
              className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-xs"
            >
              <div>
                <p className="font-medium text-slate-800">{item.userDateTime}</p>
                <p className="text-slate-500">
                  Profissional: {item.professionalDateTime} ({timezoneLabel(professionalTimezone)})
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(item.value)}
                className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-red-200 hover:text-red-600"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-500">Nenhuma sessão adicionada ao lote ainda.</p>
      )}
    </div>
  )
}

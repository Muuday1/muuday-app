'use client'

import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'
import { Lock } from 'lucide-react'
import { addAvailabilityException } from '@/lib/actions/availability-exceptions'

interface BlockTimeModalProps {
  isOpen: boolean
  date: Date | null
  startMinutes: number
  calendarTimezone: string
  reason: string
  loading: boolean
  error: string | null
  onReasonChange: (value: string) => void
  onClose: () => void
  onError: (error: string) => void
  onLoadingChange: (loading: boolean) => void
}

export function BlockTimeModal({
  isOpen,
  date,
  startMinutes,
  calendarTimezone,
  reason,
  loading,
  error,
  onReasonChange,
  onClose,
  onError,
  onLoadingChange,
}: BlockTimeModalProps) {
  if (!isOpen || !date) return null

  const handleBlock = async () => {
    onLoadingChange(true)
    onError('')
    const dateLocal = formatInTimeZone(date, calendarTimezone, 'yyyy-MM-dd')
    const endMinutes = startMinutes + 60
    const startTimeLocal = `${String(Math.floor(startMinutes / 60)).padStart(2, '0')}:${String(startMinutes % 60).padStart(2, '0')}`
    const endTimeLocal = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`
    const result = await addAvailabilityException(dateLocal, {
      isAvailable: false,
      startTimeLocal,
      endTimeLocal,
      timezone: calendarTimezone,
      reason: reason.trim() || 'Bloqueio manual pelo calendário',
    })
    onLoadingChange(false)
    if (result.success) {
      onClose()
      window.location.reload()
    } else {
      onError(result.error || 'Erro ao bloquear horário.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-slate-500" />
          <h3 className="font-semibold text-slate-900">Bloquear horário</h3>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          {formatInTimeZone(date, calendarTimezone, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          {' às '}
          {String(Math.floor(startMinutes / 60)).padStart(2, '0')}:
          {String(startMinutes % 60).padStart(2, '0')}
        </p>
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">Motivo (opcional)</label>
          <input
            type="text"
            value={reason}
            onChange={e => onReasonChange(e.target.value)}
            placeholder="Ex: Compromisso pessoal"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#9FE870] focus:outline-none focus:ring-1 focus:ring-[#9FE870]"
          />
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={handleBlock}
            disabled={loading}
            className="flex-1 rounded-md bg-[#9FE870] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#8ed85f] disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Bloquear'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

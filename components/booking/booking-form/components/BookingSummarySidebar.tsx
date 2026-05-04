'use client'

import { Calendar, Clock, Globe, Loader2, AlertCircle } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { timezoneLabel, PLATFORM_CANCELLATION_POLICY } from '../../booking-form-helpers'

interface BookingSummarySidebarProps {
  profileName: string
  sessionDurationMinutes: number
  sessionPriceBrl: number
  userCurrency: string
  selectedDate: Date | null
  selectedTime: string | null
  selectedTimeInProfessionalTimezone: string | null
  userTimezone: string
  professionalTimezone: string
  totalSessions: number
  totalPrice: number
  priceFormatted: string
  totalPriceFormatted: string
  recurringConflicts: { startUtc: string; reason: 'existing_booking' | 'blocked_slot' }[]
  bookingResult: { success: false; error: string } | null
  canSubmit: boolean
  isPending: boolean
  submitLabel: string
  acceptPolicy: boolean
  onAcceptPolicyChange: (value: boolean) => void
  acceptTimezone: boolean
  onAcceptTimezoneChange: (value: boolean) => void
  onSubmit: () => void
}

export function BookingSummarySidebar({
  profileName,
  sessionDurationMinutes,
  sessionPriceBrl,
  userCurrency,
  selectedDate,
  selectedTime,
  selectedTimeInProfessionalTimezone,
  userTimezone,
  professionalTimezone,
  totalSessions,
  totalPrice,
  priceFormatted,
  totalPriceFormatted,
  recurringConflicts,
  bookingResult,
  canSubmit,
  isPending,
  submitLabel,
  acceptPolicy,
  onAcceptPolicyChange,
  acceptTimezone,
  onAcceptTimezoneChange,
  onSubmit,
}: BookingSummarySidebarProps) {
  return (
    <div className="sticky top-6 rounded-lg border border-slate-200/80 bg-white p-6">
      <div className="mb-4 flex items-center gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#9FE870]/80 to-[#8ed85f] text-lg font-bold text-white font-display">
          {profileName.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{profileName}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {sessionDurationMinutes} min • {priceFormatted}
          </p>
        </div>
      </div>

      <div className="mb-5 space-y-3">
        <div className="flex items-start gap-2.5 text-sm">
          <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
          <div>
            <p className="mb-0.5 text-xs text-slate-400">Data</p>
            {selectedDate ? (
              <p className="font-medium text-slate-800">
                {selectedDate.toLocaleDateString('pt-BR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            ) : (
              <p className="italic text-slate-400">Não selecionada</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2.5 text-sm">
          <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
          <div>
            <p className="mb-0.5 text-xs text-slate-400">Horário</p>
            {selectedTime ? (
              <p className="font-medium text-slate-800">
                {selectedTime} ({timezoneLabel(userTimezone)})
              </p>
            ) : (
              <p className="italic text-slate-400">Não selecionado</p>
            )}
            {selectedTimeInProfessionalTimezone && (
              <p className="mt-0.5 text-xs text-slate-500">
                Profissional: {selectedTimeInProfessionalTimezone} ({timezoneLabel(professionalTimezone)})
              </p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2.5 text-sm">
          <Globe className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
          <div>
            <p className="mb-0.5 text-xs text-slate-400">Fuso padrão do checkout</p>
            <p className="text-xs font-medium leading-snug text-slate-800">
              {timezoneLabel(userTimezone)}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5 rounded-lg bg-slate-50/60 p-4 border border-slate-100">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Sessão ({sessionDurationMinutes} min) x {totalSessions}
          </span>
          <span className="font-semibold text-slate-800">{priceFormatted}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Taxa de serviço</span>
          <span className="font-medium text-green-600">Grátis</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
          <span className="font-semibold text-slate-900">Total</span>
          <span className="text-lg font-bold text-slate-900">{totalPriceFormatted}</span>
        </div>
      </div>

      <div className="mb-4 rounded-lg border border-slate-200/80 bg-slate-50/30 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
          Política de cancelamento
        </p>
        <div className="space-y-1.5">
          {PLATFORM_CANCELLATION_POLICY.map(item => (
            <p key={item} className="text-xs text-slate-500">
              • {item}
            </p>
          ))}
        </div>
      </div>

      {recurringConflicts.length > 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50/70 p-3 text-sm text-amber-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <p className="font-semibold">Atenção: conflitos detectados</p>
            <p className="mt-0.5">
              {recurringConflicts.length} sessão(ões) conflitam com agendamentos existentes. O profissional pode recusar ou ajustar.
            </p>
          </div>
        </div>
      )}

      {bookingResult && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50/70 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>{bookingResult.error}</p>
        </div>
      )}

      <div className="mb-4 space-y-2 rounded-lg border border-slate-200/80 bg-slate-50/30 p-3">
        <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={acceptPolicy}
            onChange={e => onAcceptPolicyChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#9FE870] focus:ring-[#9FE870]/50"
          />
          <span>Li e concordo com a política de cancelamento e reembolso.</span>
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={acceptTimezone}
            onChange={e => onAcceptTimezoneChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#9FE870] focus:ring-[#9FE870]/50"
          />
          <span>Confirmo que revisei data e horário nos fusos corretos.</span>
        </label>
      </div>

      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-all active:scale-[0.98]',
          canSubmit
            ? 'bg-[#9FE870] text-white hover:bg-[#8ed85f]'
            : 'cursor-not-allowed bg-slate-100 text-slate-400',
        )}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <Calendar className="h-4 w-4" />
            {submitLabel}
          </>
        )}
      </button>

      <div className="mt-4 space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-400" />
          Sessão por vídeo (Agora)
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-400" />
          Lembretes por email e notificações no app
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-400" />
          Proteção contra conflito de agenda
        </div>
      </div>
    </div>
  )
}

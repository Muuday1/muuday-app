'use client'

import { WEEK_DAYS, TIME_OPTIONS } from '../constants'
import type { AvailabilityDayState, SaveState } from '../types'
import type { TierLimits } from '@/lib/tier-config'

interface AvailabilityStageProps {
  profileTimezone: string
  availabilityMap: Record<string, AvailabilityDayState>
  setAvailabilityMap: React.Dispatch<React.SetStateAction<Record<string, AvailabilityDayState>>>
  minimumNoticeHours: number
  setMinimumNoticeHours: (value: number) => void
  minNoticeRange: { min: number; max: number }
  maxBookingWindowDays: number
  setMaxBookingWindowDays: (value: number) => void
  tierLimits: TierLimits
  bufferMinutes: number
  setBufferMinutes: (value: number) => void
  maxBufferMinutes: number
  isBasicTier: boolean
  confirmationMode: 'auto_accept' | 'manual'
  setConfirmationMode: (value: 'auto_accept' | 'manual') => void
  enableRecurring: boolean
  setEnableRecurring: (value: boolean) => void
  allowMultiSession: boolean
  setAllowMultiSession: (value: boolean) => void
  requireSessionPurpose: boolean
  setRequireSessionPurpose: (value: boolean) => void
  availabilityError: string | null
  availabilitySaveState: SaveState
  saveAvailabilityCalendar: () => Promise<void>
}

export function AvailabilityStage({
  profileTimezone,
  availabilityMap,
  setAvailabilityMap,
  minimumNoticeHours,
  setMinimumNoticeHours,
  minNoticeRange,
  maxBookingWindowDays,
  setMaxBookingWindowDays,
  tierLimits,
  bufferMinutes,
  setBufferMinutes,
  maxBufferMinutes,
  isBasicTier,
  confirmationMode,
  setConfirmationMode,
  enableRecurring,
  setEnableRecurring,
  allowMultiSession,
  setAllowMultiSession,
  requireSessionPurpose,
  setRequireSessionPurpose,
  availabilityError,
  availabilitySaveState,
  saveAvailabilityCalendar,
}: AvailabilityStageProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-4">
        <div className="flex flex-col gap-3">
          <div className="max-w-2xl">
            <h3 className="text-sm font-semibold text-neutral-900">Defina aqui só os seus horários de trabalho</h3>
            <p className="mt-1 text-sm text-neutral-700">
              Nesta etapa você configura a disponibilidade recorrente da semana. Esses horários representam quando você aceita atender pela Muuday.
            </p>
            <p className="mt-2 text-xs text-neutral-600">
              Bloqueios pontuais, integrações e regras avançadas ficam nas páginas de Calendário e Configurações.
            </p>
          </div>
        </div>
        <div className="mt-3 rounded-lg border border-neutral-200 bg-white/90 px-3 py-2 text-xs text-neutral-700">
          Fuso configurado do perfil: <strong>{profileTimezone}</strong>. A agenda aplica esse fuso automaticamente, incluindo horário de verão/inverno quando aplicável.
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-3.5">
        <h4 className="text-sm font-semibold text-neutral-900">Horas de trabalho por dia</h4>
        <p className="mt-1 text-xs text-neutral-500">
          Ative apenas os dias em que você costuma atender. Você poderá bloquear exceções e indisponibilidades no calendário completo.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2.5">
          {WEEK_DAYS.map(day => {
            const dayState = availabilityMap[day.value]
            const isActive = dayState?.is_available
            return (
              <div
                key={day.value}
                className={`rounded-xl border px-3 py-3 ${
                  isActive ? 'border-brand-200 bg-brand-50/30' : 'border-neutral-200 bg-neutral-50'
                }`}
              >
                <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,180px)_1fr] md:items-center">
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-neutral-800">
                    <input
                      type="checkbox"
                      checked={Boolean(isActive)}
                      onChange={event =>
                        setAvailabilityMap(prev => ({
                          ...prev,
                          [day.value]: {
                            ...prev[day.value],
                            is_available: event.target.checked,
                          },
                        }))
                      }
                      className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                    />
                    {day.label}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={dayState?.start_time || '09:00'}
                      disabled={!isActive}
                      onChange={event =>
                        setAvailabilityMap(prev => ({
                          ...prev,
                          [day.value]: {
                            ...prev[day.value],
                            start_time: event.target.value,
                          },
                        }))
                      }
                      className="w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {TIME_OPTIONS.map(option => (
                        <option key={`start-${day.value}-${option}`} value={option}>
                          Início {option}
                        </option>
                      ))}
                    </select>
                    <select
                      value={dayState?.end_time || '18:00'}
                      disabled={!isActive}
                      onChange={event =>
                        setAvailabilityMap(prev => ({
                          ...prev,
                          [day.value]: {
                            ...prev[day.value],
                            end_time: event.target.value,
                          },
                        }))
                      }
                      className="w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {TIME_OPTIONS.map(option => (
                        <option key={`end-${day.value}-${option}`} value={option}>
                          Fim {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-3.5">
        <h4 className="text-sm font-semibold text-neutral-900">Regras básicas de agendamento</h4>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-neutral-700">Antecedência mínima (horas)</label>
            <input
              type="number"
              min={Number(minNoticeRange.min)}
              max={Math.min(Number(minNoticeRange.max), 168)}
              value={minimumNoticeHours}
              onChange={event =>
                setMinimumNoticeHours(
                  Math.min(
                    Math.min(Number(minNoticeRange.max), 168),
                    Math.max(
                      Number(minNoticeRange.min),
                      Number(event.target.value || minNoticeRange.min),
                    ),
                  ),
                )
              }
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-[11px] text-neutral-500">
              Tempo mínimo entre a solicitação e a sessão (ex.: 24h = pedido com 1 dia de antecedência).
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-neutral-700">Janela máxima (dias)</label>
            <input
              type="number"
              min={1}
              max={Number(tierLimits.bookingWindowDays)}
              value={maxBookingWindowDays}
              onChange={event =>
                setMaxBookingWindowDays(
                  Math.min(Number(tierLimits.bookingWindowDays), Math.max(1, Number(event.target.value || 1))),
                )
              }
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-[11px] text-neutral-500">
              Limite do plano atual: ate {tierLimits.bookingWindowDays} dias.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-neutral-700">Buffer entre sessões (min)</label>
            <input
              type="number"
              min={0}
              max={maxBufferMinutes}
              value={bufferMinutes}
              onChange={event => {
                const next = Math.max(0, Number(event.target.value || 0))
                setBufferMinutes(Math.min(maxBufferMinutes, next))
              }}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-[11px] text-neutral-500">
              Limite atual: {maxBufferMinutes} minutos.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-neutral-700">Modo de confirmação</label>
            <select
              value={isBasicTier ? 'auto_accept' : confirmationMode}
              disabled={isBasicTier}
              onChange={event => setConfirmationMode(event.target.value === 'manual' ? 'manual' : 'auto_accept')}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500"
            >
              <option value="auto_accept">Auto-aceite</option>
              <option value="manual">Confirmação manual</option>
            </select>
            {isBasicTier ? (
              <p className="mt-1 text-[11px] text-amber-700">
                No plano básico, o aceite é automático.
              </p>
            ) : null}
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={enableRecurring}
              onChange={event => setEnableRecurring(event.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
            />
            Permitir recorrência
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={allowMultiSession}
              onChange={event => setAllowMultiSession(event.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
            />
            Permitir múltiplas sessões
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={requireSessionPurpose}
              onChange={event => setRequireSessionPurpose(event.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
            />
            Exigir objetivo da sessão
          </label>
        </div>
      </div>

      {availabilityError ? <p className="text-sm font-medium text-red-700">{availabilityError}</p> : null}

      <button
        type="button"
        onClick={() => void saveAvailabilityCalendar()}
        disabled={availabilitySaveState === 'saving'}
        className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
      >
        {availabilitySaveState === 'saving'
          ? 'Salvando...'
          : availabilitySaveState === 'saved'
            ? 'Salvo'
            : 'Salvar horas de trabalho'}
      </button>
    </div>
  )
}

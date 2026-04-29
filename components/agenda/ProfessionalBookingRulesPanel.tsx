'use client'

import { useMemo, useState } from 'react'
import { ALL_TIMEZONES } from '@/lib/constants'
import { AlertCircle, CalendarClock, Check, Loader2 } from 'lucide-react'
import { DEFAULT_PROFESSIONAL_BOOKING_SETTINGS } from '@/lib/booking/settings'
import type { PlanConfig } from '@/lib/plan-config'
import { getDefaultPlanConfigMap } from '@/lib/plan-config'
import type { BookingSettingsForm } from '@/components/settings/BookingSettingsClient'
import { saveBookingSettingsAction } from '@/lib/actions/professional'

type ProfessionalBookingRulesPanelProps = {
  userId: string
  professionalId: string
  tier: string
  initialPlanConfig: PlanConfig
  initialForm: BookingSettingsForm
}

const DURATION_OPTIONS = [30, 45, 50, 60, 75, 90, 120]
const BUFFER_OPTIONS = [0, 5, 10, 15, 20, 30, 45, 60, 90, 120]
const MIN_NOTICE_OPTIONS = [0, 1, 2, 4, 8, 12, 24, 48, 72, 96, 168]
const MAX_WINDOW_OPTIONS = [7, 14, 21, 30, 45, 60, 90, 120, 180, 365]

export function ProfessionalBookingRulesPanel({
  userId,
  professionalId,
  tier: tierRaw,
  initialPlanConfig,
  initialForm,
}: ProfessionalBookingRulesPanelProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [form, setForm] = useState<BookingSettingsForm>(initialForm)

  const tier = String(tierRaw || 'basic').toLowerCase()
  const fallbackPlanConfig = useMemo(() => getDefaultPlanConfigMap().basic, [])
  const planConfig = useMemo(
    () => initialPlanConfig || fallbackPlanConfig,
    [fallbackPlanConfig, initialPlanConfig],
  )
  const noticeRange = planConfig.minNoticeRange
  const tierLimits = planConfig.limits
  const bufferConfig = planConfig.bufferConfig
  const allowedMinNoticeOptions = useMemo(
    () => MIN_NOTICE_OPTIONS.filter(hours => hours >= noticeRange.min && hours <= noticeRange.max),
    [noticeRange.max, noticeRange.min],
  )
  const allowedMaxWindowOptions = useMemo(
    () => MAX_WINDOW_OPTIONS.filter(days => days <= tierLimits.bookingWindowDays),
    [tierLimits.bookingWindowDays],
  )

  const minNoticeLabel = useMemo(() => {
    if (form.minimumNoticeHours >= 24 && form.minimumNoticeHours % 24 === 0) {
      const days = form.minimumNoticeHours / 24
      return `${days} ${days === 1 ? 'dia' : 'dias'}`
    }
    return `${form.minimumNoticeHours}h`
  }, [form.minimumNoticeHours])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setErrorMessage('')

    const effectiveBufferMinutes = bufferConfig.configurable ? form.bufferMinutes : 15
    const effectiveConfirmationMode = tier === 'basic' ? 'auto_accept' : form.confirmationMode
    const effectiveMaxWindowDays = Math.min(form.maxBookingWindowDays, tierLimits.bookingWindowDays)

    const result = await saveBookingSettingsAction({
      timezone: form.timezone,
      sessionDurationMinutes: form.sessionDurationMinutes,
      bufferMinutes: effectiveBufferMinutes,
      minimumNoticeHours: form.minimumNoticeHours,
      maxBookingWindowDays: effectiveMaxWindowDays,
      enableRecurring: form.enableRecurring,
      confirmationMode: effectiveConfirmationMode,
      cancellationPolicyCode: form.cancellationPolicyCode,
      requireSessionPurpose: form.requireSessionPurpose,
    })

    setSaving(false)

    if (result?.error) {
      setErrorMessage(result.error)
      return
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Regras e disponibilidades
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">
          Regras de agendamento e checkout
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Ajuste confirmação, janela de agenda, antecedência e comportamento do checkout a partir do mesmo fluxo.
        </p>
      </div>

      <div className="rounded-md border border-[#9FE870]/20 bg-[#9FE870]/8 px-4 py-3 text-sm text-[#3d6b1f]">
        O seu plano atual é <strong>{tier.toUpperCase()}</strong>. Algumas opções abaixo variam por tier.
      </div>

      <div className="space-y-6 rounded-lg border border-slate-200/80 bg-white p-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Fuso horário padrão</label>
          <select
            value={form.timezone}
            onChange={e => setForm(prev => ({ ...prev, timezone: e.target.value }))}
            className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#9FE870] focus:outline-none focus:ring-2 focus:ring-[#9FE870]/20"
          >
            {ALL_TIMEZONES.map(timezone => (
              <option key={timezone.value} value={timezone.value}>
                {timezone.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Duração padrão da sessão
            </label>
            <select
              value={form.sessionDurationMinutes}
              onChange={e =>
                setForm(prev => ({
                  ...prev,
                  sessionDurationMinutes: Number(e.target.value),
                }))
              }
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#9FE870] focus:outline-none focus:ring-2 focus:ring-[#9FE870]/20"
            >
              {DURATION_OPTIONS.map(option => (
                <option key={option} value={option}>
                  {option} min
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Buffer entre sessões</label>
            {bufferConfig.configurable ? null : (
              <p className="mb-2 text-xs text-slate-500">
                No plano Basic o buffer é fixo em 15 minutos.
              </p>
            )}
            <select
              value={form.bufferMinutes}
              onChange={e =>
                setForm(prev => ({
                  ...prev,
                  bufferMinutes: Number(e.target.value),
                }))
              }
              disabled={!bufferConfig.configurable}
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#9FE870] focus:outline-none focus:ring-2 focus:ring-[#9FE870]/20 disabled:cursor-not-allowed disabled:bg-slate-50/70"
            >
              {BUFFER_OPTIONS.map(option => (
                <option key={option} value={option}>
                  {option} min
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Antecedência mínima ({minNoticeLabel})
            </label>
            <select
              value={form.minimumNoticeHours}
              onChange={e =>
                setForm(prev => ({
                  ...prev,
                  minimumNoticeHours: Number(e.target.value),
                }))
              }
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#9FE870] focus:outline-none focus:ring-2 focus:ring-[#9FE870]/20"
            >
              {allowedMinNoticeOptions.map(option => (
                <option key={option} value={option}>
                  {option >= 24 && option % 24 === 0 ? `${option / 24} dia(s)` : `${option}h`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Janela máxima de agendamento
            </label>
            <select
              value={form.maxBookingWindowDays}
              onChange={e =>
                setForm(prev => ({
                  ...prev,
                  maxBookingWindowDays: Number(e.target.value),
                }))
              }
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#9FE870] focus:outline-none focus:ring-2 focus:ring-[#9FE870]/20"
            >
              {allowedMaxWindowOptions.map(option => (
                <option key={option} value={option}>
                  {option} dias
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex items-start gap-3 rounded-md border border-slate-200 bg-white px-4 py-3">
            <input
              type="checkbox"
              checked={form.enableRecurring}
              onChange={e => setForm(prev => ({ ...prev, enableRecurring: e.target.checked }))}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#9FE870] focus:ring-[#9FE870]/30"
            />
            <span>
              <span className="block text-sm font-medium text-slate-900">Permitir recorrência</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Clientes podem criar pacotes recorrentes no mesmo dia/horário.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-md border border-slate-200 bg-white px-4 py-3">
            <input
              type="checkbox"
              checked={form.requireSessionPurpose}
              onChange={e =>
                setForm(prev => ({ ...prev, requireSessionPurpose: e.target.checked }))
              }
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#9FE870] focus:ring-[#9FE870]/30"
            />
            <span>
              <span className="block text-sm font-medium text-slate-900">
                Exigir objetivo da sessão
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Solicita contexto do cliente antes da confirmação.
              </span>
            </span>
          </label>
        </div>

        <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
          {tier === 'basic' ? (
            <p className="mb-2 text-xs text-slate-500">
              No plano Basic o aceite é automático. Faça upgrade para confirmação manual.
            </p>
          ) : null}
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Modo de confirmação
          </label>
          <select
            value={tier === 'basic' ? 'auto_accept' : form.confirmationMode}
            onChange={e =>
              setForm(prev => ({
                ...prev,
                confirmationMode: e.target.value as 'auto_accept' | 'manual',
              }))
            }
            disabled={tier === 'basic'}
            className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#9FE870] focus:outline-none focus:ring-2 focus:ring-[#9FE870]/20 disabled:cursor-not-allowed disabled:bg-slate-50/70"
          >
            <option value="auto_accept">Aceite automático</option>
            <option value="manual">Confirmação manual</option>
          </select>
        </div>

        <div className="rounded-md border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-xs text-slate-600">
          <div className="flex items-start gap-2">
            <CalendarClock className="mt-0.5 h-4 w-4 text-slate-500" />
            <p>
              Essas regras são usadas no checkout e no cálculo de slots. Mudanças aqui impactam imediatamente novas reservas.
            </p>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>{errorMessage}</p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#9FE870] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[#8ed85f] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : saved ? (
          <>
            <Check className="h-4 w-4" />
            Regras salvas
          </>
        ) : (
          'Salvar regras'
        )}
      </button>

      <div className="text-center text-xs text-slate-500">
        Default de fallback: timezone {DEFAULT_PROFESSIONAL_BOOKING_SETTINGS.timezone}
      </div>
    </div>
  )
}

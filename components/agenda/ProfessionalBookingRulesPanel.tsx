'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ALL_TIMEZONES } from '@/lib/constants'
import { AlertCircle, CalendarClock, Check, Loader2 } from 'lucide-react'
import { DEFAULT_PROFESSIONAL_BOOKING_SETTINGS } from '@/lib/booking/settings'
import type { PlanConfig } from '@/lib/plan-config'
import { getDefaultPlanConfigMap } from '@/lib/plan-config'
import type { BookingSettingsForm } from '@/components/settings/BookingSettingsClient'

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
  const supabase = useMemo(() => createClient(), [])
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

    const nowIso = new Date().toISOString()

    const { error: settingsError } = await supabase.from('professional_settings').upsert(
      {
        professional_id: professionalId,
        timezone: form.timezone,
        session_duration_minutes: form.sessionDurationMinutes,
        buffer_minutes: bufferConfig.configurable ? form.bufferMinutes : 15,
        buffer_time_minutes: bufferConfig.configurable ? form.bufferMinutes : 15,
        minimum_notice_hours: form.minimumNoticeHours,
        max_booking_window_days: Math.min(form.maxBookingWindowDays, tierLimits.bookingWindowDays),
        enable_recurring: form.enableRecurring,
        confirmation_mode: tier === 'basic' ? 'auto_accept' : form.confirmationMode,
        cancellation_policy_code: form.cancellationPolicyCode,
        require_session_purpose: form.requireSessionPurpose,
        updated_at: nowIso,
      },
      { onConflict: 'professional_id' },
    )

    if (settingsError) {
      setErrorMessage('Não foi possível salvar as regras de agendamento. Tente novamente.')
      setSaving(false)
      return
    }

    const { error: professionalError } = await supabase
      .from('professionals')
      .update({
        session_duration_minutes: form.sessionDurationMinutes,
        updated_at: nowIso,
      })
      .eq('id', professionalId)

    if (professionalError) {
      setErrorMessage('Regras salvas, mas houve falha ao sincronizar a duração no perfil.')
      setSaving(false)
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        timezone: form.timezone,
        updated_at: nowIso,
      })
      .eq('id', userId)

    if (profileError) {
      setErrorMessage('Regras salvas, mas houve falha ao sincronizar o fuso no perfil.')
      setSaving(false)
      return
    }

    await fetch('/api/professional/recompute-visibility', {
      method: 'POST',
      credentials: 'include',
    })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-neutral-200 bg-white px-6 py-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
          Regras e disponibilidades
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold text-neutral-950">
          Regras de agendamento e checkout
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">
          Ajuste confirmação, janela de agenda, antecedência e comportamento do checkout a partir do mesmo fluxo.
        </p>
      </div>

      <div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700">
        O seu plano atual é <strong>{tier.toUpperCase()}</strong>. Algumas opções abaixo variam por tier.
      </div>

      <div className="space-y-6 rounded-2xl border border-neutral-100 bg-white p-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Fuso horário padrão</label>
          <select
            value={form.timezone}
            onChange={e => setForm(prev => ({ ...prev, timezone: e.target.value }))}
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
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
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
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
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              {DURATION_OPTIONS.map(option => (
                <option key={option} value={option}>
                  {option} min
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Buffer entre sessões</label>
            {bufferConfig.configurable ? null : (
              <p className="mb-2 text-xs text-neutral-500">
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
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-neutral-50"
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
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
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
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              {allowedMinNoticeOptions.map(option => (
                <option key={option} value={option}>
                  {option >= 24 && option % 24 === 0 ? `${option / 24} dia(s)` : `${option}h`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
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
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
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
          <label className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3">
            <input
              type="checkbox"
              checked={form.enableRecurring}
              onChange={e => setForm(prev => ({ ...prev, enableRecurring: e.target.checked }))}
              className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-500/30"
            />
            <span>
              <span className="block text-sm font-medium text-neutral-900">Permitir recorrência</span>
              <span className="mt-0.5 block text-xs text-neutral-500">
                Clientes podem criar pacotes recorrentes no mesmo dia/horário.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3">
            <input
              type="checkbox"
              checked={form.requireSessionPurpose}
              onChange={e =>
                setForm(prev => ({ ...prev, requireSessionPurpose: e.target.checked }))
              }
              className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-500/30"
            />
            <span>
              <span className="block text-sm font-medium text-neutral-900">
                Exigir objetivo da sessão
              </span>
              <span className="mt-0.5 block text-xs text-neutral-500">
                Solicita contexto do cliente antes da confirmação.
              </span>
            </span>
          </label>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
          {tier === 'basic' ? (
            <p className="mb-2 text-xs text-neutral-500">
              No plano Basic o aceite é automático. Faça upgrade para confirmação manual.
            </p>
          ) : null}
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
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
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-neutral-50"
          >
            <option value="auto_accept">Aceite automático</option>
            <option value="manual">Confirmação manual</option>
          </select>
        </div>

        <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-xs text-neutral-600">
          <div className="flex items-start gap-2">
            <CalendarClock className="mt-0.5 h-4 w-4 text-neutral-500" />
            <p>
              Essas regras são usadas no checkout e no cálculo de slots. Mudanças aqui impactam imediatamente novas reservas.
            </p>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>{errorMessage}</p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
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

      <div className="text-center text-xs text-neutral-500">
        Default de fallback: timezone {DEFAULT_PROFESSIONAL_BOOKING_SETTINGS.timezone}
      </div>
    </div>
  )
}

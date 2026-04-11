'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ALL_TIMEZONES } from '@/lib/constants'
import { AlertCircle, CalendarClock, Check, ChevronLeft, Loader2 } from 'lucide-react'
import {
  DEFAULT_PROFESSIONAL_BOOKING_SETTINGS,
} from '@/lib/booking/settings'
import { getBufferConfig, getMinNoticeRange, getTierLimits } from '@/lib/tier-config'

export type BookingSettingsForm = {
  timezone: string
  sessionDurationMinutes: number
  bufferMinutes: number
  minimumNoticeHours: number
  maxBookingWindowDays: number
  enableRecurring: boolean
  confirmationMode: 'auto_accept' | 'manual'
  cancellationPolicyCode: string
  requireSessionPurpose: boolean
}

type BookingSettingsClientProps = {
  userId: string
  professionalId: string
  tier: string
  initialForm: BookingSettingsForm
}

const DURATION_OPTIONS = [30, 45, 50, 60, 75, 90, 120]
const BUFFER_OPTIONS = [0, 5, 10, 15, 20, 30, 45, 60]
const MIN_NOTICE_OPTIONS = [1, 2, 4, 8, 12, 24, 48, 72, 96, 168]
const MAX_WINDOW_OPTIONS = [7, 14, 21, 30, 45, 60, 90, 120, 180, 365]

export function BookingSettingsClient({
  userId,
  professionalId,
  tier: tierRaw,
  initialForm,
}: BookingSettingsClientProps) {
  const supabase = useMemo(() => createClient(), [])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [form, setForm] = useState<BookingSettingsForm>(initialForm)

  const tier = String(tierRaw || 'basic').toLowerCase()
  const noticeRange = useMemo(() => getMinNoticeRange(tier), [tier])
  const tierLimits = useMemo(() => getTierLimits(tier), [tier])
  const bufferConfig = useMemo(() => getBufferConfig(tier), [tier])
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
      setErrorMessage('Não foi possível salvar as configurações. Tente novamente.')
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
      setErrorMessage('Configurações salvas, mas houve falha ao sincronizar a duração no perfil.')
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
      setErrorMessage('Configurações salvas, mas houve falha ao sincronizar o fuso no perfil.')
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
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <Link
          href="/perfil"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-600 transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar ao perfil
        </Link>
        <h1 className="font-display font-bold text-3xl text-neutral-900 mb-1">
          Configurações de agendamento
        </h1>
        <p className="text-neutral-500">
          Defina as regras usadas no checkout: fuso, janela de agenda, confirmação e recorrência.
        </p>
      </div>

      <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 mb-6 text-sm text-brand-700">
        O seu plano atual é <strong>{tier.toUpperCase()}</strong>. Algumas opções abaixo variam por tier.
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Fuso horário padrão
          </label>
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
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
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

          <div className="relative">
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Buffer entre sessões
            </label>
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
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
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
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
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

        <div className="relative rounded-xl border border-neutral-200 bg-white px-4 py-3">
          {tier === 'basic' ? (
            <p className="mb-2 text-xs text-neutral-500">
              No plano Basic o aceite é automático. Faça upgrade para confirmação manual.
            </p>
          ) : null}
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
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
              Essas regras são usadas no checkout e no cálculo de slots. Mudanças aqui impactam
              imediatamente novas reservas.
            </p>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>{errorMessage}</p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : saved ? (
          <>
            <Check className="h-4 w-4" />
            Configurações salvas
          </>
        ) : (
          'Salvar configurações'
        )}
      </button>

      <div className="mt-3 text-center text-xs text-neutral-500">
        Default de fallback: timezone {DEFAULT_PROFESSIONAL_BOOKING_SETTINGS.timezone}
      </div>
    </div>
  )
}

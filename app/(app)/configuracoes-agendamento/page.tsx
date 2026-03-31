'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ALL_TIMEZONES } from '@/lib/constants'
import { DEFAULT_PROFESSIONAL_BOOKING_SETTINGS, normalizeProfessionalSettingsRow } from '@/lib/booking/settings'
import { AlertCircle, CalendarClock, Check, ChevronLeft, Loader2 } from 'lucide-react'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'

type BookingSettingsForm = {
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

const DURATION_OPTIONS = [30, 45, 50, 60, 75, 90, 120]
const BUFFER_OPTIONS = [0, 5, 10, 15, 20, 30, 45, 60]
const MIN_NOTICE_OPTIONS = [1, 2, 4, 8, 12, 24, 48, 72, 96, 168]
const MAX_WINDOW_OPTIONS = [7, 14, 21, 30, 45, 60, 90, 120, 180, 365]

export default function ConfiguracoesAgendamentoPage() {
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [accessDenied, setAccessDenied] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [professionalId, setProfessionalId] = useState<string | null>(null)
  const [form, setForm] = useState<BookingSettingsForm>({
    ...DEFAULT_PROFESSIONAL_BOOKING_SETTINGS,
    confirmationMode: DEFAULT_PROFESSIONAL_BOOKING_SETTINGS.confirmationMode,
  })

  useEffect(() => {
    async function loadData() {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, timezone')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'profissional') {
        setAccessDenied(true)
        setLoading(false)
        return
      }

      const { data: professional } = await getPrimaryProfessionalForUser(
        supabase,
        user.id,
        'id, session_duration_minutes',
      )

      if (!professional) {
        setAccessDenied(true)
        setLoading(false)
        return
      }

      setProfessionalId(professional.id)

      const { data: settingsRow, error: settingsError } = await supabase
        .from('professional_settings')
        .select(
          'timezone, session_duration_minutes, buffer_minutes, minimum_notice_hours, max_booking_window_days, enable_recurring, confirmation_mode, cancellation_policy_code, require_session_purpose'
        )
        .eq('professional_id', professional.id)
        .maybeSingle()

      const normalized = normalizeProfessionalSettingsRow(
        settingsError ? null : (settingsRow as Record<string, unknown> | null),
        profile.timezone || DEFAULT_PROFESSIONAL_BOOKING_SETTINGS.timezone,
      )

      const durationFromProfessional =
        typeof professional.session_duration_minutes === 'number'
          ? professional.session_duration_minutes
          : normalized.sessionDurationMinutes

      setForm({
        timezone: normalized.timezone,
        sessionDurationMinutes: durationFromProfessional,
        bufferMinutes: normalized.bufferMinutes,
        minimumNoticeHours: normalized.minimumNoticeHours,
        maxBookingWindowDays: normalized.maxBookingWindowDays,
        enableRecurring: normalized.enableRecurring,
        confirmationMode: normalized.confirmationMode,
        cancellationPolicyCode: normalized.cancellationPolicyCode,
        requireSessionPurpose: normalized.requireSessionPurpose,
      })
      setLoading(false)
    }

    loadData()
  }, [supabase])

  const minNoticeLabel = useMemo(() => {
    if (form.minimumNoticeHours >= 24 && form.minimumNoticeHours % 24 === 0) {
      const days = form.minimumNoticeHours / 24
      return `${days} ${days === 1 ? 'dia' : 'dias'}`
    }
    return `${form.minimumNoticeHours}h`
  }, [form.minimumNoticeHours])

  async function handleSave() {
    if (!professionalId || !userId) return

    setSaving(true)
    setSaved(false)
    setErrorMessage('')

    const nowIso = new Date().toISOString()

    const { error: settingsError } = await supabase.from('professional_settings').upsert(
      {
        professional_id: professionalId,
        timezone: form.timezone,
        session_duration_minutes: form.sessionDurationMinutes,
        buffer_minutes: form.bufferMinutes,
        minimum_notice_hours: form.minimumNoticeHours,
        max_booking_window_days: form.maxBookingWindowDays,
        enable_recurring: form.enableRecurring,
        confirmation_mode: form.confirmationMode,
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

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-neutral-100 p-8 text-center">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="font-display font-bold text-xl text-neutral-900 mb-2">Acesso restrito</h2>
          <p className="text-neutral-500 text-sm mb-6">
            Esta página é exclusiva para profissionais.
          </p>
          <Link
            href="/perfil"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm"
          >
            Voltar ao perfil
          </Link>
        </div>
      </div>
    )
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
        Todas as datas são armazenadas em UTC no sistema. O cliente vê os horários no fuso dele.
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-neutral-100 p-6">
          <h2 className="font-display font-bold text-lg text-neutral-900 mb-4">Fuso e duração</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Fuso horário profissional
              </label>
              <select
                value={form.timezone}
                onChange={e => setForm(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              >
                {ALL_TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Duração padrão da sessão
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {DURATION_OPTIONS.map(minutes => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, sessionDurationMinutes: minutes }))}
                    className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                      form.sessionDurationMinutes === minutes
                        ? 'bg-brand-500 text-white'
                        : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    {minutes}min
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 p-6">
          <h2 className="font-display font-bold text-lg text-neutral-900 mb-4">Regras operacionais</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Buffer entre sessões
              </label>
              <select
                value={form.bufferMinutes}
                onChange={e => setForm(prev => ({ ...prev, bufferMinutes: Number(e.target.value) }))}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              >
                {BUFFER_OPTIONS.map(value => (
                  <option key={value} value={value}>
                    {value === 0 ? 'Sem buffer' : `${value} min`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Antecedência mínima
              </label>
              <select
                value={form.minimumNoticeHours}
                onChange={e =>
                  setForm(prev => ({ ...prev, minimumNoticeHours: Number(e.target.value) }))
                }
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              >
                {MIN_NOTICE_OPTIONS.map(hours => (
                  <option key={hours} value={hours}>
                    {hours >= 24 && hours % 24 === 0
                      ? `${hours / 24} ${hours / 24 === 1 ? 'dia' : 'dias'}`
                      : `${hours} horas`}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Janela máxima de agendamento
              </label>
              <select
                value={form.maxBookingWindowDays}
                onChange={e =>
                  setForm(prev => ({ ...prev, maxBookingWindowDays: Number(e.target.value) }))
                }
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              >
                {MAX_WINDOW_OPTIONS.map(days => (
                  <option key={days} value={days}>
                    {days} {days === 1 ? 'dia' : 'dias'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 p-6">
          <h2 className="font-display font-bold text-lg text-neutral-900 mb-4">Fluxo de confirmação</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, confirmationMode: 'auto_accept' }))}
              className={`rounded-xl border px-4 py-3 text-left transition-all ${
                form.confirmationMode === 'auto_accept'
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <p className="text-sm font-semibold text-neutral-900">Aceitar automaticamente</p>
              <p className="text-xs text-neutral-500 mt-1">
                A sessão fica confirmada após pagamento.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, confirmationMode: 'manual' }))}
              className={`rounded-xl border px-4 py-3 text-left transition-all ${
                form.confirmationMode === 'manual'
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <p className="text-sm font-semibold text-neutral-900">Confirmação manual</p>
              <p className="text-xs text-neutral-500 mt-1">
                O pedido fica pendente até sua aprovação (SLA de 24h).
              </p>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 p-6">
          <h2 className="font-display font-bold text-lg text-neutral-900 mb-4">Recorrência e briefing</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-neutral-800">Permitir pacotes recorrentes</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Libera agendamento semanal com pagamento do pacote completo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, enableRecurring: !prev.enableRecurring }))}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  form.enableRecurring ? 'bg-brand-500' : 'bg-neutral-200'
                }`}
                aria-label="Alternar recorrência"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    form.enableRecurring ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-neutral-800">Objetivo da sessão obrigatório</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Exige texto do cliente no checkout antes do pagamento.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm(prev => ({ ...prev, requireSessionPurpose: !prev.requireSessionPurpose }))
                }
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  form.requireSessionPurpose ? 'bg-brand-500' : 'bg-neutral-200'
                }`}
                aria-label="Alternar obrigatoriedade do objetivo da sessão"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    form.requireSessionPurpose ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 p-6">
          <h2 className="font-display font-bold text-lg text-neutral-900 mb-2">Política de cancelamento</h2>
          <p className="text-sm text-neutral-500 mb-4">
            Atualmente usamos a política padrão da plataforma.
          </p>
          <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-4 text-sm text-neutral-600">
            <div>- 48h ou mais: reembolso de 100%</div>
            <div>- Entre 24h e 48h: reembolso de 50%</div>
            <div>- Menos de 24h: sem reembolso</div>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      )}

      {saved && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <Check className="w-4 h-4" />
          Configurações de agendamento salvas com sucesso.
        </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold px-5 py-3 rounded-xl transition-all"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <CalendarClock className="w-4 h-4" />
              Salvar configurações
            </>
          )}
        </button>
        <p className="text-xs text-neutral-500">
          Antecedência atual: <strong>{minNoticeLabel}</strong> • Janela atual:{' '}
          <strong>{form.maxBookingWindowDays} dias</strong>
        </p>
      </div>
    </div>
  )
}



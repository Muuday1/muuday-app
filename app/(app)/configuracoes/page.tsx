'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  AlertTriangle,
  Bell,
  Briefcase,
  CalendarClock,
  Check,
  ChevronRight,
  Globe,
  Lock,
  Settings,
  Wallet,
} from 'lucide-react'
import { STRIPE_CURRENCIES, ALL_TIMEZONES } from '@/lib/constants'
import {
  evaluateProfessionalOnboarding,
  type ProfessionalOnboardingEvaluation,
} from '@/lib/professional/onboarding-gates'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'

type NotificationPreferences = {
  booking_emails: boolean
  session_reminders: boolean
  news_promotions: boolean
}

type UserRole = 'usuario' | 'profissional' | 'admin' | null

type ProfessionalWorkspaceSummary = {
  id: string
  status: string
  tier: string
  firstBookingEnabled: boolean
  gateNote: string
  pendingConfirmations: number
  openRequests: number
  availabilityCount: number
  confirmationMode: string
  minNoticeHours: number
  maxWindowDays: number
  serviceCount: number
  specialtyCount: number
  billingCardOnFile: boolean
  payoutOnboardingStarted: boolean
  payoutKycCompleted: boolean
}

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  booking_emails: true,
  session_reminders: true,
  news_promotions: true,
}

const NOTIFICATION_ITEMS: {
  key: keyof NotificationPreferences
  label: string
  desc: string
}[] = [
  {
    key: 'booking_emails',
    label: 'Emails de agendamento',
    desc: 'Confirmações, cancelamentos, pagamentos e avaliações',
  },
  {
    key: 'session_reminders',
    label: 'Lembretes de sessão',
    desc: 'Lembrete 24h e 1h antes da sessão',
  },
  {
    key: 'news_promotions',
    label: 'Novidades e promoções',
    desc: 'Atualizações da plataforma, dicas e ofertas',
  },
]

function tierLabel(tier: string) {
  if (tier === 'premium') return 'PREMIUM'
  if (tier === 'professional') return 'PROFESSIONAL'
  return 'BASIC'
}

function professionalAlerts(summary: ProfessionalWorkspaceSummary | null) {
  if (!summary) return []
  const alerts: Array<{ id: string; level: 'warning' | 'critical'; title: string; description: string }> = []

  if (summary.status !== 'approved') {
    alerts.push({
      id: 'status-not-approved',
      level: summary.status === 'rejected' || summary.status === 'suspended' ? 'critical' : 'warning',
      title: 'Conta profissional com restrição operacional',
      description:
        summary.status === 'pending_review'
          ? 'Seu perfil ainda está em revisão. Algumas ações ficam bloqueadas até aprovação.'
          : 'Seu perfil não está aprovado. Revise dados de perfil e status de compliance.',
    })
  }

  if (!summary.firstBookingEnabled) {
    alerts.push({
      id: 'first-booking-gate',
      level: 'warning',
      title: 'Primeiro agendamento bloqueado',
      description:
        summary.gateNote ||
        'Finalize os requisitos de go-live para liberar o primeiro agendamento.',
    })
  }

  if (summary.availabilityCount === 0) {
    alerts.push({
      id: 'availability-empty',
      level: 'critical',
      title: 'Sem disponibilidade ativa',
      description: 'Adicione horários de atendimento para receber novos agendamentos.',
    })
  }

  return alerts
}

export default function ConfiguracoesPage() {
  const [timezone, setTimezone] = useState('America/Sao_Paulo')
  const [currency, setCurrency] = useState('BRL')
  const [notifications, setNotifications] = useState<NotificationPreferences>(DEFAULT_NOTIFICATIONS)
  const [role, setRole] = useState<UserRole>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [savedField, setSavedField] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [professionalSummary, setProfessionalSummary] = useState<ProfessionalWorkspaceSummary | null>(null)
  const [onboardingEvaluation, setOnboardingEvaluation] = useState<ProfessionalOnboardingEvaluation | null>(null)
  const [onboardingFlagsAvailable, setOnboardingFlagsAvailable] = useState(true)
  const [operationalSaving, setOperationalSaving] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function loadProfile() {
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
        .select('full_name, email, country, avatar_url, timezone, currency, notification_preferences, role')
        .eq('id', user.id)
        .single()

      if (!profile) {
        setLoading(false)
        return
      }

      setRole((profile.role as UserRole) || 'usuario')
      setTimezone(profile.timezone || 'America/Sao_Paulo')
      setCurrency(profile.currency || 'BRL')
      if (profile.notification_preferences) {
        setNotifications({ ...DEFAULT_NOTIFICATIONS, ...profile.notification_preferences })
      }

      if (profile.role === 'profissional') {
        const { data: professional } = await getPrimaryProfessionalForUser(
          supabase,
          user.id,
          'id, status, tier, first_booking_enabled, first_booking_gate_note, bio, category, subcategories, languages, years_experience, session_price_brl, session_duration_minutes',
        )

        if (professional?.id) {
          const { count: pendingConfirmationsCount } = await supabase
            .from('bookings')
            .select('id', { count: 'exact', head: true })
            .eq('professional_id', professional.id)
            .eq('status', 'pending_confirmation')

          const { count: openRequestsCount } = await supabase
            .from('request_bookings')
            .select('id', { count: 'exact', head: true })
            .eq('professional_id', professional.id)
            .in('status', ['open', 'offered'])

          const { count: availabilityCount } = await supabase
            .from('availability')
            .select('id', { count: 'exact', head: true })
            .eq('professional_id', professional.id)
            .eq('is_active', true)

          const { count: availabilityRulesCount } = await supabase
            .from('availability_rules')
            .select('id', { count: 'exact', head: true })
            .eq('professional_id', professional.id)
            .eq('is_active', true)

          const availabilityBaselineCount =
            (availabilityRulesCount || 0) > 0
              ? availabilityRulesCount || 0
              : availabilityCount || 0

          const { data: settings } = await supabase
            .from('professional_settings')
            .select('confirmation_mode, minimum_notice_hours, max_booking_window_days')
            .eq('professional_id', professional.id)
            .maybeSingle()

          const { data: readinessSettings, error: readinessError } = await supabase
            .from('professional_settings')
            .select('billing_card_on_file, payout_onboarding_started, payout_kyc_completed')
            .eq('professional_id', professional.id)
            .maybeSingle()

          const readinessFlagsAvailable = !Boolean(readinessError)
          setOnboardingFlagsAvailable(readinessFlagsAvailable)

          const billingCardOnFile = readinessFlagsAvailable
            ? Boolean(readinessSettings?.billing_card_on_file)
            : Boolean(professional.first_booking_enabled)
          const payoutOnboardingStarted = readinessFlagsAvailable
            ? Boolean(readinessSettings?.payout_onboarding_started)
            : Boolean(professional.first_booking_enabled)
          const payoutKycCompleted = readinessFlagsAvailable
            ? Boolean(readinessSettings?.payout_kyc_completed)
            : Boolean(professional.first_booking_enabled)

          const { count: serviceCount, error: serviceCountError } = await supabase
            .from('professional_services')
            .select('id', { count: 'exact', head: true })
            .eq('professional_id', professional.id)
            .eq('is_active', true)

          const fallbackServiceCount =
            Number(professional.session_price_brl || 0) > 0 &&
            Number(professional.session_duration_minutes || 0) > 0
              ? 1
              : 0
          const resolvedServiceCount =
            serviceCountError == null ? serviceCount || 0 : fallbackServiceCount

          const { count: specialtyCount } = await supabase
            .from('professional_specialties')
            .select('id', { count: 'exact', head: true })
            .eq('professional_id', professional.id)

          const onboarding = evaluateProfessionalOnboarding({
            account: {
              fullName: profile.full_name,
              email: profile.email,
              country: profile.country,
              timezone: profile.timezone,
              avatarUrl: profile.avatar_url,
              primaryLanguage: Array.isArray(professional.languages)
                ? String(professional.languages[0] || '')
                : '',
            },
            professional: {
              id: professional.id,
              status: professional.status,
              tier: professional.tier,
              firstBookingEnabled: professional.first_booking_enabled,
              bio: professional.bio,
              category: professional.category,
              subcategories: Array.isArray(professional.subcategories)
                ? (professional.subcategories as string[])
                : [],
              languages: Array.isArray(professional.languages)
                ? (professional.languages as string[])
                : [],
              yearsExperience: Number(professional.years_experience || 0),
            },
            settings: {
              confirmationMode: String(settings?.confirmation_mode || 'auto_accept'),
              minimumNoticeHours: Number(settings?.minimum_notice_hours || 24),
              maxBookingWindowDays: Number(settings?.max_booking_window_days || 30),
              billingCardOnFile,
              payoutOnboardingStarted,
              payoutKycCompleted,
            },
            serviceCount: resolvedServiceCount,
            hasServicePricingAndDuration:
              Number(professional.session_price_brl || 0) > 0 &&
              Number(professional.session_duration_minutes || 0) > 0,
            availabilityCount: availabilityBaselineCount,
            specialtyCount: specialtyCount || 0,
            sensitiveCategory: false,
          })
          setOnboardingEvaluation(onboarding)

          setProfessionalSummary({
            id: String(professional.id),
            status: String(professional.status || 'draft'),
            tier: String(professional.tier || 'basic'),
            firstBookingEnabled: Boolean(professional.first_booking_enabled),
            gateNote: String(professional.first_booking_gate_note || '').trim(),
            pendingConfirmations: pendingConfirmationsCount || 0,
            openRequests: openRequestsCount || 0,
            availabilityCount: availabilityBaselineCount,
            confirmationMode: String(settings?.confirmation_mode || 'auto_accept'),
            minNoticeHours: Number(settings?.minimum_notice_hours || 24),
            maxWindowDays: Number(settings?.max_booking_window_days || 30),
            serviceCount: resolvedServiceCount,
            specialtyCount: specialtyCount || 0,
            billingCardOnFile,
            payoutOnboardingStarted,
            payoutKycCompleted,
          })
        }
      }

      setLoading(false)
    }

    loadProfile()
  }, [supabase])

  // Whitelist of fields users are allowed to update on their own profile.
  // Prevents mass assignment attacks (e.g. setting role to 'admin').
  const EDITABLE_PROFILE_FIELDS = ['currency', 'timezone', 'notification_preferences', 'full_name', 'country']

  async function saveField(field: string, value: unknown) {
    if (!userId) return
    if (!EDITABLE_PROFILE_FIELDS.includes(field)) {
      console.error(`[configuracoes] Blocked attempt to update restricted field: ${field}`)
      return
    }
    await supabase.from('profiles').update({ [field]: value }).eq('id', userId)
    setSavedField(field)
    setTimeout(() => setSavedField(null), 2000)
  }

  async function handleToggle(key: keyof NotificationPreferences) {
    const updated = { ...notifications, [key]: !notifications[key] }
    setNotifications(updated)
    await saveField('notification_preferences', updated)
  }

  async function saveOperationalReadinessFlags(updates: {
    billingCardOnFile?: boolean
    payoutOnboardingStarted?: boolean
    payoutKycCompleted?: boolean
  }) {
    if (!professionalSummary?.id) return
    if (!onboardingFlagsAvailable) return

    setOperationalSaving(true)
    const payload: Record<string, unknown> = {
      professional_id: professionalSummary.id,
      updated_at: new Date().toISOString(),
    }

    if (typeof updates.billingCardOnFile === 'boolean') {
      payload.billing_card_on_file = updates.billingCardOnFile
    }
    if (typeof updates.payoutOnboardingStarted === 'boolean') {
      payload.payout_onboarding_started = updates.payoutOnboardingStarted
    }
    if (typeof updates.payoutKycCompleted === 'boolean') {
      payload.payout_kyc_completed = updates.payoutKycCompleted
    }

    await supabase.from('professional_settings').upsert(payload, { onConflict: 'professional_id' })

    setOperationalSaving(false)
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-neutral-200" />
          <div className="h-32 rounded-2xl bg-neutral-100" />
          <div className="h-48 rounded-2xl bg-neutral-100" />
        </div>
      </div>
    )
  }

  const showProfessionalWorkspace = role === 'profissional'
  const alerts = professionalAlerts(professionalSummary)

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-8">
      <div className="mb-8">
        <h1 className="mb-1 font-display text-3xl font-bold text-neutral-900">
          {showProfessionalWorkspace ? 'Configurações do negócio' : 'Configurações'}
        </h1>
        <p className="text-neutral-500">
          {showProfessionalWorkspace
            ? 'Controle de perfil, serviços, regras de agendamento e status operacional.'
            : 'Personalize sua experiência na Muuday'}
        </p>
      </div>

      {showProfessionalWorkspace && (
        <>
          {professionalSummary && (
            <div className="mb-6 rounded-2xl border border-neutral-100 bg-white p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                  Plano: {tierLabel(professionalSummary.tier)}
                </span>
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                  Status: {professionalSummary.status}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 text-sm text-neutral-700 sm:grid-cols-2">
                  <p>Pendências de confirmação: {professionalSummary.pendingConfirmations}</p>
                <p>Requests abertos: {professionalSummary.openRequests}</p>
                <p>Disponibilidade ativa: {professionalSummary.availabilityCount}</p>
                <p>Confirma??o: {professionalSummary.confirmationMode}</p>
                  <p>Antecedência mínima: {professionalSummary.minNoticeHours}h</p>
                <p>Janela maxima: {professionalSummary.maxWindowDays} dias</p>
              </div>
            </div>
          )}

          {onboardingEvaluation && (
            <div className="mb-6 rounded-2xl border border-neutral-100 bg-white p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-semibold text-neutral-900">
                  Onboarding C1-C10 (Wave 2)
                </h2>
                <Link
                  href="/onboarding-profissional"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  Abrir checklist completo
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {Object.values(onboardingEvaluation.gates).map(gate => (
                  <div
                    key={gate.id}
                    className={`rounded-xl border px-3 py-2 ${
                      gate.passed
                        ? 'border-green-200 bg-green-50'
                        : 'border-amber-200 bg-amber-50'
                    }`}
                  >
                    <p
                      className={`text-xs font-semibold ${
                        gate.passed ? 'text-green-800' : 'text-amber-800'
                      }`}
                    >
                      {gate.title}
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        gate.passed ? 'text-green-700' : 'text-amber-700'
                      }`}
                    >
                      {gate.passed
                        ? 'OK'
                        : gate.blockers[0]?.description || 'Bloqueado por pendencias'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {professionalSummary && (
            <div className="mb-6 rounded-2xl border border-neutral-100 bg-white p-5">
              <h2 className="mb-1 font-display text-lg font-semibold text-neutral-900">
                Readiness operacional (C6/C7)
              </h2>
              <p className="mb-4 text-xs text-neutral-500">
                Flags operacionais da Wave 2 para gate de primeiro booking e payout.
              </p>

              {!onboardingFlagsAvailable && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Colunas de readiness não encontradas. Rode a migração 015 para ativar estes controles.
                </div>
              )}

              <div className="space-y-3">
                <label className="flex items-center justify-between rounded-xl border border-neutral-200 px-3 py-2 text-sm">
                  <span>Cartao para billing profissional em arquivo</span>
                  <input
                    type="checkbox"
                    checked={professionalSummary.billingCardOnFile}
                    disabled={!onboardingFlagsAvailable || operationalSaving}
                    onChange={event =>
                      saveOperationalReadinessFlags({
                        billingCardOnFile: event.target.checked,
                      })
                    }
                  />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-neutral-200 px-3 py-2 text-sm">
                  <span>Onboarding de payout iniciado</span>
                  <input
                    type="checkbox"
                    checked={professionalSummary.payoutOnboardingStarted}
                    disabled={!onboardingFlagsAvailable || operationalSaving}
                    onChange={event =>
                      saveOperationalReadinessFlags({
                        payoutOnboardingStarted: event.target.checked,
                      })
                    }
                  />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-neutral-200 px-3 py-2 text-sm">
                  <span>KYC de payout completo</span>
                  <input
                    type="checkbox"
                    checked={professionalSummary.payoutKycCompleted}
                    disabled={!onboardingFlagsAvailable || operationalSaving}
                    onChange={event =>
                      saveOperationalReadinessFlags({
                        payoutKycCompleted: event.target.checked,
                      })
                    }
                  />
                </label>
              </div>
            </div>
          )}

          {alerts.length > 0 && (
            <div className="mb-6 space-y-3">
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`rounded-2xl border px-4 py-3 ${
                    alert.level === 'critical'
                      ? 'border-red-200 bg-red-50'
                      : 'border-amber-200 bg-amber-50'
                  }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      alert.level === 'critical' ? 'text-red-800' : 'text-amber-800'
                    }`}
                  >
                    {alert.title}
                  </p>
                  <p
                    className={`mt-1 text-xs ${
                      alert.level === 'critical' ? 'text-red-700' : 'text-amber-700'
                    }`}
                  >
                    {alert.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/editar-perfil-profissional"
              className="rounded-2xl border border-neutral-100 bg-white p-4 transition hover:border-brand-300"
            >
              <div className="mb-2 flex items-center gap-2 text-neutral-800">
                <Briefcase className="h-4 w-4 text-brand-500" />
                <p className="text-sm font-semibold">Perfil e servicos</p>
              </div>
              <p className="text-xs text-neutral-500">Categoria, bio, idiomas, preço e duração.</p>
            </Link>

            <Link
              href="/disponibilidade"
              className="rounded-2xl border border-neutral-100 bg-white p-4 transition hover:border-brand-300"
            >
              <div className="mb-2 flex items-center gap-2 text-neutral-800">
                <CalendarClock className="h-4 w-4 text-brand-500" />
                <p className="text-sm font-semibold">Calendário</p>
              </div>
              <p className="text-xs text-neutral-500">Agenda semanal, bloqueios e horários ativos.</p>
            </Link>

            <Link
              href="/configuracoes-agendamento"
              className="rounded-2xl border border-neutral-100 bg-white p-4 transition hover:border-brand-300"
            >
              <div className="mb-2 flex items-center gap-2 text-neutral-800">
                <Settings className="h-4 w-4 text-brand-500" />
                <p className="text-sm font-semibold">Regras de booking</p>
              </div>
                    <p className="text-xs text-neutral-500">Notice, janela, recorrência e modo de confirmação.</p>
            </Link>

            <Link
              href="/financeiro"
              className="rounded-2xl border border-neutral-100 bg-white p-4 transition hover:border-brand-300"
            >
              <div className="mb-2 flex items-center gap-2 text-neutral-800">
                <Wallet className="h-4 w-4 text-brand-500" />
                <p className="text-sm font-semibold">Financeiro</p>
              </div>
              <p className="text-xs text-neutral-500">Receitas operacionais (stub Wave 2) e saude financeira.</p>
            </Link>
          </div>
        </>
      )}

      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">
          <div className="flex items-center gap-3 border-b border-neutral-50 px-6 py-4">
            <Globe className="h-4 w-4 text-brand-500" />
            <h2 className="font-display font-bold text-neutral-900">Idioma e regiao</h2>
          </div>
          <div className="divide-y divide-neutral-50">
            <div className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-neutral-50/50">
              <div>
                <p className="text-sm font-medium text-neutral-700">Idioma</p>
                <p className="mt-0.5 text-xs text-neutral-400">Portugues (BR)</p>
              </div>
              <span className="rounded-full bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-400">
                Em breve
              </span>
            </div>

            <div className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-neutral-50/50">
              <div className="mr-4 flex-1">
                <p className="text-sm font-medium text-neutral-700">Fuso horário</p>
              </div>
              <div className="flex items-center gap-2">
                {savedField === 'timezone' && (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                    <Check className="h-3 w-3" /> Salvo!
                  </span>
                )}
                <select
                  value={timezone}
                  onChange={e => {
                    setTimezone(e.target.value)
                    saveField('timezone', e.target.value)
                  }}
                  className="max-w-[220px] rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-700 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {ALL_TIMEZONES.map(tz => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-neutral-50/50">
              <div className="mr-4 flex-1">
                <p className="text-sm font-medium text-neutral-700">Moeda preferida</p>
              </div>
              <div className="flex items-center gap-2">
                {savedField === 'currency' && (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                    <Check className="h-3 w-3" /> Salvo!
                  </span>
                )}
                <select
                  value={currency}
                  onChange={e => {
                    setCurrency(e.target.value)
                    saveField('currency', e.target.value)
                  }}
                  className="max-w-[220px] rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-700 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {STRIPE_CURRENCIES.map(c => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-brand-500" />
              <h2 className="font-display font-bold text-neutral-900">Notificacoes</h2>
            </div>
            {savedField === 'notification_preferences' && (
              <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                <Check className="h-3 w-3" /> Salvo!
              </span>
            )}
          </div>
          <div className="divide-y divide-neutral-50">
            {NOTIFICATION_ITEMS.map(item => (
              <div
                key={item.key}
                className="flex cursor-pointer items-center justify-between px-6 py-4 transition-colors hover:bg-neutral-50/50"
                onClick={() => handleToggle(item.key)}
              >
                <div className="mr-6 flex-1">
                  <p className="text-sm font-medium text-neutral-700">{item.label}</p>
                  <p className="mt-0.5 text-xs text-neutral-400">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    handleToggle(item.key)
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 ${
                    notifications[item.key] ? 'bg-brand-500' : 'bg-neutral-200'
                  }`}
                  aria-label={item.label}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">
          <div className="flex items-center gap-3 border-b border-neutral-50 px-6 py-4">
            <Lock className="h-4 w-4 text-brand-500" />
            <h2 className="font-display font-bold text-neutral-900">Seguranca</h2>
          </div>
          <div className="divide-y divide-neutral-50">
            <div className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-neutral-50/50">
              <p className="text-sm font-medium text-neutral-700">Alterar senha</p>
              <a
                href="/recuperar-senha"
                className="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-600 transition-all hover:text-brand-700"
              >
                Alterar <ChevronRight className="h-3 w-3" />
              </a>
            </div>
            <div className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-neutral-50/50">
              <div>
                <p className="text-sm font-medium text-neutral-700">Autenticacao de dois fatores</p>
                <p className="mt-0.5 text-xs text-neutral-400">Desativado</p>
              </div>
              <span className="rounded-full bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-400">
                Em breve
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-red-100 bg-white p-6">
        <h3 className="mb-2 font-display font-bold text-red-700">Zona de risco</h3>
        <p className="mb-4 text-sm text-neutral-500">Acoes irreversiveis para sua conta.</p>
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-50 hover:text-red-700"
          >
            Sair da conta
          </button>
        </form>
      </div>

      {showProfessionalWorkspace && professionalSummary?.pendingConfirmations ? (
        <p className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5" />
          Você possui pendências de confirmação ativas na agenda.
        </p>
      ) : null}
    </div>
  )
}



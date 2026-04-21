'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { evaluateProfessionalOnboarding } from '@/lib/professional/onboarding-gates'
import {
  DEFAULT_NOTIFICATIONS,
  tierLabel,
  professionalAlerts,
} from './workspace-helpers'
import type {
  NotificationPreferences,
  UserRole,
  ProfessionalWorkspaceSummary,
} from './workspace-helpers'
import { ProfessionalWorkspaceSection } from './professional-workspace-section'
import { RegionSettings } from './region-settings'
import { NotificationSettings } from './notification-settings'
import { SecuritySettings } from './security-settings'

export default function ProfessionalSettingsWorkspace() {
  const [timezone, setTimezone] = useState('America/Sao_Paulo')
  const [currency, setCurrency] = useState('BRL')
  const [notifications, setNotifications] = useState<NotificationPreferences>(DEFAULT_NOTIFICATIONS)
  const [role, setRole] = useState<UserRole>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [savedField, setSavedField] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [professionalSummary, setProfessionalSummary] = useState<ProfessionalWorkspaceSummary | null>(null)
  const [onboardingEvaluation, setOnboardingEvaluation] = useState<ReturnType<typeof evaluateProfessionalOnboarding> | null>(null)

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
            (availabilityRulesCount || 0) > 0 ? availabilityRulesCount || 0 : availabilityCount || 0

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

          const billingCardOnFile = readinessError
            ? Boolean(professional.first_booking_enabled)
            : Boolean(readinessSettings?.billing_card_on_file)
          const payoutOnboardingStarted = readinessError
            ? Boolean(professional.first_booking_enabled)
            : Boolean(readinessSettings?.payout_onboarding_started)
          const payoutKycCompleted = readinessError
            ? Boolean(professional.first_booking_enabled)
            : Boolean(readinessSettings?.payout_kyc_completed)

          const { count: serviceCount, error: serviceCountError } = await supabase
            .from('professional_services')
            .select('id', { count: 'exact', head: true })
            .eq('professional_id', professional.id)
            .eq('is_active', true)

          const fallbackServiceCount =
            Number(professional.session_price_brl || 0) > 0 && Number(professional.session_duration_minutes || 0) > 0
              ? 1
              : 0
          const resolvedServiceCount = serviceCountError == null ? serviceCount || 0 : fallbackServiceCount

          const { count: specialtyCount } = await supabase
            .from('professional_specialties')
            .select('id', { count: 'exact', head: true })
            .eq('professional_id', professional.id)

          const { count: credentialUploadCount } = await supabase
            .from('professional_credentials')
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
            credentialUploadCount: credentialUploadCount || 0,
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

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-slate-200" />
          <div className="h-32 rounded-lg bg-slate-100" />
          <div className="h-48 rounded-lg bg-slate-100" />
        </div>
      </div>
    )
  }

  const showProfessionalWorkspace = role === 'profissional'
  const alerts = professionalAlerts(professionalSummary)

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-8">
      <div className="mb-8">
        <h1 className="mb-1 font-display text-3xl font-bold text-slate-900">
          {showProfessionalWorkspace ? 'Configurações do negócio' : 'Configurações'}
        </h1>
        <p className="text-slate-500">
          {showProfessionalWorkspace
            ? 'Controle de perfil, serviços, regras de agendamento e status operacional.'
            : 'Personalize sua experiência na Muuday'}
        </p>
      </div>

      {showProfessionalWorkspace && (
        <ProfessionalWorkspaceSection
          summary={professionalSummary}
          onboardingEvaluation={onboardingEvaluation}
          pendingConfirmationsCount={professionalSummary?.pendingConfirmations}
        />
      )}

      <div className="space-y-6">
        <RegionSettings
          timezone={timezone}
          currency={currency}
          savedField={savedField}
          onTimezoneChange={value => {
            setTimezone(value)
            saveField('timezone', value)
          }}
          onCurrencyChange={value => {
            setCurrency(value)
            saveField('currency', value)
          }}
        />

        <NotificationSettings
          preferences={notifications}
          onToggle={handleToggle}
        />

        <SecuritySettings
          onOpenPassword={() => { window.location.href = '/recuperar-senha' }}
          onOpenVisibility={() => { /* TODO */ }}
          onSignOut={() => {
            const form = document.createElement('form')
            form.method = 'post'
            form.action = '/auth/signout'
            document.body.appendChild(form)
            form.submit()
            document.body.removeChild(form)
          }}
        />
      </div>

      <div className="mt-8 rounded-lg border border-red-100 bg-white p-6">
        <h3 className="mb-2 font-display font-bold text-red-700">Zona de risco</h3>
        <p className="mb-4 text-sm text-slate-500">Acoes irreversiveis para sua conta.</p>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="inline-flex rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-50 hover:text-red-700"
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

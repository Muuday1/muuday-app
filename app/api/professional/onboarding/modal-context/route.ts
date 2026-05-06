import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/server'
import { getOrSetUpstashJsonCache } from '@/lib/cache/upstash-json-cache'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { loadProfessionalOnboardingState } from '@/lib/professional/onboarding-state'
import { loadProfessionalTrackerMeta } from '@/lib/professional/onboarding-tracker-state'
import {
  PROFESSIONAL_REQUIRED_TERMS,
} from '@/lib/legal/professional-terms'
import { loadPlanConfigMap } from '@/lib/plan-config'
import { getExchangeRates } from '@/lib/exchange-rates'
import {
  resolveProfessionalPlanPricing,
  shouldAllowFallbackPricing,
} from '@/lib/professional/plan-pricing'
import { withApiHandler } from '@/lib/api/with-api-handler'

const OPTIONAL_TAXONOMY_CACHE_KEY = 'onboarding-modal:optional-taxonomy:v1'
const OPTIONAL_PLAN_CONFIG_CACHE_KEY = 'onboarding-modal:optional-plan-config:v1'
const OPTIONAL_PLAN_PRICING_CACHE_TTL_SECONDS = 90
const OPTIONAL_STATIC_CACHE_TTL_SECONDS = 60 * 15

type ContextScope = 'critical' | 'optional'
type ServicesLoadState = 'loaded' | 'degraded' | 'failed'

type ProfessionalServiceRow = {
  id: string
  name: string
  description: string | null
  price_brl: number
  duration_minutes: number
}

function normalizeScope(rawValue: string | null): ContextScope {
  return rawValue === 'optional' ? 'optional' : 'critical'
}

function shouldSkipTrackerBootstrap(rawValue: string | null) {
  return rawValue === '1' || rawValue === 'true'
}

function normalizeRequestedProfessionalId(rawValue: string | null) {
  const value = String(rawValue || '').trim()
  return /^[0-9a-fA-F-]{36}$/.test(value) ? value : ''
}

async function loadProfessionalServicesWithFallback(args: {
  supabase: Awaited<ReturnType<typeof createClient>>
  professionalId: string
  requestedProfessionalId: string
}): Promise<{
  rows: ProfessionalServiceRow[]
  state: ServicesLoadState
  errorMessage: string
}> {
  const fallbackErrorMessage = 'Não foi possível carregar seus serviços agora. Tente novamente em instantes.'
  let hadFallback = false

  const userResponse = await args.supabase
    .from('professional_services')
    .select('id,name,description,price_brl,duration_minutes')
    .eq('professional_id', args.professionalId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (!userResponse.error) {
    return {
      rows: (userResponse.data || []) as ProfessionalServiceRow[],
      state: hadFallback ? 'degraded' : 'loaded',
      errorMessage: hadFallback
        ? 'Carregamos seus serviços em modo de contingência. Se notar dados desatualizados, tente recarregar o tracker.'
        : '',
    }
  }

  hadFallback = true
  Sentry.captureException(userResponse.error, {
    tags: { area: 'onboarding_modal_context', context: 'services-load-full' },
    extra: {
      attempt: 'user_full',
      professionalId: args.professionalId,
      requestedProfessionalId: args.requestedProfessionalId || null,
    },
  })

  const minimalResponse = await args.supabase
    .from('professional_services')
    .select('id,name,price_brl,duration_minutes')
    .eq('professional_id', args.professionalId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (!minimalResponse.error) {
    const rows = (minimalResponse.data || []).map((row: { id: unknown; name: unknown; price_brl: unknown; duration_minutes: unknown }) => ({
      id: String(row.id || ''),
      name: String(row.name || ''),
      description: null,
      price_brl: Number(row.price_brl || 0),
      duration_minutes: Number(row.duration_minutes || 0),
    }))

    return {
      rows,
      state: 'degraded',
      errorMessage:
        'Carregamos seus serviços em modo reduzido. Alguns detalhes podem aparecer incompletos até a próxima atualização.',
    }
  }

  Sentry.captureException(minimalResponse.error, {
    tags: { area: 'onboarding_modal_context', context: 'services-load-minimal' },
    extra: {
      attempt: 'user_minimal',
      professionalId: args.professionalId,
      requestedProfessionalId: args.requestedProfessionalId || null,
    },
  })

  return {
    rows: [],
    state: 'failed',
    errorMessage: fallbackErrorMessage,
  }
}

async function loadOptionalTaxonomyCached(supabase: Awaited<ReturnType<typeof createClient>>) {
  return getOrSetUpstashJsonCache({
    key: OPTIONAL_TAXONOMY_CACHE_KEY,
    ttlSeconds: OPTIONAL_STATIC_CACHE_TTL_SECONDS,
    version: 'v1',
    loader: async () => {
      const [categoriesResponse, subcategoriesResponse] = await Promise.all([
        supabase.from('categories').select('slug,name_pt').eq('is_active', true),
        supabase.from('subcategories').select('slug,name_pt').eq('is_active', true),
      ])
      return {
        categories: categoriesResponse.data || [],
        subcategories: subcategoriesResponse.data || [],
      }
    },
  })
}

async function loadOptionalPlanConfigsCached() {
  return getOrSetUpstashJsonCache({
    key: OPTIONAL_PLAN_CONFIG_CACHE_KEY,
    ttlSeconds: OPTIONAL_STATIC_CACHE_TTL_SECONDS,
    version: 'v1',
    loader: async () => loadPlanConfigMap(),
  })
}

async function loadOptionalPlanPricingCached(args: {
  tierRaw: string | null | undefined
  platformRegionRaw: string | null | undefined
  countryRaw: string | null | undefined
  currencyRaw: string | null | undefined
  allowFallbackPricing: boolean
}) {
  const cacheKey = [
    'onboarding-modal:optional-plan-pricing:v1',
    String(args.tierRaw || 'basic').toLowerCase(),
    String(args.platformRegionRaw || 'auto').toLowerCase(),
    String(args.countryRaw || 'na').toLowerCase(),
    String(args.currencyRaw || 'brl').toLowerCase(),
    args.allowFallbackPricing ? 'fallback' : 'strict',
  ].join(':')

  return getOrSetUpstashJsonCache({
    key: cacheKey,
    ttlSeconds: OPTIONAL_PLAN_PRICING_CACHE_TTL_SECONDS,
    version: 'v1',
    loader: async () =>
      resolveProfessionalPlanPricing({
        tierRaw: args.tierRaw,
        platformRegionRaw: args.platformRegionRaw,
        countryRaw: args.countryRaw,
        currencyRaw: args.currencyRaw,
        allowFallbackPricing: args.allowFallbackPricing,
      }),
  })
}

export const GET = withApiHandler(async (request: Request) => {
  const supabase = await createClient()
  const url = new URL(request.url)
  const scope = normalizeScope(url.searchParams.get('scope'))
  const skipTrackerBootstrap = shouldSkipTrackerBootstrap(url.searchParams.get('skipTracker'))
  const requestedProfessionalId = normalizeRequestedProfessionalId(url.searchParams.get('professionalId'))
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Sessao invalida.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role,country,currency')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile || profile.role !== 'profissional') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const { data: primaryProfessional } = await getPrimaryProfessionalForUser(
    supabase,
    user.id,
    'id,user_id,status,tier,category,subcategories,focus_areas,years_experience,cover_photo_url,platform_region',
  )
  if (!primaryProfessional?.id) {
    return NextResponse.json({ error: 'Perfil profissional nao encontrado.' }, { status: 404 })
  }
  let professional = primaryProfessional
  if (requestedProfessionalId && requestedProfessionalId !== String(primaryProfessional.id)) {
    const { data: requestedProfessional } = await supabase
      .from('professionals')
      .select('id,user_id,status,tier,category,subcategories,focus_areas,years_experience,cover_photo_url,platform_region')
      .eq('id', requestedProfessionalId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (requestedProfessional?.id) {
      professional = requestedProfessional
    }
  }

  if (scope === 'optional') {
    const [taxonomyResult, planConfigResult, exchangeRatesResult, settingsResult] = await Promise.allSettled([
      loadOptionalTaxonomyCached(supabase),
      loadOptionalPlanConfigsCached(),
      getExchangeRates(supabase),
      supabase
        .from('professional_settings')
        .select('onboarding_finance_bypass')
        .eq('professional_id', professional.id)
        .maybeSingle(),
    ])

    const taxonomy =
      taxonomyResult.status === 'fulfilled'
        ? taxonomyResult.value
        : { categories: [], subcategories: [] }
    const planConfigs =
      planConfigResult.status === 'fulfilled' ? planConfigResult.value : await loadPlanConfigMap()
    const exchangeRates =
      exchangeRatesResult.status === 'fulfilled' ? exchangeRatesResult.value : await getExchangeRates()
    const onboardingFinanceBypass =
      settingsResult.status === 'fulfilled'
        ? Boolean(
            (settingsResult.value.data as { onboarding_finance_bypass?: boolean } | null)
              ?.onboarding_finance_bypass,
          )
        : false

    const allowFallbackPricing = shouldAllowFallbackPricing(onboardingFinanceBypass)
    const pricingResult = await loadOptionalPlanPricingCached({
      tierRaw: professional.tier,
      platformRegionRaw: professional.platform_region,
      countryRaw: profile.country,
      currencyRaw: profile.currency,
      allowFallbackPricing,
    })

    return NextResponse.json({
      scope: 'optional',
      professionalId: professional.id,
      optional: {
        categories: taxonomy.categories || [],
        subcategories: taxonomy.subcategories || [],
        planConfigs,
        exchangeRates,
        planPricing: pricingResult.ok ? pricingResult.data : null,
        pricingError: pricingResult.ok ? '' : pricingResult.error,
      },
    })
  }

  const onboardingStatePromise = skipTrackerBootstrap
    ? Promise.resolve(null)
    : loadProfessionalOnboardingState(supabase, professional.id, {
        resolveSignedMediaUrls: false,
      })
  const trackerMetaPromise = loadProfessionalTrackerMeta(supabase, professional.id)

  const [
    servicesLoadResult,
    settingsResponse,
    availabilityResponse,
    applicationResponse,
    credentialsResponse,
    ownerProfileResponse,
    onboardingState,
    trackerMeta,
  ] = await Promise.all([
    loadProfessionalServicesWithFallback({
      supabase,
      professionalId: String(professional.id || ''),
      requestedProfessionalId: requestedProfessionalId || '',
    }),
    supabase
      .from('professional_settings')
      .select(
        'timezone,minimum_notice_hours,max_booking_window_days,buffer_minutes,buffer_time_minutes,confirmation_mode,enable_recurring,allow_multi_session,require_session_purpose,calendar_sync_provider,terms_accepted_at,terms_version,onboarding_finance_bypass',
      )
      .eq('professional_id', professional.id)
      .maybeSingle(),
    supabase
      .from('availability_rules')
      .select('weekday,start_time_local,end_time_local,is_active')
      .eq('professional_id', professional.id)
      .then(async result => {
        if (result.data && result.data.length > 0) {
          return {
            data: result.data.map(row => ({
              day_of_week: row.weekday,
              start_time: row.start_time_local,
              end_time: row.end_time_local,
              is_active: row.is_active,
            })),
            error: null,
          }
        }
        // Fallback to legacy availability table
        const legacy = await supabase
          .from('availability')
          .select('day_of_week,start_time,end_time,is_active')
          .eq('professional_id', professional.id)
        return legacy
      }),
    supabase
      .from('professional_applications')
      .select(
        'title,display_name,category,specialty_name,taxonomy_suggestions,focus_areas,years_experience,primary_language,secondary_languages,target_audiences,qualifications_structured',
      )
      .eq('professional_id', professional.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('professional_credentials')
      .select('id,file_name,file_url,scan_status,verified,credential_type')
      .eq('professional_id', professional.id)
      .order('uploaded_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('currency,full_name,timezone,avatar_url')
      .eq('id', String(professional.user_id || ''))
      .maybeSingle(),
    onboardingStatePromise,
    trackerMetaPromise,
  ])

  if (!skipTrackerBootstrap && !onboardingState) {
    return NextResponse.json({ error: 'Nao foi possivel carregar o tracker.' }, { status: 500 })
  }
  const termsAcceptanceByKey = trackerMeta?.termsAcceptanceByKey
    ? trackerMeta.termsAcceptanceByKey
    : PROFESSIONAL_REQUIRED_TERMS.reduce<Record<string, boolean>>((acc, key) => {
        acc[key] = false
        return acc
      }, {})

  return NextResponse.json({
    scope: 'critical',
    professionalId: professional.id,
    professionalStatus: onboardingState
      ? String(onboardingState.snapshot.professional.status || professional.status || '')
      : undefined,
    evaluation: onboardingState?.evaluation,
    reviewAdjustments: trackerMeta?.reviewAdjustments || [],
    servicesLoadState: servicesLoadResult.state,
    servicesLoadError: servicesLoadResult.errorMessage,
    termsAcceptanceByKey: skipTrackerBootstrap ? undefined : termsAcceptanceByKey,
    critical: {
      professional,
      services: servicesLoadResult.rows || [],
      settings: settingsResponse.data || null,
      availability: availabilityResponse.data || [],
      application: applicationResponse.data || null,
      credentials: credentialsResponse.data || [],
      profile: ownerProfileResponse.data || null,
    },
  })
})

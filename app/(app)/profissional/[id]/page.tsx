export const metadata = { title: 'Profissional | Muuday' }

import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Globe, MapPin, Star, MessageCircle, ExternalLink, PlayCircle } from 'lucide-react'
import { getSearchCategoryLabel } from '@/lib/search-config'
import { FavoriteButton } from '@/components/FavoriteButton'
import { ProfileAvailabilityBookingSection } from '@/components/professional/ProfileAvailabilityBookingSection'
import {
  buildProfessionalProfilePath,
  parseProfessionalProfileParam,
} from '@/lib/professional/public-profile-url'
import {
  filterPubliclyVisibleProfessionals,
  getPublicVisibilityByProfessionalId,
  type ProfessionalSearchRecord,
} from '@/lib/professional/public-visibility'
import { loadProfessionalSpecialtyContext } from '@/lib/taxonomy/professional-specialties'
import { getOrSetUpstashJsonCache } from '@/lib/cache/upstash-json-cache'
import { formatCurrency } from '@/lib/utils'
import { isFeatureAvailable } from '@/lib/tier-config'

const PUBLIC_PROFILE_CACHE_TTL_SECONDS = 5 * 60
const PUBLIC_PROFILE_CACHE_VERSION = 'v1'
const PROFESSIONAL_PROFILE_FIELDS =
  'id,user_id,public_code,status,category,subcategories,tags,bio,languages,session_price_brl,session_duration_minutes,rating,total_reviews,total_bookings,years_experience,social_links,video_intro_url,cover_photo_url,first_booking_enabled,tier,whatsapp_number'
const PROFESSIONAL_PROFILE_SELECT_WITH_VISIBILITY =
  `${PROFESSIONAL_PROFILE_FIELDS},is_publicly_visible,profiles!professionals_user_id_fkey(full_name,country,avatar_url,role)` as const
const PROFESSIONAL_PROFILE_SELECT_LEGACY =
  `${PROFESSIONAL_PROFILE_FIELDS},profiles!professionals_user_id_fkey(full_name,country,avatar_url,role)` as const

type PublicProfileEmbedded = {
  full_name?: string | null
  country?: string | null
  avatar_url?: string | null
  role?: string | null
}

type PublicProfessionalRecord = ProfessionalSearchRecord & {
  user_id?: string
  public_code?: string | null
  category?: string | null
  subcategories?: string[] | null
  tags?: string[] | null
  rating?: number | null
  total_reviews?: number | null
  total_bookings?: number | null
  years_experience?: number | null
  social_links?: Record<string, string> | string[] | null
  tier?: string | null
  first_booking_enabled?: boolean | null
  session_price_brl?: number | null
  session_duration_minutes?: number | null
  whatsapp_number?: string | null
  cover_photo_url?: string | null
  video_intro_url?: string | null
  timezone?: string | null
  minimum_notice_hours?: number | null
  max_booking_window_days?: number | null
  enable_recurring?: boolean | null
  is_publicly_visible?: boolean | null
  profiles?: PublicProfileEmbedded | PublicProfileEmbedded[] | null
}

type AvailabilitySlotRow = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active?: boolean
}

type ExistingBookingRow = {
  scheduled_at: string
  duration_minutes: number
}

function getCountryDisplayName(countryCodeOrName?: string | null) {
  if (!countryCodeOrName) return 'Online'
  const normalized = countryCodeOrName.trim()
  if (!normalized) return 'Online'

  if (/^[A-Za-z]{2}$/.test(normalized)) {
    try {
      const displayNames = new Intl.DisplayNames(['pt-BR', 'en'], { type: 'region' })
      const resolved = displayNames.of(normalized.toUpperCase())
      if (resolved) return resolved
    } catch {
      return normalized
    }
  }

  return normalized
}

function getNameInitial(name?: string | null, fallback = 'P') {
  const normalized = String(name || '').trim()
  if (!normalized) return fallback
  return normalized.charAt(0).toUpperCase()
}

function getPrimarySpecialty(professional: PublicProfessionalRecord, specialties: string[]) {
  const firstSpecialty = specialties[0]
  if (firstSpecialty) return firstSpecialty

  const subcategory = ((professional.subcategories || []) as string[]).find((entry: string) =>
    String(entry || '').trim(),
  )
  if (subcategory) return String(subcategory)

  const tag = ((professional.tags || []) as string[]).find((entry: string) =>
    String(entry || '').trim(),
  )
  if (tag) return String(tag)

  return getSearchCategoryLabel(professional.category)
}

function normalizeExternalUrl(url: string) {
  if (!url) return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function parseSocialLinks(value: unknown): Array<{ label: string; url: string }> {
  if (!value) return []

  if (Array.isArray(value)) {
    return value
      .map((entry, index) => {
        if (typeof entry !== 'string') return null
        const url = normalizeExternalUrl(entry)
        if (!url) return null
        return { label: `Link ${index + 1}`, url }
      })
      .filter((entry): entry is { label: string; url: string } => Boolean(entry))
  }

  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, rawUrl]) => {
        if (typeof rawUrl !== 'string') return null
        const url = normalizeExternalUrl(rawUrl)
        if (!url) return null
        return { label: key || 'Link', url }
      })
      .filter((entry): entry is { label: string; url: string } => Boolean(entry))
  }

  return []
}

function toVideoEmbedUrl(value?: string | null) {
  const input = String(value || '').trim()
  if (!input) return null

  try {
    const parsed = new URL(normalizeExternalUrl(input))
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase()

    if (host === 'youtu.be') {
      const videoId = parsed.pathname.split('/').filter(Boolean)[0]
      if (videoId) return `https://www.youtube.com/embed/${videoId}`
    }

    if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
      const videoId = parsed.searchParams.get('v')
      if (videoId) return `https://www.youtube.com/embed/${videoId}`
      const pathParts = parsed.pathname.split('/').filter(Boolean)
      if (pathParts[0] === 'embed' && pathParts[1]) {
        return `https://www.youtube.com/embed/${pathParts[1]}`
      }
    }

    if (host === 'vimeo.com' || host.endsWith('.vimeo.com')) {
      const videoId = parsed.pathname.split('/').filter(Boolean)[0]
      if (videoId && /^\d+$/.test(videoId)) return `https://player.vimeo.com/video/${videoId}`
    }
  } catch {}

  return null
}

function isSensitiveCategory(category?: string | null) {
  const normalized = String(category || '').toLowerCase()
  if (!normalized) return false
  return ['saude', 'mental', 'medic', 'direito', 'jurid', 'legal'].some(keyword =>
    normalized.includes(keyword),
  )
}

function getPublicProfileCacheIdentity(
  parsedParam: ReturnType<typeof parseProfessionalProfileParam>,
) {
  if (parsedParam.kind === 'uuid') {
    return `professional-id:${parsedParam.id}`
  }
  if (parsedParam.kind === 'publicCode') {
    return `public-code:${parsedParam.code}`
  }
  return `unknown:${parsedParam.raw}`
}

async function loadPublicProfessionalByParam(
  parsedParam: ReturnType<typeof parseProfessionalProfileParam>,
): Promise<PublicProfessionalRecord | null> {
  const client = await createClient()
  const buildQuery = (useVisibilityColumn: boolean) => {
    let professionalQuery = client
      .from('professionals')
      .select(
        useVisibilityColumn
          ? PROFESSIONAL_PROFILE_SELECT_WITH_VISIBILITY
          : PROFESSIONAL_PROFILE_SELECT_LEGACY,
      )
      .eq('status', 'approved')

    if (useVisibilityColumn) {
      professionalQuery = professionalQuery.eq('is_publicly_visible', true)
    }

    if (parsedParam.kind === 'uuid') {
      professionalQuery = professionalQuery.eq('id', parsedParam.id)
    }

    if (parsedParam.kind === 'publicCode') {
      professionalQuery = professionalQuery.eq('public_code', parsedParam.code)
    }

    return professionalQuery
  }

  const initialResult = (await buildQuery(true).maybeSingle()) as unknown as {
    data: PublicProfessionalRecord | null
    error: { message?: string } | null
  }
  let normalizedProfessional = initialResult.data
  if (initialResult.error?.message?.includes('is_publicly_visible')) {
    const fallback = (await buildQuery(false).maybeSingle()) as unknown as {
      data: PublicProfessionalRecord | null
      error: { message?: string } | null
    }
    normalizedProfessional = fallback.data as unknown as PublicProfessionalRecord | null
    if (normalizedProfessional) {
      const visibilityByProfessionalId = await getPublicVisibilityByProfessionalId(client, [normalizedProfessional])
      const canGoLive = visibilityByProfessionalId.get(String(normalizedProfessional.id))?.canGoLive
      if (!canGoLive) return null
    }
  }
  if (!normalizedProfessional) return null

  return normalizedProfessional
}

async function loadCachedPublicProfessionalByParam(
  parsedParam: ReturnType<typeof parseProfessionalProfileParam>,
) {
  const cacheIdentity = getPublicProfileCacheIdentity(parsedParam)
  const getWithIsrTag = unstable_cache(
    async () =>
      getOrSetUpstashJsonCache<PublicProfessionalRecord | null>({
        key: `public-profile:${cacheIdentity}`,
        ttlSeconds: PUBLIC_PROFILE_CACHE_TTL_SECONDS,
        version: PUBLIC_PROFILE_CACHE_VERSION,
        loader: () => loadPublicProfessionalByParam(parsedParam),
      }),
    ['public-profile', cacheIdentity],
    {
      revalidate: PUBLIC_PROFILE_CACHE_TTL_SECONDS,
      tags: ['public-profiles'],
    },
  )

  const cached = await getWithIsrTag()
  if (cached) return cached
  return loadPublicProfessionalByParam(parsedParam)
}

export default async function ProfissionalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ erro?: string }>
}) {
  const { id } = await params
  const { erro } = await searchParams
  const parsedParam = parseProfessionalProfileParam(id)
  if (parsedParam.kind === 'unknown') notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const readClient = supabase

  let viewerCurrency = 'BRL'
  let viewerTimezone = 'America/Sao_Paulo'

  if (user) {
    const { data: viewerProfile } = await supabase
      .from('profiles')
      .select('currency,timezone')
      .eq('id', user.id)
      .single()

    viewerCurrency = String(viewerProfile?.currency || 'BRL').toUpperCase()
    viewerTimezone = String(viewerProfile?.timezone || viewerTimezone)
  }

  let professional: PublicProfessionalRecord | null = null
  if (user) {
    const buildProfessionalQuery = (withVisibilityColumn: boolean) => {
      let professionalQuery = readClient
        .from('professionals')
        .select(
          withVisibilityColumn
            ? PROFESSIONAL_PROFILE_SELECT_WITH_VISIBILITY
            : PROFESSIONAL_PROFILE_SELECT_LEGACY,
        )

      if (parsedParam.kind === 'uuid') {
        professionalQuery = professionalQuery.eq('id', parsedParam.id)
      }

      if (parsedParam.kind === 'publicCode') {
        professionalQuery = professionalQuery.eq('public_code', parsedParam.code)
      }

      return professionalQuery
    }

    let professionalResult = (await buildProfessionalQuery(true).maybeSingle()) as unknown as {
      data: PublicProfessionalRecord | null
      error: { message?: string } | null
    }
    if (professionalResult.error?.message?.includes('is_publicly_visible')) {
      professionalResult = (await buildProfessionalQuery(false).maybeSingle()) as unknown as {
        data: PublicProfessionalRecord | null
        error: { message?: string } | null
      }
    }

    professional = professionalResult.data
  } else {
    professional = await loadCachedPublicProfessionalByParam(parsedParam)
  }

  if (!professional) {
    notFound()
  }

  const isOwnProfessional = user ? professional.user_id === user.id : false
  if (!isOwnProfessional) {
    const visibilityByProfessionalId = await getPublicVisibilityByProfessionalId(readClient, [professional])
    const canGoLive = Boolean(visibilityByProfessionalId.get(String(professional.id))?.canGoLive)
    const isPubliclyVisible =
      (typeof professional.is_publicly_visible === 'boolean'
        ? professional.is_publicly_visible
        : false) || canGoLive

    if (!isPubliclyVisible || professional.status !== 'approved') {
      notFound()
    }
  }

  const { data: availability } = await readClient
    .from('availability')
    .select('id,day_of_week,start_time,end_time,is_active')
    .eq('professional_id', professional.id)
    .eq('is_active', true)
    .order('day_of_week')

  const { data: existingBookings } = await readClient
    .from('bookings')
    .select('scheduled_at,duration_minutes')
    .eq('professional_id', professional.id)
    .in('status', ['pending_confirmation', 'confirmed'])

  const { data: reviews } = await readClient
    .from('reviews')
    .select('id,rating,comment,professional_response,profiles(full_name)')
    .eq('professional_id', professional.id)
    .eq('is_visible', true)
    .order('created_at', { ascending: false })
    .limit(20)

  const { count: verifiedCredentialsCount } = await readClient
    .from('professional_credentials')
    .select('id', { count: 'exact', head: true })
    .eq('professional_id', professional.id)
    .eq('verified', true)

  const { data: professionalSpecialtyLinks } = await readClient
    .from('professional_specialties')
    .select('specialty_id')
    .eq('professional_id', professional.id)

  const specialtyIds = Array.from(
    new Set(
      (professionalSpecialtyLinks || [])
        .map((entry: { specialty_id?: string | null }) => String(entry.specialty_id || '').trim())
        .filter(Boolean),
    ),
  )

  let professionalSpecialties: string[] = []
  if (specialtyIds.length > 0) {
    const { data: specialtyRows } = await readClient
      .from('specialties')
      .select('id,name_pt')
      .in('id', specialtyIds)
      .eq('is_active', true)

    professionalSpecialties = Array.from(
      new Set(
        (specialtyRows || [])
          .map((row: { name_pt?: string | null }) => String(row.name_pt || '').trim())
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
  }

  const firstBookingRelevantStatuses = [
    'pending',
    'pending_confirmation',
    'confirmed',
    'completed',
    'no_show',
    'rescheduled',
  ]

  const { count: existingAcceptedBookingsCount } = await readClient
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('professional_id', professional.id)
    .in('status', firstBookingRelevantStatuses)

  const firstBookingBlocked =
    !professional.first_booking_enabled && (existingAcceptedBookingsCount || 0) === 0

  const { data: recommendationCandidatesRaw, error: recommendationCandidatesError } = await readClient
    .from('professionals')
    .select(
      'id,public_code,session_price_brl,session_duration_minutes,rating,total_reviews,tier,tags,bio,profiles!professionals_user_id_fkey(full_name,country,avatar_url,role),category,subcategories',
    )
    .eq('status', 'approved')
    .eq('is_publicly_visible', true)
    .eq('profiles.role', 'profissional')
    .neq('id', professional.id)
    .order('rating', { ascending: false })
    .limit(24)

  let recommendationCandidates: PublicProfessionalRecord[] =
    (recommendationCandidatesRaw || []) as unknown as PublicProfessionalRecord[]
  if (recommendationCandidatesError?.message?.includes('is_publicly_visible')) {
    const fallbackCandidatesResult = await readClient
      .from('professionals')
      .select(
        'id,public_code,session_price_brl,session_duration_minutes,rating,total_reviews,tier,tags,bio,profiles!professionals_user_id_fkey(full_name,country,avatar_url,role),category,subcategories',
      )
      .eq('status', 'approved')
      .eq('profiles.role', 'profissional')
      .neq('id', professional.id)
      .order('rating', { ascending: false })
      .limit(24)

    recommendationCandidates = (await filterPubliclyVisibleProfessionals(
      readClient,
      ((fallbackCandidatesResult.data || []) as unknown as PublicProfessionalRecord[]),
    )) as unknown as PublicProfessionalRecord[]
  }

  const recommendationIds = recommendationCandidates.map((candidate: PublicProfessionalRecord) => String(candidate.id))
  const recommendationSpecialtyContext =
    recommendationIds.length > 0
      ? await loadProfessionalSpecialtyContext(readClient, recommendationIds)
      : {
          byProfessionalId: new Map<string, string[]>(),
          primaryByProfessionalId: new Map<string, string>(),
          categorySlugsByProfessionalId: new Map<string, string[]>(),
        }

  const recommendations = recommendationCandidates.slice(0, 10)
  const profile = Array.isArray(professional.profiles)
    ? professional.profiles[0]
    : professional.profiles
  const primarySpecialty = getPrimarySpecialty(professional, professionalSpecialties)
  const professionalTimezone = String(professional.timezone || viewerTimezone)
  const tier = String(professional.tier || 'basic').toLowerCase()
  const socialLinks = parseSocialLinks(professional.social_links).slice(0, tier === 'premium' ? 5 : 2)
  const whatsappUrl = professional.whatsapp_number
    ? `https://wa.me/${String(professional.whatsapp_number).replace(/[^\d]/g, '')}`
    : null
  const videoEmbedUrl =
    isFeatureAvailable(tier, 'video_intro') && professional.video_intro_url
      ? toVideoEmbedUrl(professional.video_intro_url)
      : null
  const showSensitiveVerifiedBadge =
    isSensitiveCategory(professional.category) && Number(verifiedCredentialsCount || 0) > 0

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <Link
        href="/buscar"
        className="mb-6 inline-flex items-center gap-1.5 rounded-lg text-sm text-slate-500 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/20"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar à busca
      </Link>

      <ProfileAvailabilityBookingSection
        availability={(availability || []) as AvailabilitySlotRow[]}
        existingBookings={(existingBookings || []) as ExistingBookingRow[]}
        isLoggedIn={Boolean(user)}
        isOwnProfessional={isOwnProfessional}
        firstBookingBlocked={firstBookingBlocked}
        errorCode={erro}
        bookHref={`/agendar/${professional.id}`}
        messageHref={`/mensagens?profissional=${professional.id}`}
        userTimezone={viewerTimezone}
        professionalTimezone={professionalTimezone}
        minimumNoticeHours={Math.max(0, Number(professional.minimum_notice_hours || 24))}
        maxBookingWindowDays={Math.max(7, Number(professional.max_booking_window_days || 60))}
        enableRecurring={professional.enable_recurring !== false}
        basePriceBrl={Math.max(0, Number(professional.session_price_brl || 0))}
        baseDurationMinutes={Math.max(1, Number(professional.session_duration_minutes || 60))}
        viewerCurrency={viewerCurrency}
        topSections={
          <>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div
                className="relative h-28 bg-gradient-to-br from-[#9FE870]/80 to-[#8ed85f]"
                style={
                  professional.cover_photo_url
                    ? {
                        backgroundImage: `linear-gradient(rgba(0,0,0,0.22), rgba(0,0,0,0.22)), url('${professional.cover_photo_url}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : undefined
                }
              >
                <div className="absolute -bottom-10 left-6">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={`Foto de ${profile?.full_name || 'Profissional'}`}
                      width={96}
                      height={96}
                      sizes="96px"
                      quality={75}
                      priority
                      className="h-24 w-24 rounded-lg border-4 border-white bg-white object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-lg border-4 border-white bg-white text-3xl font-bold text-[#3d6b1f]">
                      {getNameInitial(profile?.full_name)}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 pb-6 pt-14">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">{profile?.full_name}</h1>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                      <span>{primarySpecialty}</span>
                      {Number(professional.years_experience || 0) > 0 ? (
                        <span>• {Number(professional.years_experience)} anos de experiência</span>
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {tier !== 'basic' && whatsappUrl ? (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          WhatsApp
                        </a>
                      ) : null}
                      {tier !== 'basic' && socialLinks.length > 0
                        ? socialLinks.map(link => (
                            <a
                              key={`${link.label}-${link.url}`}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              {link.label}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ))
                        : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {professional.tier && professional.tier !== 'basic' ? (
                      <span
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                          professional.tier === 'premium'
                            ? 'border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700'
                            : 'border-blue-200 bg-blue-50 text-blue-700'
                        }`}
                      >
                        {professional.tier === 'premium' ? '⭐ Premium' : '✓ Profissional'}
                      </span>
                    ) : null}

                    <FavoriteButton professionalId={professional.id} />

                    <div className="flex items-center gap-1.5 rounded-full bg-accent-50 px-3 py-1.5">
                      <Star className="h-4 w-4 fill-accent-500 text-accent-500" />
                      <span className="text-sm font-semibold text-accent-700">
                        {Number(professional.rating || 0) > 0 ? Number(professional.rating).toFixed(1) : 'Novo'}
                      </span>
                      {Number(professional.total_reviews || 0) > 0 ? (
                        <span className="text-xs text-accent-500">({Number(professional.total_reviews)})</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {((professional.tags || []) as string[]).length > 0 ? (
                  <div className="mt-4">
                    <p className="mb-1 text-[11px] text-slate-400">Foco de atuação</p>
                    <div className="flex flex-wrap gap-2">
                      {((professional.tags || []) as string[]).map((tag: string) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[#9FE870]/8 px-2.5 py-1 text-xs font-medium text-[#3d6b1f]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {showSensitiveVerifiedBadge ? (
                  <div className="mt-4">
                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                      Credenciais verificadas
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="mb-3 font-display text-lg font-semibold text-slate-900">Sobre mim</h2>
              <p className="whitespace-pre-line leading-relaxed text-slate-600">
                {professional.bio || 'Sem descrição.'}
              </p>
            </div>

            {videoEmbedUrl ? (
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-slate-900">
                  <PlayCircle className="h-5 w-5 text-[#9FE870]" />
                  Vídeo de apresentação
                </h2>
                <div className="overflow-hidden rounded-md border border-slate-200">
                  <iframe
                    src={videoEmbedUrl}
                    title="Vídeo de apresentação do profissional"
                    className="aspect-video h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : null}

            {(professional.languages || []).length > 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-slate-900">
                  <Globe className="h-4 w-4 text-slate-400" /> Idiomas
                </h2>
                <div className="flex flex-wrap gap-2">
                  {(professional.languages || []).map((language: string) => (
                    <span key={language} className="rounded-full bg-slate-50/70 px-3 py-1.5 text-sm text-slate-700">
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        }
      >
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-slate-900">Rating</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-slate-200/80 bg-slate-50/70 px-4 py-3">
              <p className="text-xs text-slate-500">Avaliação média</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {Number(professional.rating || 0) > 0 ? Number(professional.rating).toFixed(1) : 'Novo'}
              </p>
            </div>
            <div className="rounded-md border border-slate-200/80 bg-slate-50/70 px-4 py-3">
              <p className="text-xs text-slate-500">Total de avaliações</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{professional.total_reviews || 0}</p>
            </div>
            <div className="rounded-md border border-slate-200/80 bg-slate-50/70 px-4 py-3">
              <p className="text-xs text-slate-500">Sessões concluídas</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{professional.total_bookings || 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-slate-900">Comentários</h2>
          {reviews && reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review: any) => (
                <div key={review.id} className="border-b border-slate-100/80 pb-4 last:border-0 last:pb-0">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                      {getNameInitial(review.profiles?.full_name, 'U')}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{review.profiles?.full_name}</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={`h-3 w-3 ${
                            index < review.rating ? 'fill-accent-500 text-accent-500' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="ml-9 text-sm text-slate-600">{review.comment || 'Sem comentário.'}</p>
                  {review.professional_response ? (
                    <div className="ml-9 mt-2 border-l-2 border-[#9FE870]/30 pl-3">
                      <p className="mb-0.5 text-xs font-medium text-[#3d6b1f]">Resposta do profissional</p>
                      <p className="text-sm text-slate-600">{review.professional_response}</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Este profissional ainda não recebeu comentários públicos.</p>
          )}
        </div>

        {recommendations.length > 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-slate-900">
              Pessoas que você também pode gostar
            </h2>
            <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
              {recommendations.map((item: any) => {
                const itemSpecialty =
                  recommendationSpecialtyContext.primaryByProfessionalId.get(String(item.id)) ||
                  getPrimarySpecialty(
                    item,
                    recommendationSpecialtyContext.byProfessionalId.get(String(item.id)) || [],
                  )

                return (
                  <Link
                    key={item.id}
                    href={buildProfessionalProfilePath({
                      id: item.id,
                      fullName: item.profiles?.full_name,
                      publicCode: item.public_code,
                    })}
                    className="min-w-[220px] max-w-[220px] rounded-md border border-slate-200 bg-white p-3 transition hover:border-slate-300"
                  >
                    <div className="flex items-start gap-2">
                      {item.profiles?.avatar_url ? (
                        <Image
                          src={item.profiles.avatar_url}
                          alt={`Foto de ${item.profiles?.full_name || 'Profissional'}`}
                          width={44}
                          height={44}
                          sizes="44px"
                          quality={68}
                          className="h-11 w-11 rounded-md border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-gradient-to-br from-[#9FE870]/80 to-[#8ed85f] text-sm font-bold text-white">
                          {getNameInitial(item.profiles?.full_name)}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {item.profiles?.full_name || 'Profissional'}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{itemSpecialty}</p>
                        <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-500">
                          <MapPin className="h-3 w-3" /> {getCountryDisplayName(item.profiles?.country)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatCurrency(item.session_price_brl, viewerCurrency)}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {Math.max(1, Number(item.session_duration_minutes || 60))} min
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ) : null}
      </ProfileAvailabilityBookingSection>
    </div>
  )
}


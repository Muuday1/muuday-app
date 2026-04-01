export const metadata = { title: 'Profissional | Muuday' }

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Globe, MapPin, Star } from 'lucide-react'
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
} from '@/lib/professional/public-visibility'
import { loadProfessionalSpecialtyContext } from '@/lib/taxonomy/professional-specialties'
import { formatCurrency } from '@/lib/utils'

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

function getPrimarySpecialty(professional: any, specialties: string[]) {
  const firstSpecialty = specialties[0]
  if (firstSpecialty) return firstSpecialty

  const subcategory = (professional.subcategories || []).find((entry: string) =>
    String(entry || '').trim(),
  )
  if (subcategory) return String(subcategory)

  const tag = (professional.tags || []).find((entry: string) => String(entry || '').trim())
  if (tag) return String(tag)

  return getSearchCategoryLabel(professional.category)
}

export default async function ProfissionalPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: { erro?: string }
}) {
  const parsedParam = parseProfessionalProfileParam(params.id)
  if (parsedParam.kind === 'unknown') notFound()

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const readClient = (user ? supabase : createAdminClient()) || supabase

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

  let professionalQuery = readClient
    .from('professionals')
    .select('*, profiles!inner(*), first_booking_enabled')
    .eq('profiles.role', 'profissional')

  if (parsedParam.kind === 'uuid') {
    professionalQuery = professionalQuery.eq('id', parsedParam.id)
  }

  if (parsedParam.kind === 'publicCode') {
    professionalQuery = professionalQuery.eq('public_code', parsedParam.code)
  }

  const { data: professional } = await professionalQuery.maybeSingle()

  if (!professional || (professional.status !== 'approved' && professional.user_id !== user?.id)) {
    notFound()
  }

  const isOwnProfessional = user ? professional.user_id === user.id : false
  if (!isOwnProfessional) {
    const visibilityByProfessionalId = await getPublicVisibilityByProfessionalId(readClient as any, [professional])
    const canGoLive = visibilityByProfessionalId.get(String(professional.id))?.canGoLive
    if (!canGoLive) notFound()
  }

  const { data: availability } = await readClient
    .from('availability')
    .select('*')
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
    .select('*, profiles(full_name)')
    .eq('professional_id', professional.id)
    .eq('is_visible', true)
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: professionalSpecialtyLinks } = await readClient
    .from('professional_specialties')
    .select('specialty_id')
    .eq('professional_id', professional.id)

  const specialtyIds = Array.from(
    new Set(
      (professionalSpecialtyLinks || [])
        .map((entry: any) => String(entry.specialty_id || '').trim())
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
          .map((row: any) => String(row.name_pt || '').trim())
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

  const { data: recommendationCandidatesRaw } = await readClient
    .from('professionals')
    .select(
      'id,public_code,session_price_brl,session_duration_minutes,rating,total_reviews,tier,tags,bio,profiles!inner(full_name,country,avatar_url,role),category,subcategories',
    )
    .eq('status', 'approved')
    .eq('profiles.role', 'profissional')
    .neq('id', professional.id)
    .order('rating', { ascending: false })
    .limit(24)

  let recommendationCandidates: any[] = (recommendationCandidatesRaw || []) as any[]
  if (recommendationCandidates.length > 0) {
    recommendationCandidates = (await filterPubliclyVisibleProfessionals(
      readClient as any,
      recommendationCandidates as any,
    )) as any[]
  }

  const recommendationIds = recommendationCandidates.map((candidate: any) => String(candidate.id))
  const recommendationSpecialtyContext =
    recommendationIds.length > 0
      ? await loadProfessionalSpecialtyContext(readClient as any, recommendationIds)
      : {
          byProfessionalId: new Map<string, string[]>(),
          primaryByProfessionalId: new Map<string, string>(),
          categorySlugsByProfessionalId: new Map<string, string[]>(),
        }

  const recommendations = recommendationCandidates.slice(0, 10)
  const profile = professional.profiles as any
  const primarySpecialty = getPrimarySpecialty(professional, professionalSpecialties)
  const professionalTimezone = String(professional.timezone || viewerTimezone)

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <Link
        href="/buscar"
        className="mb-6 inline-flex items-center gap-1.5 rounded-lg text-sm text-neutral-500 transition-colors hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar à busca
      </Link>

      <ProfileAvailabilityBookingSection
        availability={(availability || []) as any[]}
        existingBookings={(existingBookings || []) as any[]}
        isLoggedIn={Boolean(user)}
        isOwnProfessional={isOwnProfessional}
        firstBookingBlocked={firstBookingBlocked}
        errorCode={searchParams?.erro}
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
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <div className="relative h-28 bg-gradient-to-br from-brand-400 to-brand-600">
                <div className="absolute -bottom-10 left-6">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={`Foto de ${profile?.full_name || 'Profissional'}`}
                      width={96}
                      height={96}
                      className="h-24 w-24 rounded-2xl border-4 border-white bg-white object-cover shadow-sm"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-white text-3xl font-bold text-brand-600 shadow-sm">
                      {getNameInitial(profile?.full_name)}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 pb-6 pt-14">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <h1 className="font-display text-2xl font-bold text-neutral-900">{profile?.full_name}</h1>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                      <span>{primarySpecialty}</span>
                      {professional.years_experience > 0 ? (
                        <span>• {professional.years_experience} anos de experiência</span>
                      ) : null}
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
                        {professional.rating > 0 ? Number(professional.rating).toFixed(1) : 'Novo'}
                      </span>
                      {professional.total_reviews > 0 ? (
                        <span className="text-xs text-accent-500">({professional.total_reviews})</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {professional.tags?.length > 0 ? (
                  <div className="mt-4">
                    <p className="mb-1 text-[11px] text-neutral-400">Foco de atuação</p>
                    <div className="flex flex-wrap gap-2">
                      {professional.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 font-display text-lg font-semibold text-neutral-900">Sobre mim</h2>
              <p className="whitespace-pre-line leading-relaxed text-neutral-600">
                {professional.bio || 'Sem descrição.'}
              </p>
            </div>

            {(professional.languages || []).length > 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-neutral-900">
                  <Globe className="h-4 w-4 text-neutral-400" /> Idiomas
                </h2>
                <div className="flex flex-wrap gap-2">
                  {(professional.languages || []).map((language: string) => (
                    <span key={language} className="rounded-full bg-neutral-50 px-3 py-1.5 text-sm text-neutral-700">
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        }
      >
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-display text-lg font-semibold text-neutral-900">Rating</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
              <p className="text-xs text-neutral-500">Avaliação média</p>
              <p className="mt-1 text-xl font-semibold text-neutral-900">
                {professional.rating > 0 ? Number(professional.rating).toFixed(1) : 'Novo'}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
              <p className="text-xs text-neutral-500">Total de avaliações</p>
              <p className="mt-1 text-xl font-semibold text-neutral-900">{professional.total_reviews || 0}</p>
            </div>
            <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
              <p className="text-xs text-neutral-500">Sessões concluídas</p>
              <p className="mt-1 text-xl font-semibold text-neutral-900">{professional.total_bookings || 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-display text-lg font-semibold text-neutral-900">Comentários</h2>
          {reviews && reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review: any) => (
                <div key={review.id} className="border-b border-neutral-50 pb-4 last:border-0 last:pb-0">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-600">
                      {getNameInitial(review.profiles?.full_name, 'U')}
                    </div>
                    <span className="text-sm font-medium text-neutral-700">{review.profiles?.full_name}</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={`h-3 w-3 ${
                            index < review.rating ? 'fill-accent-500 text-accent-500' : 'text-neutral-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="ml-9 text-sm text-neutral-600">{review.comment || 'Sem comentário.'}</p>
                  {review.professional_response ? (
                    <div className="ml-9 mt-2 border-l-2 border-brand-200 pl-3">
                      <p className="mb-0.5 text-xs font-medium text-brand-700">Resposta do profissional</p>
                      <p className="text-sm text-neutral-600">{review.professional_response}</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">Este profissional ainda não recebeu comentários públicos.</p>
          )}
        </div>

        {recommendations.length > 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-display text-lg font-semibold text-neutral-900">
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
                    className="min-w-[220px] max-w-[220px] rounded-xl border border-neutral-200 bg-white p-3 transition hover:border-neutral-300 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-2">
                      {item.profiles?.avatar_url ? (
                        <Image
                          src={item.profiles.avatar_url}
                          alt={`Foto de ${item.profiles?.full_name || 'Profissional'}`}
                          width={44}
                          height={44}
                          className="h-11 w-11 rounded-xl border border-neutral-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white">
                          {getNameInitial(item.profiles?.full_name)}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-neutral-900">
                          {item.profiles?.full_name || 'Profissional'}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">{itemSpecialty}</p>
                        <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-neutral-500">
                          <MapPin className="h-3 w-3" /> {getCountryDisplayName(item.profiles?.country)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-neutral-900">
                        {formatCurrency(item.session_price_brl, viewerCurrency)}
                      </p>
                      <p className="text-[11px] text-neutral-400">
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

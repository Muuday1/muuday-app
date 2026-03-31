export const metadata = { title: 'Profissional | Muuday' }

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Star, Clock, Globe, MapPin, Calendar, ArrowLeft, MessageCircle } from 'lucide-react'
import { getSearchCategoryLabel, normalizeSearchCategorySlug, getSearchCategoryBySlug } from '@/lib/search-config'
import { formatCurrency } from '@/lib/utils'
import { FavoriteButton } from '@/components/FavoriteButton'
import { PublicBookingAuthModal } from '@/components/auth/PublicBookingAuthModal'
import { MobileBookingStickyCta } from '@/components/booking/MobileBookingStickyCta'
import {
  parseProfessionalProfileParam,
} from '@/lib/professional/public-profile-url'

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default async function ProfissionalPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: { erro?: string }
}) {
  const parsedParam = parseProfessionalProfileParam(params.id)
  if (parsedParam.kind === 'unknown') {
    notFound()
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let viewerCurrency = 'BRL'
  if (user) {
    const { data: viewerProfile } = await supabase
      .from('profiles')
      .select('currency')
      .eq('id', user.id)
      .single()
    viewerCurrency = viewerProfile?.currency || 'BRL'
  }

  // Fetch professional with profile
  let professionalQuery = supabase
    .from('professionals')
    .select('*, profiles!inner(*), first_booking_enabled')
    .eq('profiles.role', 'profissional')

  if (parsedParam.kind === 'uuid') {
    professionalQuery = professionalQuery.eq('id', parsedParam.id)
  }

  if (parsedParam.kind === 'publicCode') {
    professionalQuery = professionalQuery.eq('public_code', parsedParam.code)
  }

  const { data: professional } = await professionalQuery.single()

  if (!professional || (professional.status !== 'approved' && professional.user_id !== user?.id)) {
    notFound()
  }

  // Fetch availability
  const { data: availability } = await supabase
    .from('availability')
    .select('*')
    .eq('professional_id', professional.id)
    .eq('is_active', true)
    .order('day_of_week')

  // Fetch reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, profiles(full_name)')
    .eq('professional_id', professional.id)
    .eq('is_visible', true)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: professionalSpecialtyLinks } = await supabase
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
    const { data: specialtyRows } = await supabase
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

  const categorySlug = normalizeSearchCategorySlug(professional.category)
  const category = getSearchCategoryBySlug(categorySlug)
  const primarySpecialty = professionalSpecialties[0] || getSearchCategoryLabel(professional.category)
  const profile = professional.profiles as any
  const isOwnProfessional = user ? professional.user_id === user.id : false
  const isLoggedIn = !!user
  const requestBookingAvailable = ['professional', 'premium'].includes(
    String(professional.tier || 'basic'),
  )

  const firstBookingRelevantStatuses = [
    'pending',
    'pending_confirmation',
    'confirmed',
    'completed',
    'no_show',
    'rescheduled',
  ]
  const { count: existingAcceptedBookingsCount } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('professional_id', professional.id)
    .in('status', firstBookingRelevantStatuses)

  const firstBookingBlocked =
    !professional.first_booking_enabled && (existingAcceptedBookingsCount || 0) === 0

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8 pb-24 lg:pb-8">
      {/* Back button */}
      <Link
        href="/buscar"
        className="mb-6 inline-flex items-center gap-1.5 rounded-lg text-sm text-neutral-500 transition-colors hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar à busca
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile header */}
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="h-28 bg-gradient-to-br from-brand-400 to-brand-600 relative">
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
                  <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-sm flex items-center justify-center text-brand-600 font-display font-bold text-3xl">
                    {profile?.full_name?.charAt(0) || 'P'}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-14 px-6 pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="font-display font-bold text-2xl text-neutral-900">{profile?.full_name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-neutral-500 flex items-center gap-1">{primarySpecialty}</span>
                    {category?.name ? (
                      <span className="text-xs text-neutral-400">· {category.icon} {category.name}</span>
                    ) : null}
                    {professional.years_experience > 0 && (
                      <span className="text-xs text-neutral-400">
                        · {professional.years_experience} anos de exp.
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {professional.tier && professional.tier !== 'basic' && (
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                      professional.tier === 'premium'
                        ? 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border border-amber-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {professional.tier === 'premium' ? '⭐ Premium' : '✓ Profissional'}
                    </span>
                  )}
                  <FavoriteButton professionalId={professional.id} />
                  <div className="flex items-center gap-1.5 bg-accent-50 px-3 py-1.5 rounded-full">
                    <Star className="w-4 h-4 text-accent-500 fill-accent-500" />
                    <span className="font-semibold text-sm text-accent-700">
                      {professional.rating > 0 ? professional.rating.toFixed(1) : 'Novo'}
                    </span>
                    {professional.total_reviews > 0 && (
                      <span className="text-xs text-accent-500">({professional.total_reviews})</span>
                    )}
                  </div>
                </div>
              </div>

              {professionalSpecialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {professionalSpecialties.map((specialty: string) => (
                    <span key={specialty} className="text-xs bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-full font-medium">
                      {specialty}
                    </span>
                  ))}
                </div>
              )}
              {professional.tags?.length > 0 && (
                <div className="mt-3">
                  <p className="text-[11px] text-neutral-400 mb-1">Foco de atuacao</p>
                  <div className="flex flex-wrap gap-2">
                    {professional.tags.map((tag: string) => (
                      <span key={tag} className="text-xs bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="font-display font-semibold text-lg text-neutral-900 mb-3">Sobre</h2>
            <p className="text-neutral-600 leading-relaxed whitespace-pre-line">{professional.bio || 'Sem descrição.'}</p>
          </div>

          {/* Languages */}
          {professional.languages?.length > 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="font-display font-semibold text-lg text-neutral-900 mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-neutral-400" /> Idiomas
              </h2>
              <div className="flex flex-wrap gap-2">
                {professional.languages.map((lang: string) => (
                  <span key={lang} className="text-sm bg-neutral-50 text-neutral-700 px-3 py-1.5 rounded-full">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Availability */}
          {availability && availability.length > 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="font-display font-semibold text-lg text-neutral-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neutral-400" /> Disponibilidade
              </h2>
              <p className="mb-3 text-xs text-neutral-500">
                Horários exibidos como janelas de atendimento. Ao agendar, você confirma data e fuso horário no checkout.
              </p>
              <div className="space-y-2">
                {availability.map((slot: any) => (
                  <div key={slot.id} className="flex items-center justify-between py-2 border-b border-neutral-50 last:border-0">
                    <span className="text-sm font-medium text-neutral-700">{DAY_NAMES[slot.day_of_week]}</span>
                    <span className="text-sm text-neutral-500">{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {reviews && reviews.length > 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="font-display font-semibold text-lg text-neutral-900 mb-4 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-neutral-400" /> Avaliações
              </h2>
              <div className="space-y-4">
                {reviews.map((review: any) => (
                  <div key={review.id} className="border-b border-neutral-50 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 text-xs font-semibold">
                        {review.profiles?.full_name?.charAt(0) || 'U'}
                      </div>
                      <span className="text-sm font-medium text-neutral-700">{review.profiles?.full_name}</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-accent-500 fill-accent-500' : 'text-neutral-200'}`} />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-neutral-600 ml-9">{review.comment}</p>
                    )}
                    {review.professional_response && (
                      <div className="ml-9 mt-2 pl-3 border-l-2 border-brand-200">
                        <p className="text-xs font-medium text-brand-700 mb-0.5">Resposta do profissional</p>
                        <p className="text-sm text-neutral-600">{review.professional_response}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Booking card */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-neutral-900">
                {formatCurrency(professional.session_price_brl, viewerCurrency)}
              </div>
              <p className="text-sm text-neutral-500 flex items-center justify-center gap-1 mt-1">
                <Clock className="w-3.5 h-3.5" /> {professional.session_duration_minutes} minutos
              </p>
              {profile?.country && (
                <p className="mt-1 inline-flex items-center justify-center gap-1 text-xs text-neutral-500">
                  <MapPin className="h-3.5 w-3.5" />
                  {profile.country}
                </p>
              )}
            </div>

            {isOwnProfessional ? (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled
                  className="w-full bg-neutral-100 text-neutral-400 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-sm cursor-not-allowed"
                >
                  <Calendar className="w-4 h-4" /> Este é seu perfil
                </button>
                <p className="text-xs text-neutral-500 text-center">
                  Não é possível agendar sessão com você mesmo.
                </p>
              </div>
            ) : firstBookingBlocked ? (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled
                  className="w-full bg-neutral-100 text-neutral-400 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-sm cursor-not-allowed"
                >
                  <Calendar className="w-4 h-4" /> Agendamento indisponível
                </button>
                <p className="text-xs text-neutral-500 text-center">
                  Este profissional ainda não foi liberado para aceitar o primeiro agendamento.
                </p>
              </div>
            ) : (
              <PublicBookingAuthModal
                isLoggedIn={isLoggedIn}
                bookHref={`/agendar/${professional.id}`}
                requestHref={`/solicitar/${professional.id}`}
                requestEnabled={requestBookingAvailable}
              />
            )}

            {searchParams?.erro === 'auto-agendamento' && (
              <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700" role="alert">
                Não é permitido agendar sessão com o próprio perfil profissional.
              </div>
            )}

            {searchParams?.erro === 'primeiro-agendamento-bloqueado' && (
              <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700" role="alert">
                Este profissional ainda não está habilitado para aceitar o primeiro agendamento.
              </div>
            )}

            {searchParams?.erro === 'request-booking-indisponivel' && (
              <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700" role="alert">
                Solicitação de horário disponível apenas para profissionais nos planos Professional ou Premium.
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-neutral-100">
              <div className="space-y-2 text-xs text-neutral-600">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  Cancelamento gratuito até 24h antes
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  Sessão por vídeo (link enviado após confirmação)
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  Conversão automática de fuso horário
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      {!isOwnProfessional && !firstBookingBlocked && (
        <MobileBookingStickyCta
          isLoggedIn={isLoggedIn}
          bookHref={`/agendar/${professional.id}`}
          priceText={formatCurrency(professional.session_price_brl, viewerCurrency)}
          durationText={`${professional.session_duration_minutes} min`}
        />
      )}
    </div>
  )
}

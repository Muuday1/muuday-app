import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface AdminDashboardData {
  stats: {
    totalUsers: number
    totalProfessionals: number
    totalBookings: number
    totalReviews: number
    pendingProfessionals: number
    pendingReviews: number
  }
  professionals: Array<{
    id: string
    public_code?: number | null
    user_id: string
    status: string
    first_booking_enabled: boolean
    first_booking_gate_note?: string | null
    first_booking_gate_updated_at?: string | null
    bio: string
    category: string
    tags: string[]
    languages: string[]
    years_experience: number
    session_price_brl: number
    session_duration_minutes: number
    rating: number
    total_reviews: number
    total_bookings: number
    created_at: string
    admin_review_notes?: string | null
    reviewed_at?: string | null
    profiles: {
      full_name: string
      email: string
      country: string
      timezone: string
      avatar_url?: string | null
    }
  }>
  professionalSpecialties: Record<string, string[]>
  professionalCredentialCounts: Record<string, number>
  professionalMinServicePrice: Record<string, number>
  reviews: Array<{
    id: string
    rating: number
    comment: string
    is_visible: boolean
    created_at: string
    profiles: { full_name: string }
    professionals: { id: string; profiles: { full_name: string } }
  }>
  bookings: Array<{
    id: string
    scheduled_at: string
    status: string
    price_brl: number
    duration_minutes: number
    user_profile: { full_name: string; email: string }
    professional_profile: { full_name: string }
  }>
}

export async function loadAdminDashboardDataService(
  supabase: SupabaseClient,
): Promise<{ success: boolean; data?: AdminDashboardData; error?: string }> {
  try {
    const [usersRes, prosRes, bookingsRes, reviewsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('professionals').select('id, status').limit(5000),
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
      supabase.from('reviews').select('id, is_visible').limit(5000),
    ])

    if (usersRes.error) Sentry.captureException(usersRes.error, { tags: { area: 'admin_dashboard', query: 'users_count' } })
    if (prosRes.error) Sentry.captureException(prosRes.error, { tags: { area: 'admin_dashboard', query: 'professionals_list' } })
    if (bookingsRes.error) Sentry.captureException(bookingsRes.error, { tags: { area: 'admin_dashboard', query: 'bookings_count' } })
    if (reviewsRes.error) Sentry.captureException(reviewsRes.error, { tags: { area: 'admin_dashboard', query: 'reviews_list' } })

    const allPros = prosRes.data || []
    const allRevs = reviewsRes.data || []

    const stats = {
      totalUsers: usersRes.count || 0,
      totalProfessionals: allPros.length,
      totalBookings: bookingsRes.count || 0,
      totalReviews: allRevs.length,
      pendingProfessionals: allPros.filter(p => p.status === 'pending_review').length,
      pendingReviews: allRevs.filter(r => !r.is_visible).length,
    }

    const { data: professionalsData, error: professionalsError } = await supabase
      .from('professionals')
      .select('*, profiles!professionals_user_id_fkey(*)')
      .order('created_at', { ascending: false })

    if (professionalsError) {
      Sentry.captureException(professionalsError, { tags: { area: 'admin_dashboard', query: 'professionals_detail' } })
    }

    const resolvedProfessionals = (professionalsData as unknown as AdminDashboardData['professionals']) || []
    const professionalIds = resolvedProfessionals.map(p => p.id).filter(Boolean)

    let professionalSpecialties: Record<string, string[]> = {}
    let professionalCredentialCounts: Record<string, number> = {}
    let professionalMinServicePrice: Record<string, number> = {}

    if (professionalIds.length > 0) {
      const { data: credentialRows, error: credentialError } = await supabase
        .from('professional_credentials')
        .select('professional_id')
        .in('professional_id', professionalIds)

      if (credentialError) {
        Sentry.captureException(credentialError, { tags: { area: 'admin_dashboard', query: 'credentials' } })
      }

      professionalCredentialCounts = (credentialRows || []).reduce((acc, row: { professional_id: string }) => {
        const pid = String(row.professional_id || '').trim()
        if (!pid) return acc
        acc[pid] = (acc[pid] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const { data: serviceRows, error: serviceError } = await supabase
        .from('professional_services')
        .select('professional_id,price_brl,is_active')
        .in('professional_id', professionalIds)
        .eq('is_active', true)

      if (serviceError) {
        Sentry.captureException(serviceError, { tags: { area: 'admin_dashboard', query: 'services' } })
      }

      professionalMinServicePrice = (serviceRows || []).reduce((acc, row: { professional_id: string; price_brl: number }) => {
        const pid = String(row.professional_id || '').trim()
        const price = Number(row.price_brl || 0)
        if (!pid || !Number.isFinite(price) || price <= 0) return acc
        if (!(pid in acc) || price < acc[pid]!) {
          acc[pid] = price
        }
        return acc
      }, {} as Record<string, number>)

      const { data: linkRows, error: linkError } = await supabase
        .from('professional_specialties')
        .select('professional_id,specialty_id')
        .in('professional_id', professionalIds)

      if (linkError) {
        Sentry.captureException(linkError, { tags: { area: 'admin_dashboard', query: 'specialties_link' } })
      }

      const specialtyIds = Array.from(
        new Set((linkRows || []).map((row: { specialty_id: string }) => String(row.specialty_id || '').trim()).filter(Boolean)),
      )

      if (specialtyIds.length > 0) {
        const { data: specialtyRows, error: specialtyError } = await supabase
          .from('specialties')
          .select('id,name_pt')
          .in('id', specialtyIds)
          .eq('is_active', true)

        if (specialtyError) {
          Sentry.captureException(specialtyError, { tags: { area: 'admin_dashboard', query: 'specialties' } })
        }

        const specialtyById = new Map(
          (specialtyRows || []).map((row: { id: string; name_pt: string }) => [String(row.id), String(row.name_pt || '').trim()]),
        )

        const mapped = (linkRows || []).reduce((acc, row: { professional_id: string; specialty_id: string }) => {
          const pid = String(row.professional_id || '').trim()
          const name = specialtyById.get(String(row.specialty_id || '').trim()) || ''
          if (!pid || !name) return acc
          if (!acc[pid]) acc[pid] = []
          if (!acc[pid].includes(name)) {
            acc[pid].push(name)
          }
          return acc
        }, {} as Record<string, string[]>)

        Object.keys(mapped).forEach(pid => {
          mapped[pid].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
        })

        professionalSpecialties = mapped
      }
    }

    const { data: reviewsData, error: reviewsDataError } = await supabase
      .from('reviews')
      .select('*, profiles!reviews_user_id_fkey(full_name), professionals!reviews_professional_id_fkey(id, profiles!professionals_user_id_fkey(full_name))')
      .order('created_at', { ascending: false })

    if (reviewsDataError) {
      Sentry.captureException(reviewsDataError, { tags: { area: 'admin_dashboard', query: 'reviews_detail' } })
    }

    const { data: bookingsData, error: bookingsDataError } = await supabase
      .from('bookings')
      .select('id, scheduled_at, status, price_brl, duration_minutes, profiles!bookings_user_id_fkey(full_name, email), professionals!bookings_professional_id_fkey(profiles!professionals_user_id_fkey(full_name))')
      .order('scheduled_at', { ascending: false })
      .limit(50)

    if (bookingsDataError) {
      Sentry.captureException(bookingsDataError, { tags: { area: 'admin_dashboard', query: 'bookings_detail' } })
    }

    const mappedBookings = (bookingsData || []).map((b: Record<string, unknown>) => {
      const pro = b.professionals as Record<string, unknown> | null
      return {
        id: b.id as string,
        scheduled_at: b.scheduled_at as string,
        status: b.status as string,
        price_brl: b.price_brl as number,
        duration_minutes: b.duration_minutes as number,
        user_profile: (b.profiles as { full_name: string; email: string }) || { full_name: '-', email: '' },
        professional_profile: (pro?.profiles as { full_name: string }) || { full_name: '-' },
      }
    })

    return {
      success: true,
      data: {
        stats,
        professionals: resolvedProfessionals,
        professionalSpecialties,
        professionalCredentialCounts,
        professionalMinServicePrice,
        reviews: (reviewsData as unknown as AdminDashboardData['reviews']) || [],
        bookings: mappedBookings,
      },
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido.' }
  }
}

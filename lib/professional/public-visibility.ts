import type { SupabaseClient } from '@supabase/supabase-js'
import { type ProfessionalOnboardingEvaluation } from '@/lib/professional/onboarding-gates'
import { loadProfessionalOnboardingState } from '@/lib/professional/onboarding-state'

export type ProfessionalSearchProfile = {
  full_name?: string | null
  country?: string | null
  avatar_url?: string | null
}

export type ProfessionalSearchRecord = {
  id: string
  status?: string | null
  tier?: string | null
  first_booking_enabled?: boolean | null
  bio?: string | null
  category?: string | null
  subcategories?: string[] | null
  languages?: string[] | null
  years_experience?: number | null
  session_price_brl?: number | null
  session_duration_minutes?: number | null
  whatsapp_number?: string | null
  cover_photo_url?: string | null
  video_intro_url?: string | null
  social_links?: Record<string, string> | null
  profiles?: ProfessionalSearchProfile | null
}

type PublicVisibilityEvaluation = {
  canGoLive: boolean
  evaluation: ProfessionalOnboardingEvaluation
}

const VISIBILITY_CONCURRENCY = 8

function asId(value: unknown) {
  return String(value || '').trim()
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const normalizedLimit = Math.max(1, Math.min(limit, items.length || 1))
  const results: R[] = new Array(items.length)
  let nextIndex = 0

  async function worker() {
    while (true) {
      const currentIndex = nextIndex
      nextIndex += 1
      if (currentIndex >= items.length) return
      results[currentIndex] = await mapper(items[currentIndex])
    }
  }

  await Promise.all(Array.from({ length: normalizedLimit }, () => worker()))
  return results
}

export async function getPublicVisibilityByProfessionalId(
  supabase: SupabaseClient,
  professionals: ProfessionalSearchRecord[],
): Promise<Map<string, PublicVisibilityEvaluation>> {
  const results = new Map<string, PublicVisibilityEvaluation>()
  if (!professionals.length) return results

  const professionalIds = Array.from(
    new Set(
      professionals
        .map(professional => asId(professional.id))
        .filter(Boolean),
    ),
  )

  if (!professionalIds.length) return results

  await mapWithConcurrency(professionalIds, VISIBILITY_CONCURRENCY, async professionalId => {
    try {
      const onboardingState = await loadProfessionalOnboardingState(supabase, professionalId, {
        resolveSignedMediaUrls: false,
      })
      if (!onboardingState) return

      const evaluation = onboardingState.evaluation
      results.set(professionalId, {
        canGoLive: evaluation.summary.canGoLive,
        evaluation,
      })
    } catch {
      // Keep best-effort behavior for public listing and batch recompute.
    }
  })

  return results
}

export async function filterPubliclyVisibleProfessionals(
  supabase: SupabaseClient,
  professionals: ProfessionalSearchRecord[],
) {
  const visibilityByProfessionalId = await getPublicVisibilityByProfessionalId(supabase, professionals)
  return professionals.filter(professional =>
    visibilityByProfessionalId.get(asId(professional.id))?.canGoLive,
  )
}

export async function recomputeProfessionalVisibility(
  supabase: SupabaseClient,
  professionalId: string,
) {
  const normalizedProfessionalId = asId(professionalId)
  if (!normalizedProfessionalId) {
    return {
      ok: false as const,
      professionalId: normalizedProfessionalId,
      isPubliclyVisible: false,
      reason: 'invalid_professional_id',
    }
  }

  const onboardingState = await loadProfessionalOnboardingState(supabase, normalizedProfessionalId, {
    resolveSignedMediaUrls: false,
  })
  const isPubliclyVisible = Boolean(onboardingState?.evaluation.summary.canGoLive)
  const visibilityCheckedAt = new Date().toISOString()

  const { error } = await supabase
    .from('professionals')
    .update({
      is_publicly_visible: isPubliclyVisible,
      visibility_checked_at: visibilityCheckedAt,
    })
    .eq('id', normalizedProfessionalId)

  if (error) {
    return {
      ok: false as const,
      professionalId: normalizedProfessionalId,
      isPubliclyVisible,
      reason: error.message || 'update_failed',
    }
  }

  return {
    ok: true as const,
    professionalId: normalizedProfessionalId,
    isPubliclyVisible,
    visibilityCheckedAt,
  }
}

export async function recomputeApprovedProfessionalsVisibility(
  supabase: SupabaseClient,
  options?: {
    limit?: number
    offset?: number
  },
) {
  const limit = Math.max(1, Math.min(options?.limit || 500, 5000))
  const offset = Math.max(0, options?.offset || 0)

  const { data: rows, error } = await supabase
    .from('professionals')
    .select('id')
    .eq('status', 'approved')
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return {
      ok: false as const,
      total: 0,
      updated: 0,
      failed: 0,
      failures: [error.message || 'load_professionals_failed'],
    }
  }

  const visibilityByProfessionalId = await getPublicVisibilityByProfessionalId(
    supabase,
    (rows || []) as ProfessionalSearchRecord[],
  )

  let updated = 0
  let failed = 0
  const failures: string[] = []
  const visibilityCheckedAt = new Date().toISOString()

  for (const row of rows || []) {
    const professionalId = asId(row.id)
    const isPubliclyVisible = Boolean(visibilityByProfessionalId.get(professionalId)?.canGoLive)
    const { error: updateError } = await supabase
      .from('professionals')
      .update({
        is_publicly_visible: isPubliclyVisible,
        visibility_checked_at: visibilityCheckedAt,
      })
      .eq('id', professionalId)

    if (updateError) {
      failed += 1
      failures.push(`${professionalId}:${updateError.message || 'update_failed'}`)
      continue
    }

    updated += 1
  }

  return {
    ok: failed === 0,
    total: rows?.length || 0,
    updated,
    failed,
    failures,
  }
}

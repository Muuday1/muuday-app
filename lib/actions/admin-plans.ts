'use server'

import { createClient } from '@/lib/supabase/server'
import { loadPlanConfigMap, type PlanConfigMap } from '@/lib/plan-config'
import type { TierFeature } from '@/lib/tier-config'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: 'Não autenticado.' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return { ok: false as const, error: 'Acesso restrito ao admin.' }
  }

  return { ok: true as const, supabase, userId: user.id }
}

const ALLOWED_FEATURES = new Set<TierFeature>([
  'manual_accept',
  'auto_accept',
  'video_intro',
  'whatsapp_profile',
  'social_links',
  'extended_bio',
  'outlook_sync',
  'whatsapp_notifications',
  'promotions',
  'csv_export',
  'pdf_export',
  'cover_photo',
])

export async function loadPlanConfigs() {
  const adminCheck = await requireAdmin()
  if (!adminCheck.ok) {
    return { ok: false as const, error: adminCheck.error }
  }

  const plans = await loadPlanConfigMap()
  return { ok: true as const, plans }
}

export async function savePlanConfigs(plans: PlanConfigMap) {
  const adminCheck = await requireAdmin()
  if (!adminCheck.ok) {
    return { ok: false as const, error: adminCheck.error }
  }

  const nowIso = new Date().toISOString()
  const rows = (['basic', 'professional', 'premium'] as const).map(tier => {
    const plan = plans[tier]
    const nextFeatures = Array.from(
      new Set(
        (plan.features || [])
          .map(item => String(item || '').trim())
          .filter((item): item is TierFeature => ALLOWED_FEATURES.has(item as TierFeature)),
      ),
    )

    return {
      tier,
      specialties_limit: Math.max(0, Math.floor(plan.limits.specialties)),
      tags_limit: Math.max(0, Math.floor(plan.limits.tags)),
      services_limit: Math.max(0, Math.floor(plan.limits.services)),
      service_options_per_service_limit: Math.max(0, Math.floor(plan.limits.serviceOptionsPerService)),
      booking_window_days_limit: Math.max(1, Math.floor(plan.limits.bookingWindowDays)),
      min_notice_hours_min: Math.max(0, Math.floor(plan.minNoticeRange.min)),
      min_notice_hours_max: Math.max(
        Math.max(0, Math.floor(plan.minNoticeRange.min)),
        Math.floor(plan.minNoticeRange.max),
      ),
      buffer_configurable: Boolean(plan.bufferConfig.configurable),
      buffer_default_minutes: Math.max(0, Math.floor(plan.bufferConfig.defaultMinutes)),
      buffer_max_minutes: Math.max(
        Math.max(0, Math.floor(plan.bufferConfig.defaultMinutes)),
        Math.floor(plan.bufferConfig.maxMinutes),
      ),
      social_links_limit: Math.max(0, Math.floor(plan.socialLinksLimit)),
      extended_bio_limit: Math.max(0, Math.floor(plan.extendedBioLimit)),
      features: nextFeatures,
      updated_at: nowIso,
      updated_by: adminCheck.userId,
    }
  })

  const { error } = await adminCheck.supabase.from('plan_configs').upsert(rows, { onConflict: 'tier' })

  if (error) {
    return { ok: false as const, error: 'Não foi possível salvar as configurações.' }
  }

  return { ok: true as const }
}

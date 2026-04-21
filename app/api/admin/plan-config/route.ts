import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  getDefaultPlanConfigMap,
  loadPlanConfigMap,
  type PlanConfig,
  type PlanConfigMap,
} from '@/lib/plan-config'
import type { TierFeature } from '@/lib/tier-config'

const tierEnum = z.enum(['basic', 'professional', 'premium'])

const planSchema = z.object({
  limits: z.object({
    specialties: z.number().int().min(0),
    tags: z.number().int().min(0),
    services: z.number().int().min(0),
    serviceOptionsPerService: z.number().int().min(0),
    bookingWindowDays: z.number().int().min(1),
  }),
  minNoticeRange: z
    .object({
      min: z.number().int().min(0),
      max: z.number().int().min(0),
    })
    .refine(value => value.max >= value.min, {
      message: 'Faixa de antecedência inválida.',
      path: ['max'],
    }),
  bufferConfig: z
    .object({
      configurable: z.boolean(),
      defaultMinutes: z.number().int().min(0),
      maxMinutes: z.number().int().min(0),
    })
    .refine(value => value.maxMinutes >= value.defaultMinutes, {
      message: 'Buffer máximo não pode ser menor que o padrão.',
      path: ['maxMinutes'],
    }),
  socialLinksLimit: z.number().int().min(0),
  extendedBioLimit: z.number().int().min(0),
  features: z.array(z.string().trim().min(1)).max(30),
})

const payloadSchema = z.object({
  plans: z.object({
    basic: planSchema,
    professional: planSchema,
    premium: planSchema,
  }),
})

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, status: 401, error: 'Não autenticado.' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return { ok: false as const, status: 403, error: 'Acesso restrito ao admin.' }
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

function sanitizePlanConfigInput(plans: z.infer<typeof payloadSchema>['plans']): PlanConfigMap {
  const defaults = getDefaultPlanConfigMap()
  const normalized: PlanConfigMap = { ...defaults }

  ;(['basic', 'professional', 'premium'] as const).forEach(tier => {
    const source = plans[tier]
    const nextFeatures = Array.from(
      new Set(
        (source.features || [])
          .map(item => String(item || '').trim())
          .filter((item): item is TierFeature => ALLOWED_FEATURES.has(item as TierFeature)),
      ),
    )
    const normalizedPlan: PlanConfig = {
      tier,
      limits: {
        specialties: Math.max(0, Math.floor(source.limits.specialties)),
        tags: Math.max(0, Math.floor(source.limits.tags)),
        services: Math.max(0, Math.floor(source.limits.services)),
        serviceOptionsPerService: Math.max(0, Math.floor(source.limits.serviceOptionsPerService)),
        bookingWindowDays: Math.max(1, Math.floor(source.limits.bookingWindowDays)),
      },
      minNoticeRange: {
        min: Math.max(0, Math.floor(source.minNoticeRange.min)),
        max: Math.max(
          Math.max(0, Math.floor(source.minNoticeRange.min)),
          Math.floor(source.minNoticeRange.max),
        ),
      },
      bufferConfig: {
        configurable: Boolean(source.bufferConfig.configurable),
        defaultMinutes: Math.max(0, Math.floor(source.bufferConfig.defaultMinutes)),
        maxMinutes: Math.max(
          Math.max(0, Math.floor(source.bufferConfig.defaultMinutes)),
          Math.floor(source.bufferConfig.maxMinutes),
        ),
      },
      socialLinksLimit: Math.max(0, Math.floor(source.socialLinksLimit)),
      extendedBioLimit: Math.max(0, Math.floor(source.extendedBioLimit)),
      features: nextFeatures,
    }
    normalized[tier] = normalizedPlan
  })

  return normalized
}

export async function GET() {
  const adminCheck = await requireAdmin()
  if (!adminCheck.ok) {
    return NextResponse.json({ ok: false, error: adminCheck.error }, { status: adminCheck.status })
  }

  const plans = await loadPlanConfigMap()
  return NextResponse.json({ ok: true, plans })
}

export async function PUT(request: Request) {
  const adminCheck = await requireAdmin()
  if (!adminCheck.ok) {
    return NextResponse.json({ ok: false, error: adminCheck.error }, { status: adminCheck.status })
  }

  const json = await request.json().catch(() => null)
  const parsed = payloadSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message || 'Payload inválido.' },
      { status: 400 },
    )
  }

  const plans = sanitizePlanConfigInput(parsed.data.plans)
  const nowIso = new Date().toISOString()

  const rows = (Object.keys(plans) as Array<z.infer<typeof tierEnum>>).map(tier => ({
    tier,
    specialties_limit: plans[tier].limits.specialties,
    tags_limit: plans[tier].limits.tags,
    services_limit: plans[tier].limits.services,
    service_options_per_service_limit: plans[tier].limits.serviceOptionsPerService,
    booking_window_days_limit: plans[tier].limits.bookingWindowDays,
    min_notice_hours_min: plans[tier].minNoticeRange.min,
    min_notice_hours_max: plans[tier].minNoticeRange.max,
    buffer_configurable: plans[tier].bufferConfig.configurable,
    buffer_default_minutes: plans[tier].bufferConfig.defaultMinutes,
    buffer_max_minutes: plans[tier].bufferConfig.maxMinutes,
    social_links_limit: plans[tier].socialLinksLimit,
    extended_bio_limit: plans[tier].extendedBioLimit,
    features: plans[tier].features,
    updated_at: nowIso,
    updated_by: adminCheck.userId,
  }))

  const { error } = await adminCheck.supabase
    .from('plan_configs')
    .upsert(rows, { onConflict: 'tier' })

  if (error) {
    return NextResponse.json({ ok: false, error: 'Não foi possível salvar as configurações.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

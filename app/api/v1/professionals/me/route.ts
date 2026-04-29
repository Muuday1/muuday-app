import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { validateApiCsrf } from '@/lib/http/csrf'
import {
  createOrUpdateProfessionalProfile,
  saveProfessionalProfileDraft,
} from '@/lib/professional/professional-profile-service'

export async function POST(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'professional', message: 'POST /api/v1/professionals/me started', level: 'info' })

  const csrfCheck = validateApiCsrf(request)
  if (!csrfCheck.ok) {
    return NextResponse.json({ error: csrfCheck.error }, { status: 403 })
  }

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1ProfessionalProfile', `api-v1-professional-profile:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  const supabase = await createApiClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify the user has the professional role before allowing profile creation/update.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile || profile.role !== 'profissional') {
    return NextResponse.json({ error: 'Acesso negado. Apenas profissionais podem executar esta ação.' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const result = await createOrUpdateProfessionalProfile(supabase, user.id, {
    bio: String(body.bio || ''),
    category: String(body.category || ''),
    tags: String(body.tags || ''),
    languages: String(body.languages || ''),
    years_experience: String(body.years_experience || '0'),
    session_price_brl: String(body.session_price_brl || '0'),
    session_duration_minutes: String(body.session_duration_minutes || '60'),
  })

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, professionalId: result.professionalId }, { status: 201 })
}

export async function PUT(request: NextRequest) {
  return POST(request)
}

export async function PATCH(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'professional', message: 'PATCH /api/v1/professionals/me started', level: 'info' })

  const csrfCheck = validateApiCsrf(request)
  if (!csrfCheck.ok) {
    return NextResponse.json({ error: csrfCheck.error }, { status: 403 })
  }

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1ProfessionalProfile', `api-v1-professional-profile:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  const supabase = await createApiClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify the user has the professional role before allowing profile draft updates.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile || profile.role !== 'profissional') {
    return NextResponse.json({ error: 'Acesso negado. Apenas profissionais podem executar esta ação.' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const result = await saveProfessionalProfileDraft(supabase, user.id, {
    professionalId: String(body.professionalId || ''),
    category: String(body.category || ''),
    bio: String(body.bio || ''),
    tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
    languages: Array.isArray(body.languages) ? body.languages.map(String) : [],
    yearsExperience: Number(body.yearsExperience || 0),
    sessionPriceBrl: Number(body.sessionPriceBrl || 0),
    sessionDurationMinutes: Number(body.sessionDurationMinutes || 60),
    whatsappNumber: body.whatsappNumber !== undefined ? String(body.whatsappNumber) : undefined,
    coverPhotoUrl: body.coverPhotoUrl !== undefined ? String(body.coverPhotoUrl) : undefined,
    videoIntroUrl: body.videoIntroUrl !== undefined ? String(body.videoIntroUrl) : undefined,
    socialLinks: Array.isArray(body.socialLinks) ? body.socialLinks.map(String) : undefined,
    credentialUrls: Array.isArray(body.credentialUrls) ? body.credentialUrls.map(String) : undefined,
  })

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}

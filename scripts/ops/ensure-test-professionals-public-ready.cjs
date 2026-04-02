#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')
const { createClient } = require('@supabase/supabase-js')

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const index = line.indexOf('=')
    if (index <= 0) continue
    const key = line.slice(0, index).trim()
    const value = line.slice(index + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}

function getArgValue(flagName) {
  const exact = process.argv.find(arg => arg.startsWith(`${flagName}=`))
  if (exact) return exact.slice(flagName.length + 1)
  const index = process.argv.findIndex(arg => arg === flagName)
  if (index >= 0) return process.argv[index + 1]
  return undefined
}

function normalizeKey(key) {
  if (!key) return ''
  let normalized = String(key).trim()
  if (normalized.startsWith('"') && normalized.endsWith('"') && normalized.length >= 2) {
    normalized = normalized.slice(1, -1)
  }
  return normalized.replace(/\s+/g, '')
}

function isServiceRoleLikeKey(key) {
  if (!key) return false
  if (key.startsWith('sb_secret_')) return true
  if (key.startsWith('sb_publishable_') || key.startsWith('sb_anon_')) return false

  const parts = key.split('.')
  if (parts.length !== 3) return false
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
    return payload?.role === 'service_role'
  } catch {
    return false
  }
}

function parseListArg(value) {
  if (!value) return []
  return String(value)
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function normalizeText(value, fallback = '') {
  const normalized = String(value || '').trim()
  return normalized || fallback
}

async function resolveProfessionalIdByEmail(supabase, email) {
  const normalizedEmail = normalizeText(email).toLowerCase()
  if (!normalizedEmail) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (!profile?.id) return null

  const { data: professional } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return professional?.id ? String(professional.id) : null
}

async function ensureProfessionalReadyForPublicSearch(
  supabase,
  professionalId,
  { confirmationMode, firstBookingEnabled },
) {
  const { data: professional } = await supabase
    .from('professionals')
    .select('id,user_id,status,tier,bio,category,subcategories,tags,languages,years_experience,session_price_brl,session_duration_minutes')
    .eq('id', professionalId)
    .maybeSingle()

  if (!professional?.id) {
    return { professionalId, updated: false, reason: 'professional-not-found' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id,full_name,email,country,timezone,avatar_url')
    .eq('id', String(professional.user_id))
    .maybeSingle()

  const fallbackAvatar = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
    normalizeText(profile?.full_name, professionalId),
  )}`

  await supabase
    .from('profiles')
    .update({
      avatar_url: normalizeText(profile?.avatar_url, fallbackAvatar),
      country: normalizeText(profile?.country, 'BR'),
      timezone: normalizeText(profile?.timezone, 'America/Sao_Paulo'),
    })
    .eq('id', String(professional.user_id))

  const normalizedCategory = normalizeText(professional.category, 'carreira-negocios-desenvolvimento-profissional')
  const normalizedSubcategories = Array.isArray(professional.subcategories)
    ? professional.subcategories.filter(Boolean)
    : []
  const normalizedLanguages = Array.isArray(professional.languages)
    ? professional.languages.filter(Boolean)
    : []
  const normalizedTags = Array.isArray(professional.tags) ? professional.tags.filter(Boolean) : []

  await supabase
    .from('professionals')
    .update({
      status: 'approved',
      first_booking_enabled: firstBookingEnabled,
      tier: normalizeText(professional.tier, 'professional'),
      bio: normalizeText(
        professional.bio,
        'Profissional validado para ambiente de testes da Muuday.',
      ),
      category: normalizedCategory,
      subcategories: normalizedSubcategories.length > 0 ? normalizedSubcategories : ['Mentoria'],
      tags: normalizedTags.length > 0 ? normalizedTags : ['Foco de atuação'],
      languages: normalizedLanguages.length > 0 ? normalizedLanguages : ['Português'],
      years_experience: Math.max(Number(professional.years_experience || 0), 1),
      session_price_brl: Math.max(Number(professional.session_price_brl || 0), 120),
      session_duration_minutes: Math.max(Number(professional.session_duration_minutes || 0), 60),
    })
    .eq('id', professionalId)

  await supabase.from('professional_settings').upsert(
    {
      professional_id: professionalId,
      timezone: normalizeText(profile?.timezone, 'America/Sao_Paulo'),
      session_duration_minutes: Math.max(Number(professional.session_duration_minutes || 0), 60),
      buffer_minutes: 15,
      minimum_notice_hours: 12,
      max_booking_window_days: 30,
      enable_recurring: false,
      confirmation_mode: confirmationMode,
      cancellation_policy_code: 'moderate',
      require_session_purpose: false,
      billing_card_on_file: true,
      payout_onboarding_started: true,
      payout_kyc_completed: true,
    },
    { onConflict: 'professional_id' },
  )

  const { count: serviceCount } = await supabase
    .from('professional_services')
    .select('id', { head: true, count: 'exact' })
    .eq('professional_id', professionalId)
    .eq('is_active', true)

  if ((serviceCount || 0) === 0) {
    await supabase.from('professional_services').insert({
      professional_id: professionalId,
      name: 'Sessão de teste validada',
      service_type: 'one_off',
      description: 'Serviço de teste para validação da jornada pública.',
      duration_minutes: Math.max(Number(professional.session_duration_minutes || 0), 60),
      price_brl: Math.max(Number(professional.session_price_brl || 0), 120),
      enable_recurring: false,
      enable_monthly: false,
      is_active: true,
      is_draft: false,
    })
  }

  const { count: availabilityRuleCount } = await supabase
    .from('availability_rules')
    .select('id', { head: true, count: 'exact' })
    .eq('professional_id', professionalId)
    .eq('is_active', true)

  if ((availabilityRuleCount || 0) === 0) {
    await supabase.from('availability_rules').insert({
      professional_id: professionalId,
      weekday: 1,
      start_time_local: '09:00',
      end_time_local: '17:00',
      timezone: normalizeText(profile?.timezone, 'America/Sao_Paulo'),
      is_active: true,
    })
  }

  const { count: availabilityLegacyCount } = await supabase
    .from('availability')
    .select('id', { head: true, count: 'exact' })
    .eq('professional_id', professionalId)
    .eq('is_active', true)

  if ((availabilityLegacyCount || 0) === 0) {
    await supabase.from('availability').insert({
      professional_id: professionalId,
      day_of_week: 1,
      start_time: '09:00',
      end_time: '17:00',
      is_active: true,
    })
  }

  return { professionalId, updated: true, reason: 'ready' }
}

async function main() {
  const root = process.cwd()
  loadEnvFile(path.join(root, '.env.local'))
  loadEnvFile(path.join(root, '.env'))

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = normalizeKey(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY,
  )

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL.')
  }
  if (!serviceRoleKey || !isServiceRoleLikeKey(serviceRoleKey)) {
    throw new Error(
      'Missing valid service role key. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY (service role).',
    )
  }

  const argIds = parseListArg(getArgValue('--ids'))
  const argEmails = parseListArg(getArgValue('--emails'))

  const envIds = [
    normalizeText(process.env.E2E_PROFESSIONAL_ID),
    normalizeText(process.env.E2E_MANUAL_PROFESSIONAL_ID),
    normalizeText(process.env.E2E_BLOCKED_PROFESSIONAL_ID),
  ].filter(Boolean)

  const envEmails = [
    normalizeText(process.env.E2E_PROFESSIONAL_EMAIL),
    normalizeText(process.env.E2E_USER_EMAIL),
  ].filter(Boolean)

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const resolvedIds = new Set([...argIds, ...envIds])
  for (const email of [...argEmails, ...envEmails]) {
    const resolved = await resolveProfessionalIdByEmail(supabase, email)
    if (resolved) resolvedIds.add(resolved)
  }

  if (resolvedIds.size === 0) {
    throw new Error(
      'No professional fixture IDs found. Set E2E_PROFESSIONAL_ID/E2E_MANUAL_PROFESSIONAL_ID/E2E_BLOCKED_PROFESSIONAL_ID or pass --ids.',
    )
  }

  const manualId = normalizeText(process.env.E2E_MANUAL_PROFESSIONAL_ID)
  const blockedId = normalizeText(process.env.E2E_BLOCKED_PROFESSIONAL_ID)
  const summary = []
  for (const professionalId of resolvedIds) {
    const isManualFixture = professionalId === manualId
    const isBlockedFixture = professionalId === blockedId
    const confirmationMode = isManualFixture ? 'manual' : 'auto_accept'
    const firstBookingEnabled = !isBlockedFixture
    const result = await ensureProfessionalReadyForPublicSearch(
      supabase,
      professionalId,
      { confirmationMode, firstBookingEnabled },
    )
    summary.push(result)
  }

  console.log('[fixtures] Professional visibility sync summary:')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch(error => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[fixtures] Failed: ${message}`)
  process.exitCode = 1
})

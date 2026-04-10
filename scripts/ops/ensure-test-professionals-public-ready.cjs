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

function exportCiVariable(name, value) {
  const normalizedValue = normalizeText(value)
  if (!normalizedValue) return

  if (process.env.GITHUB_ENV) {
    fs.appendFileSync(process.env.GITHUB_ENV, `${name}=${normalizedValue}\n`)
  }

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name.toLowerCase()}=${normalizedValue}\n`)
  }
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

async function listProfessionalCandidateIds(supabase) {
  const { data, error } = await supabase
    .from('professionals')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    throw new Error(`Failed to list professionals: ${error.message}`)
  }

  return (data || []).map(row => String(row.id)).filter(Boolean)
}

function pickDistinctFixtureId({ label, preferredId, requestedIds, candidateIds, usedIds }) {
  const preferred = normalizeText(preferredId)
  if (preferred && !usedIds.has(preferred)) {
    if (candidateIds.includes(preferred)) {
      usedIds.add(preferred)
      return preferred
    }
    console.warn(`[fixtures] WARN: ${label} preferred id not found: ${preferred}`)
  }

  for (const id of requestedIds) {
    if (!usedIds.has(id)) {
      usedIds.add(id)
      return id
    }
  }

  for (const id of candidateIds) {
    if (!usedIds.has(id)) {
      usedIds.add(id)
      return id
    }
  }

  throw new Error(
    `Unable to resolve distinct fixture for ${label}. Need at least 3 professionals available for open/manual/blocked fixtures.`,
  )
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

  const normalizedCategory = normalizeText(
    professional.category,
    'carreira-negocios-desenvolvimento-profissional',
  )
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
      bio: normalizeText(professional.bio, 'Professional fixture validated for CI public journeys.'),
      category: normalizedCategory,
      subcategories: normalizedSubcategories.length > 0 ? normalizedSubcategories : ['Mentoria'],
      tags: normalizedTags.length > 0 ? normalizedTags : ['Foco de atuacao'],
      languages: normalizedLanguages.length > 0 ? normalizedLanguages : ['Portugues'],
      years_experience: Math.max(Number(professional.years_experience || 0), 1),
      session_price_brl: Math.max(Number(professional.session_price_brl || 0), 120),
      session_duration_minutes: Math.max(Number(professional.session_duration_minutes || 0), 60),
    })
    .eq('id', professionalId)

  const defaultDisplayName = normalizeText(
    profile?.full_name,
    `Profissional ${String(professionalId).slice(0, 8)}`,
  )
  await supabase.from('professional_applications').upsert(
    {
      user_id: String(professional.user_id),
      professional_id: professionalId,
      display_name: defaultDisplayName,
      headline: normalizeText(
        professional.bio,
        'Profissional validado para jornada publica de testes.',
      ),
      category: normalizedCategory,
      specialty_name:
        normalizedSubcategories.length > 0
          ? String(normalizedSubcategories[0])
          : 'Mentoria',
      specialty_custom: false,
      specialty_validation_message: null,
      focus_areas: normalizedTags.length > 0 ? normalizedTags : ['Foco de atuacao'],
      primary_language:
        normalizedLanguages.length > 0 ? String(normalizedLanguages[0]) : 'Portugues',
      secondary_languages:
        normalizedLanguages.length > 1 ? normalizedLanguages.slice(1) : [],
      years_experience: Math.max(Number(professional.years_experience || 0), 1),
      session_price_brl: Math.max(Number(professional.session_price_brl || 0), 120),
      session_duration_minutes: Math.max(Number(professional.session_duration_minutes || 0), 60),
      qualification_file_names: [],
      qualification_note: null,
      status: 'approved',
    },
    { onConflict: 'user_id' },
  )

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
      cancellation_policy_accepted: true,
      terms_accepted_at: new Date().toISOString(),
      terms_version: 'wave2-e2e-fixture',
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
      name: 'Sessao de teste validada',
      service_type: 'one_off',
      description: 'Servico de teste para validacao da jornada publica.',
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

  return { professionalId, updated: true, reason: 'ready', confirmationMode, firstBookingEnabled }
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

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const candidateIds = await listProfessionalCandidateIds(supabase)
  if (candidateIds.length === 0) {
    throw new Error('No professionals found in database. Cannot auto-heal fixtures.')
  }

  const resolvedFromEmails = []
  const envEmails = [
    normalizeText(process.env.E2E_PROFESSIONAL_EMAIL),
    normalizeText(process.env.E2E_USER_EMAIL),
  ].filter(Boolean)

  for (const email of [...argEmails, ...envEmails]) {
    const resolved = await resolveProfessionalIdByEmail(supabase, email)
    if (resolved) {
      resolvedFromEmails.push(resolved)
    } else {
      console.warn(`[fixtures] WARN: no professional found for email ${email}`)
    }
  }

  const requestedIds = [
    ...argIds,
    normalizeText(process.env.E2E_PROFESSIONAL_ID),
    normalizeText(process.env.E2E_MANUAL_PROFESSIONAL_ID),
    normalizeText(process.env.E2E_BLOCKED_PROFESSIONAL_ID),
    ...resolvedFromEmails,
  ].filter(Boolean)

  const requestedUniqueExistingIds = []
  for (const id of requestedIds) {
    if (!candidateIds.includes(id)) {
      console.warn(`[fixtures] WARN: requested fixture id not found: ${id}`)
      continue
    }
    if (!requestedUniqueExistingIds.includes(id)) {
      requestedUniqueExistingIds.push(id)
    }
  }

  const usedIds = new Set()
  const openFixtureId = pickDistinctFixtureId({
    label: 'E2E_PROFESSIONAL_ID',
    preferredId: process.env.E2E_PROFESSIONAL_ID,
    requestedIds: requestedUniqueExistingIds,
    candidateIds,
    usedIds,
  })

  const manualFixtureId = pickDistinctFixtureId({
    label: 'E2E_MANUAL_PROFESSIONAL_ID',
    preferredId: process.env.E2E_MANUAL_PROFESSIONAL_ID,
    requestedIds: requestedUniqueExistingIds,
    candidateIds,
    usedIds,
  })

  const blockedFixtureId = pickDistinctFixtureId({
    label: 'E2E_BLOCKED_PROFESSIONAL_ID',
    preferredId: process.env.E2E_BLOCKED_PROFESSIONAL_ID,
    requestedIds: requestedUniqueExistingIds,
    candidateIds,
    usedIds,
  })

  const fixturePlan = [
    {
      fixture: 'open',
      professionalId: openFixtureId,
      confirmationMode: 'auto_accept',
      firstBookingEnabled: true,
    },
    {
      fixture: 'manual',
      professionalId: manualFixtureId,
      confirmationMode: 'manual',
      firstBookingEnabled: true,
    },
    {
      fixture: 'blocked',
      professionalId: blockedFixtureId,
      confirmationMode: 'auto_accept',
      firstBookingEnabled: false,
    },
  ]

  const summary = []
  for (const entry of fixturePlan) {
    const result = await ensureProfessionalReadyForPublicSearch(supabase, entry.professionalId, {
      confirmationMode: entry.confirmationMode,
      firstBookingEnabled: entry.firstBookingEnabled,
    })
    summary.push({ fixture: entry.fixture, ...result })
  }

  exportCiVariable('E2E_PROFESSIONAL_ID', openFixtureId)
  exportCiVariable('E2E_MANUAL_PROFESSIONAL_ID', manualFixtureId)
  exportCiVariable('E2E_BLOCKED_PROFESSIONAL_ID', blockedFixtureId)

  console.log('[fixtures] Resolved fixture IDs:')
  console.log(
    JSON.stringify(
      {
        E2E_PROFESSIONAL_ID: openFixtureId,
        E2E_MANUAL_PROFESSIONAL_ID: manualFixtureId,
        E2E_BLOCKED_PROFESSIONAL_ID: blockedFixtureId,
      },
      null,
      2,
    ),
  )

  console.log('[fixtures] Professional visibility sync summary:')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch(error => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[fixtures] Failed: ${message}`)
  process.exitCode = 1
})

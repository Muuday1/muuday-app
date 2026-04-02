#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')
const { createClient } = require('@supabase/supabase-js')

const ALLOWED_ROLES = new Set(['usuario', 'profissional', 'admin'])

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

function normalizeKey(key) {
  if (!key) return ''
  let normalized = String(key).trim()
  if (normalized.startsWith('"') && normalized.endsWith('"') && normalized.length >= 2) {
    normalized = normalized.slice(1, -1)
  }
  return normalized.replace(/\s+/g, '')
}

function normalizeRole(value) {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  return ALLOWED_ROLES.has(normalized) ? normalized : null
}

function getArgValue(flagName) {
  const exact = process.argv.find(arg => arg.startsWith(`${flagName}=`))
  if (exact) return exact.slice(flagName.length + 1)
  const index = process.argv.findIndex(arg => arg === flagName)
  if (index >= 0) return process.argv[index + 1]
  return undefined
}

function asPercent(count, total) {
  if (!total) return '0.00'
  return ((count / total) * 100).toFixed(2)
}

async function main() {
  const root = process.cwd()
  loadEnvFile(path.join(root, '.env.local'))
  loadEnvFile(path.join(root, '.env'))

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = normalizeKey(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY,
  )
  const limitArg = Number(getArgValue('--limit') || 5000)
  const sampleLimit = Number(getArgValue('--sample-limit') || 25)

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  const users = []
  let page = 1
  const pageSize = 200

  while (users.length < limitArg) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: pageSize })
    if (error) throw new Error(`Failed to list users page ${page}: ${error.message}`)
    const pageUsers = data?.users || []
    if (pageUsers.length === 0) break
    users.push(...pageUsers)
    if (pageUsers.length < pageSize) break
    page += 1
  }

  if (users.length === 0) {
    console.log('No users found.')
    return
  }

  const userIds = users.map(user => user.id)
  const profileRolesById = new Map()
  for (let i = 0; i < userIds.length; i += 500) {
    const chunk = userIds.slice(i, i + 500)
    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('id, role')
      .in('id', chunk)

    if (profilesError) throw new Error(`Failed to load profiles: ${profilesError.message}`)

    for (const profile of profiles || []) {
      profileRolesById.set(profile.id, normalizeRole(profile.role))
    }
  }

  let claimValid = 0
  let claimMissing = 0
  let claimInvalid = 0
  let profilePresent = 0
  let profileMissing = 0
  let claimMatchesProfile = 0
  let claimMismatchProfile = 0
  let fallbackNeeded = 0

  const missingClaimSample = []
  const invalidClaimSample = []
  const mismatchSample = []

  for (const user of users) {
    const claimRaw = user.app_metadata?.role ?? user.raw_app_meta_data?.role
    const claimRole = normalizeRole(claimRaw)
    const profileRole = profileRolesById.get(user.id) || null

    if (profileRole) profilePresent += 1
    else profileMissing += 1

    if (claimRole) claimValid += 1
    else if (claimRaw === undefined || claimRaw === null || String(claimRaw).trim() === '') {
      claimMissing += 1
      if (missingClaimSample.length < sampleLimit) {
        missingClaimSample.push({
          user_id: user.id,
          email: user.email || null,
          profile_role: profileRole,
        })
      }
    } else {
      claimInvalid += 1
      if (invalidClaimSample.length < sampleLimit) {
        invalidClaimSample.push({
          user_id: user.id,
          email: user.email || null,
          claim_role_raw: claimRaw,
          profile_role: profileRole,
        })
      }
    }

    if (!claimRole) fallbackNeeded += 1

    if (claimRole && profileRole) {
      if (claimRole === profileRole) claimMatchesProfile += 1
      else {
        claimMismatchProfile += 1
        if (mismatchSample.length < sampleLimit) {
          mismatchSample.push({
            user_id: user.id,
            email: user.email || null,
            claim_role: claimRole,
            profile_role: profileRole,
          })
        }
      }
    }
  }

  const total = users.length
  const report = {
    generated_at_utc: new Date().toISOString(),
    total_users_scanned: total,
    claim_coverage: {
      valid_claim_count: claimValid,
      valid_claim_percent: asPercent(claimValid, total),
      missing_claim_count: claimMissing,
      missing_claim_percent: asPercent(claimMissing, total),
      invalid_claim_count: claimInvalid,
      invalid_claim_percent: asPercent(claimInvalid, total),
    },
    profile_coverage: {
      profile_present_count: profilePresent,
      profile_present_percent: asPercent(profilePresent, total),
      profile_missing_count: profileMissing,
      profile_missing_percent: asPercent(profileMissing, total),
    },
    consistency: {
      claim_matches_profile_count: claimMatchesProfile,
      claim_matches_profile_percent: asPercent(claimMatchesProfile, total),
      claim_mismatch_profile_count: claimMismatchProfile,
      claim_mismatch_profile_percent: asPercent(claimMismatchProfile, total),
    },
    middleware_fallback_estimate: {
      fallback_needed_count: fallbackNeeded,
      fallback_needed_percent: asPercent(fallbackNeeded, total),
      rule: 'Fallback needed when claim role is missing/invalid.',
    },
    samples: {
      missing_claim: missingClaimSample,
      invalid_claim: invalidClaimSample,
      mismatch_claim_vs_profile: mismatchSample,
    },
  }

  console.log(JSON.stringify(report, null, 2))
}

main().catch(error => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[audit-role-claim-coverage] Failed: ${message}`)
  process.exitCode = 1
})

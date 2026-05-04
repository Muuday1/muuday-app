#!/usr/bin/env node
/**
 * Sync .env.local keys to Vercel project env vars.
 *
 * Reads the local .env.local file and creates any missing keys in Vercel.
 * Existing keys are NOT overwritten unless --force is passed.
 *
 * SAFETY:
 * - Default target is 'development', NOT 'production'.
 * - A blocklist prevents local-only / test secrets from being synced.
 * - '--confirm-production' is required when target is 'production'.
 * - API errors are redacted so secret values never appear in logs.
 *
 * Required env (auto-loaded from .env.local and .vercel/project.json):
 *   VERCEL_TOKEN (or VERCEL_API_TOKEN)
 *   VERCEL_PROJECT_ID
 *   VERCEL_TEAM_ID (optional)
 */

const fs = require('fs')
const path = require('path')

// Auto-load local env so this can be run without manual exports
try {
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') })
} catch { /* ignore */ }

if (!process.env.VERCEL_TOKEN && process.env.VERCEL_API_TOKEN) {
  process.env.VERCEL_TOKEN = process.env.VERCEL_API_TOKEN
}

const vercelMetaPath = path.resolve(process.cwd(), '.vercel', 'project.json')
if (fs.existsSync(vercelMetaPath)) {
  const meta = JSON.parse(fs.readFileSync(vercelMetaPath, 'utf8'))
  if (!process.env.VERCEL_PROJECT_ID && meta.projectId) process.env.VERCEL_PROJECT_ID = meta.projectId
  if (!process.env.VERCEL_TEAM_ID && meta.orgId) process.env.VERCEL_TEAM_ID = meta.orgId
}

// ─── Safety blocklist ────────────────────────────────────────────────────────
// These keys are local-only and must NEVER be synced to Vercel.
const BLOCKLIST = new Set([
  // E2E / test credentials
  'E2E_USER_EMAIL', 'E2E_USER_PASSWORD', 'E2E_PROFESSIONAL_EMAIL', 'E2E_PROFESSIONAL_PASSWORD',
  'E2E_ADMIN_EMAIL', 'E2E_ADMIN_PASSWORD', 'RLS_A_EMAIL', 'RLS_A_PASSWORD', 'RLS_B_EMAIL', 'RLS_B_PASSWORD',
  // Test / local dev keys
  'KIMI_API_KEY', 'OPENROUTER_API_KEY',
  // Local-only Supabase test data
  'RLS_SAMPLE_BOOKING_ID', 'RLS_SAMPLE_PAYMENT_ID', 'RLS_SAMPLE_HIDDEN_REVIEW_ID', 'RLS_SAMPLE_MESSAGE_ID',
  'E2E_BLOCKED_PROFESSIONAL_ID', 'E2E_MANUAL_PROFESSIONAL_ID', 'E2E_PROFESSIONAL_ID',
])

function parseArgs(argv) {
  const args = { envFile: '.env.local', dryRun: false, force: false, target: 'development', confirmProduction: false }
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i]
    if (token === '--env-file' && argv[i + 1]) { args.envFile = argv[i + 1]; i += 1; continue }
    if (token === '--dry-run') { args.dryRun = true; continue }
    if (token === '--force') { args.force = true; continue }
    if (token === '--target' && argv[i + 1]) { args.target = argv[i + 1]; i += 1; continue }
    if (token === '--confirm-production') { args.confirmProduction = true; continue }
  }
  return args
}

function loadEnvFile(filePath) {
  const abs = path.resolve(process.cwd(), filePath)
  if (!fs.existsSync(abs)) throw new Error(`Env file not found: ${abs}`)
  const entries = []
  for (const raw of fs.readFileSync(abs, 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx <= 0) continue
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    entries.push({ key, value })
  }
  return { abs, entries }
}

function redactError(errMessage) {
  // Strip anything that looks like a key, token, or URL with credentials
  let m = String(errMessage || '')
  m = m.replace(/\b([A-Za-z0-9_-]{20,})\b/g, '[REDACTED]')
  m = m.replace(/https?:\/\/[^\s]+/g, '[REDACTED_URL]')
  return m
}

async function vercelApi(urlPath, opts = {}) {
  const token = process.env.VERCEL_TOKEN
  const teamId = process.env.VERCEL_TEAM_ID || null
  const projectId = process.env.VERCEL_PROJECT_ID
  if (!token) throw new Error('Missing VERCEL_TOKEN (or VERCEL_API_TOKEN)')
  if (!projectId) throw new Error('Missing VERCEL_PROJECT_ID')

  const url = new URL(`https://api.vercel.com/v10/projects/${projectId}/env${urlPath}`)
  if (teamId) url.searchParams.set('teamId', teamId)

  const res = await fetch(url.toString(), {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'muuday-env-sync',
      ...(opts.headers || {}),
    },
  })

  const text = await res.text()
  if (!res.ok) {
    // Redact before throwing so secrets don't leak into logs
    throw new Error(`Vercel API ${res.status}: ${redactError(text)}`)
  }
  try { return JSON.parse(text) } catch { return text }
}

async function listVercelEnvKeys(projectId, token, teamId) {
  const keys = new Set()
  let next = null
  while (true) {
    const url = new URL(`https://api.vercel.com/v10/projects/${projectId}/env`)
    url.searchParams.set('decrypt', 'false')
    url.searchParams.set('limit', '100')
    if (teamId) url.searchParams.set('teamId', teamId)
    if (next) url.searchParams.set('since', String(next))

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Vercel API ${res.status}: ${redactError(text)}`)
    }
    const data = await res.json()
    const envs = Array.isArray(data.envs) ? data.envs : []
    for (const item of envs) {
      if (item && item.key) keys.add(item.key)
    }
    const pagination = data.pagination || {}
    if (!pagination.next) break
    next = pagination.next
  }
  return keys
}

async function main() {
  const args = parseArgs(process.argv)
  const { abs, entries } = loadEnvFile(args.envFile)

  const projectId = process.env.VERCEL_PROJECT_ID
  const token = process.env.VERCEL_TOKEN
  const teamId = process.env.VERCEL_TEAM_ID || null

  // Validate target
  const validTargets = ['production', 'preview', 'development']
  if (!validTargets.includes(args.target)) {
    throw new Error(`Invalid target: ${args.target}. Must be one of: ${validTargets.join(', ')}`)
  }

  // Require explicit confirmation for production
  if (args.target === 'production' && !args.confirmProduction) {
    console.error('[env-sync] ERROR: Syncing to production requires --confirm-production')
    console.error('[env-sync] Run with --dry-run first to preview changes.')
    process.exit(1)
  }

  console.log(`[env-sync] Local file: ${abs}`)
  console.log(`[env-sync] Vercel project: ${projectId}`)
  console.log(`[env-sync] Target: ${args.target}`)
  if (args.dryRun) console.log('[env-sync] ⚠️ DRY RUN — no changes will be made.')
  console.log('')

  const vercelKeys = await listVercelEnvKeys(projectId, token, teamId)

  const created = []
  const skipped = []
  const blocked = []
  const failed = []

  for (const { key, value } of entries) {
    if (BLOCKLIST.has(key)) {
      blocked.push(key)
      console.log(`  🚫 ${key} (blocked — local-only/test secret)`)
      continue
    }

    const exists = vercelKeys.has(key)
    if (exists && !args.force) {
      skipped.push(key)
      console.log(`  ⏭️  ${key} (already exists, skipped)`)
      continue
    }

    if (args.dryRun) {
      console.log(`  🔍 ${key} ${exists ? 'would update' : 'would create'}`)
      continue
    }

    try {
      if (exists) {
        // Find ID to PATCH
        const listUrl = new URL(`https://api.vercel.com/v10/projects/${projectId}/env`)
        listUrl.searchParams.set('decrypt', 'false')
        listUrl.searchParams.set('limit', '100')
        if (teamId) listUrl.searchParams.set('teamId', teamId)
        const listRes = await fetch(listUrl.toString(), {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })
        const listData = await listRes.json()
        const envs = Array.isArray(listData.envs) ? listData.envs : []
        const existing = envs.find((e) => e.key === key)
        if (existing && existing.id) {
          await vercelApi(`/${existing.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              key,
              value,
              target: [args.target],
              type: 'encrypted',
            }),
          })
          created.push({ key, action: 'updated' })
          console.log(`  🔄 ${key} (updated)`)
          continue
        }
      }

      await vercelApi('', {
        method: 'POST',
        body: JSON.stringify({
          key,
          value,
          target: [args.target],
          type: 'encrypted',
        }),
      })
      created.push({ key, action: 'created' })
      console.log(`  ✅ ${key} (created)`)
    } catch (err) {
      failed.push({ key, error: redactError(err.message) })
      console.error(`  ❌ ${key}: ${redactError(err.message)}`)
    }
  }

  console.log('')
  console.log(`[env-sync] Created/Updated: ${created.length}`)
  console.log(`[env-sync] Skipped: ${skipped.length}`)
  console.log(`[env-sync] Blocked: ${blocked.length}`)
  console.log(`[env-sync] Failed: ${failed.length}`)

  if (blocked.length > 0) {
    console.log(`\n[env-sync] Blocked keys (local-only): ${blocked.join(', ')}`)
  }

  if (failed.length > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(`[env-sync] FATAL: ${redactError(err.message)}`)
  process.exit(1)
})

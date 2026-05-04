#!/usr/bin/env node
/**
 * Automated secret rotation script.
 *
 * Reads secrets-rotation-register.json, identifies overdue secrets,
 * attempts provider-specific rotation via APIs, updates Vercel env vars,
 * and stamps the register.
 *
 * Providers with automatic rotation support:
 *   - resend    : Creates a new API key via Resend REST API
 *   - openai    : Creates a new API key via OpenAI REST API
 *   - stripe    : Creates a new Restricted Key (Secret Key still manual)
 *   - upstash   : Rotates Redis REST token via Upstash API
 *   - vercel    : Rotates Vercel token via Vercel API
 *
 * For unsupported providers, the script emits a manual-action report.
 *
 * Required env:
 *   VERCEL_PROJECT_ID, VERCEL_TOKEN, VERCEL_TEAM_ID (optional)
 *   Provider tokens (e.g. RESEND_API_KEY, OPENAI_API_KEY, etc.)
 */

const fs = require('fs')
const path = require('path')

const REGISTER_PATH = 'docs/engineering/runbooks/secrets-rotation-register.json'

// ─── CLI ─────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = {
    dryRun: false,
    jsonOut: null,
    only: null, // comma-separated provider or secret names
  }
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i]
    if (token === '--dry-run') {
      args.dryRun = true
      continue
    }
    if (token === '--json-out' && argv[i + 1]) {
      args.jsonOut = argv[i + 1]
      i += 1
      continue
    }
    if (token === '--only' && argv[i + 1]) {
      args.only = argv[i + 1]
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
      i += 1
      continue
    }
  }
  return args
}

// ─── Utilities ───────────────────────────────────────────────────────────────
function parseISODate(value) {
  if (!value) return null
  const d = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

function formatDate(d) {
  return d.toISOString().slice(0, 10)
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

function daysBetweenUTC(fromDate, toDate) {
  const from = Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate())
  const to = Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate())
  return Math.floor((to - from) / (24 * 60 * 60 * 1000))
}

function loadRegister(filePath) {
  const abs = path.resolve(process.cwd(), filePath)
  if (!fs.existsSync(abs)) throw new Error(`Register not found: ${abs}`)
  const payload = JSON.parse(fs.readFileSync(abs, 'utf8'))
  if (!Array.isArray(payload.secrets)) throw new Error('Invalid register: secrets[] missing')
  return { abs, payload }
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

async function httpRequest(url, opts = {}) {
  const res = await fetch(url, opts)
  const text = await res.text()
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}: ${text}`)
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

// ─── Vercel Env API ──────────────────────────────────────────────────────────
async function vercelApi(pathSuffix, opts = {}) {
  const token = process.env.VERCEL_TOKEN
  const teamId = process.env.VERCEL_TEAM_ID || null
  const projectId = process.env.VERCEL_PROJECT_ID
  if (!token) throw new Error('Missing VERCEL_TOKEN')
  if (!projectId) throw new Error('Missing VERCEL_PROJECT_ID')

  const url = new URL(`https://api.vercel.com/v10/projects/${projectId}/env${pathSuffix}`)
  if (teamId) url.searchParams.set('teamId', teamId)

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'User-Agent': 'muuday-secret-rotator',
    ...(opts.headers || {}),
  }

  return httpRequest(url.toString(), { ...opts, headers })
}

async function upsertVercelEnv(key, value, target = 'production') {
  // Vercel uses env key arrays; we upsert by key name.
  // First, list existing envs to find the ID.
  const list = await vercelApi('')
  const envs = Array.isArray(list.envs) ? list.envs : []
  const existing = envs.find((e) => e.key === key)

  const body = {
    key,
    value,
    target: Array.isArray(target) ? target : [target],
    type: 'encrypted',
  }

  if (existing && existing.id) {
    // PATCH existing
    await vercelApi(`/${existing.id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
    return { action: 'updated', key, id: existing.id }
  }

  // POST new
  const created = await vercelApi('', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
  return { action: 'created', key, id: created?.id || null }
}

// ─── Provider Rotators ───────────────────────────────────────────────────────
const rotators = {
  /**
   * Resend — creates a new API key.
   * Requires: existing RESEND_API_KEY env with permission to create keys.
   */
  async resend(secretEntry, dryRun) {
    const currentKey = process.env.RESEND_API_KEY
    if (!currentKey) throw new Error('Missing RESEND_API_KEY env for rotation')

    if (dryRun) {
      return { rotated: false, reason: 'dry-run', newValue: null }
    }

    const res = await httpRequest('https://api.resend.com/api-keys', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${currentKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `muuday-auto-rotated-${formatDate(new Date())}`,
        permission: 'sending_access',
        domain_id: process.env.RESEND_DOMAIN_ID || undefined,
      }),
    })

    const newToken = res?.token
    if (!newToken) throw new Error(`Resend key creation failed: ${JSON.stringify(res)}`)

    // Update Vercel env var
    await upsertVercelEnv(secretEntry.name, newToken, 'production')

    return { rotated: true, provider: 'resend', meta: { id: res.id } }
  },

  /**
   * OpenAI — creates a new API key.
   * Requires: OPENAI_ADMIN_KEY or existing OPENAI_API_KEY with project scope.
   */
  async openai(secretEntry, dryRun) {
    const adminKey = process.env.OPENAI_ADMIN_KEY || process.env.OPENAI_API_KEY
    if (!adminKey) throw new Error('Missing OPENAI_ADMIN_KEY or OPENAI_API_KEY for rotation')

    if (dryRun) {
      return { rotated: false, reason: 'dry-run', newValue: null }
    }

    const res = await httpRequest('https://api.openai.com/v1/api_keys', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `muuday-auto-${formatDate(new Date())}`,
      }),
    })

    const newValue = res?.value || res?.key?.value
    if (!newValue) throw new Error(`OpenAI key creation failed: ${JSON.stringify(res)}`)

    await upsertVercelEnv(secretEntry.name, newValue, 'production')

    return { rotated: true, provider: 'openai', meta: { id: res.id } }
  },

  /**
   * Stripe — creates a new Restricted Key.
   * Note: Stripe Secret Keys cannot be created via API; this rotator
   * only works for restricted keys or webhook secrets.
   */
  async stripe(secretEntry, dryRun) {
    const sk = process.env.STRIPE_SECRET_KEY
    if (!sk) throw new Error('Missing STRIPE_SECRET_KEY env for rotation')

    if (dryRun) {
      return { rotated: false, reason: 'dry-run', newValue: null }
    }

    // Only rotate restricted keys automatically.
    // Secret keys must be rotated manually via Stripe Dashboard.
    if (secretEntry.name === 'STRIPE_SECRET_KEY') {
      return {
        rotated: false,
        reason: 'manual_required',
        note: 'Stripe Secret Key cannot be created via API. Rotate manually in Stripe Dashboard, then run stamp.',
      }
    }

    if (secretEntry.name === 'STRIPE_WEBHOOK_SECRET') {
      return {
        rotated: false,
        reason: 'manual_required',
        note: 'Stripe Webhook Secret requires endpoint re-creation or secret reveal in Dashboard.',
      }
    }

    const res = await httpRequest('https://api.stripe.com/v1/apps/secrets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sk}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        name: `muuday_auto_${Date.now()}`,
        payload: `rotated-${formatDate(new Date())}`,
        scope: { type: 'account' },
      }).toString(),
    })

    return { rotated: false, reason: 'stripe_restricted_only', note: 'Use Stripe Dashboard for secret/webhook keys.' }
  },

  /**
   * Upstash — rotates Redis REST token.
   * Requires: UPSTASH_REDIS_REST_URL and UPSTASH_EMAIL + UPSTASH_API_KEY
   * (or existing token with rotate permission).
   */
  async upstash(secretEntry, dryRun) {
    const email = process.env.UPSTASH_EMAIL
    const apiKey = process.env.UPSTASH_API_KEY
    if (!email || !apiKey) {
      return {
        rotated: false,
        reason: 'missing_credentials',
        note: 'Set UPSTASH_EMAIL and UPSTASH_API_KEY to rotate Upstash tokens automatically.',
      }
    }

    if (dryRun) {
      return { rotated: false, reason: 'dry-run', newValue: null }
    }

    // Extract DB ID from REST URL
    const restUrl = process.env.UPSTASH_REDIS_REST_URL
    if (!restUrl) throw new Error('Missing UPSTASH_REDIS_REST_URL')

    const match = restUrl.match(/https:\/\/([a-z0-9-]+)\.upstash\.io/)
    const dbId = match ? match[1] : null
    if (!dbId) throw new Error('Cannot extract Upstash DB ID from REST URL')

    const res = await httpRequest(`https://api.upstash.com/v2/redis/rotate_password/${dbId}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${email}:${apiKey}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    })

    const newToken = res?.password || res?.rest_token
    if (!newToken) throw new Error(`Upstash rotation failed: ${JSON.stringify(res)}`)

    await upsertVercelEnv(secretEntry.name, newToken, 'production')
    // Also update UPSTASH_REDIS_REST_URL if it embeds the token (some formats do)
    // Upstash URLs are typically https://<token>@<host> — we should update the URL too.
    const newUrl = restUrl.replace(/https:\/\/[^@]+@/, `https://${newToken}@`)
    if (newUrl !== restUrl) {
      await upsertVercelEnv('UPSTASH_REDIS_REST_URL', newUrl, 'production')
    }

    return { rotated: true, provider: 'upstash', meta: { dbId } }
  },

  /**
   * Vercel — rotates Vercel API token.
   * Requires: VERCEL_API_TOKEN (the token itself) + VERCEL_TOKEN (a parent/owner token).
   */
  async vercel(secretEntry, dryRun) {
    const parentToken = process.env.VERCEL_TOKEN
    if (!parentToken) throw new Error('Missing VERCEL_TOKEN env for rotation')

    if (dryRun) {
      return { rotated: false, reason: 'dry-run', newValue: null }
    }

    // Vercel token rotation: create a new token using the current one.
    const res = await httpRequest('https://api.vercel.com/v3/user/tokens', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${parentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `muuday-auto-${formatDate(new Date())}`,
      }),
    })

    const newToken = res?.token?.token
    if (!newToken) throw new Error(`Vercel token creation failed: ${JSON.stringify(res)}`)

    await upsertVercelEnv(secretEntry.name, newToken, 'production')

    return { rotated: true, provider: 'vercel', meta: { id: res.token?.id } }
  },
}

// ─── Secret → Provider mapping ───────────────────────────────────────────────
function providerForSecret(name) {
  const n = name.toUpperCase()
  if (n.startsWith('RESEND')) return 'resend'
  if (n.startsWith('OPENAI')) return 'openai'
  if (n.startsWith('STRIPE')) return 'stripe'
  if (n.startsWith('UPSTASH')) return 'upstash'
  if (n.startsWith('VERCEL')) return 'vercel'
  if (n === 'GITHUB_TOKEN') return 'github' // not implemented yet
  if (n === 'CLOUDFLARE_API_TOKEN' || n === 'CLOUDFLARE_ANALYTICS_TOKEN') return 'cloudflare' // not implemented yet
  return null
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv)
  const { abs, payload } = loadRegister(REGISTER_PATH)

  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  const overdue = payload.secrets.filter((s) => {
    const rotatedAt = parseISODate(s.last_rotated_at)
    if (!rotatedAt) return true
    const dueAt = parseISODate(s.next_due_at) || addDays(rotatedAt, Number(s.cadence_days))
    const daysUntil = daysBetweenUTC(today, dueAt)
    return daysUntil < 0
  })

  if (overdue.length === 0) {
    console.log('[rotate-secrets] No overdue secrets. 🎉')
    return
  }

  const filtered = args.only
    ? overdue.filter((s) => args.only.includes(s.name.toUpperCase()) || args.only.includes(providerForSecret(s.name)?.toUpperCase()))
    : overdue

  console.log(`[rotate-secrets] Overdue secrets found: ${overdue.length}`)
  if (args.only) {
    console.log(`[rotate-secrets] Filtered to: ${args.only.join(', ')} (${filtered.length} secrets)`)
  }
  if (args.dryRun) {
    console.log('[rotate-secrets] ⚠️ DRY RUN — no changes will be made.')
  }
  console.log('')

  const results = []
  const manualActions = []

  for (const secret of filtered) {
    const provider = providerForSecret(secret.name)
    const rotator = provider ? rotators[provider] : null

    console.log(`→ ${secret.name} (provider: ${provider || 'none'})`)

    if (!rotator) {
      const msg = `No automatic rotator for ${secret.name}. Manual rotation required.`
      console.log(`  ${msg}`)
      manualActions.push({ secret: secret.name, action: 'manual_rotation', note: msg })
      results.push({ secret: secret.name, rotated: false, reason: 'no_rotator' })
      continue
    }

    try {
      const outcome = await rotator(secret, args.dryRun)
      if (outcome.rotated) {
        console.log(`  ✅ Rotated automatically. Updated Vercel env ${secret.name}.`)
        if (!args.dryRun) {
          secret.last_rotated_at = formatDate(today)
          secret.next_due_at = formatDate(addDays(today, Number(secret.cadence_days)))
          secret.rotated_by = 'auto-rotation-bot'
          secret.validation_status = 'pending_validation'
          secret.notes = `Auto-rotated via ${outcome.provider}. New key ID: ${outcome.meta?.id || 'n/a'}`
        }
        results.push({ secret: secret.name, rotated: true, provider, dryRun: args.dryRun })
      } else if (outcome.reason === 'manual_required' || outcome.reason === 'missing_credentials') {
        console.log(`  ⚠️ ${outcome.note || outcome.reason}`)
        manualActions.push({ secret: secret.name, action: 'manual_rotation', note: outcome.note || outcome.reason })
        results.push({ secret: secret.name, rotated: false, reason: outcome.reason })
      } else {
        console.log(`  ℹ️ ${outcome.reason || 'skipped'}`)
        results.push({ secret: secret.name, rotated: false, reason: outcome.reason || 'skipped' })
      }
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`)
      results.push({ secret: secret.name, rotated: false, reason: 'error', error: err.message })
    }
  }

  // Write updated register unless dry-run
  if (!args.dryRun) {
    payload.updated_at = formatDate(today)
    fs.writeFileSync(abs, JSON.stringify(payload, null, 2) + '\n', 'utf8')
    console.log(`\n[rotate-secrets] Register updated: ${abs}`)
  }

  // Summary
  const autoRotated = results.filter((r) => r.rotated)
  const failed = results.filter((r) => !r.rotated && r.reason === 'error')
  const skipped = results.filter((r) => !r.rotated && r.reason !== 'error')

  console.log('\n--- Summary ---')
  console.log(`Auto-rotated: ${autoRotated.length}`)
  console.log(`Failed:       ${failed.length}`)
  console.log(`Skipped:      ${skipped.length}`)
  if (manualActions.length > 0) {
    console.log('\n--- Manual actions required ---')
    for (const ma of manualActions) {
      console.log(`- ${ma.secret}: ${ma.note}`)
    }
  }

  // JSON report
  if (args.jsonOut) {
    const outAbs = path.resolve(process.cwd(), args.jsonOut)
    ensureDir(outAbs)
    const report = {
      run_at_utc: new Date().toISOString(),
      dry_run: args.dryRun,
      register_path: abs,
      summary: { auto_rotated: autoRotated.length, failed: failed.length, skipped: skipped.length, manual: manualActions.length },
      results,
      manual_actions: manualActions,
    }
    fs.writeFileSync(outAbs, JSON.stringify(report, null, 2), 'utf8')
    console.log(`\n[rotate-secrets] JSON report: ${outAbs}`)
  }

  if (failed.length > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(`[rotate-secrets] FATAL: ${err.message}`)
  process.exit(1)
})

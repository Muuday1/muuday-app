#!/usr/bin/env node
/**
 * Audit: compare keys in .env.local against Vercel project env vars.
 *
 * Ensures every key in the local .env.local file is also present in Vercel,
 * so the local file can be safely deleted / treated as ephemeral.
 *
 * Required env:
 *   VERCEL_PROJECT_ID
 *   VERCEL_TOKEN
 *   VERCEL_TEAM_ID (optional)
 */

const fs = require('fs')
const path = require('path')

// Allow running this script directly without manual env export.
// dotenv is safe: it does nothing if .env.local is missing.
try {
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') })
} catch { /* dotenv may not be resolvable in bare contexts */ }

// Fallback: accept VERCEL_API_TOKEN as VERCEL_TOKEN
if (!process.env.VERCEL_TOKEN && process.env.VERCEL_API_TOKEN) {
  process.env.VERCEL_TOKEN = process.env.VERCEL_API_TOKEN
}

// Fallback: read projectId / orgId from .vercel/project.json
function loadVercelProjectMeta() {
  const metaPath = path.resolve(process.cwd(), '.vercel', 'project.json')
  if (!fs.existsSync(metaPath)) return null
  try {
    return JSON.parse(fs.readFileSync(metaPath, 'utf8'))
  } catch {
    return null
  }
}

const vercelMeta = loadVercelProjectMeta()
if (vercelMeta) {
  if (!process.env.VERCEL_PROJECT_ID && vercelMeta.projectId) {
    process.env.VERCEL_PROJECT_ID = vercelMeta.projectId
  }
  if (!process.env.VERCEL_TEAM_ID && vercelMeta.orgId) {
    process.env.VERCEL_TEAM_ID = vercelMeta.orgId
  }
}

function parseArgs(argv) {
  const args = {
    envFile: '.env.local',
    jsonOut: null,
  }
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i]
    if (token === '--env-file' && argv[i + 1]) {
      args.envFile = argv[i + 1]
      i += 1
      continue
    }
    if (token === '--json-out' && argv[i + 1]) {
      args.jsonOut = argv[i + 1]
      i += 1
      continue
    }
  }
  return args
}

function loadEnvKeys(filePath) {
  const abs = path.resolve(process.cwd(), filePath)
  if (!fs.existsSync(abs)) {
    throw new Error(`Env file not found: ${abs}`)
  }
  const keys = new Set()
  const lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/)
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx <= 0) continue
    keys.add(line.slice(0, idx).trim())
  }
  return { abs, keys }
}

async function vercelRequest(url, token) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'User-Agent': 'muuday-env-audit',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Vercel API ${res.status}: ${text}`)
  }
  return res.json()
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

    const data = await vercelRequest(url.toString(), token)
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

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

async function main() {
  const args = parseArgs(process.argv)
  const { abs, keys: localKeys } = loadEnvKeys(args.envFile)

  const projectId = process.env.VERCEL_PROJECT_ID
  const token = process.env.VERCEL_TOKEN
  const teamId = process.env.VERCEL_TEAM_ID || null

  if (!projectId) throw new Error('Missing VERCEL_PROJECT_ID env.')
  if (!token) throw new Error('Missing VERCEL_TOKEN env.')

  const vercelKeys = await listVercelEnvKeys(projectId, token, teamId)

  const missing = []
  const present = []

  for (const key of localKeys) {
    if (vercelKeys.has(key)) {
      present.push(key)
    } else {
      missing.push(key)
    }
  }

  console.log(`[env-audit] Local file: ${abs}`)
  console.log(`[env-audit] Vercel project: ${projectId}`)
  console.log(`[env-audit] Local keys: ${localKeys.size}`)
  console.log(`[env-audit] Vercel keys: ${vercelKeys.size}`)
  console.log('')

  if (missing.length > 0) {
    console.log(`[env-audit] ⚠️  MISSING in Vercel (${missing.length}):`)
    for (const key of missing) {
      console.log(`  - ${key}`)
    }
  } else {
    console.log('[env-audit] ✅ All local keys are present in Vercel.')
  }

  if (present.length > 0) {
    console.log(`\n[env-audit] ✅ Present in both (${present.length}):`)
    for (const key of present) {
      console.log(`  - ${key}`)
    }
  }

  // Also report Vercel-only keys (informational)
  const vercelOnly = []
  for (const key of vercelKeys) {
    if (!localKeys.has(key)) vercelOnly.push(key)
  }
  if (vercelOnly.length > 0) {
    console.log(`\n[env-audit] ℹ️  Vercel-only keys (${vercelOnly.length} — informational):`)
    for (const key of vercelOnly) {
      console.log(`  - ${key}`)
    }
  }

  if (args.jsonOut) {
    const outAbs = path.resolve(process.cwd(), args.jsonOut)
    ensureDir(outAbs)
    fs.writeFileSync(
      outAbs,
      JSON.stringify(
        {
          checked_at_utc: new Date().toISOString(),
          local_file: abs,
          vercel_project_id: projectId,
          local_key_count: localKeys.size,
          vercel_key_count: vercelKeys.size,
          missing_in_vercel: missing,
          present_in_both: present,
          vercel_only: vercelOnly,
        },
        null,
        2,
      ),
      'utf8',
    )
    console.log(`\n[env-audit] JSON report: ${outAbs}`)
  }

  if (missing.length > 0) {
    console.error(`\n[env-audit] FAIL: ${missing.length} key(s) from ${args.envFile} are missing in Vercel.`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(`[env-audit] FATAL: ${err.message}`)
  process.exit(1)
})

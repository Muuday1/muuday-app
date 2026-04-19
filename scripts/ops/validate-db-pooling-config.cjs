#!/usr/bin/env node
 
const fs = require('node:fs')
const path = require('node:path')

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

function normalizeUrl(urlValue) {
  return (urlValue || '').trim().replace(/^["']|["']$/g, '')
}

function parseConnectionUrl(name, rawValue) {
  const value = normalizeUrl(rawValue)
  if (!value) return null
  let parsed
  try {
    parsed = new URL(value)
  } catch (error) {
    throw new Error(`${name} is not a valid URL.`)
  }

  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
    throw new Error(`${name} must use postgres/postgresql protocol.`)
  }
  return parsed
}

function portOrDefault(parsed, defaultPort) {
  return parsed.port ? Number(parsed.port) : defaultPort
}

function main() {
  const root = process.cwd()
  loadEnvFile(path.join(root, '.env.local'))
  loadEnvFile(path.join(root, '.env'))
  loadEnvFile(path.join(root, '.env.production'))

  const poolerRaw =
    process.env.SUPABASE_DB_POOLER_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    ''
  const directRaw =
    process.env.SUPABASE_DB_DIRECT_URL ||
    process.env.DATABASE_DIRECT_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    ''

  const runtimeEnv = String(
    process.env.VERCEL_ENV || process.env.APP_ENV || process.env.NODE_ENV || '',
  ).toLowerCase()
  const requirePooler =
    process.env.REQUIRE_DB_POOLER === 'true' ||
    runtimeEnv === 'production'

  const pooler = parseConnectionUrl('SUPABASE_DB_POOLER_URL/DATABASE_URL', poolerRaw)
  if (!pooler) {
    if (requirePooler) {
      throw new Error(
        'Missing pooled DB connection string. Set SUPABASE_DB_POOLER_URL (or DATABASE_URL) to Supavisor port 6543.',
      )
    }
    console.log(
      '[db-pooling] INFO: pooled URL is not configured in local/dev environment. Production must set SUPABASE_DB_POOLER_URL.',
    )
    return
  }

  const poolerPort = portOrDefault(pooler, 5432)
  if (poolerPort !== 6543) {
    throw new Error(
      `Pooler URL must use port 6543 (Supavisor transaction mode). Found ${poolerPort}.`,
    )
  }

  const poolerHost = (pooler.hostname || '').toLowerCase()
  if (!poolerHost.includes('pooler') && !poolerHost.includes('supabase')) {
    console.warn(
      `[warn] Pooler host "${pooler.hostname}" does not look like a Supabase/Supavisor endpoint. Verify manually.`,
    )
  }

  const direct = parseConnectionUrl('SUPABASE_DB_DIRECT_URL/DATABASE_DIRECT_URL', directRaw)
  if (direct) {
    const directPort = portOrDefault(direct, 5432)
    if (directPort === 6543) {
      throw new Error(
        'Direct DB URL cannot use port 6543. Use direct postgres endpoint (typically 5432).',
      )
    }
  }

  console.log('[db-pooling] OK: pooled connection string is configured on port 6543.')
  if (direct) {
    console.log('[db-pooling] OK: direct connection string is separate from pooled URL.')
  } else {
    console.log(
      '[db-pooling] INFO: direct connection string not set (optional for migration/maintenance tooling).',
    )
  }
}

try {
  main()
} catch (error) {
  console.error(`[db-pooling] Failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}

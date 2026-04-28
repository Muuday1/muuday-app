/**
 * Revolut Sandbox Health Check
 *
 * Validates Revolut Business API connectivity.
 * If the access token is expired, reports actionable next steps.
 *
 * Run: node scripts/test-revolut-sandbox.js
 *
 * Requires: REVOLUT_API_KEY, REVOLUT_CLIENT_ID, REVOLUT_PRIVATE_KEY in .env.local
 */

const fs = require('fs')
const path = require('path')

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/)
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2]
    }
  }
}

const API_KEY = process.env.REVOLUT_API_KEY
const CLIENT_ID = process.env.REVOLUT_CLIENT_ID
const PRIVATE_KEY = process.env.REVOLUT_PRIVATE_KEY
const REFRESH_TOKEN = process.env.REVOLUT_REFRESH_TOKEN

const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RESET = '\x1b[0m'

function log(msg) { console.log(msg) }
function ok(msg) { console.log(`${GREEN}  ✅ ${msg}${RESET}`) }
function warn(msg) { console.log(`${YELLOW}  ⚠️  ${msg}${RESET}`) }
function fail(msg) { console.log(`${RED}  ❌ ${msg}${RESET}`) }

async function run() {
  console.log('\n🏦 Revolut Sandbox Health Check')
  console.log('=================================\n')

  // Check env vars
  console.log('1. Environment variables')
  if (!API_KEY) { fail('REVOLUT_API_KEY not set'); return }
  ok('REVOLUT_API_KEY is set')
  if (!CLIENT_ID) { fail('REVOLUT_CLIENT_ID not set'); return }
  ok('REVOLUT_CLIENT_ID is set')
  if (!PRIVATE_KEY) { fail('REVOLUT_PRIVATE_KEY not set'); return }
  ok('REVOLUT_PRIVATE_KEY is set')
  if (!REFRESH_TOKEN) {
    warn('REVOLUT_REFRESH_TOKEN is empty — token auto-refresh will fail if access token expires')
  } else {
    ok('REVOLUT_REFRESH_TOKEN is set')
  }

  // Check API connectivity
  console.log('\n2. API connectivity (GET /accounts)')
  try {
    const res = await fetch('https://b2b.revolut.com/api/1.0/accounts', {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (res.status === 200) {
      const data = await res.json()
      ok(`Connected. Found ${data.length} account(s)`)
      for (const acc of data) {
        console.log(`      • ${acc.name}: ${acc.currency} ${acc.balance}`)
      }
      console.log('\n🎉 Revolut API is healthy!')
      return
    }

    if (res.status === 401) {
      fail('HTTP 401 — Access token expired or invalid')
      console.log('\n' + YELLOW + 'Action required:' + RESET)
      console.log('  1. Go to https://business.revolut.com/settings/developers')
      console.log('  2. Generate a new access token (or re-authorize the OAuth app)')
      console.log('  3. Update REVOLUT_API_KEY in Vercel env vars and .env.local')
      console.log('  4. If using OAuth, also capture the new refresh_token for')
      console.log('     REVOLUT_REFRESH_TOKEN to enable automatic refresh')
      console.log('\n  Revolut Business API docs:')
      console.log('  https://developer.revolut.com/docs/business/authentication/')
      return
    }

    const body = await res.text()
    fail(`HTTP ${res.status}: ${body.slice(0, 200)}`)
    return
  } catch (err) {
    fail(`Network error: ${err.message}`)
    return
  }
}

run().catch((err) => {
  console.error('\n💥 Unexpected error:', err)
  process.exit(1)
})

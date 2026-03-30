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

function hasFlag(flagName) {
  return process.argv.includes(flagName)
}

function normalizeBaseUrl(url) {
  return (url || '').replace(/\/+$/, '')
}

function buildTaggedEmail(baseEmail) {
  const [localPartRaw, domain] = baseEmail.split('@')
  if (!localPartRaw || !domain) return null
  const localPart = localPartRaw.split('+')[0]
  const stamp = Date.now().toString().slice(-7)
  return `${localPart}+auth-smoke-${stamp}@${domain}`
}

async function main() {
  const root = process.cwd()
  loadEnvFile(path.join(root, '.env.local'))
  loadEnvFile(path.join(root, '.env'))

  const isDryRun = hasFlag('--dry-run')
  const shouldCleanup = hasFlag('--cleanup')
  const explicitEmail = getArgValue('--email')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const appBaseUrl = normalizeBaseUrl(process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  const seedEmail = explicitEmail || process.env.SUPABASE_AUTH_TEST_EMAIL

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  if (!seedEmail) {
    throw new Error('Missing test email. Provide --email=you@example.com or SUPABASE_AUTH_TEST_EMAIL in env.')
  }

  const smokeEmail = buildTaggedEmail(seedEmail)
  if (!smokeEmail) {
    throw new Error('Invalid test email format.')
  }

  const redirectTo = `${appBaseUrl}/auth/callback`
  const testPassword = `Muuday!Smoke${Date.now()}`

  const summary = {
    supabaseUrl,
    redirectTo,
    smokeEmail,
    dryRun: isDryRun,
    cleanup: shouldCleanup,
  }

  console.log('[auth-smoke] Config:')
  console.log(JSON.stringify(summary, null, 2))

  if (isDryRun) {
    console.log('[auth-smoke] Dry run complete. No API calls performed.')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: smokeEmail,
    password: testPassword,
    options: { emailRedirectTo: redirectTo },
  })

  if (signUpError) {
    throw new Error(`signUp failed: ${signUpError.message}`)
  }

  console.log(`[auth-smoke] signUp accepted for ${smokeEmail}.`)
  if (signUpData?.user?.id) {
    console.log(`[auth-smoke] user_id=${signUpData.user.id}`)
  }

  const { error: resetError } = await supabase.auth.resetPasswordForEmail(smokeEmail, {
    redirectTo,
  })

  if (resetError) {
    throw new Error(`resetPasswordForEmail failed: ${resetError.message}`)
  }

  console.log('[auth-smoke] resetPasswordForEmail accepted.')

  if (!shouldCleanup) {
    console.log('[auth-smoke] Completed without cleanup.')
    console.log('[auth-smoke] If inbox does not receive emails, verify Supabase SMTP + templates + allowlist settings.')
    return
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!serviceRoleKey) {
    console.log('[auth-smoke] Cleanup requested but no service role key found. Skipping cleanup.')
    return
  }

  if (!signUpData?.user?.id) {
    console.log('[auth-smoke] Cleanup requested but no user id returned. Skipping cleanup.')
    return
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(signUpData.user.id)
  if (deleteError) {
    console.log(`[auth-smoke] Cleanup failed: ${deleteError.message}`)
    return
  }
  console.log('[auth-smoke] Cleanup complete (test user deleted).')
}

main().catch(error => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[auth-smoke] Failed: ${message}`)
  process.exitCode = 1
})

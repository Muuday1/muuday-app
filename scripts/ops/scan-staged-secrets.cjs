#!/usr/bin/env node
/**
 * Pre-commit secret scanner.
 *
 * Scans staged files for patterns that look like secrets:
 *   - Stripe keys (sk_live_*, sk_test_*, pk_live_*, pk_test_*)
 *   - AWS keys (AKIA...)
 *   - Supabase service_role JWTs
 *   - Private keys (-----BEGIN...)
 *   - .env.local contents
 *   - Bearer tokens with long alphanumeric strings
 *
 * Exit code 1 if any pattern is found in staged files.
 *
 * Usage:
 *   node scripts/ops/scan-staged-secrets.cjs
 *
 * To run as a pre-commit hook, add to package.json:
 *   "simple-git-hooks": { "pre-commit": "node scripts/ops/scan-staged-secrets.cjs" }
 */

const { execSync } = require('child_process')

const PATTERNS = [
  { name: 'Stripe secret key', regex: /sk_(live|test)_[A-Za-z0-9]{24,}/ },
  { name: 'Stripe publishable key', regex: /pk_(live|test)_[A-Za-z0-9]{24,}/ },
  { name: 'AWS Access Key ID', regex: /AKIA[A-Z0-9]{16}/ },
  { name: 'Supabase service_role JWT', regex: /eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*.*service_role/ },
  { name: 'Private key block', regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'Env var assignment (possible secret)', regex: /^[A-Z_][A-Z0-9_]*=(?!\{)(?!\[)[A-Za-z0-9+/=_-]{20,}$/m },
  { name: 'Bearer token', regex: /Bearer [A-Za-z0-9_-]{40,}/ },
  { name: 'Resend API key', regex: /re_[A-Za-z0-9]{20,}/ },
  { name: 'OpenAI API key', regex: /sk-(proj|org|user)-[A-Za-z0-9]{20,}/ },
  { name: 'Vercel token', regex: /vcp_[A-Za-z0-9]{20,}/ },
]

const BLOCKED_FILES = [
  '.env.local',
  '.env.production',
  '.env.development',
  '.env.test',
]

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' })
    return output.split('\n').filter(Boolean)
  } catch {
    return []
  }
}

function getStagedContent(filePath) {
  try {
    return execSync(`git show :"${filePath}"`, { encoding: 'utf8' })
  } catch {
    return ''
  }
}

function main() {
  const files = getStagedFiles()
  if (files.length === 0) {
    console.log('[secret-scan] No staged files to scan.')
    process.exit(0)
  }

  let found = 0

  for (const file of files) {
    // Block entire files
    const baseName = file.split('/').pop()
    if (BLOCKED_FILES.includes(baseName)) {
      console.error(`[secret-scan] 🚫 BLOCKED FILE: ${file}`)
      console.error('  Committing .env files is not allowed.')
      found++
      continue
    }

    const content = getStagedContent(file)
    if (!content) continue

    for (const { name, regex } of PATTERNS) {
      const match = content.match(regex)
      if (match) {
        console.error(`[secret-scan] 🔴 ${name} found in ${file}`)
        console.error(`  Match: ${match[0].slice(0, 20)}...`)
        found++
      }
    }
  }

  if (found > 0) {
    console.error(`\n[secret-scan] FAILED: ${found} potential secret(s) found in staged files.`)
    console.error('Remove the secret from the staged file and commit again.')
    console.error('If this is a false positive, use git commit --no-verify to bypass.')
    process.exit(1)
  }

  console.log('[secret-scan] ✅ No secrets found in staged files.')
  process.exit(0)
}

main()

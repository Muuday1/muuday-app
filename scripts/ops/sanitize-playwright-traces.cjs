#!/usr/bin/env node
/**
 * Sanitize Playwright test-result traces.
 *
 * Scans test-results/ for error-context.md files and redacts:
 *   - Authorization headers
 *   - X-Supabase-Session headers
 *   - Cookie values
 *   - Any Bearer tokens
 *
 * Run automatically after E2E tests or manually:
 *   node scripts/ops/sanitize-playwright-traces.cjs
 */

const fs = require('fs')
const path = require('path')

function findFiles(dir, pattern) {
  const results = []
  if (!fs.existsSync(dir)) return results
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findFiles(fullPath, pattern))
    } else if (pattern.test(entry.name)) {
      results.push(fullPath)
    }
  }
  return results
}

function sanitizeFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  const original = content

  // Redact Authorization header
  content = content.replace(/(Authorization:\s*Bearer\s+)[A-Za-z0-9_\-\.]+/g, '$1[REDACTED]')
  content = content.replace(/(Authorization:\s*Basic\s+)[A-Za-z0-9_\-\.]+/g, '$1[REDACTED]')

  // Redact X-Supabase-Session header
  content = content.replace(/(X-Supabase-Session:\s*)[A-Za-z0-9_\-\.]+/g, '$1[REDACTED]')

  // Redact Cookie values
  content = content.replace(/(Cookie:\s*)[^\r\n]*/g, '$1[REDACTED]')

  // Redact any remaining Bearer tokens in body text
  content = content.replace(/Bearer\s+[A-Za-z0-9_\-\.]{20,}/g, 'Bearer [REDACTED]')

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`[sanitize-traces] Sanitized: ${filePath}`)
    return true
  }
  return false
}

function main() {
  const testResultsDir = path.resolve(process.cwd(), 'test-results')
  const files = findFiles(testResultsDir, /error-context\.md$/)

  if (files.length === 0) {
    console.log('[sanitize-traces] No error-context.md files found.')
    return
  }

  let sanitized = 0
  for (const file of files) {
    if (sanitizeFile(file)) sanitized++
  }

  console.log(`[sanitize-traces] Scanned ${files.length} file(s), sanitized ${sanitized}.`)
}

main()

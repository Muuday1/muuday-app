#!/usr/bin/env node
 

const fs = require('fs')
const path = require('path')

function parseArgs(argv) {
  const args = {
    baseUrl: process.env.ONBOARDING_SMOKE_BASE_URL || process.env.E2E_BASE_URL || 'http://localhost:3000',
    fixturePath: 'scripts/ops/onboarding-api-fixtures.json',
    jsonOut: null,
    timeoutMs: Number(process.env.ONBOARDING_SMOKE_TIMEOUT_MS || '30000'),
    cookie: process.env.ONBOARDING_SMOKE_COOKIE || '',
    bearer: process.env.ONBOARDING_SMOKE_BEARER || '',
    failOnSkipped: false,
    failOnNetworkError: true,
    listCases: false,
    help: false,
  }

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i]
    if ((token === '--base-url' || token === '--baseUrl') && argv[i + 1]) {
      args.baseUrl = argv[i + 1]
      i += 1
      continue
    }
    if ((token === '--fixtures' || token === '--fixture') && argv[i + 1]) {
      args.fixturePath = argv[i + 1]
      i += 1
      continue
    }
    if (token === '--json-out' && argv[i + 1]) {
      args.jsonOut = argv[i + 1]
      i += 1
      continue
    }
    if (token === '--timeout-ms' && argv[i + 1]) {
      args.timeoutMs = Number(argv[i + 1])
      i += 1
      continue
    }
    if (token === '--cookie' && argv[i + 1]) {
      args.cookie = argv[i + 1]
      i += 1
      continue
    }
    if (token === '--bearer' && argv[i + 1]) {
      args.bearer = argv[i + 1]
      i += 1
      continue
    }
    if (token === '--fail-on-skipped') {
      args.failOnSkipped = true
      continue
    }
    if (token === '--allow-network-errors') {
      args.failOnNetworkError = false
      continue
    }
    if (token === '--list-cases') {
      args.listCases = true
      continue
    }
    if (token === '--help' || token === '-h') {
      args.help = true
      continue
    }
  }

  return args
}

function printHelp() {
  console.log('Usage: node scripts/ops/smoke-onboarding-api.cjs [options]')
  console.log('')
  console.log('Options:')
  console.log('  --base-url <url>         Target base URL (default: ONBOARDING_SMOKE_BASE_URL || E2E_BASE_URL || http://localhost:3000)')
  console.log('  --fixture <path>         Fixture JSON path (default: scripts/ops/onboarding-api-fixtures.json)')
  console.log('  --json-out <path>        Optional JSON report output')
  console.log('  --timeout-ms <number>    Request timeout in ms (default: 30000)')
  console.log('  --cookie <value>         Session cookie for authenticated cases')
  console.log('  --bearer <token>         Bearer token for authenticated cases')
  console.log('  --list-cases             Print fixture case IDs and exit')
  console.log('  --fail-on-skipped        Exit non-zero when any case is skipped')
  console.log('  --allow-network-errors   Do not fail process on request/network errors')
  console.log('  --help, -h               Show this help')
  console.log('')
  console.log('Notes:')
  console.log('  - Unauthenticated guard cases run by default.')
  console.log('  - Authenticated cases require --cookie or --bearer (or ONBOARDING_SMOKE_COOKIE / ONBOARDING_SMOKE_BEARER).')
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function loadFixture(fixturePath) {
  const abs = path.resolve(process.cwd(), fixturePath)
  if (!fs.existsSync(abs)) {
    throw new Error(`Fixture file not found: ${abs}`)
  }
  const parsed = JSON.parse(fs.readFileSync(abs, 'utf8'))
  if (!Array.isArray(parsed.cases) || parsed.cases.length === 0) {
    throw new Error('Invalid fixture format: expected non-empty cases[]')
  }
  return { abs, cases: parsed.cases }
}

function resolveUrl(baseUrl, routePath) {
  return new URL(routePath, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).toString()
}

function hasPath(value, dottedPath) {
  const keys = dottedPath.split('.').filter(Boolean)
  let current = value
  for (const key of keys) {
    if (!current || typeof current !== 'object' || !(key in current)) {
      return false
    }
    current = current[key]
  }
  return true
}

function pickRequiredPaths(testCase, status) {
  const paths = []
  if (Array.isArray(testCase.requiredJsonPaths)) {
    paths.push(...testCase.requiredJsonPaths)
  }
  const byStatus = testCase.requiredJsonPathsWhenStatus || {}
  const exact = byStatus[String(status)]
  if (Array.isArray(exact)) {
    paths.push(...exact)
  }
  return Array.from(new Set(paths))
}

function makeHeaders(testCase, args) {
  const headers = {
    Accept: 'application/json',
  }
  const needsAuth = String(testCase.auth || 'none') !== 'none'
  if (needsAuth) {
    if (args.cookie) headers.Cookie = args.cookie
    if (args.bearer) headers.Authorization = `Bearer ${args.bearer}`
  }
  if (String(testCase.bodyType || '').toLowerCase() === 'json') {
    headers['Content-Type'] = 'application/json'
  }
  return headers
}

function makeBody(testCase) {
  const bodyType = String(testCase.bodyType || '').toLowerCase()
  if (bodyType === 'json') {
    return JSON.stringify(testCase.jsonBody || {})
  }
  if (bodyType === 'multipart') {
    const form = new FormData()
    const fields = Array.isArray(testCase.multipartFields) ? testCase.multipartFields : []
    for (const field of fields) {
      if (!field || !field.name) continue
      form.append(String(field.name), String(field.value || ''))
    }
    return form
  }
  return undefined
}

async function executeCase(testCase, args) {
  const requiresAuth = String(testCase.auth || 'none') !== 'none'
  const hasAuth = Boolean(args.cookie || args.bearer)
  if (requiresAuth && !hasAuth) {
    return {
      id: testCase.id,
      description: testCase.description || '',
      result: 'skipped',
      reason: 'missing_auth_context',
      request: {
        method: String(testCase.method || 'GET').toUpperCase(),
        path: testCase.path,
      },
    }
  }

  const method = String(testCase.method || 'GET').toUpperCase()
  const url = resolveUrl(args.baseUrl, String(testCase.path || '/'))
  const headers = makeHeaders(testCase, args)
  const body = makeBody(testCase)
  const expected = Array.isArray(testCase.expectedStatus) ? testCase.expectedStatus.map(Number) : []
  const timeout = Number.isFinite(args.timeoutMs) && args.timeoutMs > 0 ? args.timeoutMs : 30000
  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => controller.abort(), timeout)

  const startedAt = new Date().toISOString()
  const begin = Date.now()

  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal,
    })

    const elapsedMs = Date.now() - begin
    const rawText = await response.text()
    const contentType = response.headers.get('content-type') || ''
    let parsed = null
    if (contentType.includes('application/json')) {
      try {
        parsed = rawText ? JSON.parse(rawText) : {}
      } catch {
        parsed = null
      }
    }

    const statusOk = expected.length === 0 || expected.includes(response.status)
    const requiredPaths = pickRequiredPaths(testCase, response.status)
    const missingPaths = []
    if (requiredPaths.length > 0) {
      for (const p of requiredPaths) {
        if (!parsed || !hasPath(parsed, p)) {
          missingPaths.push(p)
        }
      }
    }

    const assertions = []
    assertions.push({
      name: 'status',
      ok: statusOk,
      details: statusOk
        ? `status=${response.status}`
        : `expected one of [${expected.join(', ')}], got ${response.status}`,
    })
    assertions.push({
      name: 'required-json-paths',
      ok: missingPaths.length === 0,
      details:
        missingPaths.length === 0
          ? requiredPaths.length > 0
            ? `present [${requiredPaths.join(', ')}]`
            : 'no required paths'
          : `missing [${missingPaths.join(', ')}]`,
    })

    const failedAssertions = assertions.filter((a) => !a.ok)
    const result = failedAssertions.length > 0 ? 'failed' : 'passed'

    return {
      id: testCase.id,
      description: testCase.description || '',
      result,
      startedAt,
      elapsedMs,
      request: {
        method,
        path: testCase.path,
        url,
        auth: String(testCase.auth || 'none'),
      },
      response: {
        status: response.status,
        contentType,
        bodyPreview: rawText.slice(0, 400),
      },
      assertions,
    }
  } catch (error) {
    const elapsedMs = Date.now() - begin
    const message = error instanceof Error ? error.message : String(error)
    return {
      id: testCase.id,
      description: testCase.description || '',
      result: 'error',
      startedAt,
      elapsedMs,
      request: {
        method,
        path: testCase.path,
        url,
        auth: String(testCase.auth || 'none'),
      },
      error: message,
    }
  } finally {
    clearTimeout(timeoutHandle)
  }
}

function printSummary(results) {
  const counts = results.reduce(
    (acc, row) => {
      acc[row.result] = (acc[row.result] || 0) + 1
      return acc
    },
    { passed: 0, failed: 0, skipped: 0, error: 0 },
  )

  console.log(`[onboarding-api-smoke] passed=${counts.passed} failed=${counts.failed} skipped=${counts.skipped} error=${counts.error}`)
  console.log('')
  console.log('id | result | details')
  console.log('--- | --- | ---')
  for (const row of results) {
    let details = ''
    if (row.result === 'skipped') {
      details = row.reason || 'skipped'
    } else if (row.result === 'error') {
      details = row.error || 'request error'
    } else {
      details = `${row.request.method} ${row.request.path} -> ${row.response.status}`
      const failed = (row.assertions || []).filter((a) => !a.ok)
      if (failed.length > 0) {
        details = `${details}; ${failed.map((a) => a.details).join('; ')}`
      }
    }
    console.log(`${row.id} | ${row.result} | ${details}`)
  }
}

function shouldFail(results, args) {
  const hasFailed = results.some((row) => row.result === 'failed')
  const hasError = results.some((row) => row.result === 'error')
  const hasSkipped = results.some((row) => row.result === 'skipped')

  if (hasFailed) return true
  if (hasError && args.failOnNetworkError) return true
  if (hasSkipped && args.failOnSkipped) return true
  return false
}

async function main() {
  const args = parseArgs(process.argv)
  if (args.help) {
    printHelp()
    return
  }

  const { abs: fixtureAbs, cases } = loadFixture(args.fixturePath)
  if (args.listCases) {
    console.log(`[onboarding-api-smoke] fixture=${fixtureAbs}`)
    for (const item of cases) {
      console.log(`${item.id}: ${item.description || ''}`)
    }
    return
  }

  console.log(`[onboarding-api-smoke] baseUrl=${args.baseUrl}`)
  console.log(`[onboarding-api-smoke] fixture=${fixtureAbs}`)
  console.log(`[onboarding-api-smoke] auth=${args.cookie || args.bearer ? 'provided' : 'none'}`)
  console.log('')

  const results = []
  for (const testCase of cases) {
    const row = await executeCase(testCase, args)
    results.push(row)
  }

  printSummary(results)

  if (args.jsonOut) {
    const outAbs = path.resolve(process.cwd(), args.jsonOut)
    ensureDir(outAbs)
    fs.writeFileSync(
      outAbs,
      JSON.stringify(
        {
          checkedAtUtc: new Date().toISOString(),
          baseUrl: args.baseUrl,
          fixturePath: fixtureAbs,
          timeoutMs: args.timeoutMs,
          authProvided: Boolean(args.cookie || args.bearer),
          results,
        },
        null,
        2,
      ),
      'utf8',
    )
    console.log(`\n[onboarding-api-smoke] JSON report written: ${outAbs}`)
  }

  if (shouldFail(results, args)) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(`[onboarding-api-smoke] ERROR: ${error.message}`)
  process.exit(1)
})

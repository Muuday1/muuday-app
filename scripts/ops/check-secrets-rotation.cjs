#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs')
const path = require('path')

function parseArgs(argv) {
  const args = {
    registerPath: 'docs/engineering/runbooks/secrets-rotation-register.json',
    warnWindowDays: 14,
    failOn: ['overdue'],
    jsonOut: null,
  }

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i]
    if (token === '--register' && argv[i + 1]) {
      args.registerPath = argv[i + 1]
      i += 1
      continue
    }
    if (token === '--warn-window-days' && argv[i + 1]) {
      args.warnWindowDays = Number(argv[i + 1])
      i += 1
      continue
    }
    if (token === '--fail-on' && argv[i + 1]) {
      args.failOn = argv[i + 1].split(',').map((s) => s.trim()).filter(Boolean)
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

function parseISODate(value) {
  if (!value) return null
  const d = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

function formatDate(d) {
  return d.toISOString().slice(0, 10)
}

function addDays(date, days) {
  const ms = date.getTime() + days * 24 * 60 * 60 * 1000
  return new Date(ms)
}

function daysBetweenUTC(fromDate, toDate) {
  const from = Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate())
  const to = Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate())
  return Math.floor((to - from) / (24 * 60 * 60 * 1000))
}

function loadRegister(filePath) {
  const abs = path.resolve(process.cwd(), filePath)
  if (!fs.existsSync(abs)) {
    throw new Error(`Rotation register not found: ${abs}`)
  }
  const raw = fs.readFileSync(abs, 'utf8')
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed.secrets)) {
    throw new Error('Invalid register format: secrets[] missing')
  }
  return { abs, data: parsed }
}

function evaluateSecret(secret, today, warnWindowDays) {
  const cadence = Number(secret.cadence_days)
  if (!Number.isFinite(cadence) || cadence <= 0) {
    return {
      ...secret,
      status: 'invalid',
      days_until_due: null,
      computed_next_due_at: null,
      reason: 'invalid_cadence',
    }
  }

  const rotatedAt = parseISODate(secret.last_rotated_at)
  if (!rotatedAt) {
    return {
      ...secret,
      status: 'baseline_missing',
      days_until_due: null,
      computed_next_due_at: null,
      reason: 'missing_last_rotated_at',
    }
  }

  const explicitDue = parseISODate(secret.next_due_at)
  const dueAt = explicitDue || addDays(rotatedAt, cadence)
  const daysUntilDue = daysBetweenUTC(today, dueAt)

  let status = 'healthy'
  if (daysUntilDue < 0) {
    status = 'overdue'
  } else if (daysUntilDue <= warnWindowDays) {
    status = 'due_soon'
  }

  return {
    ...secret,
    status,
    days_until_due: daysUntilDue,
    computed_next_due_at: formatDate(dueAt),
    reason: explicitDue ? 'explicit_next_due_at' : 'derived_from_cadence',
  }
}

function printSummary(evaluated, warnWindowDays) {
  console.log(`[secrets-rotation] Audit date (UTC): ${formatDate(new Date())}`)
  console.log(`[secrets-rotation] Warn window: ${warnWindowDays} days`)
  console.log('')

  const counts = evaluated.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1
    return acc
  }, {})

  const statusOrder = ['overdue', 'due_soon', 'baseline_missing', 'healthy', 'invalid']
  for (const key of statusOrder) {
    if (counts[key]) {
      console.log(`[secrets-rotation] ${key}: ${counts[key]}`)
    }
  }

  console.log('')
  console.log('name | status | last_rotated_at | next_due_at | days_until_due')
  console.log('--- | --- | --- | --- | ---')

  for (const row of evaluated) {
    const days = row.days_until_due === null ? '' : String(row.days_until_due)
    console.log(
      `${row.name} | ${row.status} | ${row.last_rotated_at || ''} | ${row.computed_next_due_at || row.next_due_at || ''} | ${days}`,
    )
  }
}

function shouldFail(evaluated, failOn) {
  const failSet = new Set(failOn)
  return evaluated.some((row) => failSet.has(row.status))
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath)
  fs.mkdirSync(dir, { recursive: true })
}

function main() {
  const args = parseArgs(process.argv)
  const { abs, data } = loadRegister(args.registerPath)

  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const evaluated = data.secrets.map((secret) => evaluateSecret(secret, today, args.warnWindowDays))

  printSummary(evaluated, args.warnWindowDays)

  if (args.jsonOut) {
    const outAbs = path.resolve(process.cwd(), args.jsonOut)
    ensureDir(outAbs)
    const payload = {
      checked_at_utc: new Date().toISOString(),
      register_path: abs,
      warn_window_days: args.warnWindowDays,
      fail_on: args.failOn,
      summary: evaluated.reduce((acc, row) => {
        acc[row.status] = (acc[row.status] || 0) + 1
        return acc
      }, {}),
      rows: evaluated,
    }
    fs.writeFileSync(outAbs, JSON.stringify(payload, null, 2), 'utf8')
    console.log(`\n[secrets-rotation] JSON report written: ${outAbs}`)
  }

  if (shouldFail(evaluated, args.failOn)) {
    console.error(`\n[secrets-rotation] Failed due to statuses in fail-on set: ${args.failOn.join(', ')}`)
    process.exit(1)
  }
}

try {
  main()
} catch (error) {
  console.error(`[secrets-rotation] ERROR: ${error.message}`)
  process.exit(1)
}

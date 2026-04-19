#!/usr/bin/env node
 

const fs = require('fs')
const path = require('path')

function parseArgs(argv) {
  const args = {
    registerPath: 'docs/engineering/runbooks/secrets-rotation-register.json',
    secrets: [],
    date: new Date().toISOString().slice(0, 10),
    rotatedBy: 'operator',
    validationStatus: 'validated',
    note: null,
  }

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i]
    if (token === '--register' && argv[i + 1]) {
      args.registerPath = argv[i + 1]
      i += 1
      continue
    }
    if (token === '--secrets' && argv[i + 1]) {
      args.secrets = argv[i + 1].split(',').map((s) => s.trim()).filter(Boolean)
      i += 1
      continue
    }
    if (token === '--date' && argv[i + 1]) {
      args.date = argv[i + 1]
      i += 1
      continue
    }
    if (token === '--by' && argv[i + 1]) {
      args.rotatedBy = argv[i + 1]
      i += 1
      continue
    }
    if (token === '--validation-status' && argv[i + 1]) {
      args.validationStatus = argv[i + 1]
      i += 1
      continue
    }
    if (token === '--note' && argv[i + 1]) {
      args.note = argv[i + 1]
      i += 1
      continue
    }
  }

  return args
}

function parseISODate(value) {
  const d = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

function formatDate(d) {
  return d.toISOString().slice(0, 10)
}

function loadRegister(filePath) {
  const abs = path.resolve(process.cwd(), filePath)
  if (!fs.existsSync(abs)) {
    throw new Error(`Rotation register not found: ${abs}`)
  }
  const payload = JSON.parse(fs.readFileSync(abs, 'utf8'))
  if (!Array.isArray(payload.secrets)) {
    throw new Error('Invalid register format: secrets[] missing')
  }
  return { abs, payload }
}

function normalize(name) {
  return String(name || '').trim().toUpperCase()
}

function matches(entry, requested) {
  const target = normalize(requested)
  if (!target) return false
  if (normalize(entry.name) === target) return true
  if (Array.isArray(entry.aliases) && entry.aliases.some((alias) => normalize(alias) === target)) return true
  return false
}

function main() {
  const args = parseArgs(process.argv)
  if (args.secrets.length === 0) {
    throw new Error('Provide --secrets SECRET_A,SECRET_B')
  }

  const date = parseISODate(args.date)
  if (!date) {
    throw new Error('Invalid --date. Use YYYY-MM-DD.')
  }

  const { abs, payload } = loadRegister(args.registerPath)

  const unresolved = []
  for (const requested of args.secrets) {
    const entry = payload.secrets.find((item) => matches(item, requested))
    if (!entry) {
      unresolved.push(requested)
      continue
    }

    const cadence = Number(entry.cadence_days)
    if (!Number.isFinite(cadence) || cadence <= 0) {
      throw new Error(`Invalid cadence_days for ${entry.name}`)
    }

    entry.last_rotated_at = formatDate(date)
    entry.next_due_at = formatDate(addDays(date, cadence))
    entry.rotated_by = args.rotatedBy
    entry.validation_status = args.validationStatus
    if (args.note) {
      entry.notes = args.note
    }
  }

  if (unresolved.length > 0) {
    throw new Error(`Secrets not found in register: ${unresolved.join(', ')}`)
  }

  payload.updated_at = new Date().toISOString().slice(0, 10)
  fs.writeFileSync(abs, JSON.stringify(payload, null, 2) + '\n', 'utf8')

  console.log(`[secrets-rotation] Register updated: ${abs}`)
  console.log(`[secrets-rotation] Rotated date: ${formatDate(date)} | by: ${args.rotatedBy}`)
  console.log(`[secrets-rotation] Updated secrets: ${args.secrets.join(', ')}`)
}

try {
  main()
} catch (error) {
  console.error(`[secrets-rotation] ERROR: ${error.message}`)
  process.exit(1)
}

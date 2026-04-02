#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs')
const path = require('path')

function parseArgs(argv) {
  const args = {
    registerPath: 'docs/engineering/runbooks/secrets-rotation-register.json',
    jsonOut: null,
  }

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i]
    if (token === '--register' && argv[i + 1]) {
      args.registerPath = argv[i + 1]
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

async function githubRequest(url, token) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'muuday-secrets-sync-audit',
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`GitHub API ${response.status}: ${text}`)
  }

  return response.json()
}

async function vercelRequest(url, token) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'User-Agent': 'muuday-secrets-sync-audit',
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Vercel API ${response.status}: ${text}`)
  }

  return response.json()
}

async function listGithubSecrets(repo, token) {
  const names = new Set()
  let page = 1

  while (true) {
    const data = await githubRequest(`https://api.github.com/repos/${repo}/actions/secrets?per_page=100&page=${page}`, token)
    const secrets = Array.isArray(data.secrets) ? data.secrets : []
    for (const item of secrets) {
      names.add(normalize(item.name))
    }
    if (secrets.length < 100) break
    page += 1
  }

  return names
}

async function listVercelEnvKeys(projectId, token, teamId) {
  const keys = new Set()
  let next = null

  while (true) {
    const base = new URL(`https://api.vercel.com/v10/projects/${projectId}/env`)
    base.searchParams.set('decrypt', 'false')
    base.searchParams.set('limit', '100')
    if (teamId) base.searchParams.set('teamId', teamId)
    if (next) base.searchParams.set('since', String(next))

    const data = await vercelRequest(base.toString(), token)
    const envs = Array.isArray(data.envs) ? data.envs : []

    for (const item of envs) {
      if (item && item.key) {
        keys.add(normalize(item.key))
      }
    }

    const pagination = data.pagination || {}
    if (!pagination.next) break
    next = pagination.next
  }

  return keys
}

function secretCovered(secret, availableSet) {
  const options = [secret.name, ...(Array.isArray(secret.aliases) ? secret.aliases : [])]
    .map(normalize)
    .filter(Boolean)

  return options.some((opt) => availableSet.has(opt))
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

async function main() {
  const args = parseArgs(process.argv)
  const { abs, payload } = loadRegister(args.registerPath)

  const githubRepo = process.env.GITHUB_REPOSITORY
  const githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  const vercelProjectId = process.env.VERCEL_PROJECT_ID
  const vercelToken = process.env.VERCEL_TOKEN
  const vercelTeamId = process.env.VERCEL_TEAM_ID || null

  if (!githubRepo) throw new Error('Missing GITHUB_REPOSITORY env.')
  if (!githubToken) throw new Error('Missing GITHUB_TOKEN (or GH_TOKEN).')
  if (!vercelProjectId) throw new Error('Missing VERCEL_PROJECT_ID env.')
  if (!vercelToken) throw new Error('Missing VERCEL_TOKEN env.')

  const [githubSecrets, vercelKeys] = await Promise.all([
    listGithubSecrets(githubRepo, githubToken),
    listVercelEnvKeys(vercelProjectId, vercelToken, vercelTeamId),
  ])

  const rows = []
  for (const secret of payload.secrets) {
    const targets = Array.isArray(secret.sync_targets) ? secret.sync_targets.map((t) => String(t).toLowerCase()) : []
    const expectsGithub = targets.includes('github')
    const expectsVercel = targets.includes('vercel')

    const githubOk = !expectsGithub || secretCovered(secret, githubSecrets)
    const vercelOk = !expectsVercel || secretCovered(secret, vercelKeys)

    rows.push({
      name: secret.name,
      aliases: secret.aliases || [],
      expects_github: expectsGithub,
      expects_vercel: expectsVercel,
      github_present: githubOk,
      vercel_present: vercelOk,
      status: githubOk && vercelOk ? 'ok' : 'missing',
    })
  }

  const missing = rows.filter((row) => row.status === 'missing')

  console.log(`[secrets-sync] Register: ${abs}`)
  console.log(`[secrets-sync] Repo: ${githubRepo}`)
  console.log(`[secrets-sync] Vercel project: ${vercelProjectId}`)
  console.log('')
  console.log('name | github | vercel | status')
  console.log('--- | --- | --- | ---')
  for (const row of rows) {
    const g = row.expects_github ? (row.github_present ? 'present' : 'missing') : 'n/a'
    const v = row.expects_vercel ? (row.vercel_present ? 'present' : 'missing') : 'n/a'
    console.log(`${row.name} | ${g} | ${v} | ${row.status}`)
  }

  if (args.jsonOut) {
    const outAbs = path.resolve(process.cwd(), args.jsonOut)
    ensureDir(outAbs)
    fs.writeFileSync(
      outAbs,
      JSON.stringify(
        {
          checked_at_utc: new Date().toISOString(),
          register_path: abs,
          github_repository: githubRepo,
          vercel_project_id: vercelProjectId,
          missing_count: missing.length,
          rows,
        },
        null,
        2,
      ),
      'utf8',
    )
    console.log(`\n[secrets-sync] JSON report written: ${outAbs}`)
  }

  if (missing.length > 0) {
    const names = missing.map((row) => row.name).join(', ')
    throw new Error(`Secrets missing in sync targets: ${names}`)
  }
}

main().catch((error) => {
  console.error(`[secrets-sync] ERROR: ${error.message}`)
  process.exit(1)
})

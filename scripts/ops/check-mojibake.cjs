const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const TARGET_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.md'])
const IGNORE_DIRS = new Set(['.git', '.next', 'node_modules', 'dist', 'build', 'coverage', 'docs', 'scripts'])
const SUSPICIOUS_PATTERNS = [
  /Ã[\x80-\xBF]/u,
  /â€/u,
  /â€™/u,
  /â€œ/u,
  /â€¢/u,
  /Â/u,
]

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, files)
      continue
    }
    if (!TARGET_EXTENSIONS.has(path.extname(entry.name))) continue
    files.push(full)
  }
  return files
}

const offenders = []
for (const file of walk(ROOT)) {
  const content = fs.readFileSync(file, 'utf8')
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(content)) {
      offenders.push(path.relative(ROOT, file))
      break
    }
  }
}

if (offenders.length > 0) {
  console.error('Mojibake pattern detected in:')
  offenders.forEach(file => console.error(`- ${file}`))
  process.exit(1)
}

console.log('Encoding check passed (no mojibake patterns found).')

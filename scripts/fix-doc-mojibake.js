const fs = require('fs')

/**
 * Fix common UTF-8 mojibake sequences that appear when smart punctuation
 * was decoded with the wrong encoding (e.g. â€” instead of —).
 *
 * This script is intentionally small and dependency-free.
 */

function fixMojibake(input) {
  let s = input

  // Common punctuation mojibake sequences.
  // Use unicode escapes so the source stays ASCII-only.
  const replacements = [
    ['\u00e2\u20ac\u201d', '\u2014'], // â€” -> —
    ['\u00e2\u20ac\u201c', '\u2013'], // â€“ -> –
    ['\u00e2\u20ac\u0153', '\u201c'], // â€œ -> “
    ['\u00e2\u20ac\u009d', '\u201d'], // â€ -> ”
    ['\u00e2\u20ac\u02dc', '\u2018'], // â€˜ -> ‘
    ['\u00e2\u20ac\u2122', '\u2019'], // â€™ -> ’
    ['\u00e2\u20ac\u00a6', '\u2026'], // â€¦ -> …
    ['\u00e2\u20ac\u00a2', '\u2022'], // â€¢ -> •
    ['\u00c2\u00a0', ' '], // Â  -> space
    ['\u00a0', ' '], // NBSP -> space
    ['\u00c2', ''], // stray Â
  ]

  for (const [from, to] of replacements) {
    s = s.split(from).join(to)
  }

  // Fix common double-UTF8 sequences for accents (e.g. SaÃºde -> Saúde).
  // Pattern "Ã." (U+00C3 + following char) is typical.
  s = s.replace(/\u00c3./g, m => Buffer.from(m, 'latin1').toString('utf8'))

  return s
}

function main() {
  const target = process.argv[2]
  if (!target) {
    console.error('Usage: node scripts/fix-doc-mojibake.js <path>')
    process.exit(2)
  }

  const before = fs.readFileSync(target, 'utf8')
  const after = fixMojibake(before)

  if (after === before) {
    console.log('No changes:', target)
    return
  }

  fs.writeFileSync(target, after, 'utf8')
  console.log('Updated:', target)
}

main()


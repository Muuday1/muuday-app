const HTML_TAG_REGEX = /<[^>]*>/g
const CONTROL_CHAR_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

function normalizeBase(value: string) {
  return value.replace(CONTROL_CHAR_REGEX, '').trim()
}

export function sanitizePlainText(value: string, maxLength?: number) {
  const withoutTags = normalizeBase(String(value || '').replace(HTML_TAG_REGEX, ' '))
  const normalized = withoutTags.replace(/\s+/g, ' ').trim()
  if (!maxLength || normalized.length <= maxLength) return normalized
  return normalized.slice(0, maxLength).trim()
}

export function sanitizeMultilineText(value: string, maxLength?: number) {
  const withoutTags = normalizeBase(String(value || '').replace(HTML_TAG_REGEX, ' '))
  const normalizedLines = withoutTags
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  const normalized = normalizedLines.join('\n').trim()
  if (!maxLength || normalized.length <= maxLength) return normalized
  return normalized.slice(0, maxLength).trim()
}

export function sanitizeHttpUrl(value: string) {
  const normalized = sanitizePlainText(value, 2048)
  if (!normalized) return ''

  try {
    const url = new URL(normalized)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    return url.toString()
  } catch {
    return ''
  }
}

export function sanitizePhoneNumber(value: string, maxLength = 32) {
  const normalized = sanitizePlainText(value, maxLength)
  return normalized.replace(/[^\d+()\-\s]/g, '').trim()
}
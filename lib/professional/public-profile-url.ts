const PROFILE_FALLBACK_SLUG = 'profissional'
const PUBLIC_CODE_MIN = 1000
const PUBLIC_CODE_MAX = 9999
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type BuildProfessionalProfilePathInput = {
  id?: string | null
  fullName?: string | null
  publicCode?: number | string | null
}

type ParsedProfessionalProfileParam =
  | { kind: 'uuid'; id: string }
  | { kind: 'publicCode'; code: number }
  | { kind: 'unknown'; raw: string }

export function slugifyProfessionalName(value?: string | null): string {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || PROFILE_FALLBACK_SLUG
}

export function normalizeProfessionalPublicCode(value?: number | string | null): string | null {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null
  const code = Math.trunc(parsed)
  if (code < PUBLIC_CODE_MIN || code > PUBLIC_CODE_MAX) return null
  return String(code).padStart(4, '0')
}

export function buildProfessionalProfilePath(input: BuildProfessionalProfilePathInput): string {
  const id = String(input.id || '').trim()
  if (id) {
    return `/profissional/${id}`
  }

  const code = normalizeProfessionalPublicCode(input.publicCode)
  if (!code) return '/buscar'

  const slug = slugifyProfessionalName(input.fullName)
  return `/profissional/${slug}-${code}`
}

export function parseProfessionalProfileParam(rawValue: string): ParsedProfessionalProfileParam {
  const normalized = decodeURIComponent(String(rawValue || '').trim())

  if (!normalized) {
    return { kind: 'unknown', raw: normalized }
  }

  if (UUID_V4_REGEX.test(normalized)) {
    return { kind: 'uuid', id: normalized }
  }

  const codeMatch = normalized.match(/-(\d{4})$/)
  if (codeMatch) {
    return { kind: 'publicCode', code: Number(codeMatch[1]) }
  }

  return { kind: 'unknown', raw: normalized }
}

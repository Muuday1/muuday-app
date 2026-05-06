/**
 * Detects cookies that look like Supabase auth token cookies.
 * These use the naming pattern: sb-<project-ref>-auth-token[.chunk-index]
 */
function isSupabaseAuthCookie(name: string): boolean {
  return name.startsWith('sb-') && name.includes('-auth-token')
}

/**
 * Validates that a string contains only valid base64url characters.
 * Valid chars: A-Z, a-z, 0-9, -, _
 * Ignored chars: spaces, tabs, newlines, carriage returns, =
 */
function isValidBase64URL(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)
    // Allow alphanumeric, -, _
    if (
      (code >= 0x41 && code <= 0x5a) || // A-Z
      (code >= 0x61 && code <= 0x7a) || // a-z
      (code >= 0x30 && code <= 0x39) || // 0-9
      code === 0x2d || // -
      code === 0x5f // _
    ) {
      continue
    }
    // Allow ignored chars: space, tab, newline, carriage return, =
    if (code === 0x20 || code === 0x09 || code === 0x0a || code === 0x0d || code === 0x3d) {
      continue
    }
    return false
  }
  return true
}

const BASE64_PREFIX = 'base64-'

/**
 * Sanitizes cookies before passing them to Supabase SSR.
 *
 * Problem: Supabase SSR's cookie storage (in @supabase/ssr) checks if a cookie
 * value starts with "base64-" and attempts to decode it with stringFromBase64URL.
 * If the cookie is corrupted (e.g. contains a `"` character from proxy mutation,
 * cookie size truncation, or manual tampering), the decoder throws a synchronous
 * error inside an async getItem, producing an unhandled rejection that crashes
 * the request.
 *
 * Fix: Filter out corrupted base64-prefixed Supabase auth cookies before
 * Supabase sees them. Treat them as absent (user appears logged out) and let
 * Supabase set fresh cookies on the next successful auth operation.
 *
 * @see https://github.com/supabase/supabase-js/issues/            (related)
 */
export function sanitizeSupabaseCookies(
  cookies: { name: string; value: string }[],
): { name: string; value: string }[] {
  return cookies.filter((cookie) => {
    if (!isSupabaseAuthCookie(cookie.name)) {
      return true
    }

    if (!cookie.value.startsWith(BASE64_PREFIX)) {
      return true
    }

    const base64Part = cookie.value.slice(BASE64_PREFIX.length)
    if (isValidBase64URL(base64Part)) {
      return true
    }

    // Corrupted base64 cookie — drop it so Supabase doesn't crash trying to decode it
    return false
  })
}

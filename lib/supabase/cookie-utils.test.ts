import { describe, it, expect } from 'vitest'
import { sanitizeSupabaseCookies } from './cookie-utils'

describe('sanitizeSupabaseCookies', () => {
  it('passes through non-supabase cookies unchanged', () => {
    const cookies = [
      { name: 'foo', value: 'bar' },
      { name: 'session', value: 'abc123' },
    ]
    expect(sanitizeSupabaseCookies(cookies)).toEqual(cookies)
  })

  it('passes through valid raw-encoded supabase auth cookies', () => {
    const cookies = [
      { name: 'sb-abc123-auth-token', value: '{"access_token":"xyz"}' },
      { name: 'sb-abc123-auth-token.0', value: '{"refresh_token":"abc"}' },
    ]
    expect(sanitizeSupabaseCookies(cookies)).toEqual(cookies)
  })

  it('passes through valid base64-encoded supabase auth cookies', () => {
    const cookies = [
      { name: 'sb-abc123-auth-token', value: 'base64-eyJhY2Nlc3NfdG9rZW4iOiJ4eXoifQ' },
      { name: 'sb-abc123-auth-token.0', value: 'base64-ab-c_d=' },
    ]
    expect(sanitizeSupabaseCookies(cookies)).toEqual(cookies)
  })

  it('filters out corrupted base64-encoded supabase auth cookies', () => {
    const cookies = [
      { name: 'sb-abc123-auth-token', value: 'base64-eyJhY2Nlc3NfdG9rZW4iOiJ4eXoifQ' },
      { name: 'sb-abc123-auth-token.0', value: 'base64-invalid"char' },
      { name: 'sb-abc123-auth-token.1', value: 'base64-abc{def' },
      { name: 'regular-cookie', value: 'safe-value' },
    ]
    const result = sanitizeSupabaseCookies(cookies)
    expect(result).toHaveLength(2)
    expect(result.map(c => c.name)).toEqual([
      'sb-abc123-auth-token',
      'regular-cookie',
    ])
  })

  it('filters out corrupted cookies with quote at large position', () => {
    const base64Part = 'a'.repeat(5536) + '"' + 'b'.repeat(100)
    const cookies = [
      { name: 'sb-abc123-auth-token', value: `base64-${base64Part}` },
    ]
    expect(sanitizeSupabaseCookies(cookies)).toEqual([])
  })

  it('handles empty cookie list', () => {
    expect(sanitizeSupabaseCookies([])).toEqual([])
  })
})

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
// TODO: Re-enable Database generic after schema alignment (P3.7)
// import type { Database } from '@/types/supabase-generated'

function normalizeKey(key: string | undefined | null) {
  if (!key) return ''
  let normalized = key.trim()
  if (normalized.startsWith('"') && normalized.endsWith('"') && normalized.length >= 2) {
    normalized = normalized.slice(1, -1)
  }
  return normalized.replace(/\s+/g, '')
}

function isServiceRoleLikeKey(key: string) {
  if (!key) return false

  if (key.startsWith('sb_secret_')) return true
  if (key.startsWith('sb_publishable_') || key.startsWith('sb_anon_')) return false

  const parts = key.split('.')
  if (parts.length !== 3) return false

  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
    return payload?.role === 'service_role'
  } catch {
    return false
  }
}

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = normalizeKey(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  )

  if (!supabaseUrl || !serviceRoleKey || !isServiceRoleLikeKey(serviceRoleKey)) {
    return null
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Always use getUser() — never fall back to getSession().
 * getSession() reads from cookies and can be spoofed; getUser()
 * validates the JWT with Supabase Auth and is the secure source
 * of truth for server-side identity.
 */
export async function getUserSafe<TUser = unknown>(
  supabase: SupabaseClient,
): Promise<TUser | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return (user as TUser | null) || null
  } catch {
    return null
  }
}


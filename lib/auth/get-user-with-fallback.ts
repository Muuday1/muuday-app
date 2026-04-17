type SupabaseAuthClientLike = {
  auth: {
    getUser: () => Promise<{ data: { user: unknown | null } }>
  }
}

/**
 * Always use getUser() — never fall back to getSession().
 * getSession() reads from cookies and can be spoofed; getUser()
 * validates the JWT with Supabase Auth and is the secure source
 * of truth for server-side identity.
 */
export async function getUserWithSessionFallback<TUser = unknown>(
  supabase: SupabaseAuthClientLike,
): Promise<TUser | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (user as TUser | null) || null
}


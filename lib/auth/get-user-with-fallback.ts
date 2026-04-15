type SupabaseAuthClientLike = {
  auth: {
    getUser: () => Promise<{ data: { user: unknown | null } }>
    getSession: () => Promise<{ data: { session: { user?: unknown | null } | null } }>
  }
}

export async function getUserWithSessionFallback<TUser = unknown>(
  supabase: SupabaseAuthClientLike,
): Promise<TUser | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) return user as TUser

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (session?.user as TUser | null) || null
}


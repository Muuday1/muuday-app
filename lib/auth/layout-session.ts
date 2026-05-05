import { cache } from 'react'
import type { User } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/server'
import { getUserSafe } from '@/lib/auth/get-user-with-fallback'

type LayoutProfile = {
  full_name: string | null
  role: string | null
  avatar_url: string | null
}

type LayoutSession = {
  user: User | null
  profile: LayoutProfile | null
}

export const getLayoutSession = cache(async (): Promise<LayoutSession> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return { user: null, profile: null }
  }

  try {
    const supabase = await createClient()
    const user = await getUserSafe<User>(supabase)

    if (!user) {
      return { user: null, profile: null }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name,role,avatar_url')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      Sentry.captureException(profileError, { tags: { area: 'layout_session' } })
    }

    return {
      user,
      profile: (profile || null) as LayoutProfile | null,
    }
  } catch {
    return { user: null, profile: null }
  }
})

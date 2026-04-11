import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

type LayoutProfile = {
  full_name: string | null
  role: string | null
  avatar_url: string | null
}

type LayoutSession = {
  user: any | null
  profile: LayoutProfile | null
}

export const getLayoutSession = cache(async (): Promise<LayoutSession> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return { user: null, profile: null }
  }

  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { user: null, profile: null }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name,role,avatar_url')
      .eq('id', user.id)
      .maybeSingle()

    return {
      user,
      profile: (profile || null) as LayoutProfile | null,
    }
  } catch {
    return { user: null, profile: null }
  }
})

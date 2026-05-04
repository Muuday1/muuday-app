import { createBrowserClient } from '@supabase/ssr'
// TODO: Re-enable Database generic after schema alignment (P3.7)
// import type { Database } from '@/types/supabase-generated'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

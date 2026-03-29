import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getAppBaseUrl } from '@/lib/config/app-url'

export async function POST() {
  const supabase = createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', getAppBaseUrl()))
}

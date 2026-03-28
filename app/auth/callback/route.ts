import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Use app URL from env to prevent open redirect attacks
function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const baseUrl = getBaseUrl()

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)

    // Check if the user's profile has country set (social login users won't have it)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('country, role')
        .eq('id', user.id)
        .single()

      // If no country set, redirect to complete account (social login flow)
      if (!profile?.country) {
        return NextResponse.redirect(`${baseUrl}/completar-conta`)
      }
    }
  }

  return NextResponse.redirect(`${baseUrl}/buscar`)
}

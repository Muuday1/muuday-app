import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getAppBaseUrl } from '@/lib/config/app-url'

// Use app URL from env to prevent open redirect attacks
function getBaseUrl() {
  return getAppBaseUrl()
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const oauthError = searchParams.get('error')
  const baseUrl = getBaseUrl()

  if (oauthError) {
    return NextResponse.redirect(`${baseUrl}/login?erro=oauth`)
  }

  if (code) {
    const supabase = createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      return NextResponse.redirect(`${baseUrl}/login?erro=oauth`)
    }

    // Check if the user's profile has country set (social login users won't have it)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, country, role')
        .eq('id', user.id)
        .maybeSingle()

      // If social signup did not create profile row, bootstrap it here.
      if (!profile) {
        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'Usuario'

        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email || '',
          full_name: String(fullName),
          role: 'usuario',
        })

        return NextResponse.redirect(`${baseUrl}/completar-conta`)
      }

      // If no country set, redirect to complete account (social login flow)
      if (!profile?.country) {
        return NextResponse.redirect(`${baseUrl}/completar-conta`)
      }

      if (profile.role === 'profissional') {
        return NextResponse.redirect(`${baseUrl}/dashboard`)
      }

      if (profile.role === 'admin') {
        return NextResponse.redirect(`${baseUrl}/buscar`)
      }

      return NextResponse.redirect(`${baseUrl}/buscar`)
    }

    return NextResponse.redirect(`${baseUrl}/login?erro=oauth`)
  }

  return NextResponse.redirect(`${baseUrl}/login?erro=oauth`)
}

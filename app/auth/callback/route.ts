import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { resolvePostLoginDestination } from '@/lib/auth/post-login-destination'

function getBaseUrl(request: NextRequest) {
  // Keep OAuth callback on the same origin that started the login flow.
  // This avoids cookie/domain drift between custom domain and vercel domain.
  return request.nextUrl.origin
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const oauthError = searchParams.get('error')
  const roleHint = searchParams.get('role') === 'profissional' ? 'profissional' : 'usuario'
  const baseUrl = getBaseUrl(request)

  if (oauthError || !code) {
    return NextResponse.redirect(`${baseUrl}/login?erro=oauth`)
  }

  const supabase = createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    return NextResponse.redirect(`${baseUrl}/login?erro=oauth`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${baseUrl}/login?erro=oauth`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, country, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Usuário'

    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email || '',
      full_name: String(fullName),
      role: roleHint,
    })

    const { data: profileAfterUpsert } = await supabase
      .from('profiles')
      .select('country, role')
      .eq('id', user.id)
      .maybeSingle()

    if (!profileAfterUpsert?.country) {
      return NextResponse.redirect(`${baseUrl}/completar-conta`)
    }

    return NextResponse.redirect(
      `${baseUrl}${resolvePostLoginDestination(profileAfterUpsert.role)}`,
    )
  }

  if (!profile.country) {
    return NextResponse.redirect(`${baseUrl}/completar-conta`)
  }

  return NextResponse.redirect(`${baseUrl}${resolvePostLoginDestination(profile.role)}`)
}

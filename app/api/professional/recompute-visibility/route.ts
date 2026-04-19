import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { recomputeProfessionalVisibility } from '@/lib/professional/public-visibility'

export async function POST(request: Request) {
  const ip = getClientIp(request as never)
  const rl = await rateLimit('recomputeVisibility', `recompute-visibility:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Muitas requisicoes. Tente novamente mais tarde.' }, { status: 429 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'profissional') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id, 'id')
  if (!professional?.id) {
    return NextResponse.json({ error: 'Professional profile not found' }, { status: 404 })
  }

  const result = await recomputeProfessionalVisibility(supabase, professional.id)
  if (!result.ok) {
    return NextResponse.json(
      {
        error: 'Failed to recompute visibility',
        details: result.reason,
      },
      { status: 500 },
    )
  }

  return NextResponse.json({
    ok: true,
    professionalId: result.professionalId,
    isPubliclyVisible: result.isPubliclyVisible,
    visibilityCheckedAt: result.visibilityCheckedAt,
  })
}

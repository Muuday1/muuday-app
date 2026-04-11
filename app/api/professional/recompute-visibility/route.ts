import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { recomputeProfessionalVisibility } from '@/lib/professional/public-visibility'

export async function POST() {
  const supabase = createClient()
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

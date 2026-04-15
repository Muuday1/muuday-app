import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import {
  createTermViewProofToken,
  extractRequestIp,
} from '@/lib/legal/term-acceptance-proof'
import {
  PROFESSIONAL_REQUIRED_TERMS,
  PROFESSIONAL_TERMS_VERSION,
  type ProfessionalTermKey,
} from '@/lib/legal/professional-terms'

const payloadSchema = z.object({
  termKey: z.enum(PROFESSIONAL_REQUIRED_TERMS as [ProfessionalTermKey, ...ProfessionalTermKey[]]),
})

export async function POST(request: Request) {
  const parsed = payloadSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Termo inválido.' }, { status: 400 })
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 })
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!profile || profile.role !== 'profissional') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id, 'id')
  if (!professional?.id) {
    return NextResponse.json({ error: 'Perfil profissional não encontrado.' }, { status: 404 })
  }

  try {
    const token = createTermViewProofToken({
      userId: user.id,
      professionalId: professional.id,
      termKey: parsed.data.termKey,
      termVersion: PROFESSIONAL_TERMS_VERSION,
      ip: extractRequestIp(request.headers),
      userAgent: request.headers.get('user-agent') || '',
    })
    return NextResponse.json({ ok: true, token, termVersion: PROFESSIONAL_TERMS_VERSION })
  } catch {
    return NextResponse.json({ error: 'Não foi possível preparar a validação do termo.' }, { status: 503 })
  }
}

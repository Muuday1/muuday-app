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

function isMissingTableError(error: { code?: string; message?: string; details?: string } | null | undefined) {
  if (!error) return false
  const haystack = `${String(error.code || '')} ${String(error.message || '')} ${String(error.details || '')}`.toLowerCase()
  return haystack.includes('42p01') || haystack.includes('does not exist')
}

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
    const viewEventId = crypto.randomUUID()
    const now = new Date()
    const openedAt = now.toISOString()
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString()
    const ip = extractRequestIp(request.headers)
    const userAgent = request.headers.get('user-agent') || ''

    const { error: viewEventError } = await supabase.from('professional_term_view_events').insert({
      id: viewEventId,
      professional_id: professional.id,
      opened_by: user.id,
      term_key: parsed.data.termKey,
      term_version: PROFESSIONAL_TERMS_VERSION,
      opened_at: openedAt,
      expires_at: expiresAt,
      ip,
      user_agent: userAgent,
    })

    if (viewEventError) {
      if (isMissingTableError(viewEventError)) {
        return NextResponse.json(
          { error: 'Base de termos desatualizada. Execute a migration 049 para continuar.' },
          { status: 500 },
        )
      }
      return NextResponse.json({ error: 'Não foi possível registrar a abertura do termo.' }, { status: 500 })
    }

    const token = createTermViewProofToken({
      userId: user.id,
      professionalId: professional.id,
      termKey: parsed.data.termKey,
      termVersion: PROFESSIONAL_TERMS_VERSION,
      viewEventId,
      ip,
      userAgent,
    })

    return NextResponse.json({ ok: true, token, termVersion: PROFESSIONAL_TERMS_VERSION })
  } catch {
    return NextResponse.json({ error: 'Não foi possível preparar a validação do termo.' }, { status: 503 })
  }
}

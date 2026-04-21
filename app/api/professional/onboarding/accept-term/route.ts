import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  getProfessionalTermTextHash,
  PROFESSIONAL_REQUIRED_TERMS,
  PROFESSIONAL_TERMS_VERSION,
  type ProfessionalTermKey,
} from '@/lib/legal/professional-terms'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { extractRequestIp, verifyTermViewProofToken } from '@/lib/legal/term-acceptance-proof'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'

const payloadSchema = z.object({
  termKey: z.enum(PROFESSIONAL_REQUIRED_TERMS as [ProfessionalTermKey, ...ProfessionalTermKey[]]),
  termViewToken: z.string().min(20),
})

function isMissingTableError(error: { code?: string; message?: string; details?: string } | null | undefined) {
  if (!error) return false
  const haystack = `${String(error.code || '')} ${String(error.message || '')} ${String(error.details || '')}`.toLowerCase()
  return haystack.includes('42p01') || haystack.includes('does not exist')
}

export async function POST(request: Request) {
  const clientIp = getClientIp(request as never)
  const rl = await rateLimit('acceptTerm', `accept-term:${clientIp}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Muitas requisicoes. Tente novamente mais tarde.' }, { status: 429 })
  }

  const parsed = payloadSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Termo inválido.' }, { status: 400 })
  }

  const supabase = await createClient()
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

  const ip = extractRequestIp(request.headers)
  const userAgent = request.headers.get('user-agent') || ''
  const proofCheck = verifyTermViewProofToken({
    token: parsed.data.termViewToken,
    expectedUserId: user.id,
    expectedProfessionalId: professional.id,
    expectedTermKey: parsed.data.termKey,
    expectedTermVersion: PROFESSIONAL_TERMS_VERSION,
    currentIp: ip,
    currentUserAgent: userAgent,
  })

  if (!proofCheck.ok || !proofCheck.viewEventId) {
    return NextResponse.json(
      { error: 'Abra o termo e permaneça na leitura antes de aceitar.' },
      { status: 400 },
    )
  }

  const db = supabase
  const termKey = parsed.data.termKey
  const textHash = getProfessionalTermTextHash(termKey)
  if (!textHash) {
    return NextResponse.json({ error: 'Termo não encontrado.' }, { status: 400 })
  }

  const nowIso = new Date().toISOString()
  const minOpenedAtIso = new Date(Date.now() - 3000).toISOString()
  const { data: consumedEvent, error: consumeError } = await db
    .from('professional_term_view_events')
    .update({ consumed_at: nowIso })
    .eq('id', proofCheck.viewEventId)
    .eq('professional_id', professional.id)
    .eq('opened_by', user.id)
    .eq('term_key', termKey)
    .eq('term_version', PROFESSIONAL_TERMS_VERSION)
    .is('consumed_at', null)
    .lte('opened_at', minOpenedAtIso)
    .gt('expires_at', nowIso)
    .select('id')
    .maybeSingle()

  if (consumeError) {
    if (isMissingTableError(consumeError)) {
      return NextResponse.json(
        { error: 'Base de termos desatualizada. Execute a migration 049 para continuar.' },
        { status: 500 },
      )
    }
    return NextResponse.json({ error: 'Não foi possível validar o comprovante de leitura.' }, { status: 500 })
  }

  if (!consumedEvent?.id) {
    return NextResponse.json(
      { error: 'Comprovante de leitura inválido, expirado ou já utilizado.' },
      { status: 400 },
    )
  }

  const { error } = await db.from('professional_term_acceptances').upsert(
    {
      professional_id: professional.id,
      accepted_by: user.id,
      term_key: termKey,
      term_version: PROFESSIONAL_TERMS_VERSION,
      text_hash: textHash,
      accepted_at: new Date().toISOString(),
      ip,
      user_agent: userAgent,
    },
    { onConflict: 'professional_id,term_key,term_version' },
  )

  if (error) {
    return NextResponse.json({ error: 'Não foi possível registrar este aceite agora.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, termKey, termVersion: PROFESSIONAL_TERMS_VERSION })
}

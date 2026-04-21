import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'

const PROFILE_MEDIA_BUCKET = 'professional-profile-media'

function mapStorageError(error: { message?: string; details?: string; code?: string } | null | undefined) {
  const text = `${String(error?.code || '')} ${String(error?.message || '')} ${String(error?.details || '')}`.toLowerCase()
  if (text.includes('bucket') && text.includes('not')) {
    return 'Bucket professional-profile-media nao encontrado.'
  }
  if (text.includes('42501') || text.includes('permission denied') || text.includes('row-level security')) {
    return 'Sem permissao para upload autenticado no bucket professional-profile-media.'
  }
  return 'Nao foi possivel validar storage de foto no momento.'
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sessao invalida.' }, { status: 401 })
  }

  const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id, 'id')
  if (!professional?.id) {
    return NextResponse.json({ ok: false, error: 'Perfil profissional nao encontrado.' }, { status: 404 })
  }

  const probePath = `${professional.id}/.health-${Date.now()}.txt`
  const probeContent = new Blob(['ok'], { type: 'text/plain' })
  const uploadResult = await supabase.storage.from(PROFILE_MEDIA_BUCKET).upload(probePath, probeContent, {
    contentType: 'text/plain',
    upsert: false,
    cacheControl: '0',
  })
  if (uploadResult.error) {
    return NextResponse.json({ ok: false, error: mapStorageError(uploadResult.error) }, { status: 503 })
  }

  await supabase.storage.from(PROFILE_MEDIA_BUCKET).remove([probePath])
  return NextResponse.json({ ok: true })
}


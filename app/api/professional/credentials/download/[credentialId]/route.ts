import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const CREDENTIALS_BUCKET = 'professional-credentials'
const STORAGE_URI_PREFIX = `storage://${CREDENTIALS_BUCKET}/`
const LEGACY_PUBLIC_MARKER = `/storage/v1/object/public/${CREDENTIALS_BUCKET}/`
const LEGACY_SIGNED_MARKER = `/storage/v1/object/sign/${CREDENTIALS_BUCKET}/`

function extractStoragePath(value: string): string | null {
  const normalized = String(value || '').trim()
  if (!normalized) return null

  if (normalized.startsWith(STORAGE_URI_PREFIX)) {
    return decodeURIComponent(normalized.slice(STORAGE_URI_PREFIX.length))
  }

  const publicIndex = normalized.indexOf(LEGACY_PUBLIC_MARKER)
  if (publicIndex !== -1) {
    return decodeURIComponent(normalized.slice(publicIndex + LEGACY_PUBLIC_MARKER.length).split('?')[0])
  }

  const signedIndex = normalized.indexOf(LEGACY_SIGNED_MARKER)
  if (signedIndex !== -1) {
    return decodeURIComponent(normalized.slice(signedIndex + LEGACY_SIGNED_MARKER.length).split('?')[0])
  }

  return null
}

export async function GET(
  _request: NextRequest,
  context: { params: { credentialId: string } },
) {
  const credentialId = String(context.params.credentialId || '').trim()
  if (!credentialId) {
    return NextResponse.json({ error: 'credentialId obrigatorio.' }, { status: 400 })
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Sessao invalida.' }, { status: 401 })
  }

  const { data: credential, error } = await supabase
    .from('professional_credentials')
    .select('id,file_url')
    .eq('id', credentialId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!credential?.id) {
    return NextResponse.json({ error: 'Comprovante nao encontrado.' }, { status: 404 })
  }

  const fileUrl = String(credential.file_url || '').trim()
  if (!fileUrl) {
    return NextResponse.json({ error: 'Comprovante sem URL de arquivo.' }, { status: 422 })
  }

  const storagePath = extractStoragePath(fileUrl)
  if (!storagePath) {
    return NextResponse.json({ error: 'Formato de arquivo nao suportado.' }, { status: 422 })
  }

  const admin = createAdminClient()
  if (admin) {
    const { data, error: signedError } = await admin.storage
      .from(CREDENTIALS_BUCKET)
      .createSignedUrl(storagePath, 60)

    if (signedError || !data?.signedUrl) {
      return NextResponse.json({ error: signedError?.message || 'Falha ao assinar URL do arquivo.' }, { status: 500 })
    }

    return NextResponse.redirect(data.signedUrl)
  }

  const { data, error: signedError } = await supabase.storage
    .from(CREDENTIALS_BUCKET)
    .createSignedUrl(storagePath, 60)

  if (signedError || !data?.signedUrl) {
    return NextResponse.json({ error: signedError?.message || 'Falha ao assinar URL do arquivo.' }, { status: 500 })
  }

  return NextResponse.redirect(data.signedUrl)
}

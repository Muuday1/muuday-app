import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { validateFileSignature } from '@/lib/security/file-signature'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'

const CREDENTIALS_BUCKET = 'professional-credentials'
const STORAGE_URI_PREFIX = `storage://${CREDENTIALS_BUCKET}/`
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png'])
const ALLOWED_KINDS = ['pdf', 'jpg', 'png'] as const
const CREDENTIAL_TYPES = new Set(['diploma', 'license', 'certification', 'other'])

function sanitizeFilename(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120)
}

function safeQualificationName(value: unknown) {
  const text = String(value || '').trim()
  return text ? text.slice(0, 120) : 'Comprovante'
}

function resolveCredentialType(value: unknown): 'diploma' | 'license' | 'certification' | 'other' {
  const normalized = String(value || '').trim().toLowerCase()
  if (CREDENTIAL_TYPES.has(normalized)) {
    return normalized as 'diploma' | 'license' | 'certification' | 'other'
  }
  return 'other'
}

function extractStoragePath(fileUrl: string, bucket: string) {
  const normalized = String(fileUrl || '').trim()
  if (!normalized) return null

  const storagePrefix = `storage://${bucket}/`
  if (normalized.startsWith(storagePrefix)) {
    return decodeURIComponent(normalized.slice(storagePrefix.length))
  }

  const publicMarker = `/storage/v1/object/public/${bucket}/`
  const signedMarker = `/storage/v1/object/sign/${bucket}/`

  const publicIndex = normalized.indexOf(publicMarker)
  if (publicIndex !== -1) {
    return decodeURIComponent(normalized.slice(publicIndex + publicMarker.length).split('?')[0])
  }

  const signedIndex = normalized.indexOf(signedMarker)
  if (signedIndex !== -1) {
    return decodeURIComponent(normalized.slice(signedIndex + signedMarker.length).split('?')[0])
  }

  return null
}

type ResolvedProfessionalContext =
  | {
      ok: true
      supabase: ReturnType<typeof createClient>
      professionalId: string
    }
  | {
      ok: false
      response: NextResponse
    }

async function resolveProfessionalContext(): Promise<ResolvedProfessionalContext> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'Sessao invalida.' }, { status: 401 }) }
  }

  const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id, 'id')
  if (!professional?.id) {
    return { ok: false, response: NextResponse.json({ error: 'Perfil profissional nao encontrado.' }, { status: 404 }) }
  }

  return { ok: true, supabase, professionalId: professional.id }
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request as never)
    const rl = await rateLimit('credentialsUpload', `credentials-upload:${ip}`)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Muitas requisicoes. Tente novamente mais tarde.' }, { status: 429 })
    }

    const authResult = await resolveProfessionalContext()
    if (!authResult.ok) return authResult.response

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo obrigatorio.' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Formato invalido. Use PDF, JPG ou PNG.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'Arquivo excede 2MB.' }, { status: 400 })
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    const signatureValidation = validateFileSignature({
      bytes,
      claimedMimeType: file.type,
      allowedKinds: ALLOWED_KINDS,
    })
    if (!signatureValidation.ok) {
      return NextResponse.json({ error: signatureValidation.error }, { status: 400 })
    }

    const qualificationName = safeQualificationName(formData.get('qualificationName'))
    const credentialType = resolveCredentialType(formData.get('credentialType'))

    const safeBaseName = sanitizeFilename(file.name.replace(/\.[^.]+$/, '')) || 'credential'
    const filePath = `${authResult.professionalId}/${Date.now()}-${randomUUID()}-${safeBaseName}.${signatureValidation.extension}`

    const { error: uploadError } = await authResult.supabase.storage.from(CREDENTIALS_BUCKET).upload(filePath, bytes, {
      contentType: signatureValidation.canonicalMimeType,
      upsert: false,
      cacheControl: '3600',
    })

    if (uploadError) {
      return NextResponse.json({ error: 'Falha no upload do arquivo.' }, { status: 500 })
    }

    const dbFileName = `${qualificationName}::${file.name}`
    const { data: inserted, error: insertError } = await authResult.supabase
      .from('professional_credentials')
      .insert({
        professional_id: authResult.professionalId,
        file_url: `${STORAGE_URI_PREFIX}${encodeURIComponent(filePath)}`,
        file_name: dbFileName,
        credential_type: credentialType,
        verified: false,
        scan_status: 'pending_scan',
        scan_checked_at: null,
      })
      .select('id,file_name,file_url,scan_status,verified,credential_type')
      .single()

    if (insertError) {
      await authResult.supabase.storage.from(CREDENTIALS_BUCKET).remove([filePath])
      return NextResponse.json({ error: 'Falha ao registrar comprovante.' }, { status: 500 })
    }

    return NextResponse.json({
      credential: inserted,
      downloadUrl: `/api/professional/credentials/download/${inserted.id}`,
    })
  } catch {
    return NextResponse.json({ error: 'Erro inesperado no upload.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await resolveProfessionalContext()
    if (!authResult.ok) return authResult.response

    const payload = (await request.json().catch(() => ({}))) as { credentialId?: string }
    const credentialId = String(payload.credentialId || '').trim()
    if (!credentialId) {
      return NextResponse.json({ error: 'credentialId obrigatorio.' }, { status: 400 })
    }

    const { data: credentialRow, error: credentialError } = await authResult.supabase
      .from('professional_credentials')
      .select('id,file_url')
      .eq('id', credentialId)
      .eq('professional_id', authResult.professionalId)
      .maybeSingle()

    if (credentialError) {
      return NextResponse.json({ error: 'Erro ao buscar comprovante.' }, { status: 500 })
    }

    if (!credentialRow?.id) {
      return NextResponse.json({ error: 'Comprovante nao encontrado.' }, { status: 404 })
    }

    const { error: deleteDbError } = await authResult.supabase
      .from('professional_credentials')
      .delete()
      .eq('id', credentialId)
      .eq('professional_id', authResult.professionalId)

    if (deleteDbError) {
      return NextResponse.json({ error: 'Falha ao remover comprovante.' }, { status: 500 })
    }

    const storagePath = extractStoragePath(String(credentialRow.file_url || ''), CREDENTIALS_BUCKET)
    if (storagePath) {
      await authResult.supabase.storage.from(CREDENTIALS_BUCKET).remove([storagePath])
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro inesperado ao remover comprovante.' }, { status: 500 })
  }
}

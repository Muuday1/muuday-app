import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { validateFileSignature } from '@/lib/security/file-signature'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'

const PROFILE_MEDIA_BUCKET = 'professional-profile-media'
const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const ALLOWED_KINDS = ['jpg', 'png', 'webp'] as const
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60 * 24 * 30 // 30 days

function getStorageUploadErrorMessage(error: { message?: string; details?: string; code?: string } | null | undefined) {
  const text = `${String(error?.code || '')} ${String(error?.message || '')} ${String(error?.details || '')}`.toLowerCase()
  if (text.includes('bucket') && text.includes('not')) {
    return 'Bucket professional-profile-media nao encontrado. Configure o bucket antes de enviar fotos.'
  }
  if (text.includes('42501') || text.includes('permission denied') || text.includes('row-level security')) {
    return 'Sem permissao para upload de foto. Ajuste as policies do bucket professional-profile-media.'
  }
  return 'Falha no upload do arquivo.'
}

async function createProfileMediaSignedUrl(
  storage: { createSignedUrl: (path: string, expiresIn: number) => Promise<{ data: { signedUrl?: string | null } | null; error: { message?: string } | null }> },
  path: string,
) {
  const { data, error } = await storage.createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS)
  if (error || !data?.signedUrl) {
    throw new Error(error?.message || 'Nao foi possivel gerar URL assinada para a foto.')
  }
  return data.signedUrl
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request as never)
    const rl = await rateLimit('profileMediaUpload', `profile-media-upload:${ip}`)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Muitas requisicoes. Tente novamente mais tarde.' }, { status: 429 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Sessao invalida.' }, { status: 401 })
    }

    const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id, 'id')
    if (!professional?.id) {
      return NextResponse.json({ error: 'Perfil profissional nao encontrado.' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo obrigatorio.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'Arquivo acima de 3MB.' }, { status: 400 })
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    const signatureValidation = validateFileSignature({
      bytes,
      claimedMimeType: '',
      allowedKinds: ALLOWED_KINDS,
    })
    if (!signatureValidation.ok) {
      return NextResponse.json({ error: signatureValidation.error }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(signatureValidation.canonicalMimeType)) {
      return NextResponse.json({ error: 'Formato invalido. Use JPG, PNG ou WEBP.' }, { status: 400 })
    }

    const filePath = `${professional.id}/${Date.now()}-${randomUUID()}.${signatureValidation.extension}`

    const { data: bucket, error: bucketError } = await supabase.storage.getBucket(PROFILE_MEDIA_BUCKET)
    if (bucketError || !bucket) {
      return NextResponse.json(
        { error: 'Bucket professional-profile-media nao encontrado ou inacessivel.' },
        { status: 503 },
      )
    }
    if (Boolean((bucket as { public?: boolean }).public)) {
      return NextResponse.json(
        { error: 'Bucket professional-profile-media deve permanecer privado.' },
        { status: 503 },
      )
    }

    const { error: uploadError } = await supabase.storage.from(PROFILE_MEDIA_BUCKET).upload(filePath, bytes, {
      contentType: signatureValidation.canonicalMimeType,
      upsert: false,
      cacheControl: '3600',
    })

    if (uploadError) {
      return NextResponse.json({ error: getStorageUploadErrorMessage(uploadError) }, { status: 500 })
    }

    const signedUrl = await createProfileMediaSignedUrl(supabase.storage.from(PROFILE_MEDIA_BUCKET), filePath)

    return NextResponse.json({
      signedUrl,
      path: filePath,
    })
  } catch {
    return NextResponse.json({ error: 'Erro inesperado no upload da foto.' }, { status: 500 })
  }
}

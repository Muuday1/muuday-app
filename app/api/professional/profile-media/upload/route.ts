import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'

const PROFILE_MEDIA_BUCKET = 'professional-profile-media'
const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function sanitizeFilename(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120)
}

async function ensureProfileMediaBucket(admin: NonNullable<ReturnType<typeof createAdminClient>>) {
  const { data: bucket } = await admin.storage.getBucket(PROFILE_MEDIA_BUCKET)
  if (bucket) return

  const { error } = await admin.storage.createBucket(PROFILE_MEDIA_BUCKET, {
    public: true,
    fileSizeLimit: String(MAX_FILE_SIZE_BYTES),
    allowedMimeTypes: Array.from(ALLOWED_TYPES),
  })

  if (error && !String(error.message || '').toLowerCase().includes('already')) {
    throw error
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
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

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Formato invalido. Use JPG, PNG ou WEBP.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'Arquivo acima de 3MB.' }, { status: 400 })
    }

    const admin = createAdminClient()
    if (!admin) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY nao configurada.' }, { status: 503 })
    }

    await ensureProfileMediaBucket(admin)

    const ext = file.name.includes('.') ? file.name.split('.').pop() || 'bin' : 'bin'
    const safeBaseName = sanitizeFilename(file.name.replace(/\.[^.]+$/, '')) || 'profile-photo'
    const filePath = `${professional.id}/${Date.now()}-${safeBaseName}.${ext}`

    const bytes = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await admin.storage.from(PROFILE_MEDIA_BUCKET).upload(filePath, bytes, {
      contentType: file.type,
      upsert: false,
      cacheControl: '3600',
    })

    if (uploadError) {
      return NextResponse.json({ error: `Falha no upload: ${uploadError.message}` }, { status: 500 })
    }

    const { data: publicData } = admin.storage.from(PROFILE_MEDIA_BUCKET).getPublicUrl(filePath)

    return NextResponse.json({
      publicUrl: publicData.publicUrl,
      path: filePath,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado no upload.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

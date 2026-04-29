import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { runOcrPipeline } from '@/lib/kyc/ocr-pipeline'
import type { OcrStatus, OcrProvider } from '@/lib/kyc/types'

const payloadSchema = z.object({
  credentialId: z.string().uuid(),
  provider: z.enum(['textract', 'document-ai', 'manual']).optional().default('textract'),
})

export async function POST(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'kyc', message: 'POST /api/v1/kyc/scan', level: 'info' })

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1KycScan', `api-v1-kyc-scan:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  const supabase = await createApiClient(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const parsed = payloadSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload.', details: parsed.error.issues },
      { status: 400 },
    )
  }

  // Fetch credential + professional name
  const { data: credential, error: credError } = await supabase
    .from('professional_credentials')
    .select('id,professional_id,file_url,credential_type,ocr_status')
    .eq('id', parsed.data.credentialId)
    .maybeSingle()

  if (credError || !credential) {
    return NextResponse.json({ error: 'Credential not found.' }, { status: 404 })
  }

  // Authorization: admin or the credential owner
  const { data: profile } = await supabase
    .from('profiles')
    .select('role,full_name')
    .eq('id', user.id)
    .maybeSingle()

  const { data: professional } = await supabase
    .from('professionals')
    .select('user_id')
    .eq('id', credential.professional_id)
    .maybeSingle()

  const isAdmin = profile?.role === 'admin'
  const isOwner = professional?.user_id === user.id

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  // Update status to processing
  await supabase
    .from('professional_credentials')
    .update({
      ocr_status: 'processing' as OcrStatus,
      ocr_provider: parsed.data.provider as OcrProvider,
      updated_at: new Date().toISOString(),
    })
    .eq('id', credential.id)

  // Run pipeline
  const { ocr, triage } = await runOcrPipeline({
    fileUrl: credential.file_url,
    credentialType: credential.credential_type,
    professionalName: profile?.full_name,
    provider: parsed.data.provider,
  })

  // Persist results
  const { error: updateError } = await supabase
    .from('professional_credentials')
    .update({
      ocr_status: (ocr.status === 'failed' ? 'failed' : triage.decision === 'manual_review' ? 'manual_review' : 'completed') as OcrStatus,
      ocr_score: triage.score,
      ocr_extracted_data: ocr.fields.length > 0 ? { fields: ocr.fields } : null,
      ocr_provider: parsed.data.provider as OcrProvider,
      ocr_checked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', credential.id)

  if (updateError) {
    Sentry.captureException(updateError, {
      tags: { area: 'api_v1_kyc_scan', context: 'persist-results' },
    })
    return NextResponse.json({ error: 'Failed to persist OCR results.' }, { status: 500 })
  }

  return NextResponse.json({
    credentialId: credential.id,
    ocr: {
      provider: ocr.provider,
      status: ocr.status,
      score: triage.score,
      fields: ocr.fields,
      error: ocr.error,
    },
    triage: {
      decision: triage.decision,
      reason: triage.reason,
    },
  })
}

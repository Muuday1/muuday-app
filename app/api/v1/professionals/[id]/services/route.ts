import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { getProfessionalServices } from '@/lib/professional/professional-services-service'
import { withApiHandler } from '@/lib/api/with-api-handler'

export const GET = withApiHandler(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  Sentry.addBreadcrumb({ category: 'services', message: 'GET /api/v1/professionals/:id/services started', level: 'info' })

  const supabase = await createApiClient(request)
  const { id } = await params

  const result = await getProfessionalServices(supabase, id)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ data: result.data.services })
})
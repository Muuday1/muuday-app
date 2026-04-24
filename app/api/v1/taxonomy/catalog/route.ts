import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { loadSignupCatalogService } from '@/lib/taxonomy/signup-catalog-service'

export async function GET(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'taxonomy', message: 'GET /api/v1/taxonomy/catalog', level: 'info' })

  const ip = getClientIp(request)
  const rl = await rateLimit('apiV1TaxonomyCatalog', ip)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  const supabase = await createApiClient(request)
  const result = await loadSignupCatalogService(supabase)

  return NextResponse.json({ data: result })
}

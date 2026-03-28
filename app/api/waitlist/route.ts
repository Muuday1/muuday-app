import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const LEAD_TYPES = ['usuario', 'profissional', 'empresa', 'parceiro'] as const

const waitlistSchema = z.object({
  firstname: z.string().trim().min(1, 'firstname is required').max(80, 'firstname is too long'),
  email: z.string().trim().toLowerCase().email('invalid email').max(254, 'email is too long'),
  pais_residencia: z.string().trim().max(120, 'country is too long').optional().or(z.literal('')),
  tipo_lead: z.enum(LEAD_TYPES).optional(),
  origem_lead: z.string().trim().max(120, 'origem_lead is too long').optional().or(z.literal('')),
})

function getAllowedOrigins() {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : null,
    process.env.WAITLIST_CORS_ORIGINS,
    'https://muuday.com',
    'https://www.muuday.com',
    'http://localhost:3000',
  ].filter(Boolean) as string[]

  const origins = new Set<string>()
  for (const candidate of candidates) {
    for (const rawValue of candidate.split(',')) {
      const value = rawValue.trim()
      if (!value) continue
      origins.add(value.replace(/\/+$/, ''))
    }
  }
  return origins
}

function getCorsContext(request: NextRequest) {
  const originHeader = request.headers.get('origin')
  const origin = originHeader ? originHeader.replace(/\/+$/, '') : null
  const allowedOrigins = getAllowedOrigins()
  const isAllowed = !origin || allowedOrigins.has(origin)
  return { origin, isAllowed }
}

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {}

  if (!origin) {
    return headers
  }

  headers['Access-Control-Allow-Origin'] = origin
  headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
  headers['Access-Control-Allow-Headers'] = 'Content-Type'
  headers.Vary = 'Origin'

  return headers
}

export async function POST(request: NextRequest) {
  const corsContext = getCorsContext(request)

  if (!corsContext.isAllowed) {
    return NextResponse.json(
      { error: 'Origin not allowed' },
      { status: 403, headers: buildCorsHeaders(corsContext.origin) }
    )
  }

  try {
    const body = await request.json()
    const parsed = waitlistSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400, headers: buildCorsHeaders(corsContext.origin) }
      )
    }

    const { firstname, email, pais_residencia, tipo_lead, origem_lead } = parsed.data
    const supabase = createClient()

    const { error: dbError } = await supabase
      .from('waitlist')
      .upsert(
        {
          email,
          firstname,
          country: pais_residencia || null,
          tipo_lead: tipo_lead || 'usuario',
          origem_lead: origem_lead || null,
          status: 'na_lista',
        },
        { onConflict: 'email' }
      )

    if (dbError) {
      console.error('[waitlist] DB error:', dbError)
    }

    void (async () => {
      try {
        const { sendWaitlistConfirmationEmail, addContactToResend, SEGMENTS } = await import('@/lib/email/resend')
        await Promise.all([
          sendWaitlistConfirmationEmail(email, firstname),
          addContactToResend(email, firstname, SEGMENTS.waitlist),
        ])
      } catch (error) {
        console.error('[waitlist] Email error:', error)
      }
    })()

    return NextResponse.json({ success: true }, { headers: buildCorsHeaders(corsContext.origin) })
  } catch (error) {
    console.error('[waitlist] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: buildCorsHeaders(corsContext.origin) }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  const corsContext = getCorsContext(request)

  if (!corsContext.isAllowed) {
    return new NextResponse(null, {
      status: 403,
      headers: buildCorsHeaders(corsContext.origin),
    })
  }

  return new NextResponse(null, {
    status: 200,
    headers: {
      ...buildCorsHeaders(corsContext.origin),
      'Access-Control-Max-Age': '86400',
    },
  })
}

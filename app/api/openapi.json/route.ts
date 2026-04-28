import { NextResponse } from 'next/server'
import { generateOpenApiDocument } from '@/lib/openapi/generate'

export const dynamic = 'force-static'

export async function GET() {
  const doc = generateOpenApiDocument()
  return NextResponse.json(doc, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

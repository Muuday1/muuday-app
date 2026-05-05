import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

/**
 * Wraps a Next.js App Router API handler in a global try/catch.
 *
 * If the handler throws an unexpected error, the exception is sent to Sentry
 * and a standardized JSON error response is returned instead of a raw 500.
 *
 * Usage:
 *   export const GET = withApiHandler(async (request, context) => { ... })
 */
export function withApiHandler<
  H extends (request: NextRequest, ...args: any[]) => Promise<Response>,
>(handler: H): H {
  return (async (request: NextRequest, ...args: any[]) => {
    try {
      return await handler(request, ...args)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      Sentry.captureException(err, {
        tags: { area: 'api', context: 'unexpected_handler_error' },
        extra: {
          url: request.url,
          method: request.method,
        },
      })
      return NextResponse.json(
        { error: 'Erro interno do servidor. Tente novamente.' },
        { status: 500 },
      )
    }
  }) as H
}

import * as Sentry from '@sentry/nextjs'

/**
 * Wrapper around Promise.all that captures catastrophic failures (e.g. network
 * drop, connection timeout) with Sentry and returns a fallback array instead of
 * letting the Server Component crash.
 *
 * Individual query errors should still be checked via `.error` on each result.
 */
export async function safePromiseAll<T extends readonly unknown[] | []>(
  promises: T,
  fallback: T,
  tags: Record<string, string>,
): Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }> {
  try {
    return await Promise.all(promises)
  } catch (error) {
    Sentry.captureException(error, { tags })
    return fallback as unknown as { -readonly [P in keyof T]: Awaited<T[P]> }
  }
}

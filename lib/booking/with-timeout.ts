/**
 * Race a promise against a timeout. Rejects with an Error if the timeout
 * fires before the promise settles.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, context: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${context}`)), ms),
    ),
  ])
}

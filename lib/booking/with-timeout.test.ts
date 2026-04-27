import { describe, it, expect } from 'vitest'
import { withTimeout } from './with-timeout'

describe('withTimeout', () => {
  it('resolves when promise finishes before timeout', async () => {
    const result = await withTimeout(
      Promise.resolve('success'),
      1000,
      'test-context',
    )
    expect(result).toBe('success')
  })

  it('rejects when timeout fires first', async () => {
    const slowPromise = new Promise<string>((resolve) =>
      setTimeout(() => resolve('too late'), 200),
    )
    await expect(withTimeout(slowPromise, 50, 'slow-operation')).rejects.toThrow(
      'Timeout after 50ms: slow-operation',
    )
  })

  it('propagates promise rejection', async () => {
    const failingPromise = Promise.reject(new Error('inner failure'))
    await expect(withTimeout(failingPromise, 1000, 'failing-context')).rejects.toThrow(
      'inner failure',
    )
  })

  it('resolves immediately for fast promises', async () => {
    const start = Date.now()
    await withTimeout(Promise.resolve(42), 5000, 'fast-context')
    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(50)
  })
})

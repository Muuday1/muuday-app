import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Global mock for CSRF validation in tests
vi.mock('@/lib/http/csrf', () => ({
  validateApiCsrf: vi.fn(() => ({ ok: true })),
}))

afterEach(() => {
  cleanup()
})

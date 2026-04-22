import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'

// Use global afterEach when vitest globals are enabled
if (typeof afterEach === 'function') {
  afterEach(() => {
    cleanup()
  })
}

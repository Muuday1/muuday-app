import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import SessionCountdown from './SessionCountdown'

describe('SessionCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders countdown for a future date', () => {
    const now = new Date('2026-04-22T12:00:00.000Z')
    vi.setSystemTime(now)

    const future = new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes from now
    const { container } = render(<SessionCountdown targetDate={future} />)

    expect(screen.getByText(/Comeca em/i)).toBeInTheDocument()
    expect(container.textContent).toMatch(/05:00/)
  })

  it('renders "horario chegou" message for a past date', () => {
    const past = new Date(Date.now() - 1000) // 1 second ago
    render(<SessionCountdown targetDate={past} />)

    expect(screen.getByText(/Horario da sessao chegou/i)).toBeInTheDocument()
  })

  it('updates countdown every second', () => {
    const now = new Date('2026-04-22T12:00:00.000Z')
    vi.setSystemTime(now)

    const future = new Date(now.getTime() + 2 * 60 * 1000 + 5000) // 2:05 from now
    const { container } = render(<SessionCountdown targetDate={future} />)

    expect(container.textContent).toMatch(/02:05/)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(container.textContent).toMatch(/02:04/)
  })

  it('switches to "horario chegou" when time passes', () => {
    const now = new Date('2026-04-22T12:00:00.000Z')
    vi.setSystemTime(now)

    const future = new Date(now.getTime() + 1500) // 1.5 seconds from now
    render(<SessionCountdown targetDate={future} />)

    expect(screen.getByText(/Comeca em/i)).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.getByText(/Horario da sessao chegou/i)).toBeInTheDocument()
  })

  it('formats hours correctly for long waits', () => {
    const now = new Date('2026-04-22T12:00:00.000Z')
    vi.setSystemTime(now)

    const future = new Date(now.getTime() + 3 * 3600 * 1000 + 25 * 60 * 1000 + 15 * 1000) // 3:25:15
    const { container } = render(<SessionCountdown targetDate={future} />)

    expect(container.textContent).toMatch(/03:25:15/)
  })
})

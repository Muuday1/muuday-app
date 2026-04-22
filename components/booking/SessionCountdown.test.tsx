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
    const future = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
    render(<SessionCountdown targetDate={future} />)

    expect(screen.getByText(/Comeca em/i)).toBeInTheDocument()
    expect(screen.getByText(/04:59/)).toBeInTheDocument()
  })

  it('renders "horario chegou" message for a past date', () => {
    const past = new Date(Date.now() - 1000) // 1 second ago
    render(<SessionCountdown targetDate={past} />)

    expect(screen.getByText(/Horario da sessao chegou/i)).toBeInTheDocument()
  })

  it('updates countdown every second', () => {
    const future = new Date(Date.now() + 2 * 60 * 1000 + 5000) // 2:05 from now
    render(<SessionCountdown targetDate={future} />)

    expect(screen.getByText(/02:04/)).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(screen.getByText(/02:03/)).toBeInTheDocument()
  })

  it('switches to "horario chegou" when time passes', () => {
    const future = new Date(Date.now() + 1500) // 1.5 seconds from now
    render(<SessionCountdown targetDate={future} />)

    expect(screen.getByText(/Comeca em/i)).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.getByText(/Horario da sessao chegou/i)).toBeInTheDocument()
  })

  it('formats hours correctly for long waits', () => {
    const future = new Date(Date.now() + 3 * 3600 * 1000 + 25 * 60 * 1000 + 15 * 1000) // 3:25:15
    render(<SessionCountdown targetDate={future} />)

    expect(screen.getByText(/03:25:14/)).toBeInTheDocument()
  })
})

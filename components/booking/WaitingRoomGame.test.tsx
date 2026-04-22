import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import WaitingRoomGame from './WaitingRoomGame'

describe('WaitingRoomGame', () => {
  let rafCallbacks: Map<number, FrameRequestCallback>
  let rafId = 0

  beforeEach(() => {
    rafCallbacks = new Map()
    rafId = 0

    // Mock requestAnimationFrame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      rafId += 1
      rafCallbacks.set(rafId, cb)
      return rafId
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id: number) => {
      rafCallbacks.delete(id)
    })

    // Mock sessionStorage
    const store: Record<string, string> = {}
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => store[key] ?? null)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
      store[key] = value
    })

    // Mock canvas getContext to avoid jsdom limitations
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textAlign: 'left',
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      closePath: vi.fn(),
      clearRect: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      measureText: vi.fn(() => ({ width: 10 })),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    })) as unknown as typeof HTMLCanvasElement.prototype.getContext
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders canvas with aria-label', () => {
    render(<WaitingRoomGame />)
    expect(screen.getByLabelText(/Jogo da sala de espera/i)).toBeInTheDocument()
  })

  it('accepts isPaused prop without crashing', () => {
    const { rerender } = render(<WaitingRoomGame isPaused={false} />)
    expect(screen.getByLabelText(/Jogo da sala de espera/i)).toBeInTheDocument()

    rerender(<WaitingRoomGame isPaused={true} />)
    expect(screen.getByLabelText(/Jogo da sala de espera/i)).toBeInTheDocument()
  })

  it('responds to keyboard jump (Space)', () => {
    render(<WaitingRoomGame />)
    const canvas = screen.getByLabelText(/Jogo da sala de espera/i)

    // Should not throw
    fireEvent.keyDown(canvas, { code: 'Space' })
  })

  it('responds to touch start', () => {
    render(<WaitingRoomGame />)
    const canvas = screen.getByLabelText(/Jogo da sala de espera/i)

    // Should not throw
    fireEvent.touchStart(canvas)
  })
})

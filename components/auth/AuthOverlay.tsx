'use client'

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'

type AnchorRect = { left: number; top: number; width: number; height: number }

export type AuthOverlayVariant = 'modal' | 'popover'

export type AuthOverlayProps = {
  open: boolean
  onClose: () => void
  variant: AuthOverlayVariant
  anchorEl?: HTMLElement | null
  ariaLabel?: string
  children: React.ReactNode
}

function isMobileViewport() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 767px)').matches
}

function getAnchorRect(el: HTMLElement | null | undefined): AnchorRect | null {
  if (!el) return null
  const rect = el.getBoundingClientRect()
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
}

export function AuthOverlay({ open, onClose, variant, anchorEl, ariaLabel, children }: AuthOverlayProps) {
  const overlayId = useId()
  const surfaceRef = useRef<HTMLDivElement | null>(null)
  const [anchorRect, setAnchorRect] = useState<AnchorRect | null>(null)

  const resolvedVariant = useMemo<AuthOverlayVariant>(() => {
    if (variant === 'popover' && isMobileViewport()) return 'modal'
    return variant
  }, [variant])

  useLayoutEffect(() => {
    if (!open) return
    if (resolvedVariant !== 'popover') return
    setAnchorRect(getAnchorRect(anchorEl))
  }, [open, resolvedVariant, anchorEl])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    if (resolvedVariant !== 'modal') return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open, resolvedVariant])

  useEffect(() => {
    if (!open) return
    const handle = window.setTimeout(() => {
      const emailInput = surfaceRef.current?.querySelector<HTMLInputElement>('input[type="email"]')
      emailInput?.focus()
    }, 0)
    return () => window.clearTimeout(handle)
  }, [open])

  useEffect(() => {
    if (!open) return
    if (resolvedVariant !== 'popover') return

    function handlePointerDown(event: PointerEvent) {
      const targetNode = event.target as Node | null
      if (!targetNode) return
      if (surfaceRef.current?.contains(targetNode)) return
      if (anchorEl?.contains(targetNode)) return
      onClose()
    }

    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [open, resolvedVariant, onClose, anchorEl])

  if (!open) return null

  if (resolvedVariant === 'modal') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 px-4"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || 'Login'}
        onMouseDown={event => {
          if (event.target === event.currentTarget) onClose()
        }}
      >
        <div
          ref={surfaceRef}
          id={overlayId}
          className="w-full max-w-md rounded-2xl border border-white/40 bg-white/70 p-6 shadow-xl backdrop-blur"
        >
          {children}
        </div>
      </div>
    )
  }

  const fallbackLeft = 16
  const fallbackTop = 64
  const left = Math.max(12, (anchorRect?.left ?? fallbackLeft) + (anchorRect?.width ?? 0) - 360)
  const top = (anchorRect?.top ?? fallbackTop) + (anchorRect?.height ?? 0) + 10

  return (
    <div className="fixed inset-0 z-50 pointer-events-none" aria-hidden="false">
      <div
        ref={surfaceRef}
        id={overlayId}
        className="pointer-events-auto w-[360px] max-w-[calc(100vw-24px)] rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl"
        style={{ left, top, position: 'fixed' }}
        role="dialog"
        aria-modal="false"
        aria-label={ariaLabel || 'Login'}
      >
        {children}
      </div>
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'

interface TypewriterTextProps {
  text: string
  speed?: number
  delay?: number
  className?: string
}

export function TypewriterText({ text, speed = 40, delay = 500, className = '' }: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const startTimeout = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(startTimeout)
  }, [delay])

  useEffect(() => {
    if (!started) return
    if (displayed.length >= text.length) return

    const timeout = setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1))
    }, speed)

    return () => clearTimeout(timeout)
  }, [started, displayed, text, speed])

  return (
    <span className={className}>
      {displayed}
      <span className="animate-pulse">|</span>
    </span>
  )
}

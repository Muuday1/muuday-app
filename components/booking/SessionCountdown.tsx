'use client'

import { useEffect, useState } from 'react'

function formatCountdown(ms: number): string {
  if (ms <= 0) return ''
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function SessionCountdown({ targetDate }: { targetDate: Date }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const diff = targetDate.getTime() - now

  if (diff <= 0) {
    return (
      <p className="text-xs font-medium text-amber-600">
        Horario da sessao chegou — aguardando o profissional entrar...
      </p>
    )
  }

  return (
    <p className="text-xs font-medium text-slate-600">
      Comeca em <span className="font-bold text-slate-900">{formatCountdown(diff)}</span>
    </p>
  )
}

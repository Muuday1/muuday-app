'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Calendar, MessageCircle } from 'lucide-react'
import { AuthOverlay } from '@/components/auth/AuthOverlay'
import { LoginForm } from '@/components/auth/LoginForm'
import { captureEvent } from '@/lib/analytics/posthog-client'

type SearchBookingCtasProps = {
  isLoggedIn: boolean
  bookHref: string
  messageHref: string
  bookLabel?: string
  messageLabel?: string
}

type PendingAction = 'book' | 'message'

export function SearchBookingCtas({
  isLoggedIn,
  bookHref,
  messageHref,
  bookLabel = 'Agendar',
  messageLabel = 'Mandar mensagem',
}: SearchBookingCtasProps) {
  const [open, setOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction>('book')

  const bookButton = (
    <button
      type="button"
      onClick={() => {
        if (isLoggedIn) return
        setPendingAction('book')
        setOpen(true)
        captureEvent('booking_intent_auth_modal_shown', { action: 'book', source: 'search_cta' })
      }}
      className="inline-flex items-center gap-1.5 rounded-lg bg-[#9FE870] px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-[#8ed85f] hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/30"
    >
      <Calendar className="h-3.5 w-3.5" />
      {bookLabel}
    </button>
  )

  const messageButton = (
    <button
      type="button"
      onClick={() => {
        if (isLoggedIn) return
        setPendingAction('message')
        setOpen(true)
        captureEvent('booking_intent_auth_modal_shown', { action: 'message', source: 'search_cta' })
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/20"
    >
      <MessageCircle className="h-3.5 w-3.5" />
      {messageLabel}
    </button>
  )

  if (isLoggedIn) {
    return (
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href={bookHref}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#9FE870] px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-[#8ed85f] hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/30"
        >
          <Calendar className="h-3.5 w-3.5" />
          {bookLabel}
        </Link>
        <Link
          href={messageHref}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/20"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {messageLabel}
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {bookButton}
        {messageButton}
      </div>

      <AuthOverlay open={open} onClose={() => setOpen(false)} variant="modal" ariaLabel="Login">
        <LoginForm
          title="Entre para continuar"
          subtitle="Faça login para concluir esta ação."
          compact
          idPrefix={`search-modal-${pendingAction}`}
          onSuccess={() => setOpen(false)}
          redirectPath={pendingAction === 'book' ? bookHref : messageHref}
        />
      </AuthOverlay>
    </>
  )
}

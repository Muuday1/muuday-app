'use client'

import { useMemo, useState, useTransition } from 'react'
import { Check, Loader2, X, CalendarClock, RotateCcw } from 'lucide-react'
import {
  acceptRequestBooking,
  cancelRequestBookingByUser,
  declineRequestBookingByProfessional,
  declineRequestBookingByUser,
  offerRequestBooking,
} from '@/lib/actions/request-booking'

type RequestBookingActionsProps = {
  requestId: string
  status: 'open' | 'offered' | 'accepted' | 'declined' | 'expired' | 'cancelled' | 'converted'
  isProfessional: boolean
  proposalTimezone?: string | null
  defaultProposalStartLocal?: string
  defaultDurationMinutes?: number
}

function toDatetimeLocalValue(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d}T${hh}:${mm}`
}

export default function RequestBookingActions({
  requestId,
  status,
  isProfessional,
  proposalTimezone,
  defaultProposalStartLocal,
  defaultDurationMinutes = 60,
}: RequestBookingActionsProps) {
  const [isPending, startTransition] = useTransition()
  const initialProposal = useMemo(
    () => toDatetimeLocalValue(defaultProposalStartLocal),
    [defaultProposalStartLocal],
  )
  const [proposalStart, setProposalStart] = useState(initialProposal)
  const [proposalDuration, setProposalDuration] = useState(defaultDurationMinutes)
  const [proposalMessage, setProposalMessage] = useState('')
  const [showOfferForm, setShowOfferForm] = useState(status === 'open')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function setTimedFeedback(next: { type: 'success' | 'error'; message: string }) {
    setFeedback(next)
    setTimeout(() => setFeedback(null), 4500)
  }

  function runAction(
    action: () => Promise<{ success: true; bookingId?: string } | { success: false; error: string }>,
    successMessage: string,
  ) {
    startTransition(async () => {
      const result = await action()
      if (result.success) {
        setTimedFeedback({ type: 'success', message: successMessage })
      } else {
        setTimedFeedback({ type: 'error', message: result.error })
      }
    })
  }

  if (status === 'converted' || status === 'declined' || status === 'expired' || status === 'cancelled') {
    return null
  }

  if (isProfessional) {
    return (
      <div className="mt-3 space-y-2">
        {feedback && (
          <div
            className={`rounded-md border px-3 py-2 text-xs ${
              feedback.type === 'success'
                ? 'border-green-100 bg-green-50 text-green-700'
                : 'border-red-100 bg-red-50 text-red-700'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {showOfferForm && (
          <div className="space-y-2 rounded-md border border-[#9FE870]/20 bg-[#9FE870]/8 p-3">
            <p className="text-xs font-semibold text-[#3d6b1f]">
              Propor horário {proposalTimezone ? `(${proposalTimezone.replaceAll('_', ' ')})` : ''}
            </p>
            <input
              type="datetime-local"
              value={proposalStart}
              onChange={e => setProposalStart(e.target.value)}
              className="w-full rounded-md border border-[#9FE870]/30 bg-white px-3 py-2 text-xs focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#9FE870]/40"
            />
            <div className="flex gap-2">
              <select
                value={proposalDuration}
                onChange={e => setProposalDuration(Number(e.target.value))}
                className="rounded-md border border-[#9FE870]/30 bg-white px-2 py-2 text-xs focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#9FE870]/40"
              >
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
                <option value={120}>120 min</option>
              </select>
              <input
                type="text"
                value={proposalMessage}
                onChange={e => setProposalMessage(e.target.value)}
                placeholder="Mensagem opcional"
                className="flex-1 rounded-md border border-[#9FE870]/30 bg-white px-3 py-2 text-xs focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#9FE870]/40"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() =>
                  runAction(
                    async () =>
                      offerRequestBooking({
                        requestId,
                        proposalStartLocal: proposalStart,
                        proposalDurationMinutes: proposalDuration,
                        proposalMessage: proposalMessage.trim() || undefined,
                      }),
                    'Proposta enviada para o cliente.',
                  )
                }
                disabled={isPending || !proposalStart}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#9FE870] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#8ed85f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CalendarClock className="h-3.5 w-3.5" />}
                Enviar proposta
              </button>
              <button
                onClick={() => setShowOfferForm(false)}
                disabled={isPending}
                className="text-xs text-slate-600 transition-colors hover:text-slate-800"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {!showOfferForm && (
            <button
              onClick={() => setShowOfferForm(true)}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#9FE870] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#8ed85f] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CalendarClock className="h-3.5 w-3.5" />
              {status === 'offered' ? 'Atualizar proposta' : 'Propor horário'}
            </button>
          )}
          <button
            onClick={() =>
              runAction(
                async () => declineRequestBookingByProfessional(requestId),
                'Solicitação recusada.',
              )
            }
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            Recusar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3 space-y-2">
      {feedback && (
        <div
          className={`rounded-md border px-3 py-2 text-xs ${
            feedback.type === 'success'
              ? 'border-green-100 bg-green-50 text-green-700'
              : 'border-red-100 bg-red-50 text-red-700'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {status === 'offered' && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() =>
              runAction(
                async () => acceptRequestBooking(requestId),
                'Proposta aceita e convertida em agendamento.',
              )
            }
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-green-500 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Aceitar proposta
          </button>
          <button
            onClick={() =>
              runAction(
                async () => declineRequestBookingByUser(requestId),
                'Proposta recusada.',
              )
            }
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Recusar proposta
          </button>
        </div>
      )}

      {status === 'open' && (
        <button
          onClick={() =>
            runAction(
              async () => cancelRequestBookingByUser(requestId),
              'Solicitação cancelada.',
            )
          }
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
          Cancelar solicitação
        </button>
      )}
    </div>
  )
}




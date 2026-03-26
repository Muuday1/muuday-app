'use client'

import { useState, useTransition } from 'react'
import { Loader2, Check, X, Link2, CheckCircle2, AlertCircle } from 'lucide-react'
import {
  confirmBooking,
  cancelBooking,
  addSessionLink,
  completeBooking,
} from '@/lib/actions/manage-booking'

interface BookingActionsProps {
  bookingId: string
  status: string
  sessionLink?: string | null
  isProfessional: boolean
}

export default function BookingActions({
  bookingId,
  status,
  sessionLink,
  isProfessional,
}: BookingActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkValue, setLinkValue] = useState(sessionLink || '')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  function clearFeedback() {
    setTimeout(() => setFeedback(null), 4000)
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await confirmBooking(bookingId)
      if (result.success) {
        setFeedback({ type: 'success', message: 'Agendamento confirmado!' })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
      clearFeedback()
    })
  }

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelBooking(bookingId, cancelReason.trim() || undefined)
      if (result.success) {
        setFeedback({ type: 'success', message: 'Agendamento cancelado.' })
        setShowCancelConfirm(false)
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
      clearFeedback()
    })
  }

  function handleAddLink() {
    if (!linkValue.trim()) return
    startTransition(async () => {
      const result = await addSessionLink(bookingId, linkValue)
      if (result.success) {
        setFeedback({ type: 'success', message: 'Link adicionado!' })
        setShowLinkInput(false)
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
      clearFeedback()
    })
  }

  function handleComplete() {
    startTransition(async () => {
      const result = await completeBooking(bookingId)
      if (result.success) {
        setFeedback({ type: 'success', message: 'Sessão concluída!' })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
      clearFeedback()
    })
  }

  return (
    <div className="mt-3 space-y-2">
      {/* Feedback message */}
      {feedback && (
        <div
          className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-100'
              : 'bg-red-50 text-red-700 border border-red-100'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          )}
          {feedback.message}
        </div>
      )}

      {/* Professional actions for pending bookings */}
      {isProfessional && status === 'pending' && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            Confirmar
          </button>
          <button
            onClick={() => setShowCancelConfirm(true)}
            disabled={isPending}
            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />
            Cancelar
          </button>
        </div>
      )}

      {/* Professional actions for confirmed bookings */}
      {isProfessional && status === 'confirmed' && (
        <div className="flex flex-wrap items-center gap-2">
          {!sessionLink && !showLinkInput && (
            <button
              onClick={() => setShowLinkInput(true)}
              disabled={isPending}
              className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
            >
              <Link2 className="w-3.5 h-3.5" />
              Adicionar link
            </button>
          )}
          <button
            onClick={handleComplete}
            disabled={isPending}
            className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            Concluir sessão
          </button>
          <button
            onClick={() => setShowCancelConfirm(true)}
            disabled={isPending}
            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />
            Cancelar
          </button>
        </div>
      )}

      {/* User actions for pending/confirmed bookings */}
      {!isProfessional && (status === 'pending' || status === 'confirmed') && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCancelConfirm(true)}
            disabled={isPending}
            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />
            Cancelar
          </button>
        </div>
      )}

      {/* Link input */}
      {showLinkInput && (
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            placeholder="https://meet.google.com/..."
            className="flex-1 text-xs border border-neutral-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent transition"
          />
          <button
            onClick={handleAddLink}
            disabled={isPending || !linkValue.trim()}
            className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            Salvar
          </button>
          <button
            onClick={() => {
              setShowLinkInput(false)
              setLinkValue(sessionLink || '')
            }}
            className="text-xs text-neutral-500 hover:text-neutral-700 px-2 py-1.5 transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Cancel confirmation */}
      {showCancelConfirm && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-2">
          <p className="text-xs font-semibold text-red-700">Tem certeza que deseja cancelar?</p>
          <input
            type="text"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Motivo do cancelamento (opcional)"
            className="w-full text-xs border border-red-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent transition bg-white"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
              Sim, cancelar
            </button>
            <button
              onClick={() => {
                setShowCancelConfirm(false)
                setCancelReason('')
              }}
              disabled={isPending}
              className="text-xs text-neutral-500 hover:text-neutral-700 px-2 py-1.5 transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

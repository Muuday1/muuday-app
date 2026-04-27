'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  Loader2,
  Check,
  X,
  Link2,
  CheckCircle2,
  AlertCircle,
  CalendarClock,
  Flag,
} from 'lucide-react'
import {
  confirmBooking,
  cancelBooking,
  cancelBookingWithScope,
  addSessionLink,
  completeBooking,
  rescheduleBooking,
  reportProfessionalNoShow,
  markUserNoShow,
} from '@/lib/actions/manage-booking'
import { CancelScopeModal } from './CancelScopeModal'

interface BookingActionsProps {
  bookingId: string
  status: string
  sessionLink?: string | null
  scheduledAt?: string
  isProfessional: boolean
  bookingType?: string | null
  recurrenceGroupId?: string | null
  professionalName?: string | null
}

function toDatetimeLocalValue(value?: string) {
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

export default function BookingActions({
  bookingId,
  status,
  sessionLink,
  scheduledAt,
  isProfessional,
  bookingType,
  recurrenceGroupId,
  professionalName,
}: BookingActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkValue, setLinkValue] = useState(sessionLink || '')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showReschedule, setShowReschedule] = useState(false)
  const [rescheduleAt, setRescheduleAt] = useState(toDatetimeLocalValue(scheduledAt))
  const [showCancelScopeModal, setShowCancelScopeModal] = useState(false)
  const fallbackErrorMessage = 'Não foi possível concluir a ação. Tente novamente.'

  const isRecurring = Boolean(recurrenceGroupId || bookingType?.startsWith('recurring'))

  const isPastSession = useMemo(() => {
    if (!scheduledAt) return false
    const sessionDate = new Date(scheduledAt)
    if (Number.isNaN(sessionDate.getTime())) return false
    return sessionDate.getTime() <= Date.now()
  }, [scheduledAt])

  function clearFeedback() {
    setTimeout(() => setFeedback(null), 4500)
  }

  function runAction(action: () => Promise<{ success: true } | { success: false; error: string }>) {
    startTransition(async () => {
      try {
        const result = await action()
        if (result?.success) {
          setFeedback({ type: 'success', message: 'Ação concluída com sucesso.' })
        } else {
          setFeedback({ type: 'error', message: result?.error || fallbackErrorMessage })
        }
      } catch {
        setFeedback({ type: 'error', message: fallbackErrorMessage })
      }
      clearFeedback()
    })
  }

  function handleConfirm() {
    runAction(async () => {
      const result = await confirmBooking(bookingId)
      if (result.success) setFeedback({ type: 'success', message: 'Agendamento confirmado.' })
      return result
    })
  }

  function handleCancel() {
    runAction(async () => {
      const result = await cancelBooking(bookingId, cancelReason.trim() || undefined)
      if (result.success) {
        setShowCancelConfirm(false)
        setCancelReason('')
        setFeedback({ type: 'success', message: 'Agendamento cancelado.' })
      }
      return result
    })
  }

  function handleCancelWithScope(scope: 'this' | 'future' | 'series', reason: string) {
    runAction(async () => {
      const result = await cancelBookingWithScope(bookingId, scope, reason || undefined)
      if (result.success) {
        setShowCancelScopeModal(false)
        setFeedback({
          type: 'success',
          message:
            scope === 'this'
              ? 'Sessão cancelada.'
              : scope === 'future'
                ? 'Sessões futuras canceladas.'
                : 'Pacote cancelado.',
        })
      } else {
        setShowCancelScopeModal(false)
        setFeedback({ type: 'error', message: result.error || fallbackErrorMessage })
      }
      return result
    })
  }

  function handleAddLink() {
    if (!linkValue.trim()) return
    runAction(async () => {
      const result = await addSessionLink(bookingId, linkValue)
      if (result.success) {
        setShowLinkInput(false)
        setFeedback({ type: 'success', message: 'Link adicionado.' })
      }
      return result
    })
  }

  function handleComplete() {
    runAction(async () => {
      const result = await completeBooking(bookingId)
      if (result.success) setFeedback({ type: 'success', message: 'Sessão concluída.' })
      return result
    })
  }

  function handleReschedule() {
    if (!rescheduleAt) return
    runAction(async () => {
      const result = await rescheduleBooking(bookingId, rescheduleAt)
      if (result.success) {
        setShowReschedule(false)
        setFeedback({ type: 'success', message: 'Agendamento remarcado.' })
      }
      return result
    })
  }

  function handleProfessionalNoShow() {
    runAction(async () => {
      const result = await reportProfessionalNoShow(bookingId)
      if (result.success) {
        setFeedback({ type: 'success', message: 'No-show do profissional reportado.' })
      }
      return result
    })
  }

  function handleUserNoShow() {
    runAction(async () => {
      const result = await markUserNoShow(bookingId)
      if (result.success) {
        setFeedback({ type: 'success', message: 'No-show do cliente registrado.' })
      }
      return result
    })
  }

  return (
    <div className="mt-3 space-y-2">
      {feedback && (
        <div
          className={`animate-in fade-in flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium ${
            feedback.type === 'success'
              ? 'border-green-100 bg-green-50 text-green-700'
              : 'border-red-100 bg-red-50 text-red-700'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          )}
          {feedback.message}
        </div>
      )}

      {isProfessional && (status === 'pending' || status === 'pending_confirmation') && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-md bg-green-500 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-green-600 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Confirmar
          </button>
          <button
            onClick={() => {
              if (isRecurring) {
                setShowCancelScopeModal(true)
              } else {
                setShowCancelConfirm(true)
              }
            }}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
            Cancelar
          </button>
        </div>
      )}

      {isProfessional && status === 'confirmed' && (
        <div className="flex flex-wrap items-center gap-2">
          {!sessionLink && !showLinkInput && (
            <button
              onClick={() => setShowLinkInput(true)}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-md bg-[#9FE870] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#8ed85f] disabled:opacity-50"
            >
              <Link2 className="h-3.5 w-3.5" />
              Adicionar link
            </button>
          )}

          {isPastSession ? (
            <>
              <button
                onClick={handleComplete}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-md bg-green-500 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-green-600 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Concluir sessão
              </button>
              <button
                onClick={handleUserNoShow}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-md bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-slate-700 disabled:opacity-50"
              >
                <Flag className="h-3.5 w-3.5" />
                Cliente no-show
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                if (isRecurring) {
                  setShowCancelScopeModal(true)
                } else {
                  setShowCancelConfirm(true)
                }
              }}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              Cancelar
            </button>
          )}
        </div>
      )}

      {!isProfessional && ['pending', 'pending_confirmation', 'confirmed'].includes(status) && (
        <div className="flex flex-wrap items-center gap-2">
          {!isPastSession && (
            <>
              <button
                onClick={() => setShowReschedule(prev => !prev)}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-md bg-[#9FE870] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#8ed85f] disabled:opacity-50"
              >
                <CalendarClock className="h-3.5 w-3.5" />
                Remarcar
              </button>
              <button
                onClick={() => setShowCancelConfirm(true)}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
                Cancelar
              </button>
            </>
          )}

          {isPastSession && status === 'confirmed' && (
            <button
              onClick={handleProfessionalNoShow}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-md bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-slate-700 disabled:opacity-50"
            >
              <Flag className="h-3.5 w-3.5" />
              Reportar no-show profissional
            </button>
          )}
        </div>
      )}

      {showLinkInput && (
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={linkValue}
            onChange={e => setLinkValue(e.target.value)}
            placeholder="https://meet.google.com/..."
            className="flex-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#9FE870]/40"
          />
          <button
            onClick={handleAddLink}
            disabled={isPending || !linkValue.trim()}
            className="flex items-center gap-1.5 rounded-md bg-[#9FE870] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#8ed85f] disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Salvar
          </button>
          <button
            onClick={() => {
              setShowLinkInput(false)
              setLinkValue(sessionLink || '')
            }}
            className="px-2 py-1.5 text-xs text-slate-500 transition-colors hover:text-slate-700"
          >
            Cancelar
          </button>
        </div>
      )}

      {showReschedule && (
        <div className="space-y-2 rounded-md border border-[#9FE870]/20 bg-[#9FE870]/8 p-3">
          <p className="text-xs font-semibold text-[#3d6b1f]">Nova data e horário</p>
          <input
            type="datetime-local"
            value={rescheduleAt}
            onChange={e => setRescheduleAt(e.target.value)}
            className="w-full rounded-md border border-[#9FE870]/30 bg-white px-3 py-2 text-xs transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#9FE870]/40"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleReschedule}
              disabled={isPending || !rescheduleAt}
              className="flex items-center gap-1.5 rounded-md bg-[#9FE870] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#8ed85f] disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CalendarClock className="h-3.5 w-3.5" />
              )}
              Confirmar remarcacao
            </button>
            <button
              onClick={() => setShowReschedule(false)}
              className="px-2 py-1.5 text-xs text-slate-600 transition-colors hover:text-slate-800"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {showCancelConfirm && !isRecurring && (
        <div className="space-y-2 rounded-md border border-red-100 bg-red-50 p-3">
          <p className="text-xs font-semibold text-red-700">Tem certeza que deseja cancelar?</p>
          <input
            type="text"
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder="Motivo do cancelamento (opcional)"
            className="w-full rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-300"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
              Sim, cancelar
            </button>
            <button
              onClick={() => {
                setShowCancelConfirm(false)
                setCancelReason('')
              }}
              disabled={isPending}
              className="px-2 py-1.5 text-xs text-slate-500 transition-colors hover:text-slate-700"
            >
              Voltar
            </button>
          </div>
        </div>
      )}

      <CancelScopeModal
        isOpen={showCancelScopeModal}
        onClose={() => setShowCancelScopeModal(false)}
        onConfirm={handleCancelWithScope}
        isPending={isPending}
        professionalName={professionalName || 'Profissional'}
        scheduledAt={scheduledAt}
      />
    </div>
  )
}


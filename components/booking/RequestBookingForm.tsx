'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarClock, CheckCircle2, Loader2, MessageCircle } from 'lucide-react'
import { createRequestBooking } from '@/lib/actions/request-booking'

type RequestBookingFormProps = {
  professionalId: string
  profileHref: string
  professionalName: string
  professionalTimezone: string
  userTimezone: string
  defaultDurationMinutes: number
}

function toDatetimeLocalValue(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d}T${hh}:${mm}`
}

export default function RequestBookingForm({
  professionalId,
  profileHref,
  professionalName,
  professionalTimezone,
  userTimezone,
  defaultDurationMinutes,
}: RequestBookingFormProps) {
  const [isPending, startTransition] = useTransition()
  const defaultStart = useMemo(() => {
    const date = new Date()
    date.setHours(date.getHours() + 48, 0, 0, 0)
    return toDatetimeLocalValue(date)
  }, [])
  const [preferredStartLocal, setPreferredStartLocal] = useState(defaultStart)
  const [durationMinutes, setDurationMinutes] = useState(defaultDurationMinutes)
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<
    { success: true; requestId: string } | { success: false; error: string } | null
  >(null)

  function handleSubmit() {
    if (!preferredStartLocal) return

    startTransition(async () => {
      const response = await createRequestBooking({
        professionalId,
        preferredStartLocal,
        durationMinutes,
        userMessage: message.trim() || undefined,
      })
      setResult(response)
    })
  }

  if (result?.success) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-green-100 bg-white px-6 py-12 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-neutral-900 font-display">Solicitacao enviada</h2>
        <p className="mb-6 text-sm text-neutral-600">
          O profissional <span className="font-semibold">{professionalName}</span> recebeu sua
          solicitacao. Quando houver proposta, voce verá na sua agenda.
        </p>
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Link
            href="/agenda"
            className="flex-1 rounded-xl bg-brand-500 py-3 text-center text-sm font-semibold text-white transition-all hover:bg-brand-600"
          >
            Ir para agenda
          </Link>
          <Link
            href={profileHref}
            className="flex-1 rounded-xl border border-neutral-200 bg-white py-3 text-center text-sm font-semibold text-neutral-700 transition-all hover:bg-neutral-50"
          >
            Voltar ao perfil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-8">
      <Link
        href={profileHref}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao perfil
      </Link>

      <div className="rounded-2xl border border-neutral-100 bg-white p-6 md:p-7">
        <h1 className="mb-1 text-2xl font-bold text-neutral-900 font-display">Solicitar horario</h1>
        <p className="mb-6 text-sm text-neutral-500">
          Envie um horario preferencial para <span className="font-medium">{professionalName}</span>.
          O profissional pode aprovar, recusar ou propor alternativa.
        </p>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-neutral-700">Horario preferencial</span>
            <input
              type="datetime-local"
              value={preferredStartLocal}
              onChange={e => setPreferredStartLocal(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-neutral-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </label>

          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-neutral-700">Duracao</span>
            <select
              value={durationMinutes}
              onChange={e => setDurationMinutes(Number(e.target.value))}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-neutral-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>60 min</option>
              <option value={90}>90 min</option>
              <option value={120}>120 min</option>
            </select>
          </label>
        </div>

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-neutral-700">Mensagem (opcional)</span>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            maxLength={1200}
            placeholder="Explique rapidamente o contexto e seus horarios de preferencia."
            className="w-full resize-none rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-neutral-700 placeholder-neutral-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
          <span className="block text-right text-xs text-neutral-400">{message.length}/1200</span>
        </label>

        {result && !result.success && (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
            {result.error}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1 text-xs text-neutral-500">
            <p className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5 text-neutral-400" />
              Fuso do checkout: {userTimezone.replaceAll('_', ' ')}
            </p>
            <p className="flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5 text-neutral-400" />
              Fuso do profissional: {professionalTimezone.replaceAll('_', ' ')}
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isPending || !preferredStartLocal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
            Enviar solicitacao
          </button>
        </div>
      </div>
    </div>
  )
}

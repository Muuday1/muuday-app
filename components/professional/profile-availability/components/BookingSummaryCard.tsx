'use client'

import { formatCurrency } from '@/lib/utils'
import { SearchBookingCtas } from '@/components/search/SearchBookingCtas'
import { timezoneLabel } from '../helpers'

interface BookingSummaryCardProps {
  hasServices: boolean
  hasSingleService: boolean
  priceRangeLabel?: string
  selectedPriceBrl: number
  selectedDuration: number
  bookingType: 'one_off' | 'recurring'
  recurringSessionsCount: number
  viewerCurrency: string
  selectedDate: Date | null
  selectedTime: string | null
  selectedTimeInProfessionalTimezone: string | null
  userTimezone: string
  professionalTimezone: string
  isOwnProfessional: boolean
  firstBookingBlocked: boolean
  isLoggedIn: boolean
  bookHref: string
  bookHrefWithSelection: string
  messageHref: string
  errorCode?: string
}

export function BookingSummaryCard({
  hasServices,
  hasSingleService,
  priceRangeLabel,
  selectedPriceBrl,
  selectedDuration,
  bookingType,
  recurringSessionsCount,
  viewerCurrency,
  selectedDate,
  selectedTime,
  selectedTimeInProfessionalTimezone,
  userTimezone,
  professionalTimezone,
  isOwnProfessional,
  firstBookingBlocked,
  isLoggedIn,
  bookHref,
  bookHrefWithSelection,
  messageHref,
  errorCode,
}: BookingSummaryCardProps) {
  const selectedPriceText = formatCurrency(selectedPriceBrl, viewerCurrency)

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 md:sticky md:top-24">
      <div className="mb-4 border-b border-slate-200/80 pb-4 text-center">
        {hasServices ? (
          <>
            <p className="text-3xl font-bold text-slate-900">{priceRangeLabel}</p>
            <p className="mt-1 text-sm text-slate-500">por sessão</p>
          </>
        ) : (
          <>
            <p className="text-3xl font-bold text-slate-900">{selectedPriceText}</p>
            <p className="mt-1 text-sm text-slate-500">por sessão de {selectedDuration} min</p>
            {bookingType === 'recurring' ? (
              <p className="mt-1 text-xs text-slate-500">
                pacote recorrente de {recurringSessionsCount} sessões
              </p>
            ) : null}
          </>
        )}
      </div>

      {!hasServices && selectedDate && selectedTime ? (
        <div className="mb-4 rounded-md border border-slate-200/80 bg-slate-50/70 p-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-700">Horário selecionado</p>
          <p className="mt-1">
            {selectedDate.toLocaleDateString('pt-BR')} às {selectedTime} ({timezoneLabel(userTimezone)})
          </p>
          {selectedTimeInProfessionalTimezone ? (
            <p className="mt-1">
              Fuso profissional: {selectedTimeInProfessionalTimezone} ({timezoneLabel(professionalTimezone)})
            </p>
          ) : null}
        </div>
      ) : null}

      {isOwnProfessional ? (
        <div className="space-y-2">
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-md bg-slate-100 py-3 text-sm font-semibold text-slate-400"
          >
            Agendar sessão
          </button>
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-md border border-slate-200 bg-slate-50/70 py-3 text-sm font-semibold text-slate-400"
          >
            Mandar mensagem
          </button>
          <p className="text-center text-xs text-slate-500">
            Não é possível agendar sessão com o próprio perfil.
          </p>
        </div>
      ) : firstBookingBlocked ? (
        <div className="space-y-2">
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-md bg-slate-100 py-3 text-sm font-semibold text-slate-400"
          >
            Agendamento indisponível
          </button>
          <p className="text-center text-xs text-slate-500">
            Este profissional ainda não foi liberado para aceitar o primeiro agendamento.
          </p>
        </div>
      ) : (
        <SearchBookingCtas
          isLoggedIn={isLoggedIn}
          bookHref={hasServices ? bookHref : bookHrefWithSelection}
          messageHref={messageHref}
          bookLabel={hasServices && !hasSingleService ? 'Ver serviços e agendar' : 'Agendar sessão'}
          messageLabel="Mandar mensagem"
        />
      )}

      {errorCode === 'auto-agendamento' ? (
        <div
          className="mt-3 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700"
          role="alert"
        >
          Não é permitido agendar sessão com o próprio perfil profissional.
        </div>
      ) : null}

      {errorCode === 'primeiro-agendamento-bloqueado' ? (
        <div
          className="mt-3 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700"
          role="alert"
        >
          Este profissional ainda não está habilitado para aceitar o primeiro agendamento.
        </div>
      ) : null}

      <div className="mt-4 space-y-2 border-t border-slate-200/80 pt-4 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
          Cancelamento gratuito até 24h antes
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
          Sessão por vídeo (link enviado após confirmação)
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
          Conversão automática de fuso horário
        </div>
      </div>
    </div>
  )
}

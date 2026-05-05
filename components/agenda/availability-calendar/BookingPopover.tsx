'use client'

import Link from 'next/link'
import { Video, User, X } from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'
import type { BookingSlot } from './types'

interface BookingPopoverProps {
  booking: BookingSlot | null
  timezone: string
  onClose: () => void
}

export function BookingPopover({ booking, timezone, onClose }: BookingPopoverProps) {
  if (!booking) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-900">
              {booking.client_name || 'Sessão agendada'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {formatInTimeZone(new Date(booking.start_utc), timezone, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
            <p className="text-xs text-slate-400">
              Status: {booking.status === 'confirmed' ? 'Confirmada' : booking.status === 'pending_confirmation' ? 'Pendente de confirmação' : booking.status}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {(booking.status === 'confirmed' || booking.status === 'pending_confirmation') ? (
            <Link
              href={`/sessao/${booking.id}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#9FE870] px-3 py-2 text-sm font-semibold text-white transition-all hover:bg-[#8ed85f]"
            >
              <Video className="h-4 w-4" />
              Entrar na sessão
            </Link>
          ) : null}
          <Link
            href={`/agenda?view=inbox`}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]"
          >
            <User className="h-4 w-4" />
            Ver na inbox
          </Link>
        </div>
      </div>
    </div>
  )
}

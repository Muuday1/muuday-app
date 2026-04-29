'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Clock, Calendar, RefreshCw } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export type ProfessionalService = {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  price_brl: number
  enable_recurring?: boolean
  enable_batch?: boolean
}

type ProfileServicesListProps = {
  services: ProfessionalService[]
  professionalId: string
  viewerCurrency: string
  bookHrefBase: string
}

export function ProfileServicesList({
  services,
  professionalId,
  viewerCurrency,
  bookHrefBase,
}: ProfileServicesListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (services.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
        <p className="text-sm text-slate-500">Nenhum serviço cadastrado.</p>
      </div>
    )
  }

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  return (
    <div className="space-y-3">
      {services.map(service => {
        const isExpanded = expandedId === service.id
        const bookHref = `${bookHrefBase}?servico=${service.id}`

        return (
          <div
            key={service.id}
            className={cn(
              'rounded-lg border bg-white transition-all',
              isExpanded ? 'border-[#9FE870]/50 shadow-sm' : 'border-slate-200 hover:border-slate-300',
            )}
          >
            {/* Header — always visible */}
            <button
              type="button"
              onClick={() => toggleExpand(service.id)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    {service.name}
                  </h3>
                  {service.enable_recurring && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                      <RefreshCw className="h-3 w-3" />
                      Recorrente
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {service.duration_minutes} min
                  </span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(service.price_brl, viewerCurrency)}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-shrink-0">
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </button>

            {/* Expanded details */}
            {isExpanded && (
              <div className="border-t border-slate-100 px-4 pb-4 pt-3">
                {service.description ? (
                  <p className="mb-3 text-sm leading-relaxed text-slate-600">
                    {service.description}
                  </p>
                ) : null}

                <div className="mb-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div className="rounded-md bg-slate-50/70 px-3 py-2">
                    <span className="block text-slate-400">Duração</span>
                    <span className="font-medium text-slate-700">{service.duration_minutes} min</span>
                  </div>
                  <div className="rounded-md bg-slate-50/70 px-3 py-2">
                    <span className="block text-slate-400">Preço</span>
                    <span className="font-medium text-slate-700">
                      {formatCurrency(service.price_brl, viewerCurrency)}
                    </span>
                  </div>
                </div>

                <Link
                  href={bookHref}
                  className={cn(
                    'inline-flex w-full items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold transition',
                    'bg-[#9FE870] text-[#1a3a0a] hover:bg-[#8ed85f]',
                  )}
                >
                  <Calendar className="h-4 w-4" />
                  Escolher e ver horários
                </Link>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

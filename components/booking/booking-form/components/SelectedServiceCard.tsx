'use client'

import Link from 'next/link'
import { Briefcase, Clock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface SelectedServiceCardProps {
  service: {
    id: string
    name: string
    description?: string | null
    duration_minutes: number
    price_brl: number
  }
  profileHref: string
  userCurrency: string
}

export function SelectedServiceCard({ service, profileHref, userCurrency }: SelectedServiceCardProps) {
  return (
    <div className="rounded-xl border border-[#9FE870]/30 bg-[#9FE870]/5 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#9FE870]/20">
          <Briefcase className="h-5 w-5 text-[#4a7c1f]" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-[#4a7c1f]">
            Serviço selecionado
          </p>
          <h3 className="mt-0.5 text-base font-semibold text-slate-900">
            {service.name}
          </h3>
          {service.description && (
            <p className="mt-1 text-sm text-slate-500 line-clamp-2">
              {service.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {service.duration_minutes} min
            </span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(service.price_brl, userCurrency)}
            </span>
            <Link
              href={profileHref}
              className="ml-auto text-xs font-medium text-[#4a7c1f] underline-offset-2 hover:underline"
            >
              Trocar serviço
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

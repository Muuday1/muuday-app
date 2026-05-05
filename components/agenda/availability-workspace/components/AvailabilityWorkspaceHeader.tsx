'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface AvailabilityWorkspaceHeaderProps {
  variant: 'standalone' | 'embedded'
  activeDaysCount: number
  hasUnsavedChanges: boolean
  calendarTimezone: string
}

export function AvailabilityWorkspaceHeader({
  variant,
  activeDaysCount,
  hasUnsavedChanges,
  calendarTimezone,
}: AvailabilityWorkspaceHeaderProps) {
  if (variant === 'standalone') {
    return (
      <div className="mb-8">
        <Link
          href="/perfil"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-600"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar ao perfil
        </Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="mb-1 font-display text-3xl font-bold text-slate-900">Calendário e disponibilidade</h1>
            <p className="text-slate-500">
              Defina seus horários recorrentes de trabalho e concentre aqui as integrações do seu calendário.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {activeDaysCount > 0 ? (
              <span className="flex-shrink-0 rounded-full bg-[#9FE870]/8 px-3 py-1.5 text-xs font-medium text-[#3d6b1f]">
                {activeDaysCount} {activeDaysCount === 1 ? 'dia ativo' : 'dias ativos'}
              </span>
            ) : null}
            {hasUnsavedChanges && (
              <span className="flex-shrink-0 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                Alterações não salvas
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white px-6 py-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Regras e disponibilidades
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">
            Disponibilidade semanal e integrações de agenda
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Edite seus blocos recorrentes, acompanhe ocupações externas e mantenha a agenda operacional em um único fluxo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#9FE870]/8 px-3 py-1.5 text-xs font-medium text-[#3d6b1f]">
            {activeDaysCount} {activeDaysCount === 1 ? 'dia ativo' : 'dias ativos'}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
            Fuso {calendarTimezone.replaceAll('_', ' ')}
          </span>
          {hasUnsavedChanges && (
            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
              Alterações não salvas
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

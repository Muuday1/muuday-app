'use client'

import Link from 'next/link'
import { viewLinkClass } from '../helpers'
import type { AgendaView } from '../types'

interface AgendaHeaderProps {
  activeView: AgendaView
}

export function AgendaHeader({ activeView }: AgendaHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Agenda profissional
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-slate-950">
          Operação de agenda mais clara e mais rápida de navegar
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          O calendário completo fica na frente, as pendências viram uma inbox única e as regras ficam concentradas em uma única área de edição.
        </p>
      </div>
      <div className="flex flex-wrap gap-2" data-testid="professional-agenda-view-switcher">
        <Link
          href="/agenda?view=overview"
          className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${viewLinkClass(activeView, 'overview')}`}
        >
          Visão geral
        </Link>
        <Link
          href="/agenda?view=inbox&filter=all"
          className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${viewLinkClass(activeView, 'inbox')}`}
        >
          Pendências
        </Link>
        <Link
          href="/agenda?view=availability_rules"
          className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${viewLinkClass(activeView, 'availability_rules')}`}
        >
          Regras e disponibilidades
        </Link>
      </div>
    </div>
  )
}

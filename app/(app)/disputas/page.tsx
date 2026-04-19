export const metadata = { title: 'Disputas | Muuday' }

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { listCases } from '@/lib/actions/disputes'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'
import { ShieldAlert, ArrowRight, Plus, Clock } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  open: { label: 'Aberto', className: 'bg-amber-50 text-amber-700' },
  under_review: { label: 'Em análise', className: 'bg-blue-50 text-blue-700' },
  resolved: { label: 'Resolvido', className: 'bg-green-50 text-green-700' },
  closed: { label: 'Fechado', className: 'bg-neutral-100 text-neutral-500' },
}

const TYPE_LABELS: Record<string, string> = {
  cancelation_dispute: 'Cancelamento',
  no_show_claim: 'No-show',
  quality_issue: 'Qualidade',
  refund_request: 'Reembolso',
}

export default async function DisputasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const result = await listCases({})
  const cases = result.success ? result.data.cases : []

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900 md:text-3xl">Disputas</h1>
          <p className="mt-1 text-sm text-neutral-500">Acompanhe casos abertos e histórico.</p>
        </div>
        <Link
          href="/disputas/nova"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          Abrir caso
        </Link>
      </div>

      {cases.length === 0 ? (
        <div className="rounded-2xl border border-neutral-100 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-50">
            <ShieldAlert className="h-7 w-7 text-neutral-300" />
          </div>
          <p className="font-semibold text-neutral-900">Nenhuma disputa</p>
          <p className="mt-1 text-sm text-neutral-500">Você não tem casos abertos no momento.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {cases.map((c: any) => {
            const status = STATUS_LABELS[c.status] || STATUS_LABELS.open
            return (
              <Link
                key={c.id}
                href={`/disputas/${c.id}`}
                className="flex items-start justify-between rounded-2xl border border-neutral-100 bg-white p-4 transition hover:shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-neutral-900">{TYPE_LABELS[c.type] || c.type}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-neutral-600">{c.reason}</p>
                  <span className="mt-2 flex items-center gap-1 text-xs text-neutral-400">
                    <Clock className="h-3 w-3" />
                    {formatInTimeZone(new Date(c.created_at), 'America/Sao_Paulo', 'd MMM yyyy', {
                      locale: ptBR,
                    })}
                  </span>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-neutral-300" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

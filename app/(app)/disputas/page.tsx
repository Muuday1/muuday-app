export const metadata = { title: 'Disputas | Muuday' }

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { listCases } from '@/lib/actions/disputes'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'
import { ShieldAlert, ArrowRight, Plus, Clock } from 'lucide-react'
import { AppEmptyState } from '@/components/ui/AppEmptyState'
import { PageHeader, PageContainer } from '@/components/ui/AppShell'

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  open: { label: 'Aberto', className: 'bg-amber-50 text-amber-700' },
  under_review: { label: 'Em análise', className: 'bg-blue-50 text-blue-700' },
  resolved: { label: 'Resolvido', className: 'bg-green-50 text-green-700' },
  closed: { label: 'Fechado', className: 'bg-slate-100 text-slate-500' },
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
    <PageContainer maxWidth="md">
      <PageHeader title="Disputas" subtitle="Acompanhe casos abertos e histórico.">
        <Link
          href="/disputas/nova"
          className="inline-flex items-center gap-2 rounded-md bg-[#9FE870] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8ed85f]"
        >
          <Plus className="h-4 w-4" />
          Abrir caso
        </Link>
      </PageHeader>

      {cases.length === 0 ? (
        <AppEmptyState
          icon={ShieldAlert}
          title="Nenhuma disputa"
          description="Você não tem casos abertos no momento."
        />
      ) : (
        <div className="space-y-2">
          {cases.map((c: any) => {
            const status = STATUS_LABELS[c.status] || STATUS_LABELS.open
            return (
              <Link
                key={c.id}
                href={`/disputas/${c.id}`}
                className="flex items-start justify-between rounded-lg border border-slate-200/80 bg-white p-4 transition hover:border-slate-300"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{TYPE_LABELS[c.type] || c.type}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-slate-600">{c.reason}</p>
                  <span className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3 w-3" />
                    {formatInTimeZone(new Date(c.created_at), 'America/Sao_Paulo', 'd MMM yyyy', {
                      locale: ptBR,
                    })}
                  </span>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-slate-300" />
              </Link>
            )
          })}
        </div>
      )}
    </PageContainer>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { listCases } from '@/lib/actions/disputes'
import { CaseQueueClient } from '@/components/admin/CaseQueueClient'

export const metadata = { title: 'Casos | Admin | Muuday' }

const caseTypeLabels: Record<string, string> = {
  cancelation_dispute: 'Disputa de cancelamento',
  no_show_claim: 'Reclamação de no-show',
  quality_issue: 'Problema de qualidade',
  refund_request: 'Solicitação de reembolso',
}

const statusLabels: Record<string, string> = {
  open: 'Novo',
  under_review: 'Em análise',
  waiting_info: 'Aguardando info',
  resolved: 'Resolvido',
  closed: 'Fechado',
}

const priorityColors: Record<string, string> = {
  P0: 'bg-red-50 text-red-700 border-red-200',
  P1: 'bg-amber-50 text-amber-700 border-amber-200',
  P2: 'bg-blue-50 text-blue-700 border-blue-200',
  P3: 'bg-slate-50 text-slate-600 border-slate-200',
}

export default async function AdminCasosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; priority?: string; assigned?: string; cursor?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/buscar')

  const params = await searchParams
  const status = params.status || undefined
  const type = params.type || undefined
  const priority = params.priority || undefined
  const assignedTo = params.assigned || undefined
  const cursor = params.cursor || undefined

  const result = await listCases({ status, type, priority, assignedTo, limit: 50, cursor })

  if (!result.success) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-red-600">{result.error}</p>
        <a href="?" className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Tentar novamente
        </a>
      </div>
    )
  }

  const { cases, nextCursor } = result.data

  // Compute stats
  const stats = {
    total: cases.length,
    open: cases.filter((c: any) => c.status === 'open').length,
    underReview: cases.filter((c: any) => c.status === 'under_review').length,
    waitingInfo: cases.filter((c: any) => c.status === 'waiting_info').length,
    resolved: cases.filter((c: any) => c.status === 'resolved').length,
    overdue: cases.filter((c: any) => {
      if (['resolved', 'closed'].includes(c.status)) return false
      return c.sla_deadline && new Date(c.sla_deadline) < new Date()
    }).length,
  }

  return (
    <CaseQueueClient
      cases={cases as any[]}
      nextCursor={nextCursor}
      stats={stats}
      filters={{ status, type, priority, assignedTo }}
      labels={{ caseTypeLabels, statusLabels, priorityColors }}
      adminId={user.id}
    />
  )
}

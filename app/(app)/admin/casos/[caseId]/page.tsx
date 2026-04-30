import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  getCaseById,
  getCaseMessages,
  getCaseEvidence,
  getCaseTimeline,
} from '@/lib/actions/disputes'
import { CaseDetailClient } from '@/components/admin/CaseDetailClient'

export const metadata = { title: 'Detalhe do Caso | Admin | Muuday' }

const caseTypeLabels: Record<string, string> = {
  cancelation_dispute: 'Disputa de cancelamento',
  no_show_claim: 'Reclamação de no-show',
  quality_issue: 'Problema de qualidade',
  refund_request: 'Solicitação de reembolso',
}

const statusLabels: Record<string, string> = {
  open: 'Novo',
  under_review: 'Em análise',
  waiting_info: 'Aguardando informações',
  resolved: 'Resolvido',
  closed: 'Fechado',
}

const priorityColors: Record<string, string> = {
  P0: 'bg-red-50 text-red-700 border-red-200',
  P1: 'bg-amber-50 text-amber-700 border-amber-200',
  P2: 'bg-blue-50 text-blue-700 border-blue-200',
  P3: 'bg-slate-50 text-slate-600 border-slate-200',
}

export default async function AdminCaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/buscar')

  const { caseId } = await params

  const [caseResult, messagesResult, evidenceResult, timelineResult] = await Promise.all([
    getCaseById(caseId),
    getCaseMessages(caseId),
    getCaseEvidence(caseId),
    getCaseTimeline(caseId),
  ])

  if (!caseResult.success) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-red-600">{caseResult.error}</p>
        <Link href="/admin/casos" className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          ← Voltar para fila
        </Link>
      </div>
    )
  }

  return (
    <CaseDetailClient
      caseData={caseResult.data as any}
      messages={messagesResult.success ? (messagesResult.data.messages as any[]) : []}
      evidence={evidenceResult.success ? (evidenceResult.data as any) : null}
      timeline={timelineResult.success ? (timelineResult.data.events as any[]) : []}
      labels={{ caseTypeLabels, statusLabels, priorityColors }}
      adminId={user.id}
    />
  )
}

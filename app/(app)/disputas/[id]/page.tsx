export const metadata = { title: 'Caso | Muuday' }

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCaseById, getCaseMessages } from '@/lib/actions/disputes'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'
import {
  ArrowLeft,
  ShieldAlert,
  Clock,
  CheckCircle2,
  MessageCircle,
  Send,
  User,
} from 'lucide-react'
import { CaseMessageForm } from '@/components/disputes/CaseMessageForm'

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  open: { label: 'Aberto', className: 'bg-amber-50 text-amber-700' },
  under_review: { label: 'Em análise', className: 'bg-blue-50 text-blue-700' },
  waiting_info: { label: 'Aguardando informações', className: 'bg-purple-50 text-purple-700' },
  resolved: { label: 'Resolvido', className: 'bg-green-50 text-green-700' },
  closed: { label: 'Fechado', className: 'bg-slate-100 text-slate-500' },
}

const TYPE_LABELS: Record<string, string> = {
  cancelation_dispute: 'Cancelamento',
  no_show_claim: 'No-show',
  quality_issue: 'Problema de qualidade',
  refund_request: 'Solicitação de reembolso',
}

export default async function DisputaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const caseResult = await getCaseById(id)
  if (!caseResult.success) {
    redirect('/disputas')
  }

  const caseData = caseResult.data
  const status = STATUS_LABELS[caseData.status] || STATUS_LABELS.open

  const messagesResult = await getCaseMessages(id)
  const messages = messagesResult.success ? (messagesResult.data.messages as any[]) : []

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-8">
      <Link
        href="/disputas"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para disputas
      </Link>

      {/* Case header */}
      <div className="mb-6 rounded-lg border border-slate-200/80 bg-white p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
            {status.label}
          </span>
          <span className="text-xs text-slate-400">
            {TYPE_LABELS[caseData.type] || caseData.type}
          </span>
        </div>

        <h1 className="mt-3 font-display text-xl font-bold text-slate-900 md:text-2xl">
          Caso #{caseData.id.slice(0, 8)}
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-slate-700">{caseData.reason}</p>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Aberto em{' '}
            {formatInTimeZone(
              new Date(caseData.created_at),
              'America/Sao_Paulo',
              'd MMM yyyy',
              { locale: ptBR },
            )}
          </span>
          {caseData.reporter_name && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {caseData.reporter_name}
            </span>
          )}
        </div>

        {caseData.status === 'resolved' && caseData.resolution && (
          <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-sm font-semibold text-green-800">Resolução</p>
            </div>
            <p className="mt-1 text-sm text-green-700">{caseData.resolution}</p>
            {caseData.refund_amount && (
              <p className="mt-1 text-sm font-bold text-green-800">
                Reembolso: R$ {Number(caseData.refund_amount).toFixed(2)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="rounded-lg border border-slate-200/80 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-slate-500" />
          <h2 className="font-display text-lg font-bold text-slate-900">Mensagens</h2>
        </div>

        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhuma mensagem ainda. Use o formulário abaixo para adicionar informações.
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg: any) => {
              const isMe = msg.sender_id === user.id
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                    <User className="h-4 w-4 text-slate-500" />
                  </div>
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
                      isMe
                        ? 'bg-[#9FE870] text-white rounded-br-md'
                        : 'bg-slate-50/70 text-slate-800 rounded-bl-md'
                    }`}
                  >
                    <p className="text-xs opacity-70 mb-1">
                      {msg.profiles?.full_name || 'Usuário'} —{' '}
                      {formatInTimeZone(
                        new Date(msg.created_at),
                        'America/Sao_Paulo',
                        'd MMM HH:mm',
                        { locale: ptBR },
                      )}
                    </p>
                    <p>{msg.content}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {caseData.status !== 'resolved' && caseData.status !== 'closed' && (
          <div className="mt-6 border-t border-slate-200/80 pt-4">
            <CaseMessageForm caseId={caseData.id} />
          </div>
        )}
      </div>
    </div>
  )
}

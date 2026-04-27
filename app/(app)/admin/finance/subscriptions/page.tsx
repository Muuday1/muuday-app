import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loadProfessionalSubscriptions } from '@/lib/actions/admin/subscriptions'
import { formatMinorUnits } from '@/lib/payments/fees/calculator'

export const metadata = { title: 'Assinaturas | Admin | Muuday' }

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/buscar')

  const params = await searchParams
  const rawPage = params.page ? parseInt(params.page, 10) : 1
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1
  const status = params.status || undefined

  const result = await loadProfessionalSubscriptions({ page, pageSize: 20, status })

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

  const { items, total, pageSize } = result
  const totalPages = Math.ceil(total / pageSize)

  const statusLabel: Record<string, string> = {
    trialing: 'Em teste',
    active: 'Ativa',
    past_due: 'Inadimplente',
    canceled: 'Cancelada',
    incomplete: 'Incompleta',
    incomplete_expired: 'Expirada',
    paused: 'Pausada',
    unpaid: 'Não paga',
  }

  const statusClass: Record<string, string> = {
    trialing: 'bg-blue-50 text-blue-700',
    active: 'bg-green-50 text-green-700',
    past_due: 'bg-red-50 text-red-700',
    canceled: 'bg-slate-100 text-slate-600',
    incomplete: 'bg-amber-50 text-amber-700',
    incomplete_expired: 'bg-slate-100 text-slate-500',
    paused: 'bg-amber-50 text-amber-700',
    unpaid: 'bg-red-50 text-red-700',
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assinaturas</h1>
          <p className="text-slate-500">{total} assinaturas no total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['trialing', 'active', 'past_due', 'canceled'].map((s) => (
            <a
              key={s}
              href={`?status=${s}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${status === s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {statusLabel[s] || s}
            </a>
          ))}
          {status && (
            <a href="?" className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200">
              Limpar
            </a>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Profissional</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Valor</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Período atual</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Teste</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Falhas</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Criada</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length > 0 ? items.map((sub) => (
              <tr key={sub.id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{sub.professionalName}</div>
                  <div className="text-xs text-slate-500">{sub.professionalEmail}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass[sub.status] || 'bg-slate-100 text-slate-600'}`}>
                    {statusLabel[sub.status] || sub.status}
                  </span>
                  {sub.cancelAtPeriodEnd && (
                    <span className="ml-2 text-xs text-amber-600">(cancela no fim)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">
                  {formatMinorUnits(BigInt(sub.amountMinor), sub.currency.toUpperCase())}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {sub.currentPeriodStart && sub.currentPeriodEnd ? (
                    <>
                      {new Date(sub.currentPeriodStart).toLocaleDateString('pt-BR')} —{' '}
                      {new Date(sub.currentPeriodEnd).toLocaleDateString('pt-BR')}
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {sub.trialEnd ? new Date(sub.trialEnd).toLocaleDateString('pt-BR') : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  {sub.failureCount > 0 ? (
                    <span className="font-semibold text-red-600">{sub.failureCount}</span>
                  ) : (
                    <span className="text-slate-400">0</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(sub.createdAt).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Nenhuma assinatura encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div className="flex justify-between">
        <a
          href={`?page=${Math.max(1, page - 1)}${status ? `&status=${status}` : ''}`}
          className={`rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 ${page <= 1 ? 'pointer-events-none opacity-50' : 'hover:bg-slate-200'}`}
        >
          ← Anterior
        </a>
        <span className="text-sm text-slate-500">
          Página {page} de {totalPages}
        </span>
        <a
          href={`?page=${page + 1}${status ? `&status=${status}` : ''}`}
          className={`rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 ${page >= totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-slate-200'}`}
        >
          Próximo →
        </a>
      </div>
    </div>
  )
}

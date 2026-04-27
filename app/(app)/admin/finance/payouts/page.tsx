import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loadPayoutBatches } from '@/lib/actions/admin/finance'
import { formatMinorUnits } from '@/lib/payments/fees/calculator'

export const metadata = { title: 'Repasses | Admin | Muuday' }

export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ offset?: string; status?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/buscar')

  const params = await searchParams
  const rawOffset = params.offset ? parseInt(params.offset, 10) : 0
  const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0
  const status = params.status || undefined

  const result = await loadPayoutBatches({ limit: 50, offset, status })

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

  const { batches, total } = result.data

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Repasses</h1>
          <p className="text-slate-500">{total} lotes no total</p>
        </div>
        <div className="flex gap-2">
          {[
            { key: 'submitted', label: 'Submetido' },
            { key: 'processing', label: 'Processando' },
            { key: 'completed', label: 'Concluído' },
            { key: 'failed', label: 'Falhou' },
          ].map(({ key, label }) => (
            <a
              key={key}
              href={`?status=${key}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${status === key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {label}
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
              <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Total</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Líquido</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Itens</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Criado</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Concluído</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {batches.length > 0 ? batches.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    b.status === 'completed' ? 'bg-green-50 text-green-700' :
                    b.status === 'failed' ? 'bg-red-50 text-red-700' :
                    b.status === 'processing' ? 'bg-blue-50 text-blue-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>
                    {b.status === 'completed' ? 'Concluído' : b.status === 'failed' ? 'Falhou' : b.status === 'processing' ? 'Processando' : b.status === 'submitted' ? 'Submetido' : b.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">
                  {formatMinorUnits(BigInt(b.totalAmount), 'BRL')}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {formatMinorUnits(BigInt(b.netAmount), 'BRL')}
                </td>
                <td className="px-4 py-3 text-right">{b.itemCount}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(b.createdAt).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3 text-slate-500">{b.completedAt ? new Date(b.completedAt).toLocaleDateString('pt-BR') : '—'}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Nenhum lote encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div className="flex justify-between">
        <a
          href={`?offset=${Math.max(0, offset - 50)}${status ? `&status=${status}` : ''}`}
          className={`rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 ${offset <= 0 ? 'pointer-events-none opacity-50' : 'hover:bg-slate-200'}`}
        >
          ← Anterior
        </a>
        <a
          href={`?offset=${offset + 50}${status ? `&status=${status}` : ''}`}
          className={`rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 ${offset + 50 >= total ? 'pointer-events-none opacity-50' : 'hover:bg-slate-200'}`}
        >
          Próximo →
        </a>
      </div>
    </div>
  )
}

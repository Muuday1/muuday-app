import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loadPayoutBatches } from '@/lib/actions/admin/finance'

export const metadata = { title: 'Payouts | Admin | Muuday' }

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
  const offset = params.offset ? parseInt(params.offset, 10) : 0
  const status = params.status || undefined

  const result = await loadPayoutBatches({ limit: 50, offset, status })

  if (!result.success) {
    return <p className="p-6 text-red-600">{result.error}</p>
  }

  const { batches, total } = result.data

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payouts</h1>
          <p className="text-slate-500">{total} batches no total</p>
        </div>
        <div className="flex gap-2">
          {['submitted', 'processing', 'completed', 'failed'].map((s) => (
            <a
              key={s}
              href={`?status=${s}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${status === s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {s}
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
            {batches.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    b.status === 'completed' ? 'bg-green-50 text-green-700' :
                    b.status === 'failed' ? 'bg-red-50 text-red-700' :
                    b.status === 'processing' ? 'bg-blue-50 text-blue-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(b.totalAmount) / 100)}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(b.netAmount) / 100)}
                </td>
                <td className="px-4 py-3 text-right">{b.itemCount}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(b.createdAt).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3 text-slate-500">{b.completedAt ? new Date(b.completedAt).toLocaleDateString('pt-BR') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
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

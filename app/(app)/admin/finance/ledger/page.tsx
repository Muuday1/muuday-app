import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loadLedgerEntries } from '@/lib/actions/admin/finance'
import { formatMinorUnits } from '@/lib/payments/fees/calculator'

export const metadata = { title: 'Livro Razão | Admin | Muuday' }

export default async function AdminLedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ offset?: string; account?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/buscar')

  const params = await searchParams
  const rawOffset = params.offset ? parseInt(params.offset, 10) : 0
  const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0
  const accountId = params.account || undefined

  const result = await loadLedgerEntries({ limit: 50, offset, accountId })

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

  const { entries, total } = result.data

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Livro Razão</h1>
          <p className="text-slate-500">{total} entradas no total</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Data</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Transação</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Conta</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Tipo</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Valor</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Descrição</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.length > 0 ? entries.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 text-slate-500">{new Date(e.createdAt).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400">{e.transactionId.slice(0, 8)}</td>
                <td className="px-4 py-3 font-medium text-slate-700">{e.accountId}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${e.entryType === 'debit' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                    {e.entryType === 'debit' ? 'Débito' : 'Crédito'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">
                  {formatMinorUnits(BigInt(e.amount), e.currency)}
                </td>
                <td className="px-4 py-3 text-slate-500">{e.description || '—'}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Nenhuma entrada encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div className="flex justify-between">
        <a
          href={`?offset=${Math.max(0, offset - 50)}${accountId ? `&account=${accountId}` : ''}`}
          className={`rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 ${offset <= 0 ? 'pointer-events-none opacity-50' : 'hover:bg-slate-200'}`}
        >
          ← Anterior
        </a>
        <a
          href={`?offset=${offset + 50}${accountId ? `&account=${accountId}` : ''}`}
          className={`rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 ${offset + 50 >= total ? 'pointer-events-none opacity-50' : 'hover:bg-slate-200'}`}
        >
          Próximo →
        </a>
      </div>
    </div>
  )
}

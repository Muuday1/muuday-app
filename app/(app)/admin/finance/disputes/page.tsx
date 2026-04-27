import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loadDisputes } from '@/lib/actions/admin/finance'
import { formatMinorUnits } from '@/lib/payments/fees/calculator'

export const metadata = { title: 'Disputas | Admin | Muuday' }

export default async function AdminDisputesPage({
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

  const result = await loadDisputes({ limit: 50, offset, status })

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

  const { disputes, total } = result.data

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Disputas</h1>
          <p className="text-slate-500">{total} disputas no total</p>
        </div>
        <div className="flex gap-2">
          {[
            { key: 'open', label: 'Aberta' },
            { key: 'recovered', label: 'Recuperada' },
            { key: 'written_off', label: 'Perdida' },
            { key: 'waived', label: 'Dispensada' },
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
              <th className="px-4 py-3 text-left font-medium text-slate-600">Profissional</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Disputa</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Recuperado</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Restante</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Método</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Criado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {disputes.length > 0 ? disputes.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    d.status === 'open' ? 'bg-amber-50 text-amber-700' :
                    d.status === 'recovered' ? 'bg-green-50 text-green-700' :
                    'bg-slate-50 text-slate-700'
                  }`}>
                    {d.status === 'open' ? 'Aberta' : d.status === 'recovered' ? 'Recuperada' : d.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">{d.professionalName || d.professionalId.slice(0, 8)}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">
                  {formatMinorUnits(BigInt(d.disputeAmount), 'BRL')}
                </td>
                <td className="px-4 py-3 text-right text-green-600">
                  {formatMinorUnits(BigInt(d.recoveredAmount), 'BRL')}
                </td>
                <td className="px-4 py-3 text-right text-red-600">
                  {formatMinorUnits(BigInt(d.remainingDebt), 'BRL')}
                </td>
                <td className="px-4 py-3 text-slate-500">{d.recoveryMethod}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(d.createdAt).toLocaleDateString('pt-BR')}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Nenhuma disputa encontrada.
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

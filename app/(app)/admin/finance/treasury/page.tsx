import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Tesouraria | Admin | Muuday' }

export default async function AdminTreasuryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/buscar')

  // Fetch treasury data from existing API
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/admin/finance/treasury-status`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  })

  let data: Record<string, unknown> | null = null
  if (res.ok) {
    data = await res.json()
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tesouraria</h1>
        <p className="text-slate-500">Status da conta Revolut e histórico</p>
      </div>

      {data ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-medium text-slate-500">Saldo Atual</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: String(data.currency || 'BRL') }).format(Number(data.currentBalance || 0) / 100)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-medium text-slate-500">Payouts Pendentes</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: String(data.currency || 'BRL') }).format(Number(data.pendingPayoutsTotal || 0) / 100)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-medium text-slate-500">Disponível</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {data.availableAfterPayouts
                  ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: String(data.currency || 'BRL') }).format(Number(data.availableAfterPayouts) / 100)
                  : '—'}
              </p>
            </div>
            <div className={`rounded-xl border bg-white p-6 ${data.isBelowBuffer ? 'border-red-200' : 'border-slate-200'}`}>
              <p className="text-sm font-medium text-slate-500">Buffer de Segurança</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: String(data.currency || 'BRL') }).format(Number(data.safetyBuffer || 0) / 100)}
              </p>
              {data.isBelowBuffer && <p className="mt-1 text-sm text-red-600 font-medium">⚠️ Abaixo do buffer</p>}
            </div>
          </div>

          {/* Snapshots */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Histórico (últimos 30 dias)</h2>
            {Array.isArray(data.snapshots) && data.snapshots.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Data</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(data.snapshots as Array<{ at: string; balance: string }>).map((s, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 text-slate-500">{new Date(s.at).toLocaleDateString('pt-BR')}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: String(data.currency || 'BRL') }).format(Number(s.balance) / 100)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500">Nenhum snapshot disponível.</p>
            )}
          </div>

          {/* Recent settlements */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Settlements Recentes (Stripe → Revolut)</h2>
            {Array.isArray(data.recentSettlements) && data.recentSettlements.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Stripe Payout ID</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Bruto</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Taxa</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Líquido</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(data.recentSettlements as Array<Record<string, unknown>>).map((s, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{String(s.stripePayoutId).slice(0, 16)}...</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(s.amount || 0) / 100)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(s.fee || 0) / 100)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(s.netAmount || 0) / 100)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            s.status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {String(s.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500">Nenhum settlement recente.</p>
            )}
          </div>
        </>
      ) : (
        <p className="text-red-600">Erro ao carregar dados da tesouraria.</p>
      )}
    </div>
  )
}

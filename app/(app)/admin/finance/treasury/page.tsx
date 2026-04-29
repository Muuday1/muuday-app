import * as Sentry from '@sentry/nextjs'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTreasuryBalance } from '@/lib/payments/revolut/client'
import { env } from '@/lib/config/env'
import { formatMinorUnits } from '@/lib/payments/fees/calculator'

export const metadata = { title: 'Tesouraria | Admin | Muuday' }

export default async function AdminTreasuryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/buscar')

  // Fetch treasury data directly (no internal HTTP round-trip)
  const admin = createAdminClient()
  let data: Record<string, unknown> | null = null

  if (admin) {
    try {
      const treasury = await getTreasuryBalance()

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const [
        { data: pendingBatches },
        { data: snapshots },
        { data: settlements },
      ] = await Promise.all([
        admin
          .from('payout_batches')
          .select('net_amount')
          .in('status', ['submitted', 'processing']),
        admin
          .from('revolut_treasury_snapshots')
          .select('snapshot_at, balance')
          .gte('snapshot_at', thirtyDaysAgo.toISOString())
          .order('snapshot_at', { ascending: true })
          .limit(1000),
        admin
          .from('stripe_settlements')
          .select('stripe_payout_id, amount, fee, net_amount, status, settlement_date, created_at')
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(50),
      ])

      const pendingPayoutsTotal = (pendingBatches || []).reduce(
        (sum, b) => sum + BigInt(b.net_amount || 0),
        BigInt(0),
      )

      const minBuffer = BigInt(env.MINIMUM_TREASURY_BUFFER_MINOR)

      data = {
        currentBalance: treasury?.balance?.toString() || null,
        currency: treasury?.currency || 'BRL',
        pendingPayoutsTotal: pendingPayoutsTotal.toString(),
        safetyBuffer: minBuffer.toString(),
        availableAfterPayouts: treasury?.balance
          ? (treasury.balance - pendingPayoutsTotal).toString()
          : null,
        isBelowBuffer: treasury?.balance
          ? treasury.balance < (pendingPayoutsTotal + minBuffer)
          : null,
        snapshots: (snapshots || []).map((s) => ({ at: s.snapshot_at, balance: s.balance.toString() })),
        recentSettlements: (settlements || []).map((s) => ({
          stripePayoutId: s.stripe_payout_id,
          amount: s.amount.toString(),
          fee: s.fee.toString(),
          netAmount: s.net_amount.toString(),
          status: s.status,
          settlementDate: s.settlement_date,
          createdAt: s.created_at,
        })),
      }
    } catch (e) {
      Sentry.captureException(e instanceof Error ? e : new Error(String(e)), {
        tags: { area: 'admin_treasury_page', context: 'load-data' },
      })
    }
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
                {formatMinorUnits(BigInt(String(data.currentBalance || 0)), String(data.currency || 'BRL'))}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-medium text-slate-500">Repasses Pendentes</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {formatMinorUnits(BigInt(String(data.pendingPayoutsTotal || 0)), String(data.currency || 'BRL'))}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-medium text-slate-500">Disponível</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {data.availableAfterPayouts
                  ? formatMinorUnits(BigInt(String(data.availableAfterPayouts)), String(data.currency || 'BRL'))
                  : '—'}
              </p>
            </div>
            <div className={`rounded-xl border bg-white p-6 ${data.isBelowBuffer ? 'border-red-200' : 'border-slate-200'}`}>
              <p className="text-sm font-medium text-slate-500">Buffer de Segurança</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {formatMinorUnits(BigInt(String(data.safetyBuffer || 0)), String(data.currency || 'BRL'))}
              </p>
              {Boolean(data.isBelowBuffer) && <p className="mt-1 text-sm text-red-600 font-medium">⚠️ Abaixo do buffer</p>}
            </div>
          </div>

          {/* Snapshots */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Histórico (últimos 30 dias)</h2>
            {Array.isArray(data.snapshots) && data.snapshots.length > 0 ? (
              <div className="overflow-x-auto scrollbar-hide">
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
                          {formatMinorUnits(BigInt(String(s.balance)), String(data.currency || 'BRL'))}
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
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Liquidações Recentes (Stripe → Revolut)</h2>
            {Array.isArray(data.recentSettlements) && data.recentSettlements.length > 0 ? (
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">ID do Repasse Stripe</th>
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
                          {formatMinorUnits(BigInt(String(s.amount || 0)), 'BRL')}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500">
                          {formatMinorUnits(BigInt(String(s.fee || 0)), 'BRL')}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {formatMinorUnits(BigInt(String(s.netAmount || 0)), 'BRL')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            s.status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {s.status === 'paid' ? 'Pago' : s.status === 'pending' ? 'Pendente' : String(s.status)}
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

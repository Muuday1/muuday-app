'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { FinanceOverviewData } from '@/lib/actions/admin/finance'
import { formatMinorUnits } from '@/lib/payments/format-utils'

interface Props {
  data: FinanceOverviewData
}

function StatCard({
  title,
  value,
  subtitle,
  href,
  danger,
}: {
  title: string
  value: string
  subtitle?: string
  href?: string
  danger?: boolean
}) {
  const content = (
    <div
      className={`rounded-xl border bg-white p-6 transition-shadow hover:shadow-md ${danger ? 'border-red-200' : 'border-slate-200'}`}
    >
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className={`mt-2 text-3xl font-bold tracking-tight ${danger ? 'text-red-600' : 'text-slate-900'}`}>
        {value}
      </p>
      {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    )
  }
  return content
}

export function AdminFinanceDashboard({ data }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'debt'>('overview')

  const treasury = data.treasury
  const payouts = data.payouts
  const disputes = data.disputes
  const ledger = data.ledger

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financeiro</h1>
          <p className="text-slate-500">Visão geral das operações financeiras</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${activeTab === 'overview' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Visão geral
          </button>
          <button
            onClick={() => setActiveTab('debt')}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${activeTab === 'debt' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Dívidas
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Treasury */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Tesouraria</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Saldo Revolut"
                value={treasury.balance ? formatMinorUnits(treasury.balance) : '—'}
                subtitle={treasury.currency}
              />
              <StatCard
                title="Payouts Pendentes"
                value={formatMinorUnits(treasury.pendingPayoutsTotal)}
                subtitle={`${payouts.pendingCount} batch(s)`}
                href="/admin/finance/payouts"
              />
              <StatCard
                title="Disponível após Payouts"
                value={treasury.availableAfterPayouts ? formatMinorUnits(treasury.availableAfterPayouts) : '—'}
                subtitle={`Buffer: ${formatMinorUnits(treasury.safetyBuffer)}`}
                danger={treasury.isBelowBuffer === true}
              />
              <StatCard
                title="Receita (30d)"
                value={formatMinorUnits(ledger.totalRevenueLast30Days)}
                subtitle={`${ledger.transactionCountLast30Days} transações`}
              />
            </div>
          </section>

          {/* Payouts */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Payouts</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Pendentes"
                value={String(payouts.pendingCount)}
                subtitle={formatMinorUnits(payouts.pendingTotal)}
                href="/admin/finance/payouts"
              />
              <StatCard
                title="Concluídos (30d)"
                value={String(payouts.completedLast30Days)}
                subtitle={formatMinorUnits(payouts.completedTotalLast30Days)}
                href="/admin/finance/payouts"
              />
              <StatCard
                title="Falhas (30d)"
                value={String(payouts.failedLast30Days)}
                danger={payouts.failedLast30Days > 0}
              />
              <StatCard
                title="Taxas Stripe (30d)"
                value={formatMinorUnits(ledger.totalStripeFeesLast30Days)}
              />
            </div>
          </section>

          {/* Disputes */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Disputas</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Disputas Abertas"
                value={String(disputes.openCount)}
                subtitle={formatMinorUnits(disputes.openTotal)}
                href="/admin/finance/disputes"
                danger={disputes.openCount > 0}
              />
              <StatCard
                title="Recuperados (30d)"
                value={String(disputes.recoveredLast30Days)}
                subtitle={formatMinorUnits(disputes.recoveredTotalLast30Days)}
                href="/admin/finance/disputes"
              />
              <StatCard
                title="Taxas Trolley (30d)"
                value={formatMinorUnits(ledger.totalTrolleyFeesLast30Days)}
              />
            </div>
          </section>

          {/* Quick Links */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Ações</h2>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/finance/ledger"
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                Ver Ledger →
              </Link>
              <Link
                href="/admin/finance/payouts"
                className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Ver Payouts →
              </Link>
              <Link
                href="/admin/finance/treasury"
                className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Ver Tesouraria →
              </Link>
              <Link
                href="/admin/finance/disputes"
                className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Ver Disputas →
              </Link>
              <Link
                href="/admin/finance/subscriptions"
                className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Ver Assinaturas →
              </Link>
            </div>
          </section>
        </>
      )}

      {activeTab === 'debt' && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Profissionais com Dívida Alta</h2>
          {data.professionalsWithHighDebt.length === 0 ? (
            <p className="text-slate-500">Nenhum profissional com dívida acima do limite.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Profissional</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Email</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">Dívida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.professionalsWithHighDebt.map((pro) => (
                    <tr key={pro.professionalId}>
                      <td className="px-4 py-3 font-medium text-slate-900">{pro.name}</td>
                      <td className="px-4 py-3 text-slate-500">{pro.email}</td>
                      <td className="px-4 py-3 text-right font-semibold text-red-600">
                        {formatMinorUnits(pro.totalDebt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

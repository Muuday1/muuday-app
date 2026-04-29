export const dynamic = 'force-dynamic'

export const metadata = { title: 'Financeiro | Muuday' }

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Wallet, Calendar, Receipt, ArrowRight, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { getPayoutStatus } from '@/lib/actions/professional-payout'
import { AppCard } from '@/components/ui/AppCard'
import { PageHeader, PageContainer } from '@/components/ui/AppShell'
import { PayoutStatusCard } from '@/components/finance/PayoutStatusCard'
import { PayoutHistoryTable } from '@/components/finance/PayoutHistoryTable'
import { PayoutPeriodicitySelector } from '@/components/finance/PayoutPeriodicitySelector'
import { SubscriptionStatusCard } from '@/components/finance/SubscriptionStatusCard'
import { getProfessionalSubscription } from '@/lib/actions/professional/subscription'
import { TransactionList } from '@/components/finance/TransactionList'
import { EarningsSparkline } from '@/components/finance/EarningsSparkline'

interface Payment {
  id: string
  amount_total?: number
  platform_fee_brl_minor?: number
  currency?: string
  status: string
  created_at: string
  booking_id?: string
}

interface BookingWithClient {
  id: string
  profiles?: { full_name?: string | null } | null
}

const PAYMENTS_LIMIT = 100
const BOOKINGS_LOOKUP_LIMIT = 500
const SPARKLINE_DAYS = 30

function groupPaymentsByDay(payments: Payment[]): { label: string; value: number }[] {
  const map = new Map<string, number>()
  const today = new Date()
  // Last SPARKLINE_DAYS days
  for (let i = SPARKLINE_DAYS - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    map.set(key, 0)
  }

  for (const p of payments) {
    if (p.status !== 'captured') continue
    const dateKey = new Date(p.created_at).toISOString().slice(0, 10)
    if (map.has(dateKey)) {
      map.set(dateKey, (map.get(dateKey) || 0) + Number(p.amount_total ?? 0))
    }
  }

  return Array.from(map.entries()).map(([date, value]) => ({
    label: `${String(new Date(date).getDate()).padStart(2, '0')}/${String(new Date(date).getMonth() + 1).padStart(2, '0')}`,
    value,
  }))
}

function calculateTrend(payments: Payment[]): { direction: 'up' | 'down' | 'flat'; percentage: number } {
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const thisMonthTotal = payments
    .filter((p) => p.status === 'captured' && new Date(p.created_at) >= thisMonthStart)
    .reduce((sum, p) => sum + Number(p.amount_total ?? 0), 0)

  const lastMonthTotal = payments
    .filter(
      (p) =>
        p.status === 'captured' &&
        new Date(p.created_at) >= lastMonthStart &&
        new Date(p.created_at) < thisMonthStart,
    )
    .reduce((sum, p) => sum + Number(p.amount_total ?? 0), 0)

  if (lastMonthTotal === 0) {
    return thisMonthTotal > 0 ? { direction: 'up', percentage: 100 } : { direction: 'flat', percentage: 0 }
  }

  const pct = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
  return {
    direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat',
    percentage: Math.abs(pct),
  }
}

export default async function FinanceiroPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, currency')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'profissional' && profile.role !== 'admin')) {
    redirect('/buscar')
  }

  const { data: professional } = await getPrimaryProfessionalForUser(
    supabase,
    user.id,
    'id, status',
  )

  const professionalId = professional?.id || null

  const [
    { data: payments },
    { data: bookingsWithClients },
    { data: activeBookings },
    payoutData,
    subscriptionResult,
  ] = await Promise.all([
    professionalId
      ? supabase
          .from('payments')
          .select('id, amount_total, platform_fee_brl_minor, currency, status, created_at, booking_id')
          .eq('professional_id', professionalId)
          .order('created_at', { ascending: false })
          .limit(PAYMENTS_LIMIT)
      : Promise.resolve({ data: [] as Payment[] }),
    professionalId
      ? supabase
          .from('bookings')
          .select('id, user_id, profiles!bookings_user_id_fkey(full_name)')
          .eq('professional_id', professionalId)
          .limit(BOOKINGS_LOOKUP_LIMIT)
      : Promise.resolve({ data: [] as BookingWithClient[] }),
    professionalId
      ? supabase
          .from('bookings')
          .select('status')
          .eq('professional_id', professionalId)
          .in('status', ['confirmed', 'completed', 'pending_confirmation'])
          .limit(BOOKINGS_LOOKUP_LIMIT)
      : Promise.resolve({ data: [] as Array<{ status: string }> }),
    professionalId ? getPayoutStatus() : Promise.resolve(null),
    professionalId ? getProfessionalSubscription() : Promise.resolve(null),
  ])

  const subscription =
    subscriptionResult && typeof subscriptionResult === 'object' && 'success' in subscriptionResult && subscriptionResult.success
      ? (subscriptionResult as { success: true; subscription: unknown }).subscription
      : null

  const currency = profile.currency || 'BRL'

  // Build client name lookup from bookings
  const clientNameMap = new Map<string, string>()
  for (const b of (bookingsWithClients || []) as BookingWithClient[]) {
    const name = b.profiles?.full_name
    if (name && b.id) {
      clientNameMap.set(b.id, name)
    }
  }

  // Transaction data
  const transactions = (payments as Payment[] || []).map((p) => {
    const platformFee = (p.platform_fee_brl_minor ?? 0) / 100
    const amountTotal = Number(p.amount_total ?? 0)
    return {
      id: p.id,
      createdAt: p.created_at,
      clientName: clientNameMap.get(p.booking_id ?? '') || '—',
      bookingId: p.booking_id ?? '',
      amountTotal,
      platformFee,
      netAmount: amountTotal - platformFee,
      currency: p.currency || 'BRL',
      status: p.status,
    }
  })

  const capturedPayments = (payments as Payment[] || []).filter((payment) => payment.status === 'captured')
  const grossTotal = capturedPayments.reduce(
    (total, payment) => total + Number(payment.amount_total ?? 0),
    0,
  )
  const netTotal = capturedPayments.reduce(
    (total, payment) =>
      total + Number(payment.amount_total ?? 0) - (payment.platform_fee_brl_minor ?? 0) / 100,
    0,
  )
  const pendingPayments = (payments as Payment[] || []).filter((payment) =>
    ['pending', 'requires_action'].includes(String(payment.status)),
  )
  const activeBookingCount = (activeBookings || []).length

  const trend = calculateTrend(payments || [])
  const sparklineData = groupPaymentsByDay(payments || [])

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title="Financeiro"
        subtitle="Acompanhe ganhos, pagamentos pendentes e volume de agendamentos em um único painel."
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <AppCard>
          <p className="mb-1 text-xs text-slate-500">Total capturado (bruto)</p>
          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(grossTotal, currency)}</p>
        </AppCard>
        <AppCard>
          <p className="mb-1 text-xs text-slate-500">Total líquido</p>
          <p className="text-2xl font-semibold text-green-700">{formatCurrency(netTotal, currency)}</p>
        </AppCard>
        <AppCard>
          <div className="flex items-center justify-between">
            <p className="mb-1 text-xs text-slate-500">Pagamentos pendentes</p>
            {pendingPayments.length > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                {pendingPayments.length}
              </span>
            )}
          </div>
          <p className="text-2xl font-semibold text-slate-900">{pendingPayments.length}</p>
        </AppCard>
        <AppCard>
          <div className="flex items-center justify-between">
            <p className="mb-1 text-xs text-slate-500">Agendamentos ativos</p>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                trend.direction === 'up'
                  ? 'bg-green-100 text-green-700'
                  : trend.direction === 'down'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-slate-100 text-slate-600'
              }`}
            >
              {trend.direction === 'up' ? (
                <TrendingUp className="h-3 w-3" />
              ) : trend.direction === 'down' ? (
                <TrendingDown className="h-3 w-3" />
              ) : null}
              {trend.percentage.toFixed(0)}% vs mês anterior
            </span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{activeBookingCount}</p>
        </AppCard>
      </div>

      {/* Subscription section */}
      {Boolean(subscription) && <SubscriptionStatusCard subscription={subscription as any} />}

      {/* Earnings chart */}
      {sparklineData.length > 1 && (
        <div className="mb-6">
          <AppCard>
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#9FE870]" />
              <h2 className="font-semibold text-slate-900">Ganhos — últimos 30 dias</h2>
            </div>
            <EarningsSparkline data={sparklineData} />
          </AppCard>
        </div>
      )}

      {/* Payout section */}
      {payoutData && !('error' in payoutData) ? (
        <div className="mb-6 space-y-4">
          <PayoutStatusCard
            payoutStatus={payoutData.payoutStatus}
            balance={payoutData.balance}
            periodicity={payoutData.periodicity || 'weekly'}
          />
          <AppCard>
            <PayoutPeriodicitySelector currentPeriodicity={payoutData.periodicity || 'weekly'} />
          </AppCard>
          <PayoutHistoryTable
            payouts={payoutData.recentPayouts}
            periodicity={payoutData.periodicity || 'weekly'}
          />
        </div>
      ) : (
        <AppCard className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-[#9FE870]" />
            <h2 className="font-semibold text-slate-900">Saldo e Recebimentos</h2>
          </div>
          <p className="text-sm text-slate-600">
            Os dados de saldo e recebimentos estarão disponíveis após a configuração completa do sistema de pagamentos.
          </p>
        </AppCard>
      )}

      {/* Transaction list */}
      {transactions.length > 0 && (
        <div className="mb-6">
          <AppCard>
            <div className="mb-4 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-[#9FE870]" />
              <h2 className="font-semibold text-slate-900">Transações</h2>
            </div>
            <TransactionList transactions={transactions} currency={currency} />
          </AppCard>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AppCard hover padding="sm">
          <Link href="/agenda" className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-[#9FE870]" />
              <div>
                <p className="text-sm font-medium text-slate-900">Ver bookings</p>
                <p className="text-xs text-slate-500">Acompanhar agenda e status</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </Link>
        </AppCard>

        <AppCard hover padding="sm">
          <Link href="/configuracoes" className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Receipt className="h-4 w-4 text-[#9FE870]" />
              <div>
                <p className="text-sm font-medium text-slate-900">Preferências da conta</p>
                <p className="text-xs text-slate-500">Moeda, notificações e segurança</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </Link>
        </AppCard>
      </div>
    </PageContainer>
  )
}

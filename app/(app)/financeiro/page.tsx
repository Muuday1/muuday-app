export const metadata = { title: 'Financeiro | Muuday' }

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Wallet, Calendar, Receipt, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { AppCard } from '@/components/ui/AppCard'
import { PageHeader, PageContainer } from '@/components/ui/AppShell'

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

  const { data: payments } = professionalId
    ? await supabase
        .from('payments')
        .select('amount_total, currency, status, created_at')
        .eq('professional_id', professionalId)
        .order('created_at', { ascending: false })
        .limit(100)
    : { data: [] as any[] }

  const { data: bookings } = professionalId
    ? await supabase
        .from('bookings')
        .select('status')
        .eq('professional_id', professionalId)
        .in('status', ['confirmed', 'completed', 'pending_confirmation'])
    : { data: [] as any[] }

  const currency = profile.currency || 'BRL'
  const capturedPayments = (payments || []).filter((payment: any) => payment.status === 'captured')
  const grossTotal = capturedPayments.reduce(
    (total: number, payment: any) => total + Number(payment.amount_total || 0),
    0,
  )
  const pendingPayments = (payments || []).filter((payment: any) =>
    ['pending', 'requires_action'].includes(String(payment.status)),
  )
  const activeBookings = (bookings || []).length

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title="Financeiro"
        subtitle="Acompanhe ganhos, pagamentos pendentes e volume de agendamentos em um único painel."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
        <AppCard>
          <p className="mb-1 text-xs text-slate-500">Total capturado</p>
          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(grossTotal, currency)}</p>
        </AppCard>
        <AppCard>
          <p className="mb-1 text-xs text-slate-500">Pagamentos pendentes</p>
          <p className="text-2xl font-semibold text-slate-900">{pendingPayments.length}</p>
        </AppCard>
        <AppCard>
          <p className="mb-1 text-xs text-slate-500">Bookings ativos</p>
          <p className="text-2xl font-semibold text-slate-900">{activeBookings}</p>
        </AppCard>
      </div>

      <AppCard className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="w-4 h-4 text-[#9FE870]" />
          <h2 className="font-semibold text-slate-900">Próximos recursos</h2>
        </div>
        <ul className="text-sm text-slate-600 space-y-2">
          <li>Histórico detalhado por booking (bruto, taxas e líquido).</li>
          <li>Payouts semanais e falhas de saque com tratamento operacional.</li>
          <li>Consolidação com ledger interno para reconciliação.</li>
        </ul>
      </AppCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link
          href="/agenda"
          className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-white p-4 transition-all hover:border-slate-300"
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-[#9FE870]" />
            <div>
              <p className="text-sm font-medium text-slate-900">Ver bookings</p>
              <p className="text-xs text-slate-500">Acompanhar agenda e status</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </Link>

        <Link
          href="/configuracoes"
          className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-white p-4 transition-all hover:border-slate-300"
        >
          <div className="flex items-center gap-3">
            <Receipt className="w-4 h-4 text-[#9FE870]" />
            <div>
              <p className="text-sm font-medium text-slate-900">Preferências da conta</p>
              <p className="text-xs text-slate-500">Moeda, notificações e segurança</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </Link>
      </div>
    </PageContainer>
  )
}

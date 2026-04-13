export const metadata = { title: 'Financeiro | Muuday' }

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Wallet, Calendar, Receipt, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'

export default async function FinanceiroPage() {
  const supabase = createClient()
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
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-neutral-900 mb-2">Financeiro</h1>
        <p className="text-neutral-500">
          Acompanhe ganhos, pagamentos pendentes e volume de agendamentos em um unico painel.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-neutral-100 p-5">
          <p className="text-xs text-neutral-500 mb-1">Total capturado</p>
          <p className="text-2xl font-semibold text-neutral-900">{formatCurrency(grossTotal, currency)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-100 p-5">
          <p className="text-xs text-neutral-500 mb-1">Pagamentos pendentes</p>
          <p className="text-2xl font-semibold text-neutral-900">{pendingPayments.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-100 p-5">
          <p className="text-xs text-neutral-500 mb-1">Bookings ativos</p>
          <p className="text-2xl font-semibold text-neutral-900">{activeBookings}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="w-4 h-4 text-brand-500" />
          <h2 className="font-semibold text-neutral-900">Proximos recursos</h2>
        </div>
        <ul className="text-sm text-neutral-600 space-y-2">
          <li>Historico detalhado por booking (bruto, taxas e liquido).</li>
          <li>Payouts semanais e falhas de saque com tratamento operacional.</li>
          <li>Consolidacao com ledger interno para reconciliacao.</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/agenda"
          className="bg-white rounded-2xl border border-neutral-100 p-4 flex items-center justify-between hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-brand-500" />
            <div>
              <p className="text-sm font-medium text-neutral-900">Ver bookings</p>
              <p className="text-xs text-neutral-500">Acompanhar agenda e status</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400" />
        </Link>

        <Link
          href="/configuracoes"
          className="bg-white rounded-2xl border border-neutral-100 p-4 flex items-center justify-between hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-3">
            <Receipt className="w-4 h-4 text-brand-500" />
            <div>
              <p className="text-sm font-medium text-neutral-900">Preferencias da conta</p>
              <p className="text-xs text-neutral-500">Moeda, notificacoes e seguranca</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400" />
        </Link>
      </div>
    </div>
  )
}

export const metadata = { title: 'Configurações de Renovação | Muuday' }

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageContainer, PageHeader } from '@/components/ui/AppShell'
import { AppCard } from '@/components/ui/AppCard'
import { AutoRenewToggle } from './AutoRenewToggle'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'

export default async function RecurringSettingsPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    notFound()
  }

  const { data: settings, error } = await supabase
    .from('recurring_payment_settings')
    .select('*')
    .eq('recurrence_group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !settings) {
    notFound()
  }

  const { data: professional } = await supabase
    .from('professionals')
    .select('profiles(full_name)')
    .eq('id', settings.professional_id)
    .maybeSingle()

  const professionalName = (professional as any)?.profiles?.full_name || 'Profissional'

  const userTimezone = 'America/Sao_Paulo'
  const nextRenewalDate = settings.next_renewal_at
    ? formatInTimeZone(new Date(settings.next_renewal_at), userTimezone, "d 'de' MMMM 'de' yyyy", {
        locale: ptBR,
      })
    : null

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: settings.currency || 'BRL',
  }).format(Number(settings.price_total || 0))

  const statusMap: Record<string, { label: string; color: string }> = {
    active: { label: 'Ativa', color: 'text-green-700 bg-green-50' },
    paused: { label: 'Pausada', color: 'text-amber-700 bg-amber-50' },
    payment_failed: { label: 'Pagamento falhou', color: 'text-red-700 bg-red-50' },
    cancelled: { label: 'Cancelada', color: 'text-slate-500 bg-slate-100' },
  }
  const statusInfo = statusMap[settings.status] || statusMap.active

  return (
    <PageContainer>
      <PageHeader title="Configurações de Renovação" />

      <div className="mx-auto max-w-xl space-y-4">
        <AppCard>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">{professionalName}</p>
                <p className="text-sm text-slate-500">Agendamento recorrente</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Próxima cobrança</p>
                <p className="text-sm font-medium text-slate-900">
                  {nextRenewalDate || 'A calcular'}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Valor</p>
                <p className="text-sm font-medium text-slate-900">{formattedPrice}</p>
              </div>
            </div>

            {settings.status === 'payment_failed' && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                A cobrança automática falhou. A renovação foi pausada. Para continuar,
                realize um novo agendamento manualmente.
              </div>
            )}

            <AutoRenewToggle
              groupId={groupId}
              initialAutoRenew={settings.auto_renew}
              hasPaymentMethod={!!settings.stripe_payment_method_id}
              status={settings.status}
            />
          </div>
        </AppCard>

        <AppCard>
          <h3 className="text-sm font-semibold text-slate-900">Como funciona</h3>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            <li className="flex gap-2">
              <span className="text-green-600">✓</span>
              Seu cartão é cobrado automaticamente 7 dias antes do fim do ciclo.
            </li>
            <li className="flex gap-2">
              <span className="text-green-600">✓</span>
              Os horários do próximo ciclo são reservados automaticamente.
            </li>
            <li className="flex gap-2">
              <span className="text-green-600">✓</span>
              Se a cobrança falhar, a renovação é pausada imediatamente.
            </li>
            <li className="flex gap-2">
              <span className="text-green-600">✓</span>
              Apenas você pode ativar ou desativar a renovação automática.
            </li>
          </ul>
        </AppCard>
      </div>
    </PageContainer>
  )
}

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Prontuário | Muuday' }

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { ArrowRight, FileText } from 'lucide-react'
import { AppEmptyState } from '@/components/ui/AppEmptyState'
import { PageHeader, PageContainer } from '@/components/ui/AppShell'

export default async function ProntuarioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: professional }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    getPrimaryProfessionalForUser(supabase, user.id, 'id'),
  ])

  if (profile?.role !== 'profissional') redirect('/perfil')
  if (!professional) redirect('/completar-perfil')

  // Fetch distinct clients from completed bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('user_id, profiles!bookings_user_id_fkey(id, full_name)')
    .eq('professional_id', professional.id)
    .in('status', ['completed', 'confirmed'])
    .limit(500)

  const clientMap = new Map<string, { id: string; full_name: string }>()
  for (const b of bookings || []) {
    const clientProfile = (b as any).profiles
    const clientId = String(clientProfile?.id || b.user_id)
    const clientName = String(clientProfile?.full_name || 'Cliente')
    if (!clientMap.has(clientId)) {
      clientMap.set(clientId, { id: clientId, full_name: clientName })
    }
  }

  const clients = Array.from(clientMap.values())

  return (
    <PageContainer maxWidth="md">
      <PageHeader
        title="Prontuário"
        subtitle="Registros e anotações dos seus clientes."
      />

      {clients.length === 0 ? (
        <AppEmptyState
          icon={FileText}
          title="Nenhum cliente ainda"
          description="Os registros aparecem após sessões confirmadas ou concluídas."
        />
      ) : (
        <div className="space-y-2">
          {clients.map(client => (
            <Link
              key={client.id}
              href={`/prontuario/${client.id}`}
              className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-white p-4 transition hover:border-slate-300"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#9FE870]/8 text-[#3d6b1f] font-display font-bold">
                  {client.full_name.charAt(0).toUpperCase()}
                </div>
                <p className="text-sm font-semibold text-slate-900">{client.full_name}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300" />
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  )
}

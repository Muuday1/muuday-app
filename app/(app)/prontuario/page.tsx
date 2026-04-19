export const metadata = { title: 'Prontuário | Muuday' }

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { ArrowRight, FileText } from 'lucide-react'

export default async function ProntuarioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'profissional') redirect('/perfil')

  const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id, 'id')
  if (!professional) redirect('/completar-perfil')

  // Fetch distinct clients from completed bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('user_id, profiles!bookings_user_id_fkey(id, full_name)')
    .eq('professional_id', professional.id)
    .in('status', ['completed', 'confirmed'])

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
    <div className="mx-auto max-w-3xl p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-neutral-900 md:text-3xl">Prontuário</h1>
        <p className="mt-1 text-sm text-neutral-500">Registros e anotações dos seus clientes.</p>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-2xl border border-neutral-100 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-50">
            <FileText className="h-7 w-7 text-neutral-300" />
          </div>
          <p className="font-semibold text-neutral-900">Nenhum cliente ainda</p>
          <p className="mt-1 text-sm text-neutral-500">
            Os registros aparecem após sessões confirmadas ou concluídas.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {clients.map(client => (
            <Link
              key={client.id}
              href={`/prontuario/${client.id}`}
              className="flex items-center justify-between rounded-2xl border border-neutral-100 bg-white p-4 transition hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 font-display font-bold">
                  {client.full_name.charAt(0).toUpperCase()}
                </div>
                <p className="text-sm font-semibold text-neutral-900">{client.full_name}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-neutral-300" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

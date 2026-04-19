export const metadata = { title: 'Meus Serviços | Muuday' }

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { getProfessionalServices } from '@/lib/actions/professional-services'
import { ProfessionalServicesManager } from '@/components/professional/ProfessionalServicesManager'

export default async function ServicosPage() {
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

  const servicesResult = await getProfessionalServices(professional.id)
  const services = servicesResult.success ? servicesResult.data : []

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-neutral-900 md:text-3xl">Meus Serviços</h1>
        <p className="mt-1 text-sm text-neutral-500">Gerencie os serviços que você oferece.</p>
      </div>
      <ProfessionalServicesManager
        professionalId={professional.id}
        initialServices={services as any[]}
      />
    </div>
  )
}

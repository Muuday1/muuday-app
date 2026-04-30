export const metadata = { title: 'Meus Serviços | Muuday' }

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { getProfessionalServices } from '@/lib/actions/professional-services'
import { ProfessionalServicesManager, type Service } from '@/components/professional/ProfessionalServicesManager'
import { PageHeader, PageContainer } from '@/components/ui/AppShell'

export default async function ServicosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: professional }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    getPrimaryProfessionalForUser(supabase, user.id, 'id'),
  ])

  if (profile?.role !== 'profissional') redirect('/perfil')
  if (!professional) redirect('/completar-perfil')

  const servicesResult = await getProfessionalServices(professional.id)
  const services = servicesResult.success ? servicesResult.data.services : []

  return (
    <PageContainer maxWidth="md">
      <PageHeader
        title="Meus Serviços"
        subtitle="Gerencie os serviços que você oferece."
      />
      <ProfessionalServicesManager
        professionalId={professional.id}
        initialServices={services as Service[]}
      />
    </PageContainer>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfessionalSettingsWorkspace from '@/components/settings/ProfessionalSettingsWorkspace'

export const metadata = { title: 'Configurações | Muuday' }

export default async function ConfiguracoesPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'profissional') {
    redirect('/perfil')
  }

  return <ProfessionalSettingsWorkspace />
}

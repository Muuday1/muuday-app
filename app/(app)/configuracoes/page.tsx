import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserSafe } from '@/lib/auth/get-user-with-fallback'
import ProfessionalSettingsWorkspace from '@/components/settings/ProfessionalSettingsWorkspace'

export const metadata = { title: 'Configurações | Muuday' }

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const user = await getUserSafe<{ id: string }>(supabase)

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return <ProfessionalSettingsWorkspace />
}

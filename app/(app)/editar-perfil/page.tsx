import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditProfileForm from '@/components/profile/EditProfileForm'

export default async function EditarPerfilPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, country, timezone, currency')
    .eq('id', user.id)
    .single()

  return (
    <EditProfileForm
      initialFullName={profile?.full_name || ''}
      initialCountry={profile?.country || ''}
      initialTimezone={profile?.timezone || ''}
      initialCurrency={(profile?.currency || '').toUpperCase()}
    />
  )
}

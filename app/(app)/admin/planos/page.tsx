import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loadPlanConfigMap } from '@/lib/plan-config'
import { AdminPlanConfigForm } from '@/components/admin/AdminPlanConfigForm'

export default async function AdminPlanosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    redirect('/')
  }

  const plans = await loadPlanConfigMap()

  return <AdminPlanConfigForm initialPlans={plans} />
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loadAdminDashboardData } from '@/lib/actions/admin'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

export default async function AdminPage() {
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

  const result = await loadAdminDashboardData()
  if (!result.success || !result.data) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl border border-red-200 p-12 text-center">
          <h1 className="font-display font-bold text-2xl text-neutral-900 mb-2">Erro ao carregar dados</h1>
          <p className="text-neutral-500">{result.error || 'Não foi possível carregar o painel administrativo.'}</p>
        </div>
      </div>
    )
  }

  return <AdminDashboard initialData={result.data} />
}

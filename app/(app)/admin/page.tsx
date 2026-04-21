import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loadAdminDashboardData } from '@/lib/actions/admin'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { PageContainer } from '@/components/ui/AppShell'

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
      <PageContainer>
        <div className="rounded-lg border border-red-200 bg-white p-12 text-center">
          <h1 className="font-display font-bold text-2xl text-slate-900 mb-2">Erro ao carregar dados</h1>
          <p className="text-slate-500">{result.error || 'Não foi possível carregar o painel administrativo.'}</p>
        </div>
      </PageContainer>
    )
  }

  return <AdminDashboard initialData={result.data} />
}

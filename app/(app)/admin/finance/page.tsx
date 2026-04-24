import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loadFinanceOverview } from '@/lib/actions/admin/finance'
import { AdminFinanceDashboard } from '@/components/admin/AdminFinanceDashboard'
import { PageContainer } from '@/components/ui/AppShell'

export const metadata = { title: 'Financeiro | Admin | Muuday' }

export default async function AdminFinancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/buscar')
  }

  const result = await loadFinanceOverview()

  if (!result.success) {
    return (
      <PageContainer>
        <div className="rounded-lg border border-red-200 bg-white p-12 text-center">
          <h1 className="font-display font-bold text-2xl text-slate-900 mb-2">Erro ao carregar dados financeiros</h1>
          <p className="text-slate-500">{result.error || 'Não foi possível carregar o painel financeiro.'}</p>
        </div>
      </PageContainer>
    )
  }

  return <AdminFinanceDashboard data={result.data} />
}

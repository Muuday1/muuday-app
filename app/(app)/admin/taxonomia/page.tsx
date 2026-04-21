import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loadTaxonomyData } from '@/lib/actions/admin-taxonomy'
import { TaxonomiaForm } from '@/components/admin/TaxonomiaForm'

export default async function TaxonomiaPage() {
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

  const result = await loadTaxonomyData()
  if (!result.success || !result.data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-red-600">{result.error || 'Erro ao carregar dados.'}</p>
      </div>
    )
  }

  return <TaxonomiaForm initialData={result.data} />
}

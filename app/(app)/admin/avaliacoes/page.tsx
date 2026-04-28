import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminListReviewsForModeration } from '@/lib/actions/admin'
import { ReviewModerationClient } from '@/components/admin/ReviewModerationClient'

export const metadata = { title: 'Moderação de Avaliações | Admin | Muuday' }

export default async function AdminAvaliacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sort?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/buscar')

  const params = await searchParams
  const status = (params.status as any) || 'all'
  const sort = (params.sort as any) || 'newest'

  const result = await adminListReviewsForModeration({ status, sort, limit: 50 })

  if (!result.success) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-red-600">{result.error}</p>
        <a href="?" className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Tentar novamente
        </a>
      </div>
    )
  }

  const reviews = result.data || []

  const stats = {
    pending: reviews.filter(r => r.moderation_status === 'pending').length,
    approved: reviews.filter(r => r.moderation_status === 'approved').length,
    rejected: reviews.filter(r => r.moderation_status === 'rejected').length,
    flagged: reviews.filter(r => r.moderation_status === 'flagged' || r.flag_reasons.length > 0).length,
  }

  return (
    <ReviewModerationClient
      initialReviews={reviews}
      initialStats={stats}
      initialFilters={{ status, sort }}
    />
  )
}

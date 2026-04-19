import { createClient } from '@/lib/supabase/server'
import { getDefaultPlanConfigMap } from '@/lib/plan-config'
import PlanSelector from '@/components/plans/PlanSelector'

type TierId = 'basic' | 'professional' | 'premium'

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function PlanosPage({ searchParams }: PageProps) {
  const supabase = createClient()

  let currentTier: TierId = 'basic'
  let sessionToken: string | null = null

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (!authError && user) {
    const { data: sessionData } = await supabase.auth.getSession()
    sessionToken = sessionData.session?.access_token || null

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role === 'profissional') {
      const { data: professional } = await supabase
        .from('professionals')
        .select('tier')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      const tier = String(professional?.tier || 'basic').toLowerCase()
      if (tier === 'professional' || tier === 'premium') {
        currentTier = tier
      }
    }
  }

  // Fetch plan configs from API
  let planConfigs = getDefaultPlanConfigMap()
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || 'http://localhost:3000'}/api/plan-config`,
      { cache: 'no-store' },
    )
    const payload = (await response.json().catch(() => null)) as
      | { ok?: boolean; plans?: typeof planConfigs }
      | null
    if (payload?.ok && payload.plans) {
      planConfigs = payload.plans
    }
  } catch {
    // Fallback to default plans
  }

  const checkoutParam = String(searchParams.checkout || '')
  const message =
    checkoutParam === 'success'
      ? 'Pagamento recebido. Seu plano sera atualizado apos confirmacao do webhook.'
      : checkoutParam === 'cancelled'
        ? 'Checkout cancelado.'
        : null

  return (
    <PlanSelector
      currentTier={currentTier}
      planConfigs={planConfigs}
      message={message}
      sessionToken={sessionToken}
    />
  )
}

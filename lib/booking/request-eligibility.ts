import { createClient } from '@/lib/supabase/server'
import { evaluateFirstBookingEligibility } from '@/lib/professional/onboarding-state'

export const REQUEST_BOOKING_ALLOWED_TIERS = ['professional', 'premium']

export async function professionalCanReceiveRequestBooking(
  supabase: ReturnType<typeof createClient>,
  professional: Record<string, any>,
): Promise<{ ok: true } | { ok: false; error: string; reasonCode?: string }> {
  if (professional.status !== 'approved') {
    return { ok: false, error: 'Profissional não disponível.', reasonCode: 'pending_admin_approval' }
  }

  if (!REQUEST_BOOKING_ALLOWED_TIERS.includes(String(professional.tier))) {
    return {
      ok: false,
      error: 'Solicitações de horário estão disponíveis apenas para planos Professional/Premium.',
      reasonCode: 'missing_plan_selection',
    }
  }

  const eligibility = await evaluateFirstBookingEligibility(supabase, String(professional.id))
  if (!eligibility.ok) {
    return { ok: false, error: eligibility.message, reasonCode: eligibility.reasonCode }
  }

  return { ok: true }
}

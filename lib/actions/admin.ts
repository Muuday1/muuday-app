'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type AdminActionResult =
  | { success: true }
  | { success: false; error: string }

/**
 * Server-side admin role check. Returns the authenticated user ID or throws.
 * This ensures admin mutations are NEVER reliant on client-side RLS alone.
 */
async function requireAdmin() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Não autenticado.')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Acesso negado. Apenas administradores podem executar esta ação.')
  }

  return { supabase, userId: user.id }
}

// ─── Professional management ─────────────────────────────────────────────

export async function adminUpdateProfessionalStatus(
  professionalId: string,
  newStatus: string,
): Promise<AdminActionResult> {
  const ALLOWED_STATUSES = ['approved', 'rejected', 'suspended', 'pending_review']
  if (!ALLOWED_STATUSES.includes(newStatus)) {
    return { success: false, error: 'Status inválido.' }
  }

  try {
    const { supabase } = await requireAdmin()

    const { error } = await supabase
      .from('professionals')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', professionalId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin')
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Erro desconhecido.' }
  }
}

export async function adminUpdateFirstBookingGate(
  professionalId: string,
  enabled: boolean,
): Promise<AdminActionResult> {
  try {
    const { supabase } = await requireAdmin()

    const { error } = await supabase
      .from('professionals')
      .update({
        first_booking_enabled: enabled,
        first_booking_gate_note: enabled ? 'admin_enabled' : 'admin_blocked',
        first_booking_gate_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', professionalId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin')
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Erro desconhecido.' }
  }
}

// ─── Review management ───────────────────────────────────────────────────

export async function adminToggleReviewVisibility(
  reviewId: string,
  visible: boolean,
): Promise<AdminActionResult> {
  try {
    const { supabase } = await requireAdmin()

    const { error } = await supabase
      .from('reviews')
      .update({ is_visible: visible })
      .eq('id', reviewId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin')
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Erro desconhecido.' }
  }
}

export async function adminDeleteReview(
  reviewId: string,
): Promise<AdminActionResult> {
  try {
    const { supabase } = await requireAdmin()

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin')
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Erro desconhecido.' }
  }
}

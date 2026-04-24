'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin, AdminAuthError } from '@/lib/admin/auth-helper'
import { loadPlanConfigMap, type PlanConfigMap } from '@/lib/plan-config'
import {
  loadPlanConfigsService,
  savePlanConfigsService,
} from '@/lib/admin/plan-config-service'

export type { PlanConfigMap }

export async function loadPlanConfigs() {
  try {
    const supabase = await createClient()
    await requireAdmin(supabase)
    return loadPlanConfigsService(supabase)
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return { ok: false as const, error: error.message }
    }
    console.error('[loadPlanConfigs] unexpected error:', error)
    return { ok: false as const, error: 'Erro interno. Tente novamente mais tarde.' }
  }
}

export async function savePlanConfigs(plans: PlanConfigMap) {
  try {
    const supabase = await createClient()
    const { userId } = await requireAdmin(supabase)
    return savePlanConfigsService(supabase, userId, plans)
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return { ok: false as const, error: error.message }
    }
    console.error('[savePlanConfigs] unexpected error:', error)
    return { ok: false as const, error: 'Erro interno. Tente novamente mais tarde.' }
  }
}

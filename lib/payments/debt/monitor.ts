/**
 * Debt Monitor — Phase 5.3
 *
 * Monitors professional debt levels and alerts admin when thresholds are exceeded.
 * Integrated into payout batch creation to block over-indebted professionals.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/config/env'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DebtAlert {
  professionalId: string
  professionalName: string
  professionalEmail: string
  totalDebt: bigint
  threshold: bigint
  exceededBy: bigint
}

// ---------------------------------------------------------------------------
// Threshold
// ---------------------------------------------------------------------------

export function getMaxProfessionalDebtThreshold(): bigint {
  const envValue = env.MAX_PROFESSIONAL_DEBT_MINOR
  if (envValue) {
    try {
      return BigInt(envValue)
    } catch {
      // Fall through to default
    }
  }
  return BigInt(500000) // Default: R$ 5,000.00
}

// ---------------------------------------------------------------------------
// Debt Monitoring
// ---------------------------------------------------------------------------

/**
 * Check all professionals for debt threshold violations.
 */
export async function checkDebtThresholds(
  admin: SupabaseClient,
): Promise<DebtAlert[]> {
  const threshold = getMaxProfessionalDebtThreshold()

  const { data, error } = await admin
    .from('professional_balances')
    .select('professional_id, total_debt, professionals(name, email)')
    .gt('total_debt', Number(threshold))
    .order('total_debt', { ascending: false })

  if (error) {
    console.error('[debt/monitor] failed to check debt thresholds:', error.message)
    return []
  }

  const alerts: DebtAlert[] = []
  for (const row of data || []) {
    const totalDebt = BigInt(row.total_debt || 0)
    const pro = (row as unknown as { professionals?: { name?: string; email?: string } }).professionals
    alerts.push({
      professionalId: row.professional_id,
      professionalName: pro?.name || 'Unknown',
      professionalEmail: pro?.email || '',
      totalDebt,
      threshold,
      exceededBy: totalDebt - threshold,
    })
  }

  return alerts
}

/**
 * Alert admin about professionals exceeding debt threshold.
 *
 * Non-blocking: logs to console and creates admin notification records.
 */
export async function alertAdminOnDebtThreshold(
  admin: SupabaseClient,
  alerts: DebtAlert[],
): Promise<void> {
  if (alerts.length === 0) return

  const nowIso = new Date().toISOString()

  for (const alert of alerts) {
    console.warn('[debt/monitor] THRESHOLD EXCEEDED:', {
      professionalId: alert.professionalId,
      name: alert.professionalName,
      totalDebt: alert.totalDebt.toString(),
      threshold: alert.threshold.toString(),
      exceededBy: alert.exceededBy.toString(),
    })

    // Create admin notification (inserted into notifications table for admin users)
    // We find admin users and notify them
    const { data: admins } = await admin
      .from('profiles')
      .select('id')
      .eq('role', 'admin')

    for (const adminUser of admins || []) {
      await admin.from('notifications').insert({
        user_id: adminUser.id,
        type: 'admin_debt_alert',
        title: 'Alerta: Dívida profissional excedeu limite',
        body: `${alert.professionalName} tem dívida de R$ ${(Number(alert.totalDebt) / 100).toFixed(2)} (limite: R$ ${(Number(alert.threshold) / 100).toFixed(2)})`,
        payload: {
          professional_id: alert.professionalId,
          total_debt: alert.totalDebt.toString(),
          threshold: alert.threshold.toString(),
          exceeded_by: alert.exceededBy.toString(),
          alert_at: nowIso,
        },
      })
    }
  }
}

/**
 * Run full debt monitoring check.
 *
 * Used by Inngest cron or payout batch creation.
 */
export async function runDebtMonitoring(admin: SupabaseClient): Promise<void> {
  const alerts = await checkDebtThresholds(admin)
  await alertAdminOnDebtThreshold(admin, alerts)
}

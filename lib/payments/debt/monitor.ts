/**
 * Debt Monitor — Phase 5.3
 *
 * Monitors professional debt levels and alerts admin when thresholds are exceeded.
 * Integrated into payout batch creation to block over-indebted professionals.
 */

import * as Sentry from '@sentry/nextjs'
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
    .select('professional_id, total_debt')
    .gt('total_debt', threshold.toString())
    .order('total_debt', { ascending: false })

  if (error) {
    Sentry.captureException(error, { tags: { area: 'debt_monitor' } })
    return []
  }

  // Fetch professional names via profiles (professionals table has no name/email columns)
  const proIds = [...new Set((data || []).map((r) => r.professional_id).filter(Boolean))]
  let nameMap = new Map<string, { name: string; email: string }>()
  if (proIds.length > 0) {
    const { data: pros } = await admin
      .from('professionals')
      .select('id, user_id')
      .in('id', proIds)
    const userIds = [...new Set((pros || []).map((p) => p.user_id).filter(Boolean))]
    if (userIds.length > 0) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds)
      const profileMap = new Map(
        (profiles || []).map((p) => [
          p.id,
          {
            name: [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Profissional',
            email: p.email || '',
          },
        ]),
      )
      const proToUser = new Map((pros || []).map((p) => [p.id, p.user_id]))
      for (const proId of proIds) {
        const userId = proToUser.get(proId)
        if (userId) {
          nameMap.set(proId, profileMap.get(userId) || { name: 'Profissional', email: '' })
        }
      }
    }
  }

  const alerts: DebtAlert[] = []
  for (const row of data || []) {
    const totalDebt = BigInt(row.total_debt || 0)
    const info = nameMap.get(row.professional_id)
    alerts.push({
      professionalId: row.professional_id,
      professionalName: info?.name || 'Unknown',
      professionalEmail: info?.email || '',
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
    Sentry.captureMessage('[debt/monitor] THRESHOLD EXCEEDED', {
      level: 'warning',
      tags: { area: 'payments/debt', context: 'threshold-exceeded' },
      extra: {
        professionalId: alert.professionalId,
        name: alert.professionalName,
        totalDebt: alert.totalDebt.toString(),
        threshold: alert.threshold.toString(),
        exceededBy: alert.exceededBy.toString(),
      },
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

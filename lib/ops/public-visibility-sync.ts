import type { SupabaseClient } from '@supabase/supabase-js'
import { recomputeApprovedProfessionalsVisibility } from '@/lib/professional/public-visibility'

export async function runPublicVisibilitySync(
  supabase: SupabaseClient,
  options?: { batchSize?: number; maxBatches?: number },
) {
  const batchSize = Math.max(1, Math.min(options?.batchSize || 250, 1000))
  const maxBatches = Math.max(1, Math.min(options?.maxBatches || 20, 200))

  let offset = 0
  let batches = 0
  let checked = 0
  let updated = 0
  let failed = 0
  const failures: string[] = []

  while (batches < maxBatches) {
    const result = await recomputeApprovedProfessionalsVisibility(supabase, {
      limit: batchSize,
      offset,
    })

    if (!result.ok && result.total === 0) {
      failures.push(...result.failures)
      break
    }

    batches += 1
    checked += result.total
    updated += result.updated
    failed += result.failed
    if (result.failures.length > 0) failures.push(...result.failures)

    if (result.total < batchSize) break
    offset += batchSize
  }

  return {
    ok: failed === 0,
    checked,
    updated,
    failed,
    batches,
    at: new Date().toISOString(),
    failures: failures.slice(0, 100),
  }
}

/**
 * Utilities for working with booking `metadata` JSONB.
 *
 * ⚠️  IMPORTANT — Concurrency warning:
 * The helpers below read the existing metadata object in memory and return a
 * new object that spreads the old values followed by the patch. This is **not
 * atomic** in the database. If two processes update the same booking's
 * metadata concurrently, the later write will overwrite the earlier one.
 *
 * For true atomicity we would need a PostgreSQL function such as:
 *
 *   UPDATE bookings
 *   SET metadata = COALESCE(metadata, '{}') || jsonb_build_object('key', 'value')
 *   WHERE id = booking_id;
 *
 * Until that migration is applied, this helper at least guarantees a
 * consistent shape and makes it easy to swap in an atomic implementation later.
 */

/**
 * Merge a patch into existing booking metadata.
 *
 * @param existing — the current metadata value (may be null/undefined)
 * @param patch  — key/value pairs to add or overwrite
 * @returns a new object with existing keys + patch keys
 */
export function patchBookingMetadata(
  existing: unknown,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const base = (existing as Record<string, unknown> | null) || {}
  return { ...base, ...patch }
}

/**
 * Typed feature flags for Muuday.
 *
 * Convention: snake_case in PostHog dashboard, camelCase in code.
 * All flags default to false unless explicitly enabled in PostHog.
 */
export const FEATURE_FLAGS = {
  // Booking
  bookingRecurringEnabled: 'booking_recurring_enabled',
  bookingBatchEnabled: 'booking_batch_enabled',
  requestBookingEnabled: 'request_booking_enabled',

  // Chat
  chatEnabled: 'chat_enabled',

  // Finance
  newFinanceDashboard: 'new_finance_dashboard',
  ledgerEnabled: 'ledger_enabled',

  // Professional workspace
  multiServiceEnabled: 'multi_service_enabled',
  clientRecordsEnabled: 'client_records_enabled',

  // Notifications
  pushNotificationsEnabled: 'push_notifications_enabled',

  // Admin
  disputeSystemEnabled: 'dispute_system_enabled',
} as const

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS
export type FeatureFlagValue = (typeof FEATURE_FLAGS)[FeatureFlagKey]

/**
 * Check if a feature flag is enabled.
 * Safe for both client and server (returns false if PostHog is unavailable).
 */
export function isFeatureEnabled(
  flagKey: FeatureFlagKey,
  flags?: Record<string, boolean | string>,
): boolean {
  const posthogKey = FEATURE_FLAGS[flagKey]
  if (!flags) return false
  const value = flags[posthogKey]
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value === 'true'
  return false
}

/**
 * Default feature flag state for environments without PostHog connectivity.
 * Use this in server actions when PostHog is unavailable.
 */
export const DEFAULT_FEATURE_FLAGS: Record<FeatureFlagValue, boolean> = {
  [FEATURE_FLAGS.bookingRecurringEnabled]: true,
  [FEATURE_FLAGS.bookingBatchEnabled]: true,
  [FEATURE_FLAGS.requestBookingEnabled]: true,
  [FEATURE_FLAGS.chatEnabled]: false,
  [FEATURE_FLAGS.newFinanceDashboard]: false,
  [FEATURE_FLAGS.ledgerEnabled]: false,
  [FEATURE_FLAGS.multiServiceEnabled]: false,
  [FEATURE_FLAGS.clientRecordsEnabled]: false,
  [FEATURE_FLAGS.pushNotificationsEnabled]: false,
  [FEATURE_FLAGS.disputeSystemEnabled]: false,
}

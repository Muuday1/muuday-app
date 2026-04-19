// Barrel file — re-exports all Stripe resilience functions for backward compatibility.
// New code should import directly from the submodules (e.g. @/lib/stripe/cron-jobs)

export {
  createStripeClientIfConfigured,
  isStripeRuntimeConfigured,
} from '@/lib/stripe/client'

export {
  asRecord,
  asIdFromStringOrObject,
  asString,
  asNumber,
  truncateErrorMessage,
  buildNextRetryDate,
  toIsoWeekKey,
} from '@/lib/stripe/helpers'

export {
  tryStartJobRun,
  finishJobRun,
  type StripeJobRunStart,
} from '@/lib/stripe/jobs'

export {
  recordStripeWebhookEvent,
  processStripeWebhookInbox,
  type StripeWebhookRecordInput,
  type StripeWebhookProcessSummary,
} from '@/lib/stripe/webhook-handlers'

export {
  enqueuePaymentRetry,
  enqueueSubscriptionCheck,
  runStripeWeeklyPayoutEligibilityScan,
  runStripeSubscriptionRenewalChecks,
  runStripeFailedPaymentRetries,
  type PayoutScanSummary,
  type SubscriptionCheckSummary,
  type FailedPaymentRetrySummary,
} from '@/lib/stripe/cron-jobs'

# Data Governance and Lifecycle Policy

Last updated: 2026-03-29
Status: `Done` (policy documented) / `In progress` (automation rollout)

## Purpose

Define explicit retention, deletion, and anonymization rules by data type for Muuday.

This policy is the operational baseline for:

1. privacy and compliance consistency,
2. predictable storage lifecycle,
3. lower risk during support/dispute/legal events.

## Core principles

1. Keep only what is necessary for product operation, compliance, and finance traceability.
2. Prefer anonymization over hard deletion when legal/financial obligations apply.
3. Keep booking/payment/audit records immutable when required for reconciliation.
4. Use UTC timestamps for lifecycle events (`created_at`, `updated_at`, `deleted_at`, `anonymized_at`).
5. Make lifecycle behavior explicit in docs and implementation, never implicit.

## Retention and deletion matrix

| Data type | Examples | Retention target | Deletion/anonymization rule | Notes |
| --- | --- | --- | --- | --- |
| Accounts and auth | user account, professional account, identity references | While active | On account deletion request: soft-delete immediately, hard-delete PII after 30 days unless blocked by legal/financial obligations | Keep internal IDs for referential integrity |
| Professional public profile | bio, specialties, pricing, languages, availability settings | While active + 12 months | Remove from public immediately when deactivated; anonymize personally identifying profile text after 12 months inactive/deleted | Preserve non-PII aggregates |
| Booking records | booking rows, state transitions, schedule metadata | 7 years | Keep booking core records; anonymize user-facing notes after 24 months if no dispute/legal hold | Finance and audit linkage required |
| Booking notes/messages | “purpose of session”, request text, support comments | 24 months | Auto-delete or anonymize content after 24 months unless linked to open case/dispute | Minimize free-text retention risk |
| Payment and payout records | charges, refunds, transfers, payout batches, ledger entries | 7 years | Never delete financial core records; anonymize personal metadata not required for accounting | Accounting/tax traceability |
| Subscription billing | plan history, invoices, billing status events | 7 years | Keep records; anonymize optional profile metadata | Billing dispute handling |
| Case and trust operations | disputes, no-show cases, moderation actions | 5 years after closure | Keep case timeline; anonymize sensitive personal text after 24 months where possible | Risk and abuse history |
| Audit logs | admin actions, permissioned operations | 7 years | Append-only, no hard deletion except legal mandate | Security and compliance evidence |
| Notifications | email/in-app delivery events | 12 months | Delete delivery payload details after 12 months; keep aggregate status metrics | Cost and privacy balance |
| Analytics events | funnel, engagement, feature usage events | 24 months raw | Drop user-level raw events after 24 months; keep aggregated metrics | Product analytics continuity |
| Error and monitoring logs | Sentry events, cron errors, uptime incidents | 90 days | Auto-prune after 90 days; retain incident postmortems separately | Keep costs low pre-launch |
| Calendar/session metadata | join timestamps, provider event IDs, no-show evidence metadata | 24 months | Delete operational metadata after 24 months unless tied to case/legal hold | No recordings by default in MVP |
| File uploads/documents | verification docs, attachments | 12 months after decision/closure | Delete files 12 months after verification/case close unless legal hold | Prefer short retention |
| Consent snapshots | policy/disclaimer acceptance versions | 7 years | Keep immutable acceptance snapshots; anonymize unrelated profile fields | Required for compliance traceability |
| Backup data | encrypted database backups | 35 days rolling | Automatic expiration after retention window | Recovery-only access |

## Lifecycle events and states

Use explicit lifecycle markers in relevant tables:

1. `active`
2. `soft_deleted`
3. `anonymized`
4. `legal_hold`
5. `hard_deleted`

When legal hold is active, deletion/anonymization jobs must skip affected records.

## Deletion and anonymization workflow

1. Intake request (`account deletion`, `privacy request`, or `admin policy cleanup`).
2. Validate identity/authorization.
3. Check legal hold and financial retention obligations.
4. Apply soft delete or anonymization immediately where allowed.
5. Schedule hard deletion for eligible data after grace window.
6. Record operation in audit log.

## Operational rollout (next implementation steps)

1. Add lifecycle columns where missing (`deleted_at`, `anonymized_at`, `legal_hold`).
2. Add scheduled cleanup jobs for each retention bucket.
3. Add admin tooling to:
- place/release legal hold,
- run dry-run retention checks,
- execute approved deletion batches.
4. Add tests for retention/deletion guardrails.

## Ownership

1. Product/Operations: approve retention windows.
2. Engineering: implement lifecycle automation and safeguards.
3. Compliance/Legal: approve legal-hold and policy wording.

## Related docs

1. `docs/architecture/tech-stack.md`
2. `docs/human-actions/decision-backlog.md`
3. `docs/spec/consolidated/open-validations.md`

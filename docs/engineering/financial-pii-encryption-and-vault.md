# Financial PII Encryption and Vault

Last updated: 2026-04-01

## Scope

This document defines the mandatory data-protection posture for finance-sensitive user data when Stripe integration (Wave 3) is enabled.

## Current baseline (already true)

1. Supabase Pro provides encryption at rest by default (AES-256 managed by platform).
2. This protects storage-level data at rest, but **does not replace application-level PII controls**.

## Non-negotiable rules

1. Never store raw card data in Muuday DB:
- no PAN/card number,
- no CVC/CVV,
- no expiration date in raw form.
2. Card collection must be Stripe-hosted (Stripe Elements / Payment Element only).
3. Muuday may store only safe Stripe references:
- `stripe_customer_id`,
- `stripe_payment_method_id`,
- `stripe_payment_intent_id`,
- `stripe_subscription_id`,
- `stripe_account_id`.

## Payout PII policy (Wave 3)

Preferred path:
1. Keep payout bank/KYC data only in Stripe Connect account objects.
2. Store in Muuday only operational status/flags and non-sensitive display fields (for example last4, bank country, verification status).

If local payout PII storage is required by product/legal operations:
1. Encrypt sensitive columns at application/DB level before persistence.
2. Keep encryption key material in Supabase Vault, never in plaintext table rows.
3. Restrict read paths to service-role-only server actions and audited admin operations.
4. Persist access events in `admin_audit_log` for traceability.

## Supabase Vault usage requirements

1. Secrets with cryptographic impact must be stored in Vault (or external secret manager), not in regular tables.
2. Access to decrypted secret values must be limited to controlled server paths.
3. Rotation cadence for vault-backed secrets follows `docs/engineering/runbooks/secrets-rotation-runbook.md`.

## Implementation checklist (Wave 3 gate)

1. Stripe integration paths use tokenized identifiers only (no card data fields).
2. DB audit passes for forbidden card fields.
3. Payout PII decision resolved:
- Stripe-only data (recommended), or
- encrypted local columns + Vault-backed key path.
4. Admin/data-access audit trail active for sensitive finance actions.
5. RLS + service-role boundaries validated for all finance tables.

## Pre-Wave 3 hardening already implemented

1. Added code-level guard utility:
- `lib/stripe/pii-guards.ts`
- blocks forbidden sensitive key names (`card_number`, `cvv/cvc`, `iban`, `routing_number`, etc.) before payment payload persistence.
2. Applied guard in current legacy payment write paths:
- `lib/actions/booking.ts`
- `lib/actions/request-booking.ts`
3. Added SQL audit pack:
- `db/sql/analysis/024-wave3-pii-column-audit.sql`
- checks forbidden card columns, payout-sensitive columns, `pgcrypto`/`vault` extension availability, and RLS status for finance tables.

These are safety rails only. They do not replace Stripe webhook/payment lifecycle implementation required in Wave 3.

## Verification controls

1. Run schema audit SQL:
- `db/sql/analysis/024-wave3-pii-column-audit.sql`
2. Confirm no forbidden card-data columns are present.
3. Confirm any local payout-sensitive fields are encrypted and documented.

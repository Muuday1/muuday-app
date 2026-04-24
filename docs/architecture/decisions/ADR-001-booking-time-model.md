# ADR-001: Booking Time Model in UTC with Dual Timezone Context

Date: 2026-03-29
Status: Accepted

## Context

Muuday serves users and professionals across countries and timezones. Booking logic must remain consistent under DST and cross-region usage.

## Decision

1. Persist booking schedule data in UTC (`start_time_utc`, `end_time_utc`).
2. Store actor timezone context (`timezone_user`, `timezone_professional`) on booking records.
3. Convert at display/application boundaries, not in DB storage semantics.

## Rationale

1. UTC persistence prevents timezone drift in core state.
2. Storing both actor timezones keeps audit and UX context explicit.
3. Server-side conversion allows deterministic domain logic.

## Impact

- Booking creation, rescheduling, reminders, and timeout jobs depend on UTC fields.
- Journey docs and API behavior must always show timezone handling rules.


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.

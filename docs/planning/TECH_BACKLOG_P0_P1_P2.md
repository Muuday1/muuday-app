# Tech Backlog (P0/P1/P2)

This backlog is ordered by risk reduction and marketplace impact.

## P0 (do first)

1. Upgrade vulnerable runtime dependencies
- Scope: secure `next` and critical transitive packages.
- Accept:
  - `npm audit` has no critical vulnerabilities.
  - `build`, `lint`, `typecheck` pass.

2. Fix booking authorization model
- Scope: align `bookings.professional_id` checks with `professionals.id` model.
- Accept:
  - Professional can confirm/cancel/complete own bookings.
  - Unauthorized users cannot mutate booking status.

3. Server-side authoritative booking pricing/duration
- Scope: ignore client-sent pricing/duration.
- Accept:
  - Inserted booking values always match professional profile values in DB.

## P1

1. Harden waitlist endpoint
- Scope: schema validation, CORS allowlist, anti-abuse rate limit.
- Accept:
  - Invalid payloads are rejected with 4xx.
  - Endpoint no longer uses wildcard CORS.
  - Abuse attempts are rate limited.

2. RLS hardening
- Scope: restrict sensitive profile reads and fix waitlist insert policy.
- Accept:
  - Sensitive profile fields are not publicly readable.
  - Waitlist writes are secure and intentional.

3. Timezone correctness in booking flow
- Scope: normalize to UTC server-side and convert for display.
- Accept:
  - DST edge-case tests pass.
  - User and professional see consistent booking time.

## P2

1. Review integrity server-side
- Scope: derive actor identity server-side for review creation.
- Accept:
  - Review cannot be inserted for unrelated booking/professional combination.

2. Observability baseline
- Scope: Sentry instrumentation + alert routing.
- Accept:
  - Server and client errors visible in one project.
  - Alert policy documented.

3. Funnel instrumentation baseline
- Scope: PostHog events for signup/booking/review lifecycle.
- Accept:
  - Core funnel dashboard available and validated.


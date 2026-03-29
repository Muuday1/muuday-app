# Integration: Upstash Rate Limiting

Last updated: 2026-03-29

## Purpose

Protect API routes and server actions against abuse.

## Where it is used

- `lib/security/rate-limit.ts`
- Booking, availability, waitlist, and related actions

## Runtime model

1. Primary backend: Upstash Redis (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`).
2. Fallback: in-memory limiter when Upstash envs are not configured.

## Current status

- `In progress`
- Core limiter and presets are implemented.
- Production behavior quality depends on Upstash env configuration.

## Risks

1. In-memory fallback is process-local and not suitable as production primary protection.
2. Missing env setup can silently degrade consistency across instances.

## Next steps

1. Confirm Upstash env vars in production.
2. Monitor rate-limit source metadata (`upstash` vs `memory`) in logs.

# ADR-003: Canonical App URL Configuration

Date: 2026-03-29
Status: Accepted

## Context

The project uses a temporary hidden domain during development and will transition to `muuday.com`. Hardcoded URLs increase migration risk.

## Decision

Use centralized URL resolution in `lib/config/app-url.ts` with ordered env precedence:

1. `APP_BASE_URL`
2. `NEXT_PUBLIC_APP_URL`
3. `NEXT_PUBLIC_SITE_URL`
4. `VERCEL_URL` fallback
5. `APP_PRIMARY_DOMAIN` fallback

Also centralize waitlist allowed origins from env-driven sources.

## Rationale

1. Domain cutover becomes configuration-only.
2. Reduces duplicated URL literals across routes/services.
3. Keeps CORS policies explicit and environment-driven.

## Impact

- Auth callback/signout, waitlist CORS, and email links now share the same canonical resolver.
- Domain migration should update env values, not code paths.

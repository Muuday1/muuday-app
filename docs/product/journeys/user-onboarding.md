# User Journey: User Onboarding

Last updated: 2026-03-29

## Goal

Allow a new user to create an account, complete required profile preferences, and reach the search experience.

## Actors

1. End user (customer)
2. Supabase Auth

## Entry points

- `/login`
- `/cadastro`
- OAuth callback `/auth/callback`
- Post-auth completion route `/completar-conta`

## Happy path

1. User signs up or logs in.
2. OAuth callback exchanges auth code for session.
3. App checks profile completeness (country/timezone context).
4. Incomplete profile users are redirected to `/completar-conta`.
5. Completed users land on `/buscar`.

## Edge cases

1. Unauthenticated access to logged-in pages redirects to `/login`.
2. Missing profile fields force completion step before search.
3. Signout uses server route `/auth/signout`.

## Current implementation status

- `Done` for core onboarding flow.
- `In progress` for advanced security controls (2FA is not implemented).

## Gaps

1. No 2FA flow implemented yet.
2. Limited explicit user-facing error messaging in callback failures.

## Next steps

1. Add stronger auth security options.
2. Add explicit callback error observability.

## Related docs

- [Session Management Journey](./session-management.md)
- [Setup and Environments](../../engineering/setup-and-environments.md)

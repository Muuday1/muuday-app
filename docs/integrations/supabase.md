# Integration: Supabase

Last updated: 2026-03-29

## Purpose

Primary backend platform for:

1. Auth sessions
2. PostgreSQL data model
3. RLS-based access controls

## Where it is used

- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/middleware.ts`
- `lib/supabase/admin.ts`
- App routes and server actions under `app/` and `lib/actions/`

## Current status

- `Done` for core auth/data operations
- `In progress` for schema alignment cleanup and observability on DB operations

## Risks and notes

1. Canonical schema is migration-driven; base schema file lags behind.
2. Admin client must remain server-only with strict secret handling.

## Next steps

1. Keep migration documentation synchronized with runtime behavior.
2. Add DB operation observability and stronger audit traces for admin actions.

<!-- VERCEL BEST PRACTICES START -->
## Best practices for developing on Vercel

These defaults are optimized for AI coding agents (and humans) working on apps that deploy to Vercel.

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons), use Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres instead
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls (LLMs, APIs)
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- If Enable Deployment Protection is enabled, use a bypass secret to directly access them
- Add OpenTelemetry via `@vercel/otel` on Node; don't expect OTEL support on the Edge runtime
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing, set AI_GATEWAY_API_KEY, using a model string (e.g. 'anthropic/claude-sonnet-4.6'), Gateway is already default in AI SDK
  needed. Always curl https://ai-gateway.vercel.sh/v1/models first; never trust model IDs from memory
- For durable agent loops or untrusted code: use Workflow (pause/resume/state) + Sandbox; use Vercel MCP for secure infra access
<!-- VERCEL BEST PRACTICES END -->

## Security practices for this codebase

- **No admin fallbacks in user-facing code**: `createAdminClient()` must never be used as a fallback in server actions or API routes that serve users/professionals. RLS policies are the single source of truth.
- **Env validation at startup**: `lib/config/env.ts` is loaded via `instrumentation.ts`. Missing critical env vars will fail CI/production builds.
- **Secret scanning in CI**: Every push and PR runs TruffleHog (`--only-verified`) to catch accidental secret commits.
- **Workflow hardening**: All GitHub Actions are pinned to SHA hashes and run with minimal `permissions`.
- **Dependency hygiene**: Run `npm audit` and `npm outdated` regularly. Safe patches are applied immediately; major upgrades (e.g., Next.js) are tracked in `docs/engineering/runbooks/dependency-audit-runbook.md`.
- **Health checks**:
  - `/api/health` — liveness + Supabase connectivity
  - `/api/health/rls` — lightweight runtime RLS sanity check
- **Secret rotation register**: `docs/engineering/runbooks/secrets-rotation-register.json` tracks rotation cadences. The `secrets-rotation-reminder.yml` workflow runs daily and fails on overdue items.

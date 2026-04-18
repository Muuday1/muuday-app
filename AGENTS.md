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
- **Env validation at startup**: `lib/config/env.ts` is loaded via `instrumentation.ts` **only in Node.js runtime**. Edge runtime skips validation because not all env vars are available there. Missing critical env vars will fail CI/production Node.js builds.
- **CSP with nonces**: Content-Security-Policy is set dynamically in `middleware.ts` with per-request nonces. `script-src` does not allow `'unsafe-inline'` — Next.js hydration scripts receive the nonce automatically.
- **Secure cookies**: All auth cookies from `createServerClient` explicitly set `secure` (production), `sameSite: 'lax'`, and `httpOnly`. The `muuday_country` cookie also has `secure: true`.
- **Rate limiting**: Upstash Redis + in-memory fallback. Uses rightmost trusted IP from `X-Forwarded-For` (Vercel-trusted). 20+ presets defined in `lib/security/rate-limit.ts`.
- **CSRF origin validation**: API routes validate `Origin`/`Referer` against `APP_BASE_URL` / `NEXT_PUBLIC_APP_URL` via `lib/http/csrf.ts`.
- **Open redirect protection**: OAuth callback whitelists `next` param against `ALLOWED_NEXT_PATHS`.
- **Webhook resilience**: Stripe webhook returns HTTP 500 (not 202) when Inngest enqueue fails, triggering Stripe's automatic retry.
- **Constant-time secret comparison**: `safeSecretCompare` pads both inputs to the same length before `timingSafeEqual` to prevent timing attacks.
- **Secret scanning in CI**: Every push and PR runs TruffleHog (`--only-verified`) to catch accidental secret commits.
- **Workflow hardening**: All GitHub Actions are pinned to SHA hashes and run with minimal `permissions`.
- **Dependency hygiene**: `npm audit --audit-level=high` runs in CI. Safe patches are applied immediately; major upgrades are tracked in `docs/engineering/runbooks/dependency-audit-runbook.md`.
- **Health checks**:
  - `/api/health` — liveness + Supabase connectivity
  - `/api/health/rls` — lightweight runtime RLS sanity check
- **Secret rotation register**: `docs/engineering/runbooks/secrets-rotation-register.json` tracks rotation cadences. The `secrets-rotation-reminder.yml` workflow runs daily and fails on overdue items.

## CI / DevOps practices

- **Node version**: `.nvmrc` specifies Node 20. `package.json` has `engines.node >=20.0.0`. CI uses `node-version-file: '.nvmrc'`.
- **Build cache**: `.next/cache` is cached between CI runs via `actions/cache`.
- **Playwright cache**: Browser binaries cached at `~/.cache/ms-playwright`.
- **Step order**: Fast feedback first — typecheck → lint → encoding check → unit tests → build → E2E.
- **npm audit**: Runs with `--audit-level=high` on every CI run; fails the build on high+ CVEs.

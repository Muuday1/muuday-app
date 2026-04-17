# Dependency Audit Runbook

Last updated: 2026-04-17

## Objective

Keep the dependency tree healthy by applying safe patches promptly, tracking unavoidable vulnerabilities, and planning major upgrades separately.

## How to run

```bash
# 1. Check for vulnerabilities
npm audit

# 2. Check for outdated packages
npm outdated

# 3. Apply safe patches (same major version)
npm audit fix
npm install <pkg>@<wanted>

# 4. Verify
npm run typecheck
npm run lint
npm run test:unit
npm run build
```

## Current status (2026-04-17)

### Safe patches applied
- `brace-expansion`, `dompurify`, `follow-redirects`, `lodash`, `protobufjs` (via `npm audit fix`)
- `eslint-config-next` 14 → 15.5.15 (dev-only, fixes `glob` transitive vulnerability)
- `checkly` 7.7.0 → 7.11.0
- `@playwright/test` 1.58.2 → 1.59.1
- `@sentry/nextjs` 10.46.0 → 10.49.0
- `@supabase/supabase-js` 2.103.0 → 2.103.3
- `agora-rtc-sdk-ng` 4.24.0 → 4.24.3
- `autoprefixer` 10.4.27 → 10.5.0
- `countries-list` 3.1.0 → 3.3.0
- `inngest` 4.1.0 → 4.2.4
- `postcss` 8.5.8 → 8.5.10
- `posthog-js` 1.364.1 → 1.369.2
- `resend` 6.9.4 → 6.12.0

### Remaining high-severity vulnerabilities

| Package | CVE range | Risk | Fix path |
|---|---|---|---|
| `next` 14.2.35 | GHSA-9g9p-9gw9-jx7f, GHSA-h25m-26qc-wcjf, GHSA-ggv3-7p47-pfv8, GHSA-3x4c-7xq6-9pq8, GHSA-q4gf-8mx6-5v3 | Runtime DoS / request smuggling | Upgrade to `next@15.5.15+` or `16.x`. This is a **major upgrade** requiring dedicated QA. |
| `glob` 10.3.10 | GHSA-5j98-mcp5-4vw2 | CLI command injection (dev-only via `checkly → archiver-utils`) | Wait for `archiver-utils` to update `glob`, or override resolution. |

### Major upgrades planned (out of scope for routine patches)

| Package | Current | Target | Notes |
|---|---|---|---|
| next | 14.2.35 | 15.5.15+ | High CVE exposure; needs full E2E regression |
| react / react-dom | 18.3.1 | 19.x | Usually coupled with Next.js upgrade |
| tailwindcss | 3.4.19 | 4.x | Breaking config changes |
| eslint | 8.57.1 | 10.x | Breaking plugin ecosystem |
| typescript | 5.9.3 | 6.x | Wait for ecosystem maturity |
| zod | 3.25.76 | 4.x | Optional; 3.x is still maintained |

## Acceptance Criteria

1. `npm audit` shows only accepted/tracked vulnerabilities with ticket numbers.
2. `npm outdated` major-version upgrades are documented in a separate upgrade roadmap.
3. CI passes after every patch batch.

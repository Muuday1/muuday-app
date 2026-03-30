# Session Log

Use this for meaningful checkpoints only.

## 2026-03-29

### Entry 1
- Completed production validation for cron endpoints and login availability.
- Updated production env alignment for URL/CORS consistency.
- Follow-up: activate Checkly checks and alerts.

### Entry 2
- Introduced canonical app URL resolver and updated auth/waitlist/email usage.
- Added Checkly setup guidance.
- Follow-up: migrate to final domain via env-only change when ready.

### Entry 3
- Rebuilt documentation governance structure across project/architecture/engineering/integrations/product.
- Removed stale and agent-specific prompt/handoff documents.
- Follow-up: keep `project-status` and `handover/current-state` synchronized every meaningful change.

### Entry 4
- Created persistent handover system in `docs/handover/` with overview, state, next steps, operating rules, constraints, context map, and this log.
- Follow-up: contributors must update handover files during execution, not only at session end.

### Entry 5
- Audited booking journey readiness on professional side against code reality.
- Confirmed gap: advanced `professional_settings` are implemented in backend reads but not exposed in professional UI for editing.
- Follow-up: implement dedicated professional booking settings page before deeper booking lifecycle expansion.

### Entry 6
- Delivered professional booking settings UI at `/configuracoes-agendamento` with save flow to `professional_settings`.
- Added direct navigation links from `/perfil` and `/disponibilidade` to advanced booking settings.
- Validation completed with `typecheck` and `lint` (only pre-existing lint warnings remained).

### Entry 7
- Added Sentry instrumentation baseline (client/server/edge init + global error capture + booking server-action error capture).
- Added PostHog baseline (provider, auth events, booking funnel events, route pageviews).
- Updated canonical schema snapshot `db/sql/schema/supabase-schema.sql` through migration `006`.
- Improved professional agenda to expose pending confirmation SLA/deadline context.
- Added Playwright e2e baseline (`playwright.config.ts`, `tests/e2e/booking-critical.spec.ts`, `npm run test:e2e`).

### Entry 8
- Added Checkly monitoring-as-code structure (`checkly/` + `checkly.config.js`) with API and browser journey checks.
- Added local Checkly browser journey validation (`playwright.checkly.config.ts`, `npm run test:checkly-local`).
- Added `.github/workflows/checkly-validate.yml` for parse/syntax checks.

### Entry 9
- Completed Checkly cloud activation and controlled fail/recovery validation sessions.
- Shifted Checkly to free-first pre-launch profile.

### Entry 10
- Expanded Playwright booking smoke tests and stabilized selectors.
- Created dedicated non-self professional fixture for production e2e regular-booking coverage.
- Confirmed remaining manual-confirmation smoke blocker due production schema/API drift.

### Entry 11
- Imported 5-part Muuday product specification into `docs/spec/source-of-truth/` as canonical baseline.
- Added consolidated spec docs (`master-spec`, `execution-plan`, unified AI protocol, open-validations, journey matrix).
- Updated project, architecture, journey, and handover docs to execution-wave model aligned with the new canonical baseline.

### Entry 12
- Consolidated new journey coverage docs for payments/revenue, trust/compliance, and session execution.
- Validated docs structure and local markdown links under `docs/` for consistency.
- Follow-up: execute Wave 0 implementation tasks and keep `current-state`/`next-steps` updated after each shipped batch.

### Entry 13
- Completed consolidation verification pass and documented remaining doc gaps in `docs/human-actions/consolidation-verification.md`.
- Added `docs/human-actions/decision-backlog.md` with explicit human-owned P0/P1/P2 decisions.
- Added `docs/human-actions/tool-options-and-stack-gaps.md` with 3 concrete options per open capability and stack-gap recommendations.

### Entry 14
- Added explicit data governance policy with retention/deletion matrix by data type in `docs/engineering/data-governance-and-lifecycle.md`.
- Strengthened continuity rules to require docs updates during each section/prompt and immediate indexing of newly created docs files.
- Updated handover and human-action backlog to reflect that policy is documented and next step is lifecycle automation rollout.

### Entry 15
- Clarified consolidated docs to explicitly state video provider decision scope as LiveKit (preferred) vs Google Meet (fallback), instead of generic wording.
- Aligned `tech-stack`, `open-validations`, and `human-actions/tool-options-and-stack-gaps` with canonical source-of-truth.

### Entry 16
- Added explicit "by when" deadlines per wave for human decisions in `docs/human-actions/decision-backlog.md`.
- Linked handover execution queue to those wave-gated decision deadlines.

### Entry 17
- Updated tech-stack governance to require phase entry and growth trigger metadata for all active/proposed components.
- Added wave-based stack adoption mapping in roadmap and human-actions tool matrix.
- Added handover rule to review/update stack phase tracking at every Wave close.

### Entry 18
- Reworked source-of-truth spec files to remove tool-specific AI instruction splits and replace with unified AI-agnostic build instructions.
- Added explicit role split, route guards, and screen inventory baseline for public/user/professional/admin.
- Added detailed professional onboarding stages and gate matrix requirements for implementation readiness.

### Entry 18 (2026-03-29)
- Applied all production schema migrations (001-006) to live Supabase (`jbbnbbrroifghrshplsq`).
- Fixed `availability_exceptions` table schema mismatch (recreated with correct `date_local` column).
- Migrations applied: role escalation fix, RLS restrict, favorites RLS, schema alignment, production booking foundation (professional_settings, availability_rules, availability_exceptions, slot_locks, payments, booking_sessions, calendar_integrations + full RLS), booking operations and reminders (notifications table + partial refund support).
- Wave 0 schema parity task: `Done`.
- Follow-up: validate e2e fixtures against new schema, continue Wave 0 exit criteria.

### Entry 19 (2026-03-30)
- Upgraded to Supabase Pro (spend cap enabled, PITR available but disabled) and Vercel Pro.
- Sentry env vars deployed to Vercel.
- Confirmed Supabase billing: Pro with spend cap = no surprise charges; daily backups included; PITR ~$100/mth extra, not needed yet.
- Created migration 007 (RLS cleanup: remove duplicate favorites policies and stale payments policy). Not yet applied.
- Vercel MCP requires re-authentication (user action needed).
- Follow-up: apply migration 007, configure Supabase custom SMTP with Resend (`noreply@muuday.com`), verify Vercel spending limits, verify Checkly checks.

### Entry 20 (2026-03-30) — Wave 0 closed, Wave 1 started
- **Wave 0 formally closed.** All exit criteria met.
- Vercel MCP reconnected and verified (project READY, team confirmed).
- Applied migration 008 (Wave 1 taxonomy + tiers schema): specialties table, professional_specialties junction, tier column on professionals, category_id FK, tag_suggestions table, RLS for all taxonomy tables.
- Applied migration 009 (taxonomy seed): consolidated 8 categories to new slugs, seeded 23 subcategories and 59 specialties matching search-config, backfilled category_id on existing professionals.
- Updated middleware for role-based route guards: public search (/buscar, /profissional), professional-only routes, admin-only routes, redirect param on login.
- Created `lib/tier-config.ts` with tier entitlement limits (specialties, tags, services, booking window per tier).
- Updated `types/index.ts` CATEGORIES to match new taxonomy slugs.
- Updated `lib/search-config.ts` legacy slug mapping with English DB slugs.
- Updated `lib/actions/professional.ts` to accept new + legacy category slugs.
- Build passes clean (0 errors, 0 warnings).
- Follow-up: admin taxonomy CRUD UI, search ranking refinement, review constraints, profile card trust signals.

### Entry 21 (2026-03-30) — Wave 1 core delivery
- Made search (`/buscar`) and professional profiles (`/profissional/[id]`) publicly accessible without login. Layout handles unauthenticated users with "Entrar" button.
- Login page now supports `?redirect=` param for post-login navigation (booking intent → login → booking).
- Created admin taxonomy CRUD page at `/admin/taxonomia`: tree view of categories → subcategories → specialties with inline edit, add, activate/deactivate. Tag suggestions moderation tab.
- Added tier-aware relevance ranking to search: weighted score from rating (50%), volume signals (35%), tier boost (15% premium, 8% professional).
- Added tier badges on search cards and professional profiles (Premium/Profissional visual indicators).
- Applied migration 010: review uniqueness constraint (one review per user-professional pair), professional_response + professional_response_at columns, updated_at for edit lifecycle.
- Professional profile page: shows professional response on reviews, uses new taxonomy category labels, tier badges.
- Updated professional profile page to use search-config category labels instead of hardcoded CATEGORIES.
- Build: 0 errors, 0 warnings.
- Wave 1 exit criteria status: taxonomy CRUD ✅, tier limits config ✅, search ranking ✅, review constraints ✅, route guards ✅, public search ✅.

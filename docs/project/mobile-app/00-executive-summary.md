# Executive Summary: Mobile App Architecture Preparation

## Context

The Muuday platform currently runs as a **web-first** Next.js 16 App Router application with Supabase (PostgreSQL + Auth), Stripe, Agora (video), and Tailwind CSS. The product team has decided to build a **native mobile app** (React Native / Expo) that will be **login-only** — no public marketing pages, no SEO content, no guest browsing. Both clients (`usuario`) and professionals (`profissional`) will use the same app.

## Key Finding: The Codebase Is Not Ready Today

After deep code analysis, the codebase has **significant architectural coupling** that will make mobile app development costly if not addressed now. The good news: every fix required is also a best-practice improvement for the web product.

## Critical Gaps (Must Fix Before App Build)

| # | Gap | Impact | Effort |
|---|-----|--------|--------|
| 1 | **Auth is cookie-only** — Supabase SSR sessions via `sb-*` cookies. No JWT token extraction for mobile headers. | Mobile app cannot authenticate against the same backend. | 2-3 days |
| 2 | **Business logic lives in Server Actions** — 34 Server Actions in `lib/actions/` contain core flows (booking, chat, notifications, reviews). No equivalent REST endpoints. | Mobile cannot reuse any business logic without rewriting. | 15–20 days (10 days optimistic, 20 with full test coverage + web migration) |
| 3 | **Hardcoded Portuguese everywhere** — UI strings, error messages, validation schemas, and database queries all assume `pt-BR`. No ICU message format or translation keys. | App cannot share translations with web; every string is duplicated work. | 5-7 days |
| 4 | **No Supabase-generated types** — Database tables are accessed via raw string queries with no type safety. | Mobile and web drift on schema changes; no compile-time safety. | 1-2 days |
| 5 | **Images/assets bundled or served from Supabase Storage** — No CDN strategy; mobile will need resize/optimize endpoints. | Poor mobile performance; heavy bandwidth usage. | 2-3 days |
| 6 | **Web Push only** — Push notifications use VAPID/web-push. No FCM/APNS support for native mobile. | App cannot receive push notifications. | 3-4 days |
| 7 | **No API versioning** — Routes like `/api/stripe/checkout-session` and `/api/sessao/status` are ad-hoc. | Breaking changes to web will break mobile. | 1-2 days |

## Strategic Recommendation

**Do NOT start the mobile app build until Phase A (below) is complete.** Building the app in parallel to these refactors is the single most expensive mistake the team could make. Every Server Action the mobile team rewrites is technical debt that must later be reconciled.

## Three-Phase Plan

### Phase A: Foundation (5–6 weeks, 1 senior backend engineer)
- Extract all core Server Actions into versioned `/api/v1/*` routes
- Implement JWT token auth alongside cookies (Supabase supports both)
- Adopt ICU message format + JSON translation files
- Generate Supabase types; add `profiles.language`, `professionals.market_code`
- Add image CDN pipeline (Sanity/Cloudinary)
- Add rollback strategy with feature flags (PostHog) for gradual rollout

### Phase B: Mobile API Hardening (2–3 weeks, same engineer)
- Add mobile-specific endpoints (push token registration, deep-link handlers)
- Implement API request/response DTOs with Zod schemas
- Add mobile CORS policy and API key authentication for app clients
- Build native push notification bridge (FCM + APNS via Expo or OneSignal)

### Phase C: App Development (parallel, 6–10 weeks, mobile team)
- React Native / Expo app consuming the hardened API
- Shared design tokens and component primitives
- Feature-flagged rollout via PostHog

## Immediate Action Items (This Week)

1. **Approve Phase A budget** — one senior backend engineer, 5–6 weeks.
2. **Decide on native push strategy** — Expo Notifications vs OneSignal vs native FCM/APNS.
3. **Freeze new Server Actions** — all new features must be built as API routes, not Server Actions, starting now.
4. **Set up `supabase gen types`** — type safety is a prerequisite for both web and mobile.

## Bottom Line

The mobile app is **100% feasible**, but the current web-first architecture will multiply development cost by 2–3x if not refactored first. The refactor work described here is not "extra" — it is overdue technical debt that improves the web product, enables the mobile app, and prevents a future rewrite.


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.

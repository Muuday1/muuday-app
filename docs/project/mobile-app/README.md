# Mobile App Architecture Preparation

This folder contains the strategic analysis and implementation plan for preparing the Muuday codebase to support a future native mobile application (React Native / Expo).

## Documents

| # | Document | Purpose |
|---|----------|---------|
| `00-executive-summary.md` | **Start here.** High-level findings, critical gaps, and the three-phase recommendation. |
| `01-current-architecture-audit.md` | Deep code-level analysis of auth, API routes, Server Actions, DB, payments, chat, push, and i18n. |
| `02-auth-jwt-strategy.md` | How to evolve from cookie-only Supabase auth to dual-mode (cookies + JWT bearer tokens) for mobile. |
| `03-api-first-refactor-plan.md` | Step-by-step plan to extract 3,500+ lines of Server Actions into versioned `/api/v1/*` REST endpoints. |
| `04-mobile-app-requirements.md` | Feature matrix (web vs mobile), user journeys, design tokens, navigation, and tech stack recommendations. |
| `05-shared-infrastructure.md` | Translations (ICU), Supabase types, image CDN, push notifications, API versioning, and error standards. |
| `06-implementation-roadmap.md` | 14-week timeline with 5 phases, resource requirements, and cost-of-delay analysis. |
| `07-risks-and-mitigations.md` | Top 11 risks with likelihood, impact, and concrete mitigation strategies. |
| `08-master-backlog.md` | **O documento mestre.** Une internacionalização + mobile em sprints sequenciais. É a lista de trabalho única. |

## Key Decision

> **Do NOT start the mobile app build until Phase A (API Foundation) and Phase B (Mobile Hardening) are complete.**
>
> Building the app in parallel to these backend refactors will cost 2–3x more due to duplicated business logic and incompatible auth.

## Immediate Actions (This Week)

1. Read `00-executive-summary.md` and present to leadership.
2. Assign a senior backend engineer to Phase A (5–6 weeks).
3. Enforce the policy: **No new Server Actions.** All new features must be API routes.
4. Set up `supabase gen types` in CI.
5. Decide on native push strategy (Expo Push vs OneSignal vs FCM+APNS).

## Relationship to International Expansion Docs

This folder is **separate** from `docs/project/international-expansion/`. The two initiatives intersect at:

- **Translations**: Both need ICU message format and shared JSON files.
- **Market isolation**: `professionals.market_code` is required for both multi-market web and mobile.
- **API-first architecture**: International expansion needs market-filtered APIs; mobile needs the same APIs.

When implementing, prioritize work that serves both initiatives:
1. API-first refactor (serves mobile + multi-market)
2. ICU translations (serves mobile + multi-market)
3. DB market isolation (serves mobile + multi-market)

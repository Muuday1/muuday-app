# 06 — Implementation Roadmap

## Overview

This roadmap splits the mobile preparation work into **5 phases**. Only Phases A and B are prerequisites for starting the mobile app build. Phases C and D run in parallel with mobile development. Phase E is post-launch.

---

## Phase A: API Foundation (Weeks 1–4)
**Goal:** Mobile can authenticate and call versioned APIs for core features.
**Team:** 1 senior backend engineer.

### Week 1: Infrastructure
- [ ] Create `lib/supabase/api-client.ts` with dual-mode cookie + bearer token support.
- [ ] Update `middleware.ts` to accept bearer tokens for route guards.
- [ ] Create `lib/api-handlers/with-auth.ts`, `with-rate-limit.ts`, `with-validation.ts`.
- [ ] Add `MOBILE_API_KEY` env var and validation middleware.
- [ ] Set up `supabase gen types` and generate `types/supabase.ts`.
- [ ] Add `profiles.language` and `professionals.market_code` columns to DB.
- [ ] Create `lib/schemas/` with Zod schemas extracted from Server Actions.

### Week 2: Core Services Extraction
- [ ] Extract `lib/services/booking/create-booking.ts` from `lib/actions/booking.ts`.
- [ ] Create `POST /api/v1/bookings` route.
- [ ] Extract `lib/services/chat/*.ts` from `lib/actions/chat.ts`.
- [ ] Create `POST/GET /api/v1/conversations/{id}/messages` routes.
- [ ] Extract `lib/services/notifications/*.ts` from `lib/actions/notifications.ts`.
- [ ] Create `GET /api/v1/notifications` route.
- [ ] Write unit tests for all service functions.

### Week 3: Profile & Professional APIs
- [ ] Create `GET/PATCH /api/v1/users/me`.
- [ ] Create `GET/PATCH /api/v1/professionals/me`.
- [ ] Create `GET /api/v1/professionals/search` (with market isolation).
- [ ] Migrate `POST /api/agora/token` → `POST /api/v1/sessions/{id}/token`.
- [ ] Migrate `GET /api/sessao/status` → `GET /api/v1/sessions/{id}/status`.
- [ ] Create `POST /api/v1/push/subscribe` (supports web + native tokens).

### Week 4: Web Migration & Cleanup
- [ ] Update web components to call `/api/v1/*` instead of Server Actions.
- [ ] Remove or deprecate old Server Actions (keep as thin proxies if needed).
- [ ] Run E2E tests to ensure no regression.
- [ ] Document API contracts for mobile team.

**Deliverable:** Versioned API running in production, mobile team can `curl` endpoints with a bearer token.

---

## Phase B: Mobile Hardening (Weeks 5–6)
**Goal:** Mobile-specific features and production readiness.
**Team:** Same backend engineer + 1 DevOps (part-time).

### Week 5: Push Notifications & Auth
- [ ] Migrate `push_subscriptions` table to support native tokens.
- [ ] Implement native push sender (Expo Push Service or FCM + APNS).
- [ ] Update chat and booking reminder flows to call unified push sender.
- [ ] Configure Supabase Auth with iOS/Android OAuth client IDs.
- [ ] Create deep-link handler API (`/api/v1/auth/deep-link` for password reset).
- [ ] Add `X-Device-ID` header support for rate limiting.

### Week 6: CDN, Images, Caching & Polish
- [ ] Set up Sanity image pipeline for avatars and professional photos.
- [ ] Update upload endpoints to return CDN URLs with transform parameters.
- [ ] Add `Cache-Control` and `ETag` headers to all `/api/v1/*` list endpoints.
- [ ] Add cursor-based pagination to `/api/v1/professionals/search`.
- [ ] Add API response compression (Brotli/Gzip) for mobile bandwidth.
- [ ] Add request timing metrics to PostHog.
- [ ] Final security review: CORS, API key validation, JWT expiry handling, app attestation.
- [ ] Load test critical endpoints (`/api/v1/bookings`, `/api/v1/professionals/search`).
- [ ] Set up **OpenAPI contract tests** in CI (validate responses against schema).

**Deliverable:** Production-ready mobile backend. Mobile team can start building.

---

## Phase C: Mobile App Development (Weeks 7–14, Parallel)
**Goal:** Functional native app for iOS and Android.
**Team:** 2 mobile engineers (React Native / Expo).

### Sprint 1–2: Foundation (Weeks 7–8)
- [ ] Initialize Expo project with TypeScript.
- [ ] Set up navigation (Expo Router), theme, and design tokens.
- [ ] Integrate Supabase Auth (password + Google native OAuth).
- [ ] Integrate TanStack Query for data fetching.
- [ ] Build auth screens (login, signup, password reset).
- [ ] Configure deep links (`muuday://`).

### Sprint 3–4: Core Client Flow (Weeks 9–10)
- [ ] Home / dashboard screen.
- [ ] Search professionals (call `/api/v1/professionals/search`).
- [ ] Professional detail screen.
- [ ] Booking flow (one-off and recurring).
- [ ] My bookings list and detail.
- [ ] Push notification token registration.

### Sprint 5–6: Core Professional Flow (Weeks 11–12)
- [ ] Professional dashboard.
- [ ] Calendar / availability management.
- [ ] Client list and details.
- [ ] Booking confirmation / manual confirmation flow.
- [ ] Post-session notes.

### Sprint 7: Video & Chat (Weeks 13)
- [ ] Integrate Agora React Native SDK.
- [ ] Video session screen with join window validation.
- [ ] Chat list and thread screens.
- [ ] Realtime message subscription (Supabase realtime).
- [ ] Push notification handling for chat + booking reminders.

### Sprint 8: Polish & Beta (Week 14)
- [ ] Biometric login (Face ID / fingerprint).
- [ ] Profile editing + avatar upload.
- [ ] Notification preferences.
- [ ] Offline state handling.
- [ ] Beta build for internal testing (TestFlight + Play Console Internal).

**Deliverable:** Beta app on TestFlight and Play Console Internal Testing.

---

## Phase D: Web + Mobile Convergence (Weeks 11–16, Overlaps C)
**Goal:** Shared features launch simultaneously on both platforms.
**Team:** 1 frontend engineer (web) + mobile team.

### Parallel Work
- [ ] Adopt ICU message format on web (`next-intl`) — starts in Week 11.
- [ ] Extract all remaining hardcoded strings to JSON.
- [ ] Migrate web image pipeline to Sanity CDN.
- [ ] Add web push notification UI (if not already done).
- [ ] Unified onboarding flow (web for professionals, app for clients).
- [ ] Shared feature flags for phased rollout.

---

## Phase E: Launch & Post-Launch (Weeks 17+)
**Goal:** Public app store release and continuous improvement.

### Pre-Launch (Week 16)
- [ ] App Store review submission (iOS).
- [ ] Play Store review submission (Android).
- [ ] Marketing website updated with app download badges.
- [ ] Help center articles for app-specific features.

### Post-Launch
- [ ] Monitor crash rates (Sentry).
- [ ] Track adoption: app vs web bookings, session duration.
- [ ] Iterate on mobile-specific features (widgets, shortcuts, Siri/Assistant).
- [ ] Plan v2 features: screen sharing, group sessions, in-app calling.

---

## Timeline Summary

```
Week:  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17+
       ├───── Phase A: API Foundation ─────┤
                           ├─ Phase B: Mobile Hardening ─┤
                                          ├────── Phase C: Mobile App Dev ──────┤
                                                       ├──── Phase D: Convergence ────┤
                                                                       ├─ Phase E: Launch ─┤
```

**Critical Path:** Phase A → Phase B → Phase C Sprint 1.

**Total Time to Beta App:** ~14 weeks (3.5 months) from start of Phase A.
**Total Time if starting mobile app before Phase B:** 6+ months (due to rewriting all business logic in the app).

---

## Resource Requirements

| Role | Phase A | Phase B | Phase C | Phase D | Phase E |
|------|---------|---------|---------|---------|---------|
| Senior Backend Engineer | 1 FTE | 1 FTE | 0.25 FTE (support) | 0.25 FTE | 0.25 FTE |
| Mobile Engineer (RN/Expo) | — | — | 2 FTE | 2 FTE | 1 FTE |
| Frontend Engineer (Web) | 0.25 FTE | 0.25 FTE | 0.25 FTE | 1 FTE | 0.5 FTE |
| Designer (UI/UX) | — | — | 0.5 FTE | 0.5 FTE | 0.25 FTE |
| QA / E2E | — | 0.25 FTE | 0.5 FTE | 1 FTE | 0.5 FTE |
| DevOps | — | 0.25 FTE | 0.25 FTE | 0.25 FTE | 0.25 FTE |

**Note on Backend resourcing:** If the team cannot dedicate 1 FTE senior backend for 6 weeks, the alternative is to hire a **contractor** for Phase A+B. This is strongly recommended over splitting a single engineer across international expansion + mobile prep, as context switching will extend the timeline by 30–50%.

---

## Cost of Delay

| Delay | Impact |
|-------|--------|
| Skip Phase A, start mobile immediately | Mobile team writes duplicate business logic (3,500+ lines). Cost: **+2–3 months**, permanent technical debt. |
| Skip JWT auth refactor | Mobile app cannot use existing API. Must build parallel backend. Cost: **+1 month**, infrastructure duplication. |
| Skip translation extraction | Every UI string is translated twice (web + mobile). Cost: **+2–3 weeks**, translation drift forever. |
| Skip DB type generation | Schema changes break mobile silently. Cost: **unbounded** bug-fixing time. |

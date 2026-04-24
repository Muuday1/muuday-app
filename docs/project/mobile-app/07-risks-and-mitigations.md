# 07 — Risks & Mitigations

## Risk 1: Server Action Extraction Is Larger Than Estimated

**Likelihood:** Medium | **Impact:** High

**Description:**
The `lib/actions/booking.ts` file is 824 lines with complex atomic transactions, slot locking, payment fallback logic, calendar sync, and Resend event emission. Extracting this into a clean service without breaking the web flow is non-trivial.

**Mitigation:**
1. **Extract incrementally:** Do not refactor logic in the same PR. First, copy-paste the exact function body into a service file and have the API route call it. Verify web still works. Then refactor.
2. **Comprehensive tests:** Before touching `booking.ts`, add E2E tests that cover one-off, recurring, and batch booking flows. Run them after every extraction step.
3. **Feature flag:** Wrap the new API route in a PostHog flag (`use_api_v1_bookings`). Roll out to 5% of users, monitor error rates, then increase.
4. **Fallback:** If extraction takes >5 days, consider keeping the Server Action as a proxy that calls the service internally. The API route and Server Action both use the same service function.

---

## Risk 2: Supabase Auth Edge Runtime Issues

**Likelihood:** Medium | **Impact:** High

**Description:**
The custom storage adapter for bearer tokens in `middleware.ts` runs on Vercel Edge. `@supabase/ssr` has had subtle Edge runtime issues in the past (crypto API differences, `setAll` behavior).

**Mitigation:**
1. **Pin `@supabase/ssr` version** and read release notes before upgrading.
2. **Isolate auth logic:** Put all auth client creation in one file (`lib/supabase/api-client.ts`). If Edge breaks, we can switch to Node.js runtime for middleware by changing one config line.
3. **Test on Edge:** Deploy to a Vercel preview environment early and test bearer token auth from a script (not just local dev).
4. **Fallback middleware:** If Edge auth fails, middleware can skip auth for API routes (`/api/v1/*`) and let the API route itself handle auth. This removes auth from the Edge entirely.

---

## Risk 3: Mobile App Store Rejection

**Likelihood:** Medium | **Impact:** High

**Description:**
iOS App Store and Google Play have strict requirements for:
- Account deletion (must be in-app, not just "email support").
- In-app purchases for digital services (Apple may require IAP for subscriptions).
- Privacy manifest (iOS 17+).
- Accessibility.

**Mitigation:**
1. **Account deletion:** Build a "Delete Account" flow in the app from day one. It should call `DELETE /api/v1/users/me` which anonymizes data and triggers Supabase `auth.admin.deleteUser()`.
2. **Subscriptions:** Research Apple's policy on professional SaaS subscriptions. If professionals are paying for a platform tool (not digital content consumed in-app), Stripe may be allowed. If not, implement Apple In-App Purchase as an alternative for iOS professionals.
3. **Privacy manifest:** Use Expo SDK 50+ which auto-generates the required `PrivacyInfo.xcprivacy` file. Declare Supabase, PostHog, and Agora as third-party SDKs.
4. **Accessibility:** Use React Native's accessibility props from the start. Test with VoiceOver/TalkBack before submission.

---

## Risk 4: Push Notification Complexity

**Likelihood:** Medium | **Impact:** Medium

**Description:**
Supporting Web Push (VAPID), FCM, and APNS simultaneously creates operational overhead. Token management, delivery failures, and platform-specific payload limits are common pain points.

**Mitigation:**
1. **Use Expo Push Service** if building with Expo. It abstracts FCM and APNS into a single HTTP API. We only manage Expo push tokens.
2. **Unified sender module:** `lib/push/unified-sender.ts` routes to web or native based on `platform` column. One call site for all features (chat, booking reminders, etc.).
3. **Dead token cleanup:** The existing web-push logic already cleans up 410/404 subscriptions. Extend this to Expo tokens (Expo returns `DeviceNotRegistered`).
4. **Batch sends:** For broadcast notifications (rare), use FCM multicast or Expo batch API. Do not loop over individual tokens.

---

## Risk 5: Video Call Quality on Mobile Networks

**Likelihood:** High | **Impact:** Medium

**Description:**
Mobile users will join video sessions on 3G/4G/5G and WiFi with varying quality. Agora defaults may not adapt well, leading to dropped calls or poor audio.

**Mitigation:**
1. **Agora adaptive streaming:** Enable `setVideoEncoderConfiguration` with auto-degradation preferences on poor networks.
2. **Connection quality monitoring:** Use Agora's `onNetworkQuality` callback to show a "poor connection" banner.
3. **Audio fallback:** If video bandwidth is insufficient, drop video and keep audio. This is a better UX than a frozen screen.
4. **Pre-call network test:** Optional: run a quick Agora network test 5 minutes before the session starts and notify the user if their connection is unstable.
5. **Cellular data warning:** Show a warning if the user is on cellular data (detected via RN `NetInfo`).

---

## Risk 6: Translation Drift Between Web and Mobile

**Likelihood:** High | **Impact:** Low (but chronic)

**Description:**
If web and mobile pull from different translation sources, strings will diverge. A bug fixed in web Portuguese may remain in mobile Portuguese.

**Mitigation:**
1. **Single source of truth:** `packages/translations/messages/pt-BR.json` is the only file for both platforms.
2. **CI check:** Add a GitHub Action that fails the build if mobile imports a translation key that does not exist in the JSON file.
3. **No inline strings policy:** Enforce via ESLint rules that no hardcoded Portuguese strings are allowed in component files.
4. **Translation management tool:** Eventually adopt a TMS (Translation Management System) like Crowdin or Lokalise that exports to the JSON format for both platforms.

---

## Risk 7: Database Schema Changes Break Mobile

**Likelihood:** Medium | **Impact:** High

**Description:**
Mobile app users do not update immediately. A DB column renamed or removed will crash the app for users on older versions.

**Mitigation:**
1. **API versioning:** Mobile is locked to `/api/v1/`. The API contract is stable. Web can move to `/api/v2/` without breaking mobile.
2. **Never remove columns used by v1:** Add new columns, deprecate old ones, but keep them populated until mobile adoption of v2 is >95%.
3. **Generated types:** `types/supabase.ts` is generated from the DB. CI fails if a query uses a column not in the generated types.
4. **Backward-compatible API responses:** If a field is deprecated, keep returning it in v1 with a default value. Log usage to identify when it is safe to remove.

---

## Risk 8: Team Bandwidth During Brazil Consolidation

**Likelihood:** High | **Impact:** Medium

**Description:**
The team is simultaneously working on Brazil consolidation, KYC, CMS setup, and international expansion. Adding mobile preparation may stretch resources too thin.

**Mitigation:**
1. **Hire contractor for Phase A:** A senior backend contractor can own the API extraction for 4–5 weeks without distracting the core team.
2. **Freeze new Server Actions immediately:** This is a zero-cost policy change. Enforce via code review checklist.
3. **Defer non-critical mobile features:** Screen sharing, PiP video, and widgets are Phase E. Do not scope them into the initial build.
4. **Parallel track:** Phase A (backend) and Phase D (web i18n) can happen while the core team focuses on Brazil. Phase C (mobile app) only starts after Phase B is done.

---

## Risk 9: OAuth Deep Link Handling on Mobile

**Likelihood:** Medium | **Impact:** Medium

**Description:**
Google OAuth on mobile uses `signInWithIdToken`, but the web callback (`/auth/callback`) is also registered. If a user starts OAuth on mobile web and the deep link routes incorrectly, the session may be lost.

**Mitigation:**
1. **Separate callback schemes:**
   - Web: `https://muuday.com/auth/callback`
   - iOS: `muuday://auth/callback`
   - Android: `muuday://auth/callback` or App Link `https://muuday.com/auth/callback`
2. **Supabase redirect config:** Add all three redirect URLs to the Supabase Auth provider settings.
3. **State validation:** Always validate the `state` parameter in the callback to prevent CSRF.
4. **Test matrix:** Test OAuth on iOS Safari, iOS Chrome, Android Chrome, and in-app browser.

---

## Risk 10: Payment Flow Discrepancies (Stripe)

**Likelihood:** Medium | **Impact:** Medium

**Description:**
Web uses Stripe Checkout redirect. Mobile should use Stripe PaymentSheet for a native feel. If the payment intent/session creation logic diverges, professionals may be charged incorrectly or metadata may be lost.

**Mitigation:**
1. **Unified payment intent creation:** The server-side logic for creating Stripe PaymentIntents or Checkout Sessions should live in one service (`lib/services/payments/create-payment.ts`). Both web and mobile call this service via the API.
2. **Mobile-specific endpoint:** `POST /api/v1/payments/payment-intent` returns a `client_secret` for Stripe PaymentSheet. Web continues using `POST /api/v1/payments/checkout-session` for redirect-based flow.
3. **Metadata consistency:** Both endpoints attach the same metadata shape (`professional_id`, `tier`, `billingCycle`) to Stripe.
4. **Webhook handling:** The existing Stripe webhook (`/api/webhooks/stripe`) processes both Checkout and PaymentSheet events uniformly.

---

## Risk 11: Static API Key Leak from Mobile Bundle

**Likelihood:** Medium | **Impact:** High

**Description:**
The `MOBILE_API_KEY` proposed in the auth strategy is a static string embedded in the React Native bundle. Attackers can extract it via reverse engineering and impersonate the mobile app.

**Mitigation:**
1. **Do not rely solely on static keys.** Use them as a weak signal only (rate-limit tiering, not access control).
2. **App attestation:** Require Apple App Attest (iOS) and Google Play Integrity (Android) tokens for sensitive endpoints (account deletion, password reset, KYC submission).
3. **Dynamic attestation:** On first app launch, the mobile app requests a short-lived attestation token from the backend, which is then used for subsequent requests. The token is rotated per session.
4. **Certificate pinning:** Pin the API server's TLS certificate in the mobile app to prevent MITM attacks on public WiFi.
5. **Monitor for abuse:** Log all API requests by `X-Mobile-API-Key` + `X-Device-ID`. Alert if a single key generates traffic from 50+ distinct device IDs in 1 hour.

---

## Risk Register Summary

| # | Risk | Likelihood | Impact | Owner | Mitigation Cost |
|---|------|------------|--------|-------|-----------------|
| 1 | Server Action extraction too large | Medium | High | Backend Lead | Low (incremental) |
| 2 | Supabase Edge runtime issues | Medium | High | Backend Lead | Low (fallback to Node) |
| 3 | App Store rejection | Medium | High | Mobile Lead | Medium (compliance build) |
| 4 | Push notification complexity | Medium | Medium | Backend Lead | Low (Expo Push) |
| 5 | Video quality on mobile networks | High | Medium | Mobile Lead | Low (Agora config) |
| 6 | Translation drift | High | Low | Frontend Lead | Low (shared JSON) |
| 7 | DB schema changes break mobile | Medium | High | Backend Lead | Low (API versioning) |
| 8 | Team bandwidth stretched | High | Medium | Engineering Manager | Medium (contractor) |
| 9 | OAuth deep link issues | Medium | Medium | Mobile Lead | Low (test matrix) |
| 10 | Payment flow discrepancies | Medium | Medium | Backend Lead | Low (unified service) |
| 11 | Static API key leak from mobile bundle | Medium | High | Security Lead | Medium (app attestation + pinning) |


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.

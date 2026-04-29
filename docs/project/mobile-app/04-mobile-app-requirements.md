# 04 — Mobile App Requirements & Feature Set

## App Constraint (Given)

> The app is **login-only**. No public pages. Both clients (`usuario`) and professionals (`profissional`) use the same app.

This dramatically simplifies scope:
- **No landing pages** to build in the app.
- **No SEO** concerns.
- **No marketing content** (guides, blog, testimonials) in the app.
- **No cookie consent banners** (native apps use platform permission dialogs).

## Role-Based Login Routing

> **Decisão arquitetural:** A separação entre cliente e profissional acontece **no momento do login**, não dentro do app.

Após autenticação bem-sucedida no Supabase, o app executa:

```ts
const { data: professional } = await supabase
  .from('professionals')
  .select('id, status')
  .eq('user_id', user.id)
  .single()

if (professional && professional.status === 'active') {
  // Monta tab bar do profissional
  router.replace('/(tabs-professional)')
} else {
  // Monta tab bar do cliente
  router.replace('/(tabs)')
}
```

**Consequências:**
- Não há "switch de modo" dentro do app (diferente de apps como Uber que têm Driver/Passenger toggle).
- Um mesmo usuário com conta de cliente e conta de profissional precisa fazer logout/login para trocar.
- Deep links (`muuday://bookings/{id}`) funcionam independentemente do role, mas a navegação pós-deep-link respeita a tab bar ativa.
- A decisão de role é cacheada no `AuthProvider` para evitar flicker na reinicialização do app.

## User Journeys

### Client Journey

```
[Login/Register] → [Home/Dashboard]
                        ↓
    ┌───────────┬───────┴───────┬───────────┐
    ↓           ↓               ↓           ↓
[Search Pro] [My Bookings] [Messages] [Profile/Settings]
    ↓           ↓               ↓
[Pro Detail] [Booking Detail] [Chat Thread]
    ↓           ↓
[Book Flow] [Video Session]
    ↓
[Checkout/Payment]
```

### Professional Journey

```
[Login/Register] → [Professional Dashboard]
                        ↓
    ┌───────────┬───────┴───────┬───────────┐
    ↓           ↓               ↓           ↓
[Calendar/     [My Clients]  [Messages]  [Profile/Settings]
 Availability]    ↓               ↓
    ↓         [Client Detail] [Chat Thread]
[Booking Detail]   ↓
    ↓         [Session Notes]
[Video Session]
    ↓
[Post-Session Review]
```

## Feature Matrix: Web vs Mobile

| Feature | Web (Today) | Mobile (Required) | Notes |
|---------|-------------|-------------------|-------|
| **Auth** | | | |
| Password login | ✅ | ✅ | |
| Google OAuth | ✅ (redirect) | ✅ (native SDK) | Must use `signInWithIdToken` |
| Password reset | ✅ | ✅ | Deep link to app |
| Session refresh | Cookie | AsyncStorage/Keychain | |
| **Search & Discovery** | | | |
| Public search (no login) | ✅ | ❌ Not required | App is login-only |
| Authenticated search | ✅ | ✅ | Same API, market-filtered |
| Professional detail | ✅ | ✅ | |
| Favorites | ✅ | ✅ | |
| **Booking** | | | |
| One-off booking | ✅ | ✅ | |
| Recurring packages | ✅ | ✅ | |
| Batch booking | ✅ | ✅ (nice-to-have) | |
| Cancel / reschedule | ✅ | ✅ | |
| Manual confirmation (pro) | ✅ | ✅ | Push notification + in-app action |
| **Payments** | | | |
| Stripe Checkout (subscriptions) | ✅ | ⚠️ Webview or Customer Portal | Professionals manage plans |
| Session payment (client) | ✅ | ✅ | Stripe PaymentSheet or Checkout |
| **Video Calls** | | | |
| Agora video session | ✅ | ✅ | Agora React Native SDK |
| Screen sharing | ❌ | ❌ (future) | Not in current web scope |
| **Chat** | | | |
| Realtime messaging | ✅ | ✅ | Supabase realtime works in RN |
| Push notification on message | ✅ (web push) | ✅ (FCM/APNS) | New backend sender needed |
| Attachment sharing | ❌ | ❌ (future) | Not in current web scope |
| **Notifications** | | | |
| In-app notification list | ✅ | ✅ | |
| Realtime badge update | ✅ | ✅ | |
| Push notifications | ✅ (web) | ✅ (native) | FCM + APNS |
| **Calendar** | | | |
| View availability | ✅ | ✅ | |
| Set recurring availability | ✅ | ✅ | |
| Block exceptions | ✅ | ✅ | |
| Google/Outlook sync | ✅ | ❌ (web only) | Pro manages on web dashboard |
| **Profile Management** | | | |
| Edit profile | ✅ | ✅ | |
| Upload avatar | ✅ | ✅ | Image picker + upload |
| Upload credentials | ✅ | ⚠️ Webview or native | KYC docs |
| **Reviews** | | | |
| Leave review | ✅ | ✅ | |
| Respond to review | ✅ | ✅ | |
| **Onboarding** | | | |
| Professional onboarding | ✅ | ⚠️ Webview recommended | Complex forms + KYC |
| Client onboarding | ✅ | ✅ | Simple profile completion |
| **Admin** | | | |
| Admin dashboard | ✅ | ❌ Not required | Web only |

## KYC & Professional Onboarding Strategy

The professional onboarding flow is the **most complex web flow** today. It includes:
- Document upload (diploma, registration, certifications)
- **AI OCR pre-screening** (document validation)
- **Human review queue** (admin approval)
- Terms acceptance (multiple legal documents)
- Plan selection and Stripe Checkout

### Recommendation: Keep KYC/OCR Web-First in Phase 1

**Why:**
1. **OCR libraries**: Document scanning SDKs (e.g., `react-native-document-scanner`, `expo-camera` with ML Kit) add significant native complexity.
2. **File handling**: Credential uploads are PDFs and high-res images. Handling these reliably on mobile requires careful UX (compression, preview, retry).
3. **Legal terms**: Reading and accepting long legal terms on a small screen has poor UX and may not hold up legally.
4. **Admin review**: The review dashboard is web-only (`/admin`). KYC submissions must be viewable there.

### Mobile Approach

| Step | Mobile UX | Backend |
|------|-----------|---------|
| Initial signup | Native form (e-mail, password, role) | `POST /api/v1/auth/signup` |
| Profile basics | Native form (name, category, specialty) | `PATCH /api/v1/professionals/me` |
| **KYC document upload** | **WebView** pointing to `/onboarding-profissional?mobile=true` | Reuses existing web flow |
| **Terms acceptance** | **WebView** or deep link to web | Reuses existing web flow |
| Plan selection | WebView for Stripe Checkout | Reuses existing web flow |
| Dashboard access | Native app (after onboarding complete) | `GET /api/v1/professionals/me/onboarding` |

### Future Native KYC (Phase E+)

When the app matures:
- Replace WebView with native camera + on-device ML Kit text recognition.
- Upload directly to the same `POST /api/v1/professionals/me/credentials` endpoint.
- Stream the document through the same AI OCR pipeline (`lib/kyc/ocr.ts`).

## Mobile-Specific Features

| Feature | Priority | Description |
|---------|----------|-------------|
| Biometric login | P2 | Face ID / Touch ID / fingerprint after first password login |
| Deep links | P1 | Internal navigation via `muuday://` |
| Universal Links / App Links | P1 | E-mail links (password reset, invites) via `https://muuday.com/...` |
| Share sheet | P2 | Share professional profile via native share |
| Camera access | P1 | Avatar photo, credential document scan (KYC) |
| Photo library | P1 | Upload avatar from gallery |
| Background fetch | P2 | Refresh notifications/bookings when app resumes |
| Offline indicator | P1 | Show "offline mode" banner when no connectivity |
| Screen wake lock (video) | P1 | Prevent screen sleep during video session |
| Picture-in-picture (video) | P3 | Allow PiP during video call |
| API response caching | P1 | TanStack Query + HTTP cache headers for unstable connectivity |

## Design System for Mobile

### Recommendation: Shared Design Tokens

Create a shared package or file that both web and mobile consume:

```ts
// lib/design-tokens.ts (or packages/design-tokens/index.ts)
export const tokens = {
  colors: {
    primary: '#9FE870',
    primaryDark: '#8ed85f',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#0F172A',
    textMuted: '#64748B',
    border: '#E2E8F0',
    error: '#EF4444',
    success: '#22C55E',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  typography: {
    // Web uses Tailwind classes; mobile uses these as reference
    heading1: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
    heading2: { fontSize: 22, fontWeight: '600', lineHeight: 30 },
    body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
    caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  },
}
```

### Component Primitives

Define a minimal set of shared primitives. Web uses Tailwind; mobile uses React Native styles. Both reference the same token values.

| Primitive | Web (Tailwind) | Mobile (RN StyleSheet) |
|-----------|----------------|------------------------|
| Button | `<Button>` with Tailwind classes | `<Button>` with StyleSheet |
| Card | `rounded-lg bg-white border border-slate-200` | `borderRadius: 8, backgroundColor: '#fff'` |
| Input | `px-4 py-3 rounded-md border border-slate-200` | `padding: 16, borderRadius: 8, borderWidth: 1` |
| Avatar | `rounded-full` | `borderRadius: 9999` |
| Badge | `px-2 py-0.5 rounded-full text-xs` | `paddingHorizontal: 8, borderRadius: 9999, fontSize: 12` |

## Navigation Structure

### Client Tab Bar
```
┌─────────┬─────────┬─────────┬─────────┐
| Explore | Bookings| Messages| Profile |
|  🔍     |   📅    |   💬    |   👤    |
└─────────┴─────────┴─────────┴─────────┘
```

### Professional Tab Bar
```
┌─────────┬─────────┬─────────┬─────────┐
| Dashboard| Calendar| Messages| Profile |
|   📊    |   📅    |   💬    |   👤    |
└─────────┴─────────┴─────────┴─────────┘
```

### Deep Link Routes

**Custom scheme** (internal app navigation):
```
muuday://bookings/{id}          → Booking detail
muuday://bookings/{id}/session  → Video session
muuday://messages/{id}          → Chat thread
muuday://professionals/{id}     → Professional profile
muuday://notifications          → Notifications list
muuday://settings/notifications → Notification preferences
```

**Universal Links / App Links** (e-mail and external sources):
```
https://muuday.com/auth/callback?token=...     → OAuth / password reset
https://muuday.com/convite?code=...            → Referral invite
https://muuday.com/profissional/{slug}         → Professional profile (falls back to web if app not installed)
```

**Why both?** Custom schemes work when the app is already installed. Universal Links are required for e-mail links because iOS Mail and Gmail block custom scheme links or require user confirmation.

## Platform-Specific Considerations

### iOS
- **Notch / Dynamic Island**: Safe area insets required for header/tab bar.
- **App Store Review**: Must provide a way to delete account (GDPR/LGPD compliance).
- **Push permissions**: Must request permission explicitly; cannot send without opt-in.
- **Background audio**: Agora video calls need `audio` background mode in `Info.plist`.
- **Camera / microphone permissions**: Required for video sessions.
- **App Attest**: Use `expo-apple-authentication` or native App Attest to validate app integrity for sensitive API calls.

### Android
- **Back button**: Must handle hardware back button correctly (RN `BackHandler`).
- **Status bar**: Transparent or colored to match app theme.
- **Push permissions**: Android 13+ requires runtime permission for notifications.
- **Deep links**: Use Android App Links (`https://muuday.com/...`) + custom scheme fallback.
- **Photo picker**: Use modern photo picker (Android 13+) for credential uploads.
- **Play Integrity API**: Verify app binary authenticity for sensitive API calls.

## Technology Choices

| Layer | Recommendation | Rationale |
|-------|---------------|-----------|
| Framework | **Expo SDK 52+** | Faster development, OTA updates, push notifications built-in |
| Navigation | **Expo Router** | File-based routing, deep links out of the box |
| State Management | **TanStack Query (React Query)** | Identical to web pattern, caching, optimistic updates |
| Forms | **React Hook Form** | Same library as web, consistent validation |
| Styling | **NativeWind** (Tailwind for RN) | Share Tailwind classes with web |
| Video | **Agora React Native SDK** | Same backend token system |
| Push | **Expo Notifications** | Unified FCM + APNS, no native code needed |
| Auth Storage | **expo-secure-store** | Keychain/Keystore, encrypted |
| Image Handling | **expo-image** | Optimized, caching, CDN-friendly |
| Biometrics | **expo-local-authentication** | Face ID / fingerprint |
| Calendar | **expo-calendar** (read-only for client) | Check native calendar for conflicts |
| Payments | **@stripe/stripe-react-native** | Native PaymentSheet |
| Analytics | **posthog-react-native** | Same events as web |
| Feature Flags | **PostHog** | Already configured for web |


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.

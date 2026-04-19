# Handover: Next.js 14.2.35 → 16.2.4 Upgrade

**Branch:** `nextjs-14-to-16-upgrade`  
**Commit:** `1df482a`  
**Pushed to:** `origin/nextjs-14-to-16-upgrade`  
**PR URL:** https://github.com/Muuday1/muuday-app/pull/new/nextjs-14-to-16-upgrade

## Summary

Completed the framework upgrade from Next.js 14.2.35 to **16.2.4** with full **React 19** compatibility. This resolves the CVEs (GHSA-9g9p-9gw9-jx7f, etc.) that were blocking PR #27.

## Dependency Changes

| Package | Old | New |
|---------|-----|-----|
| `next` | `^14.2.35` | `^16.2.4` |
| `react` | `^18.3.1` | `^19` |
| `react-dom` | `^18.3.1` | `^19` |
| `lucide-react` | `^0.383.0` | `^0.577.0` |
| `eslint` | `^8` | `^9` |
| `eslint-config-next` | `^14.2.35` | `^16.2.4` |
| `@testing-library/dom` | — | added (dev) |

## Breaking Changes Migrated

### 1. Async Dynamic APIs
Next.js 16 makes `cookies()`, `headers()`, `draftMode()` async.

- `lib/supabase/server.ts` — `createClient()` is now `async`
- `app/layout.tsx` — awaits `cookies()` for country resolution
- `components/public/PublicPageLayout.tsx` — awaits both `headers()` and `cookies()`

### 2. `createClient()` Async Conversion
~63 files across `app/`, `lib/`, `components/` updated from `createClient()` to `await createClient()`.

### 3. `params` / `searchParams` as `Promise<T>`
20+ page.tsx files converted:
```typescript
// Before
export default async function Page({ params }: { params: { id: string } }) {
  const { id } = params
}

// After
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
}
```

Files affected:
- `app/(app)/admin/revisao/[professionalId]/page.tsx`
- `app/(app)/agenda/page.tsx`
- `app/(app)/agendar/[id]/page.tsx`
- `app/(app)/avaliar/[bookingId]/page.tsx`
- `app/(app)/buscar-auth/page.tsx`
- `app/(app)/dashboard/page.tsx`
- `app/(app)/mensagens/page.tsx`
- `app/(app)/onboarding-profissional/page.tsx`
- `app/(app)/planos/page.tsx`
- `app/(app)/profissional/[id]/page.tsx`
- `app/(app)/sessao/[bookingId]/page.tsx`
- `app/(app)/solicitar/[id]/page.tsx`
- `app/(auth)/cadastro/page.tsx`
- `app/(auth)/completar-conta/page.tsx`
- `app/buscar/page.tsx`

### 4. Route Handler Context API
3 API route files updated to use `Promise<{...}>` for params:
- `app/api/professional/calendar/callback/[provider]/route.ts`
- `app/api/professional/calendar/connect/[provider]/route.ts`
- `app/api/professional/credentials/download/[credentialId]/route.ts`

### 5. Type Fixes for Async `createClient()`
`ReturnType<typeof createClient>` → `Awaited<ReturnType<typeof createClient>>` in:
- `lib/admin/audit-log.ts`
- `lib/booking/availability-checks.ts`
- `lib/booking/request-eligibility.ts`
- `lib/booking/request-helpers.ts`
- `lib/booking/slot-validation.ts`
- `lib/booking/transaction-operations.ts`
- `lib/actions/manage-booking.ts`
- `app/api/professional/credentials/upload/route.ts`
- `app/api/professional/onboarding/modal-context/route.ts`
- `app/api/professional/onboarding/save/route.ts`

### 6. `revalidateTag` API Change (Next.js 16)
`revalidateTag(tag)` now requires a second argument. Updated in:
- `lib/actions/admin.ts` (5 calls)
- `lib/actions/professional.ts` (3 calls)

Pattern: `revalidateTag('public-profiles')` → `revalidateTag('public-profiles', {})`

### 7. `request.geo` Removed from Middleware
`middleware.ts` updated to use only headers (`x-vercel-ip-country`, `cf-ipcountry`, `x-country-code`) for geo detection.

### 8. React 19 `RefObject` Type
`components/dashboard/onboarding-tracker/stages/terms-modal.tsx` updated from `React.RefObject<HTMLDivElement>` to `React.RefObject<HTMLDivElement | null>`.

## Validation Results

| Check | Status |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run build` | ✅ succeeds |
| `npm run test:unit` | ✅ 41/41 tests pass |

## Unblocks

- **PR #27** (`security-hardening-and-ssr-refactor`) — resolves Next.js 14 CVEs

## Note on Branch History

`nextjs-14-to-16-upgrade` was branched from `security-hardening-and-ssr-refactor` (not `main`), so it contains both the security/SSR refactors AND the framework upgrade. Merging this branch to `main` will effectively merge both PRs at once. This is intentional — the security work was blocked by the CVEs.

## Merge Readiness

```bash
# No merge conflicts detected
git merge-tree $(git merge-base main nextjs-14-to-16-upgrade) main nextjs-14-to-16-upgrade
# → clean merge
```

**Ready for merge to `main`.**

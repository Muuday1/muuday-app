# Journey Coverage Matrix

Last updated: 2026-04-24
Coverage baseline: Part 1..Part 5

| Journey Domain | Source Part(s) | Build Wave | Current Status |
| --- | --- | --- | --- |
| Auth role split and route guards | Part 2 | Wave 1-2 | Done (Wave 2 baseline) |
| Screen inventory by role (public/user/professional/admin) | Part 2, Part 4 | Wave 1-2 | Done |
| User onboarding | Part 2 | Wave 1-2 | Done |
| Professional onboarding and first go-live review | Part 1, Part 2, Part 4 | Wave 1-2 | Done (tracker modal + admin review flow operational) |
| Search and discovery | Part 1 | Wave 1 | Done |
| Profile trust and reviews | Part 1, Part 4 | Wave 1 and 4 | Done (backend + frontend; review response API ready) |
| Direct booking lifecycle | Part 2 | Wave 2 | Done |
| Request booking lifecycle | Part 2 | Wave 2 | Done |
| Recurring scheduling behavior | Part 2, Part 3 | Wave 2-3 | Done (backend complete; frontend basic) |
| One-off payment lifecycle | Part 3 | Wave 3 | Planned (prep skeleton only; no real-money execution) |
| Professional subscription billing | Part 3 | Wave 3 | Planned (Stripe products not yet created) |
| Refund/dispute/payout operations | Part 3, Part 4 | Wave 3-4 | Backend complete (dispute/case system ready; payouts blocked on Wave 3) |
| Notification and inbox lifecycle | Part 4 | Wave 4 | Done (in-app inbox at `/mensagens`, email dispatch active) |
| Admin case operations | Part 4 | Wave 4 | Done (review flow + case backend operational; admin UI at `/admin/casos`) |
| Session execution (provider-agnostic) | Part 2, Part 5 | Wave 2-3 | Done (Agora v1 with waiting room + game shipped) |
| Sensitive-category compliance journey | Part 1, Part 5 | Wave 4-5 | Planned |

## Backend-complete systems awaiting full frontend consumption

The following have working backend (migrations, APIs, RLS) but may need frontend polish or feature-flag enablement:

1. **Chat / Messaging** — Migration `054`, server actions, Realtime-ready. Feature flag `chatEnabled = false`.
2. **Push Notifications** — Migration `055`, API routes, sender module. VAPID keys need configuration.
3. **Client Records (CRM)** — Migration `056`, server actions. UI at `/prontuario` exists but may be basic.
4. **Dispute / Cases** — Migration `057`, server actions. Admin UI exists at `/admin/casos`.
5. **Multi-Service Booking** — Migration `058`, server actions. Feature flag `multiServiceEnabled = false`.

## Usage

1. Keep this matrix synchronized with `docs/project/project-status.md`.
2. Add explicit blockers and owners in execution tracking (Linear).
3. Do not mark any domain `Done` until acceptance criteria in `execution-plan.md` are met.

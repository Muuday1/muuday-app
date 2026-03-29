# Tool Options and Stack Gaps

Last updated: 2026-03-29

Purpose:
1. map open capabilities (currently generic in tech-stack docs) to concrete options,
2. suggest three tool names per capability,
3. highlight what may be missing for launch and scale.

Status definitions:
- `Current`: already in active stack
- `Open`: approved/planned capability with no final tool lock
- `Evaluate`: optional but important for risk reduction

## A) Open capabilities -> 3 tool options each

| Capability (Open) | Why it matters | Option 1 | Option 2 | Option 3 | Recommendation for Muuday now |
| --- | --- | --- | --- | --- | --- |
| Session provider runtime | Session reliability, no-show evidence, future in-call controls | Daily | Twilio Video | Agora | Keep provider-agnostic abstraction and run a short Daily vs Twilio comparison before lock. |
| Case queue subsystem | Disputes, no-shows, trust ops, exception handling | In-app queue (Supabase + Next.js) | Linear (ops triage workflow) | Zendesk | Start with in-app queue as source of truth; mirror high-level ops tasks into Linear. |
| Notification orchestration | Reliable reminders and event fan-out | Inngest | Trigger.dev | Upstash QStash | Use Inngest or Trigger.dev for durable event jobs; keep provider adapters for Resend/WhatsApp/SMS. |
| Internal ledger implementation | Financial auditability and reconciliation | Postgres double-entry (custom) | Medici (Node ledger library) | TigerBeetle | MVP: Postgres double-entry in existing DB for lowest complexity and full control. |
| Compliance disclaimer management | Versioned legal text, acceptance snapshots | In-app versioned tables | Termly | iubenda | MVP: in-app versioned text and acceptance snapshots; legal tooling can come later. |
| Tax automation path (phase 2+) | Cross-border tax handling at scale | Stripe Tax | Quaderno | Avalara | Defer deep automation until corridor + legal model are locked; document triggers for adoption. |
| Feature flags / controlled rollout | Safer incremental rollout by segment | PostHog Feature Flags | GrowthBook | Unleash | Use PostHog flags first (already in stack) to avoid extra complexity. |
| Search scaling (future) | Better relevance and performance at scale | Postgres FTS + trigram | Typesense | Algolia | Keep Postgres-first until clear scale/relevance pressure appears. |

## B) What may be missing in tech stack (consider now)

1. Dedicated background job orchestration standard
- Current state: cron + app flows.
- Risk: retries/idempotent async processes become fragmented.
- Suggestion: choose one job orchestrator (Inngest or Trigger.dev).

2. Secrets governance for team scale
- Current state: envs across local/Vercel/GitHub.
- Risk: secret sprawl when more teammates join.
- Suggestion: adopt 1Password/Doppler workflow or strict env governance doc.

3. Contract testing for integrations
- Current state: e2e and runtime checks.
- Risk: webhook/event payload drift.
- Suggestion: add contract tests for Stripe, Resend, Make/HubSpot events.

4. Cost guardrails and budget alerts
- Current state: free-first setup.
- Risk: accidental paid-tier spikes.
- Suggestion: define monthly caps and alert rules per provider.

5. Data governance and lifecycle policy
- Current state: policy documented in `docs/engineering/data-governance-and-lifecycle.md`.
- Remaining gap: implement automated cleanup/anonymization jobs and legal-hold controls.
- Suggestion: execute rollout checklist from the policy doc in Wave 4 ops hardening.

## C) Minimal low-cost stack additions worth considering

1. Inngest (or Trigger.dev) for durable background workflows.
2. PostHog feature flags for controlled release.
3. Lightweight secret governance (1Password Teams or equivalent) before adding more collaborators.

## D) Decision trigger rules (when to upgrade)

1. Move from Postgres-first search to dedicated search engine only when:
- query latency/relevance targets fail consistently.

2. Move from in-app case queue only to external support suite when:
- case volume or multi-channel support exceeds admin throughput.

3. Move from basic legal text versioning to specialized compliance tooling when:
- regulated categories or geographies require legal workflow automation.

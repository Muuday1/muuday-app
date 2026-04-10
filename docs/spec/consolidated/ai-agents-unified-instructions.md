# Muuday Unified AI-Agnostic Build Instructions

Last updated: 2026-03-30

This protocol replaces any tool-specific instruction split.  
It is designed for any coding/design/system AI assistant.

## Mission

Implement Muuday according to `docs/spec/source-of-truth/part1..part5` with strict consistency across product rules, architecture, and operations.

## Global rules

1. Treat source-of-truth files as canonical.
2. Never keep conflicting statements; update upstream rules when new decisions are made.
3. Keep behavior deterministic in booking, payment, payout, case, review, and session lifecycles.
4. Prioritize auditability, traceability, and operational clarity over UI novelty.
5. Prefer cost-effective, low-complexity, maintainable solutions.

## Required implementation posture

1. Work domain-first, not file-first.
2. For each change, define:
- product rule implemented
- state machine impact
- permission/role impact
- data model impact
- timeline/audit impact
- failure/recovery behavior
3. Keep role boundaries explicit:
- public visitor
- user/customer
- professional
- admin
- system automation

## Session and provider abstraction rules

1. Build provider-agnostic session abstraction first.
2. Do not hardwire Agora event names directly into core booking logic.
3. Implement booking/session boundary as clean interfaces.
4. Provider decision is locked to Agora in current roadmap:
- `SessionProvider` interface
- `AgoraProvider` implementation stub
- optional `ProviderFallback` adapter only if roadmap reopens provider decision.
5. Keep core booking/payments logic independent from provider adapters.

## What to use AI assistance for

Use the AI assistant to help with:

1. system design
2. state machine refinement
3. webhook modeling
4. edge-case mapping
5. sequence diagrams
6. session lifecycle diagrams
7. no-show evidence matrix
8. waiting-room logic
9. provider abstraction design
10. failure handling flows
11. provider adapter implementation
12. session UI states
13. event handling
14. component-level work
15. booking/session timeline rendering
16. permission and error states
17. UI flow variants for session join states
18. admin/support flow generation
19. alternative provider decision trees

## Safety and quality rules

1. Use explicit typed states and transition guards.
2. Keep state logs and timeline events first-class.
3. Keep admin observability for every critical action.
4. Make financial actions idempotent and replay-safe.
5. Keep policy snapshots at booking/payment time.

## Delivery standard per task

1. Update implementation.
2. Update tests.
3. Update docs:
- project status
- relevant journey docs
- handover current-state/next-steps/session-log
- spec docs when rules are changed
4. Mark unresolved decisions as `decision pending / validate later`.

## Definition of done

A task is done only when:

1. product behavior matches source-of-truth rules
2. state transitions and permissions are safe
3. test coverage includes critical and edge paths
4. observability/auditability is clear
5. docs reflect reality

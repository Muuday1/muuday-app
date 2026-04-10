# User Journey: Session Execution

Last updated: 2026-03-29

## Goal

Deliver reliable session join and evidence lifecycle with provider-agnostic architecture and policy-safe operations.

## Actors

1. User
2. Professional
3. Session provider adapter
4. Admin operations

## Canonical scope

1. Session join availability window.
2. Waiting room/lobby behavior.
3. Join/leave event capture for evidence.
4. No-show threshold handling.
5. Session failure handling and operational outcomes.
6. Timeline/analytics integration.

## Key non-negotiable rules

1. Booking and policy logic must not depend on one provider implementation.
2. Session events must be logged for dispute and trust operations.
3. Join state must be explicit and timezone-safe.
4. Platform-failure cases must have dedicated operational handling.

## Current implementation status

`Planned`

- Provider locked to Agora for current roadmap execution.
- Session-provider abstraction still pending full implementation.

## Gaps

1. Agora adapter hardening and event mapping coverage.
2. Session-state to case/timeline integration parity.
3. Provider abstraction fallback hooks (only if provider decision is reopened).

## Next steps

1. Build provider-agnostic session abstraction contract.
2. Consolidate Agora provider adapter and observability outcomes.
3. Integrate session event logs into booking timeline and dispute evidence flows.

## Related docs

- [Open Validations](../../spec/consolidated/open-validations.md)
- [Execution Plan](../../spec/consolidated/execution-plan.md)
- [Session Management Journey](./session-management.md)

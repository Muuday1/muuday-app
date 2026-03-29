# Project Overview

Last updated: 2026-03-29

## What Muuday is

Muuday is a marketplace that connects Brazilians living abroad with Brazilian professionals (mental health, legal, accounting, education, wellness, career, and related services).

## Product goals

1. Reliable international booking with timezone safety.
2. Trust layer for quality professionals and transparent reviews.
3. Operational control for moderation and incident response.
4. Scalable growth loops with low infrastructure cost.

## Current phase

`In progress` - Booking reliability and operations hardening.

The product already supports account flows, professional profiles, search, booking, agenda actions, and admin moderation. The current focus is production hardening, observability, and integration maturity.

## Current priorities

1. Stabilize booking lifecycle in production (state transitions, reminders, timeout cancellations).
2. Keep deployment and monitoring reliable (`booking-crons`, endpoint health checks).
3. Consolidate documentation and governance as a single source of truth.
4. Prepare integration layer for growth/ops tooling (Make + HubSpot) without coupling core product logic.

## Workstreams

1. Booking and scheduling engine.
2. Trust and moderation.
3. Ops reliability and runbooks.
4. Integrations and lifecycle automation.

## Where to go next

- [Project Status](./project-status.md)
- [Roadmap](./roadmap.md)
- [Execution Alignment (Linear)](./execution-alignment.md)
- [Architecture Overview](../architecture/overview.md)

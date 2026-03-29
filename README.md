# Muuday App

Muuday is a marketplace connecting Brazilians living abroad with Brazilian professionals.

## Core stack

- Frontend: Next.js 14 (App Router)
- Backend/Auth/DB: Supabase
- Styling: Tailwind CSS
- Deploy: Vercel

## Local setup

1. Install dependencies

```bash
npm install
```

2. Create env file

```bash
cp .env.local.example .env.local
```

3. Run app

```bash
npm run dev
```

## Quality checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Documentation

Documentation source of truth is in [`docs/README.md`](./docs/README.md).
Fast takeover instructions are in [`docs/handover/`](./docs/handover/).

Main sections:

- Project status and roadmap
- Product journeys
- Architecture and ADRs
- Engineering setup/runbooks
- Integrations and rollout status

## Important notes

1. Use migration files in `db/sql/migrations` as the authoritative DB evolution source.
2. Keep app URL/domain changes env-driven (`APP_BASE_URL`, `NEXT_PUBLIC_APP_URL`, `APP_PRIMARY_DOMAIN`).
3. Update docs together with meaningful code/architecture changes.

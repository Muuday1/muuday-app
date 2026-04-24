# Code Review Checklist

> Checklist obrigatório para todo PR em `muuday-app`. Revisor e autor devem confirmar cada item antes do merge.

## Segurança & Compliance

- [ ] **RLS first**: `createAdminClient()` nunca é fallback em rotas/APIs que atendem usuários/profissionais. RLS é a única fonte de verdade.
- [ ] **Env validation**: novas variáveis de ambiente são adicionadas em `lib/config/env.ts`.
- [ ] **Rate limiting**: rotas/API públicas têm `rateLimit()` aplicado.
- [ ] **CSRF**: rotas que mutam estado validam `Origin`/`Referer` via `lib/http/csrf.ts`.
- [ ] **No secrets in code**: nenhuma chave, token ou credencial hardcoded.

## Arquitetura

- [ ] **No new Server Actions**: toda nova feature deve ser construída como API Route (`/api/v1/*` preferencialmente). Server Actions existentes podem ser mantidos, mas não criados.
- [ ] **Dual-mode auth ready**: rotas `/api/v1/*` devem usar `createApiClient()` (cookies + Bearer JWT) quando autenticação é necessária.
- [ ] **Market isolation**: queries que leem `professionals` filtram por `market_code` quando aplicável.
- [ ] **Feature flags**: mudanças arriscadas ou de largo impacto usam `lib/analytics/feature-flags.ts`.

## Qualidade

- [ ] **TypeScript strict**: zero erros de `tsc --noEmit`. Nenhum `any` sem justificativa documentada.
- [ ] **Testes**: novas rotas/APIs têm pelo menos um teste unitário ou E2E.
- [ ] **Analytics**: novos fluxos user-facing disparam eventos PostHog (`lib/analytics/server-events.ts` ou `lib/analytics/posthog-client.ts`).
- [ ] **Migrations**: migrations DB são numeradas sequencialmente em `db/sql/migrations/`.

## Mobile / International

- [ ] **API-first**: mobile consome as mesmas APIs que o web. Nenhuma lógica duplicada.
- [ ] **i18n ready**: novas strings de UI usam o sistema de mensagens (quando disponível), nunca hardcoded em PT-BR apenas.

---

**Data de vigor:** 2026-04-23  
**Versão:** v1.0


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.

# 08 — Master Backlog: Tudo no Mesmo Lugar

> **Documento mestre.** Une o trabalho de **internacionalização** (do `00-master-plan.md`) com o de **preparação do app mobile** em uma única lista de sprints sequenciais.
>
> **Regra:** Nada vive em silo. Cada tarefa é marcada com suas dependências e impacto cruzado.

---

## Como Ler Este Documento

| Tag | Significado |
|-----|-------------|
| `🌍 INT` | Tarefa da internacionalização |
| `📱 APP` | Tarefa de preparação para o app mobile |
| `🔀 BOTH` | Tarefa que serve ambos (prioridade máxima) |
| `⛔ BLOCKS` | Esta tarefa bloqueia outra(s) |
| `✅ DEPS` | Pré-requisitos que devem estar prontos |
| `⚡ SPRINT N` | Sprint ao qual a tarefa foi alocada |

---

## Visão Unificada: Por Que Tudo Junto?

As duas iniciativas (internacional + mobile) compartilham **as mesmas fundações**:

```
┌─────────────────────────────────────────────────────────────┐
│                    FUNDAÇÕES COMUNS                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ API-first    │  │ ICU messages │  │ Market isolation │  │
│  │ (/api/v1/*)  │  │ (JSON i18n)  │  │ (market_code)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│         ▲                 ▲                  ▲              │
│         │                 │                  │              │
│    ┌────┴────┐       ┌────┴────┐       ┌────┴────┐         │
│    │ Mobile  │       │   INT   │       │   INT   │         │
│    │  App    │       │   EXP   │       │   EXP   │         │
│    └─────────┘       └─────────┘       └─────────┘         │
└─────────────────────────────────────────────────────────────┘
```

**Regra de ouro:** Se uma tarefa serve mobile + internacional, ela vai **primeiro** no backlog.

---

## SPRINT 1 — Fundações (Semanas 1–2)
**Capacidade:** 1 senior backend + 1 frontend web
**Meta:** Saímos com jurisdição corrigida, DB preparado, strings extraídas, e política "No new Server Actions" em vigor.

### Backend / Dev

| # | Tarefa | Tags | Estimativa | Dono | Status |
|---|--------|------|------------|------|--------|
| 1.1 | **Corrigir jurisdição legal para UK** — Atualizar termos, privacidade, cookie policy (`lib/legal/*`). Remover foro SP. Adicionar "governed by laws of England and Wales, courts of London". | `🌍 INT` `⛔ BLOCKS` todos os cadastros futuros | 2 dias | Founder + dev | 🔲 |
| 1.2 | **Preparar banco de dados** — Adicionar `professionals.market_code`, `profiles.language`, `categories.name_es`, `professionals.session_price` + currency. Backfill `market_code = 'BR'`. | `🔀 BOTH` `⛔ BLOCKS` busca isolada + app | 1 dia | Backend | 🔲 |
| 1.3 | **Corrigir busca para isolar por mercado** — Adicionar `p_market` na RPC `search_public_professionals_pgtrgm`. Filtrar por `market_code`. Atualizar `app/buscar/page.tsx`. | `🌍 INT` `🔀 BOTH` | 1 dia | Backend | 🔲 |
| 1.4 | **Set up `supabase gen types`** — Gerar `types/supabase.ts` via CLI. Documentar comando no README. Garantir que CI falha se types estiverem desatualizados. | `📱 APP` `🔀 BOTH` | 1 dia | Backend | 🔲 |
| 1.5 | **Criar `lib/supabase/api-client.ts`** — Dual-mode auth: cookies + bearer token. Testar localmente com `curl -H "Authorization: Bearer ..."`. | `📱 APP` `⛔ BLOCKS` toda API v1 | 2 dias | Backend | 🔲 |
| 1.6 | **Adicionar `MOBILE_API_KEY` env + validação** — Criar chave. Adicionar middleware de validação em rotas `/api/v1/*`. | `📱 APP` | 0.5 dia | Backend | 🔲 |
| 1.7 | **Simplificar Stripe para UK único** — Remover dual-region BR/UK no processamento de clientes. `lib/stripe/client.ts` só usa UK para pagamentos de clientes. | `🌍 INT` | 1 dia | Backend | 🔲 |
| 1.8 | **Configurar PostHog** — Instalar SDK. Eventos: `market_detected`, `booking_started`, `booking_completed`. Criar estrutura de feature flags. | `🔀 BOTH` | 1 dia | Backend/Frontend | 🔲 |

### Frontend / Web

| # | Tarefa | Tags | Estimativa | Dono | Status |
|---|--------|------|------------|------|--------|
| 1.9 | **Componentizar landing page** — Extrair `app/page.tsx` para `components/landing/LandingPage.tsx` + `lib/landing/br-data.ts`. Zero mudança visual. | `🌍 INT` `⛔ BLOCKS` landing MX/PT | 3 dias | Frontend | 🔲 |
| 1.10 | **Extrair strings de UI para JSON** — Criar `lib/i18n/messages/pt-BR.json`. Extrair strings de: landing, busca, signup, header, footer. Usar helper `t(key)` simples. | `🔀 BOTH` `⛔ BLOCKS` next-intl + app mobile | 5 dias | Frontend | 🔲 |
| 1.11 | **Política "No new Server Actions"** — Adicionar regra no code review checklist. Documentar no README da engenharia. | `📱 APP` | 0.5 dia | Tech Lead | 🔲 |

### Ops / Legal / Outros

| # | Tarefa | Tags | Estimativa | Dono | Status |
|---|--------|------|------------|------|--------|
| 1.12 | **Revisão jurídica UK** — Founder valida os termos atualizados com contador/advogado UK. | `🌍 INT` | contínuo | Founder | 🔲 |
| 1.13 | **Decidir estratégia de push nativo** — Expo Push vs OneSignal vs FCM+APNS. Documentar decisão. | `📱 APP` | 0.5 dia | Tech Lead | 🔲 |

**Sprint 1 — Entregáveis:**
- [ ] Termos com jurisdição UK em produção
- [ ] DB com `market_code`, `language`, `name_es`
- [ ] Busca isolada por mercado funcionando
- [ ] Supabase types gerados e no CI
- [ ] API client dual-mode funcional (testado com curl)
- [ ] Landing page componentizada
- [ ] 60%+ das strings públicas extraídas para JSON
- [ ] PostHog configurado com eventos básicos

---

## SPRINT 2 — API v1 + AI OCR (Semanas 3–4)
**Capacidade:** 1 senior backend + 1 frontend web
**Meta:** Primeiros endpoints `/api/v1/*` em produção. AI OCR para KYC funcionando. Sanity CMS configurado.

### Backend / Dev

| # | Tarefa | Tags | Estimativa | Dono | Status |
|---|--------|------|------------|------|--------|
| 2.1 | **Extrair booking service** — Mover lógica de `lib/actions/booking.ts` (824 linhas) para `lib/services/booking/create-booking.ts`. Criar `POST /api/v1/bookings`. | `📱 APP` `🔀 BOTH` `⛔ BLOCKS` app mobile | 4 dias | Backend | 🔲 |
| 2.2 | **Extrair chat service** — Mover `lib/actions/chat.ts` para `lib/services/chat/*.ts`. Criar `POST/GET /api/v1/conversations/{id}/messages`. | `📱 APP` `🔀 BOTH` | 2 dias | Backend | 🔲 |
| 2.3 | **Extrair notification service** — Mover `lib/actions/notifications.ts` para `lib/services/notifications/*.ts`. Criar `GET /api/v1/notifications`. | `📱 APP` `🔀 BOTH` | 1 dia | Backend | 🔲 |
| 2.4 | **Criar `GET /api/v1/users/me`** — Retorna perfil autenticado. Auth via bearer token. | `📱 APP` | 0.5 dia | Backend | 🔲 |
| 2.5 | **Criar `GET /api/v1/professionals/search`** — Cursor-based pagination. Query params: `market`, `category`, `query`, `cursor`, `limit`, `fields`. | `📱 APP` `🌍 INT` `🔀 BOTH` | 2 dias | Backend | 🔲 |
| 2.6 | **Implementar AI OCR para KYC** — Escolher provedor (AWS Textract/Google Document AI). Pipeline: upload → OCR → extração → score. Thresholds: >80% auto-aprova, 50-80% fila humana, <50% rejeição. | `🌍 INT` `⛔ BLOCKS` scaling profissionais | 3 dias | Backend | 🔲 |
| 2.7 | **Configurar Sanity CMS** — Criar projeto. Schemas: `landingBlock`, `guide`, `blogPost`, `legalDocument`, `emailTemplate`, `testimonial`. | `🌍 INT` `🔀 BOTH` | 3 dias | Backend | 🔲 |
| 2.8 | **Configurar Upstash Redis + ISR** — `revalidate` na landing (1h), guias (24h), perfil (1h). Cache: taxonomia, configs de mercado, taxas de câmbio. | `🌍 INT` | 1 dia | Backend | 🔲 |

### Frontend / Web

| # | Tarefa | Tags | Estimativa | Dono | Status |
|---|--------|------|------------|------|--------|
| 2.9 | **Migrar web para chamar `/api/v1/*`** — Atualizar componentes de booking, chat, notificações para usar `fetch` em vez de Server Actions. | `📱 APP` | 2 dias | Frontend | 🔲 |
| 2.10 | **Admin dashboard: mostrar dados OCR pré-preenchidos** — Adaptar review de profissionais para exibir score OCR e campos extraídos. | `🌍 INT` | 2 dias | Frontend | 🔲 |
| 2.11 | **Migrar guias para Sanity** — Mover `lib/guides-data.ts` para CMS. Landing page consumir do Sanity. | `🌍 INT` | 2 dias | Frontend | 🔲 |

### Ops / Outros

| # | Tarefa | Tags | Estimativa | Dono | Status |
|---|--------|------|------------|------|--------|
| 2.12 | **Registrar domínios de proteção** — `muuday.mx`, `muuday.pt`. | `🌍 INT` | 0.5 dia | Founder | 🔲 |
| 2.13 | **Setup Trolley (testes)** — Criar conta, testar API de recipient + payout. | `🌍 INT` | 2 dias | Backend | 🔲 |
| 2.14 | **Setup PayPal Business UK** — Criar/configurar conta. Testar payout para BR e MX. | `🌍 INT` | 1 dia | Founder | 🔲 |

**Sprint 2 — Entregáveis:**
- [ ] `POST /api/v1/bookings` funcional com bearer token
- [ ] `POST/GET /api/v1/conversations/{id}/messages` funcional
- [ ] `GET /api/v1/notifications` funcional
- [ ] AI OCR pipeline funcionando em staging
- [ ] Sanity CMS com schemas criados e guias migradas
- [ ] Upstash Redis + ISR ativo
- [ ] Web não usa mais Server Actions para booking/chat/notifications

---

## SPRINT 3 — Profissional APIs + Web Completo (Semanas 5–6)
**Capacidade:** 1 senior backend + 1 frontend web
**Meta:** Todas as APIs core do app mobile estão prontas. Web 100% migrado para API-first.

### Backend / Dev

| # | Tarefa | Tags | Estimativa | Dono | Status |
|---|--------|------|------------|------|--------|
| 3.1 | **Extrair profile/professional services** — `lib/actions/user-profile.ts`, `lib/actions/professional.ts`, `lib/actions/professional-services.ts` → `lib/services/profiles/*.ts`, `lib/services/professionals/*.ts`. | `📱 APP` `🔀 BOTH` | 3 dias | Backend | 🔲 |
| 3.2 | **Criar `GET/PATCH /api/v1/users/me`** | `📱 APP` | 0.5 dia | Backend | 🔲 |
| 3.3 | **Criar `GET/PATCH /api/v1/professionals/me`** | `📱 APP` | 0.5 dia | Backend | 🔲 |
| 3.4 | **Criar `POST/DELETE /api/v1/professionals/me/services`** | `📱 APP` | 1 dia | Backend | 🔲 |
| 3.5 | **Criar `POST /api/v1/professionals/me/availability/exceptions`** | `📱 APP` | 1 dia | Backend | 🔲 |
| 3.6 | **Migrar Agora token → `/api/v1/sessions/{id}/token`** | `📱 APP` | 0.5 dia | Backend | 🔲 |
| 3.7 | **Migrar session status → `/api/v1/sessions/{id}/status`** | `📱 APP` | 0.5 dia | Backend | 🔲 |
| 3.8 | **Extrair review, favorites, disputes, client-records** | `📱 APP` | 2 dias | Backend | 🔲 |
| 3.9 | **Adicionar `Cache-Control` + `ETag` em list endpoints** | `📱 APP` | 0.5 dia | Backend | 🔲 |
| 3.10 | **OpenAPI schema + contract tests** — Documentar `/api/v1/*` com Zod-to-OpenAPI. Testes de contrato no CI. | `📱 APP` | 1 dia | Backend | 🔲 |

### Frontend / Web

| # | Tarefa | Tags | Estimativa | Dono | Status |
|---|--------|------|------------|------|--------|
| 3.11 | **Finalizar extração de strings para JSON** — 100% das strings públicas e da área logada em `pt-BR.json`. | `🔀 BOTH` | 2 dias | Frontend | 🔲 |
| 3.12 | **Migrar imagens para Sanity CDN** — Avatares e fotos de profissionais. URL builder com transformações (`?w=200&h=200`). | `🔀 BOTH` | 2 dias | Frontend | 🔲 |
| 3.13 | **Remover Server Actions deprecados** — Deletar `lib/actions/booking.ts`, `chat.ts`, `notifications.ts` (ou manter como proxies mínimos). | `📱 APP` | 1 dia | Frontend | 🔲 |

### Ops / Outros

| # | Tarefa | Tags | Estimativa | Dono | Status |
|---|--------|------|------------|------|--------|
| 3.14 | **Configurar Metabase** — Subir instância. Conectar Supabase (read-only). Dashboards: GMV, LTV, CAC. | `🌍 INT` | 1 dia | Backend | 🔲 |
| 3.15 | **Configurar Intercom + DeepL** — Auto-translate. Tags por idioma. Templates de resposta. | `🌍 INT` | 1 dia | Ops | 🔲 |
| 3.16 | **Documentação legal: assinar DPAs** — Supabase, Stripe, Resend, Vercel, Intercom, Sanity. | `🌍 INT` | 1 dia | Founder | 🔲 |

**Sprint 3 — Entregáveis:**
- [ ] Todas as APIs `/api/v1/*` core em produção (booking, chat, notifications, profile, professional, search, sessions)
- [ ] Web 100% API-first (zero Server Actions para lógica de negócio)
- [ ] 100% das strings extraídas para JSON
- [ ] Imagens servidas via Sanity CDN com resize
- [ ] OpenAPI docs + contract tests no CI
- [ ] Metabase rodando com dashboards básicos

---

## SPRINT 4 — Mobile Hardening + App Início (Semanas 7–8)
**Capacidade:** 1 backend (0.5 FTE) + 2 mobile engineers
**Meta:** Backend pronto para mobile. App iniciado com auth, navigation, e design tokens.
**Nota:** A partir daqui, o backend entra em modo suporte (0.5 FTE). O foco principal é o app.

### Backend / Dev (Suporte)

| # | Tarefa | Tags | Estimativa | Dono | Status |
|---|--------|------|------------|------|--------|
| 4.1 | **Migrar `push_subscriptions` para native tokens** — SQL migration. Adicionar `platform`, `push_token`, `device_id`. Criar unified sender (Expo Push Service). | `📱 APP` | 2 dias | Backend | 🔲 |
| 4.2 | **Atualizar chat/booking reminders para unified push** — Chamar `sendUnifiedPush()` em vez de `sendWebPush()` apenas. | `📱 APP` | 0.5 dia | Backend | 🔲 |
| 4.3 | **Configurar Supabase Auth com iOS/Android OAuth client IDs** | `📱 APP` | 0.5 dia | Backend | 🔲 |
| 4.4 | **Criar `POST /api/v1/push/subscribe`** — Suporta web (VAPID) + native (Expo/FCM). | `📱 APP` | 0.5 dia | Backend | 🔲 |
| 4.5 | **Load test em endpoints críticos** — `/api/v1/bookings`, `/api/v1/professionals/search`. | `📱 APP` | 0.5 dia | Backend | 🔲 |

### Mobile

| # | Tarefa | Tags | Estimativa | Dono | Status |
|---|--------|------|------------|------|--------|
| 4.6 | **Inicializar projeto Expo** — TypeScript, Expo Router, NativeWind, TanStack Query. | `📱 APP` | 1 dia | Mobile | 🔲 |
| 4.7 | **Design tokens + theme** — Cores, spacing, typography compartilhados com web. | `📱 APP` | 1 dia | Mobile | 🔲 |
| 4.8 | **Integrar Supabase Auth** — Password login. `expo-secure-store` para tokens. | `📱 APP` | 2 dias | Mobile | 🔲 |
| 4.9 | **Google native OAuth** — `expo-auth-session` ou `expo-google-sign-in`. `signInWithIdToken`. | `📱 APP` | 2 dias | Mobile | 🔲 |
| 4.10 | **Deep links** — Configurar `muuday://` scheme. Testar em iOS e Android. | `📱 APP` | 1 dia | Mobile | 🔲 |
| 4.11 | **Navigation + tab bars** — Cliente (Explore, Bookings, Messages, Profile) e Profissional (Dashboard, Calendar, Messages, Profile). | `📱 APP` | 2 dias | Mobile | 🔲 |
| 4.12 | **Biometric login** — Face ID / Touch ID / fingerprint após primeiro login. | `📱 APP` | 1 dia | Mobile | 🔲 |

### Frontend / Web

| # | Tarefa | Tags | Estimativa | Dono | Status |
|---|--------|------|------------|------|--------|
| 4.13 | **Web push notification UI** — Banner de consentimento, UI de preferências. | `🌍 INT` | 2 dias | Frontend | 🔲 |
| 4.14 | **Adicionar `next-intl` no web** — Substituir helper `t(key)` pelo framework. Routing ainda não muda (`/br/` vem depois). | `🔀 BOTH` | 2 dias | Frontend | 🔲 |

**Sprint 4 — Entregáveis:**
- [ ] Push notifications unificado (web + native) funcionando
- [ ] App Expo inicializado com auth, navigation, e theme
- [ ] Login com senha e Google funcionando no app
- [ ] Deep links configurados
- [ ] `next-intl` instalado no web

---

## SPRINT 5 — App Core + Conteúdo MX (Semanas 9–10)
**Capacidade:** 2 mobile engineers + 1 redator/copywriter (freelancer mexicano)
**Meta:** App com fluxo core do cliente funcionando. Conteúdo mexicano sendo produzido.

### Mobile

| # | Tarefa | Tags | Estimativa | Dono | Status |
|---|--------|------|------------|------|--------|
| 5.1 | **Home / Dashboard** — Resumo de bookings, próximas sessões, notificações. | `📱 APP` | 2 dias | Mobile | 🔲 |
| 5.2 | **Search professionals** — Consumir `/api/v1/professionals/search`. Infinite scroll. Filtros (categoria, preço). | `📱 APP` | 3 dias | Mobile | 🔲 |
| 5.3 | **Professional detail** — Perfil, reviews, disponibilidade, botão "Agendar". | `📱 APP` | 2 dias | Mobile | 🔲 |
| 5.4 | **Booking flow (one-off)** — Selecionar horário, confirmar, pagamento (Stripe PaymentSheet webview). | `📱 APP` | 3 dias | Mobile | 🔲 |
| 5.5 | **My bookings list** — Estados: confirmado, pendente, cancelado, realizado. | `📱 APP` | 2 dias | Mobile | 🔲 |
| 5.6 | **Push token registration** — Enviar Expo push token para `POST /api/v1/push/subscribe`. | `📱 APP` | 0.5 dia | Mobile | 🔲 |

### Conteúdo / Marketing (Paralelo)

| # | Tarefa | Tags | Estimativa | Dono | Status |
|---|--------|------|------------|------|--------|
| 5.7 | **Conteúdo para México (redação)** — 10-15 guias (CURP, SAT, IMSS, Afores). Landing page em espanhol. FAQ. 5-10 blog posts. | `🌍 INT` | 2-4 semanas | Copywriter MX | 🔲 |
| 5.8 | **Design de landing page MX** — Hero, assets gráficos, adaptação de cores. | `🌍 INT` | 1 semana | Designer | 🔲 |

### Backend (Suporte)

| # | Tarefa | Tags | Estimativa | Dono | Status |
|---|--------|------|------------|------|--------|
| 5.9 | **Bug fixes e ajustes na API v1** — Resolver issues encontradas pelo mobile team. | `📱 APP` | contínuo | Backend (0.5) | 🔲 |

**Sprint 5 — Entregáveis:**
- [ ] App: cliente pode buscar, ver perfil, e agendar
- [ ] App: lista de bookings funcionando
- [ ] App: push notifications recebidas
- [ ] 50%+ do conteúdo mexicano escrito
- [ ] Design da landing MX pronto

---

## SPRINT 6 — App Profissional + Preparação MX (Semanas 11–12)
**Capacidade:** 2 mobile engineers + 1 frontend web
**Meta:** App com fluxo do profissional. Web pronto para receber locale routing.

### Mobile

| # | Tarefa | Tags | Estimativa | Dono | Status |
|---|--------|------|------------|------|--------|
| 6.1 | **Professional dashboard** — Próximas sessões, estatísticas, ações pendentes. | `📱 APP` | 2 dias | Mobile | 🔲 |
| 6.2 | **Calendar / availability** — Visualizar e editar disponibilidade. Bloquear exceções. | `📱 APP` | 3 dias | Mobile | 🔲 |
| 6.3 | **Client list** — Clientes atuais e histórico. | `📱 APP` | 1 dia | Mobile | 🔲 |
| 6.4 | **Booking confirmation / manual confirmation** — Aceitar/rejeitar bookings pendentes. | `📱 APP` | 1 dia | Mobile | 🔲 |
| 6.5 | **Video session (Agora)** — Integrar Agora React Native SDK. Join window. Token via API. | `📱 APP` | 3 dias | Mobile | 🔲 |
| 6.6 | **Chat** — Lista de conversas. Thread de mensagens. Realtime (Supabase). | `📱 APP` | 3 dias | Mobile | 🔲 |
| 6.7 | **Profile editing** — Nome, avatar (camera/galeria), bio, preço. | `📱 APP` | 2 dias | Mobile | 🔲 |

### Frontend / Web

| # | Tarefa | Tags | Estimativa | Dono | Status |
|---|--------|------|------------|------|--------|
| 6.8 | **Locale routing (`/br/`, `/mx/`)** — Configurar `next-intl` com subdiretórios. Middleware atualizado. | `🌍 INT` | 2 dias | Frontend | 🔲 |
| 6.9 | **Landing page mexicana** — `app/(markets)/mx/page.tsx` com conteúdo do Sanity. | `🌍 INT` | 2 dias | Frontend | 🔲 |
| 6.10 | **Busca isolada para México** — `app/(markets)/mx/buscar/` usando `p_market = 'MX'`. | `🌍 INT` | 1 dia | Frontend | 🔲 |

### Ops / Outros

| # | Tarefa | Tags | Estimativa | Dono | Status |
|---|--------|------|------------|------|--------|
| 6.11 | **Pre-cadastro de profissionais mexicanos** — Landing de lista de espera. Recrutar 15-20 profissionais. | `🌍 INT` | contínuo | Founder | 🔲 |
| 6.12 | **Documentação legal para México** — Termos de uso e privacidade em espanhol (jurisdição UK). | `🌍 INT` | 2-3 semanas | Advogado MX | 🔲 |

**Sprint 6 — Entregáveis:**
- [ ] App: profissional pode gerenciar agenda e confirmar bookings
- [ ] App: videochamada Agora funcionando
- [ ] App: chat em tempo real
- [ ] Web: locale routing `/br/` e `/mx/` funcionando
- [ ] Landing page mexicana no ar (pode estar em "em breve" mode)

---

## PÓS-SPRINT 6 — O Que Vem Depois

### Sprints 7–8: App Polish + Beta
- App: onboarding profissional via WebView, notificações push, offline indicator, biometria
- Beta: TestFlight (iOS) + Play Console Internal (Android)
- Web: guias mexicanas, emails em espanhol, Stripe Checkout em MXN

### Sprints 9–10: Lançamento México
- Gatilhos: 15-20 profissionais mexicanos aprovados, conteúdo 100% pronto, termos revisados
- Soft launch → Big bang
- App: lançamento nas lojas (se app estiver pronto; senão, web-first)

### Sprints 11+: App Store + Escalas
- App: submissão App Store + Play Store
- Web: Portugal (`/pt/`)
- App: v2 features (screen sharing, widgets, etc.)

---

## Mapa de Dependências Críticas

```
Sprint 1
  ├─ 1.1 Jurisdição UK ──→ ⛔ BLOCKS todos os cadastros
  ├─ 1.2 DB market_code ──→ ⛔ BLOCKS 1.5 (busca), toda API v1
  ├─ 1.4 Supabase types ──→ ⛔ BLOCKS qualquer query nova
  └─ 1.5 API client dual-mode ──→ ⛔ BLOCKS toda API v1

Sprint 2
  ├─ 2.1 Booking service ──→ ⛔ BLOCKS app mobile (booking)
  ├─ 2.2 Chat service ──→ ⛔ BLOCKS app mobile (chat)
  ├─ 2.6 AI OCR ──→ ⛔ BLOCKS scaling de profissionais
  └─ 2.7 Sanity CMS ──→ ⛔ BLOCKS conteúdo MX

Sprint 3
  ├─ Todas as APIs v1 ──→ ⛔ BLOCKS app mobile completo
  └─ 3.11 Strings 100% JSON ──→ ⛔ BLOCKS next-intl + app mobile i18n

Sprint 4
  ├─ 4.1 Push native ──→ ⛔ BLOCKS notificações no app
  └─ 4.8-4.9 Auth mobile ──→ ⛔ BLOCKS todo o app

Sprint 5+
  └─ App core ──→ DEPENDE de todas as APIs v1 (Sprint 3)
```

---

## Resumo por Squad

| Squad | Sprint 1 | Sprint 2 | Sprint 3 | Sprint 4 | Sprint 5 | Sprint 6 |
|-------|----------|----------|----------|----------|----------|----------|
| **Backend** | Jurisdição, DB, API client, PostHog | Booking/chat/notif APIs, AI OCR, Sanity, Redis | Profile APIs, review/fav, OpenAPI, cache | Push native, OAuth IDs, load test | Suporte (bugs) | Suporte (bugs) |
| **Frontend Web** | Landing componentizada, strings JSON | Web → API v1, admin OCR, Sanity guias | Finalizar strings, imagens CDN, next-intl | Push UI web, next-intl | — | Locale routing, landing MX |
| **Mobile** | — | — | — | Init Expo, auth, nav, theme | Search, booking, bookings list | Calendar, video, chat, profile |
| **Ops/Legal** | Revisão UK, decidir push | Domínios, Trolley, PayPal | DPA, Intercom, Metabase | — | Conteúdo MX | Docs legal MX, pre-cadastro |

---

## Checklist de Decisões Pendentes (Tomar no Sprint 1)

- [ ] **Push strategy:** Expo Push (recomendado) ou OneSignal ou FCM+APNS nativo?
- [ ] **Backend resourcing:** Dedicar 1 FTE senior backend ou contratar contractor?
- [ ] **Mobile team:** Contratar 2 engenheiros RN/Expo agora ou só quando Phase B estiver pronta?
- [ ] **OCR provider:** AWS Textract, Google Document AI, ou Azure Form Recognizer?
- [ ] **i18n framework web:** `next-intl` (recomendado) ou `react-i18next`?

---

> **Documento vivo.** Atualizar a cada sprint review.
> **Última atualização:** 2026-04-23

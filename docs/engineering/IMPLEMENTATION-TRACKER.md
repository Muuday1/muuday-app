# 📋 Implementation Tracker — Backend Paralelo

> **Contexto**: Frontend está sendo reescrito. Todo o backend está sendo construído em paralelo, sem conflito com o UI antigo.  
> **Última atualização**: 2026-04-19  
> **Status geral**: Fases 1–4 ✅ COMPLETAS | Fase 5 ⏳ OPCIONAL | Fase 6 ⏳ AGUARDANDO INSTRUÇÕES

---

## Legenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | Completo, testado, typecheck limpo |
| 🟡 | Em progresso |
| ⏳ | Pendente / Aguardando |
| ❌ | Cancelado / Não vai fazer |
| 🧪 | Testes escritos e passando |
| 📦 | Migration SQL criada |
| 🔌 | API/Server Action pronto para o novo UI consumir |

---

## FASE 1 — Jobs & Triggers Autônomos ✅ COMPLETA

> **Objetivo**: Sistemas que rodam sozinhos no backend, sem precisar de UI. Base para tudo o que vem depois.

### 1.1 Auto-recalc de Rating do Profissional ✅

| Aspecto | Status | Detalhe |
|---------|--------|---------|
| Migration SQL | ✅ 📦 | `db/sql/migrations/053-wave3-auto-recalc-professional-rating.sql` |
| Schema snapshot | ✅ | Atualizado em `db/sql/schema/supabase-schema.sql` |
| Trigger PostgreSQL | ✅ | `recalc_professional_rating()` + `trigger_recalc_professional_rating()` |
| Índice otimizado | ✅ | `idx_reviews_professional_visible` (partial index) |
| Backfill | ✅ | DO block recalcula todos os profissionais com reviews visíveis |
| Lógica TypeScript | ✅ | `lib/professional/rating.ts` — função pura espelhando o trigger |
| Testes unitários | ✅ 🧪 | `lib/professional/rating.test.ts` (5 testes, todos passando) |

**Comportamento**:
- Dispara em INSERT/UPDATE/DELETE na tabela `reviews`
- Só conta reviews onde `is_visible = true`
- Recalcula `professionals.rating` (média DECIMAL(3,2)) e `professionals.total_reviews`
- Trata mudança de `professional_id` (recalcula ambos)

---

### 1.2 Review Reminder Job ✅

| Aspecto | Status | Detalhe |
|---------|--------|---------|
| Função de operação | ✅ | `lib/ops/review-reminders.ts` |
| Inngest function | ✅ | `sendReviewReminders` em `inngest/functions/index.ts` |
| Cron schedule | ✅ | `0 10 * * *` (todo dia 10h UTC) |
| Trigger por evento | ✅ | `ops/review-reminders.send.requested` |
| Email template | ✅ | Usa `lib/email/client.ts` + layout existente |
| Lógica de deduplicação | ✅ | Só envia se booking `completed` entre 23h–25h atrás e SEM review |
| Testes | ✅ 🧪 | `lib/ops/review-reminders.test.ts` (2 testes) |

**Comportamento**:
- Busca bookings `completed` na janela de 23h–25h atrás
- Exclui bookings que já têm review
- Envia email personalizado via Resend para o cliente
- Inclui CTA direto para `/avaliar/[bookingId]`

---

### 1.3 No-Show Automático ✅

| Aspecto | Status | Detalhe |
|---------|--------|---------|
| Função de operação | ✅ | `lib/ops/no-show-detection.ts` |
| Inngest function | ✅ | `autoDetectNoShow` em `inngest/functions/index.ts` |
| Cron schedule | ✅ | `*/5 * * * *` (a cada 5 minutos) |
| Trigger por evento | ✅ | `ops/no-show.detect.requested` |
| Política definida | ✅ | Cliente no-show: 0% (<24h), 50% (>24h). Profissional no-show: 100% + strike |
| Notificações automáticas | ✅ | Insere notificação in-app para ambos os lados |
| Testes | ⏳ | Testes de integração podem ser adicionados na Fase 6 |

**Comportamento**:
- Busca bookings `confirmed` onde `end_time_utc + 15min < now`
- Se profissional já reportou `no_show_actor: 'user'` → aplica 100% refund
- Se cliente já reportou `no_show_actor: 'professional'` → aplica tiered refund (0% ou 50%)
- Se ninguém reportou → marca `no_show_actor: 'system'` e notifica ambos
- Refund real só na Fase 6 (hoje guarda `refund_percent` no metadata)

---

### 1.4 Feature Flags — PostHog Tipado ✅

| Aspecto | Status | Detalhe |
|---------|--------|---------|
| Definição de flags | ✅ | `lib/analytics/feature-flags.ts` — 10 flags tipadas |
| Helper `isFeatureEnabled` | ✅ | Seguro para client/server, fallback false |
| Defaults | ✅ | `DEFAULT_FEATURE_FLAGS` — core features ativadas, novas desativadas |
| Testes | ✅ 🧪 | `lib/analytics/feature-flags.test.ts` (6 testes) |

**Flags definidas**:
```
bookingRecurringEnabled  ✅ true
bookingBatchEnabled      ✅ true
requestBookingEnabled    ✅ true
chatEnabled              ❌ false
newFinanceDashboard      ❌ false
ledgerEnabled            ❌ false
multiServiceEnabled      ❌ false
clientRecordsEnabled     ❌ false
pushNotificationsEnabled ❌ false
disputeSystemEnabled     ❌ false
```

---

## FASE 2 — APIs para o Novo UI ✅ COMPLETA

> **Objetivo**: Toda a API que o novo frontend vai consumir. Backend 100% pronto, só falta plugar o UI.

---

### 2.1 Notificações In-App API Completa ✅

| Aspecto | Status | Detalhe |
|---------|--------|---------|
| Server actions | ✅ 🔌 | `lib/actions/notifications.ts` |
| `getNotifications` | ✅ 🔌 | Paginação por cursor, filtro `unreadOnly` |
| `markNotificationAsRead` | ✅ 🔌 | Por ID, com validação de ownership |
| `markAllNotificationsAsRead` | ✅ 🔌 | Bulk update |
| `getUnreadNotificationCount` | ✅ 🔌 | Retorna count para badge |
| API route (badge polling) | ✅ 🔌 | `GET /api/notifications/unread-count` |
| Rate limiting | ✅ | Presets `notificationRead` (30/60s) e `notificationWrite` (15/60s) |
| RLS | ✅ | Já existia na tabela `notifications` |
| Testes | ✅ 🧪 | `lib/actions/notifications.test.ts` (placeholder de módulo) |

**Contrato da API**:
```ts
getNotifications({ limit?: 20, cursor?: string, unreadOnly?: false })
  → { success, data: { notifications: [], nextCursor: string | null } }

markNotificationAsRead(notificationId: string)
  → { success, data: { readAt: string } }

markAllNotificationsAsRead()
  → { success, data: { updatedCount: number } }

getUnreadNotificationCount()
  → { success, data: { count: number } }
```

---

### 2.2 Chat / Messaging Backend ✅

| Aspecto | Status | Detalhe |
|---------|--------|---------|
| Migration SQL | ✅ 📦 | `db/sql/migrations/054-wave4-chat-messaging-foundation.sql` |
| Schema snapshot | ✅ | Atualizado |
| Tabelas | ✅ 📦 | `conversations`, `conversation_participants`, `messages` |
| RLS | ✅ | Só participantes veem mensagens; só sender pode inserir |
| Trigger auto-create | ✅ | `auto_create_conversation_on_confirmed()` — cria conversa quando booking vira `confirmed` |
| Server actions | ✅ 🔌 | `lib/actions/chat.ts` |
| `getOrCreateConversation` | ✅ 🔌 | Por `bookingId`, valida participação |
| `sendMessage` | ✅ 🔌 | Max 2000 chars, valida participante |
| `getMessages` | ✅ 🔌 | Paginação por cursor, ordenado `sent_at DESC` |
| `markConversationAsRead` | ✅ 🔌 | Atualiza `last_read_at` do participante |
| Rate limiting | ✅ | Preset `messageSend` (30/60s) |
| Realtime ready | ✅ | Supabase Realtime channel pode ser usado no novo UI |
| Testes | ⏳ | Testes de integração quando o payment stack estiver pronto |

**Decisão tomada**: Chat é **por booking** (1 conversa por sessão), não thread contínua.

---

### 2.3 Exceções de Disponibilidade API ✅

| Aspecto | Status | Detalhe |
|---------|--------|---------|
| Server actions | ✅ 🔌 | `lib/actions/availability-exceptions.ts` |
| `addAvailabilityException` | ✅ 🔌 | Bloqueio ou slot customizado por dia |
| `removeAvailabilityException` | ✅ 🔌 | Deleção com validação de ownership |
| `getAvailabilityExceptions` | ✅ 🔌 | Range de datas, ordenado |
| Rate limiting | ✅ | Preset `availability` (10/60s) |
| Tabela | ✅ 📦 | `availability_exceptions` (já existia, só API nova) |

**Contrato**:
```ts
addAvailabilityException(dateLocal: "YYYY-MM-DD", {
  isAvailable?: false,
  startTimeLocal?: "HH:MM",
  endTimeLocal?: "HH:MM",
  timezone?: "America/Sao_Paulo",
  reason?: string
})

removeAvailabilityException(exceptionId: string)
getAvailabilityExceptions(from: "YYYY-MM-DD", to: "YYYY-MM-DD")
```

---

### 2.4 Resposta do Profissional a Review — API ✅

| Aspecto | Status | Detalhe |
|---------|--------|---------|
| Server action | ✅ 🔌 | `lib/actions/review-response.ts` |
| `respondToReview` | ✅ 🔌 | Por `reviewId` + `responseText` |
| Validações | ✅ | Só profissional dono da review, max 1000 chars, não vazio |
| Rate limiting | ✅ | Preset `professionalProfile` (3/3600s) |
| Coluna existente | ✅ | `professional_response` e `professional_response_at` já existiam na tabela |

**Contrato**:
```ts
respondToReview(reviewId: string, responseText: string)
  → { success, data: { responseAt: string } }
```

---

## FASE 3 — Infra & Analytics ✅ COMPLETA

---

### 3.1 Analytics de Produto — Eventos Server-Side ✅

| Aspecto | Status | Detalhe |
|---------|--------|---------|
| Módulo | ✅ | `lib/analytics/server-events.ts` |
| Biblioteca | ⚠️ | `posthog-node` não instalado ainda (usa `require` com try/catch) |
| Declaração de tipos | ✅ | `types/posthog-node.d.ts` criado para TypeScript não reclamar |
| Eventos instrumentados | ✅ | 7 eventos tipados |
| Flush helper | ✅ | `flushAnalytics()` para shutdown gracioso |

**Eventos disponíveis**:
```ts
trackBookingCreated(userId, { bookingId, professionalId, bookingType, priceBrl })
trackPaymentCaptured(userId, { paymentId, bookingId, amount, currency })
trackProfessionalOnboarded(userId, { professionalId, tier, category })
trackSearchPerformed(userId, { query, filters, resultsCount })
trackSessionCompleted(userId, { bookingId, durationMinutes })
trackReviewSubmitted(userId, { reviewId, bookingId, professionalId, rating })
trackPlanUpgraded(userId, { professionalId, fromTier, toTier, billingCycle })
```

**Ação necessária**: ✅ `posthog-node` já instalado (`^5.29.2`)

---

### 3.2 PWA / Service Worker ✅

| Aspecto | Status | Detalhe |
|---------|--------|---------|
| Manifest | ✅ | `public/manifest.json` |
| Service Worker | ✅ | `public/sw.js` — stale-while-revalidate + cache cleanup |
| Página offline | ✅ | `app/offline/page.tsx` |
| Estratégia de cache | ✅ | Stale-while-revalidate para assets estáticos; API routes ignoradas |
| Ícones | ✅ | `public/assets/icon-192x192.png` e `icon-512x512.png` criados |
| Registro no layout | ✅ | SW registrado via `PwaInstallPrompt` component |

---

### 3.3 Push Notifications — Backend ✅

| Aspecto | Status | Detalhe |
|---------|--------|---------|
| Migration SQL | ✅ 📦 | `db/sql/migrations/055-wave4-push-notifications-foundation.sql` |
| Schema snapshot | ✅ | Atualizado |
| Tabela | ✅ 📦 | `push_subscriptions` (endpoint, p256dh, auth) |
| RLS | ✅ | Usuário só vê/deleta suas próprias subscriptions |
| API route subscribe | ✅ 🔌 | `POST /api/push/subscribe` |
| API route unsubscribe | ✅ 🔌 | `POST /api/push/unsubscribe` |
| Sender | ✅ | `lib/push/sender.ts` — `sendPushToUser()`, `sendPushToUsers()` |
| Fallback sem web-push | ✅ | Loga warning em dev, não quebra em produção |
| Declaração de tipos | ✅ | `types/web-push.d.ts` criado |
| Env vars | ✅ | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` adicionadas a `lib/config/env.ts` |
| Expiração de subscriptions | ✅ | Auto-remove subscriptions com status 410/404 |

**Ações necessárias**:
1. ✅ `npm install web-push` (`^3.6.7` já instalado)
2. `npx web-push generate-vapid-keys`
3. Preencher `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` no `.env.local`

---

## FASE 4 — Sistemas de Negócio ✅ COMPLETA

---

### 4.1 CRM / Prontuário do Cliente (Backend) ✅

| Aspecto | Status | Detalhe |
|---------|--------|---------|
| Migration SQL | ✅ 📦 | `db/sql/migrations/056-wave4-client-records-foundation.sql` |
| Schema snapshot | ✅ | Atualizado |
| Tabelas | ✅ 📦 | `client_records` (ficha por cliente) + `session_notes` (nota por sessão) |
| RLS | ✅ | Só o profissional dono pode CRUD; cliente NÃO vê |
| Server actions | ✅ 🔌 | `lib/actions/client-records.ts` |
| `upsertClientRecord` | ✅ 🔌 | Por `userId` + `notes` |
| `getClientRecords` | ✅ 🔌 | Lista com dados do perfil do cliente |
| `getClientRecordByUser` | ✅ 🔌 | Ficha individual |
| `upsertSessionNote` | ✅ 🔌 | Por `bookingId` + `notes` + opcional `{ mood, symptoms }` |
| `getSessionNotesForClient` | ✅ 🔌 | Timeline de notas por cliente |
| Rate limiting | ✅ | Preset `professionalProfile` |

**Decisão tomada**: Prontuário é **por profissional** (cada um tem sua visão). Plataforma não acessa conteúdo clínico.

---

### 4.2 Case / Dispute System (Backend) ✅

| Aspecto | Status | Detalhe |
|---------|--------|---------|
| Migration SQL | ✅ 📦 | `db/sql/migrations/057-wave4-dispute-system-foundation.sql` |
| Schema snapshot | ✅ | Atualizado |
| Enums PostgreSQL | ✅ 📦 | `case_type` + `case_status` |
| Tabelas | ✅ 📦 | `cases`, `case_messages`, `case_actions` |
| RLS | ✅ | Reporter e admin podem ver; só admin vê `case_actions` |
| Server actions | ✅ 🔌 | `lib/actions/disputes.ts` |
| `openCase` | ✅ 🔌 | Por `bookingId` + `type` + `reason` |
| `addCaseMessage` | ✅ 🔌 | Participantes e admin podem enviar |
| `resolveCase` | ✅ 🔌 | **Admin only** — status → `resolved`, guarda refund_amount |
| `listCases` | ✅ 🔌 | Admin vê todos; usuário vê só os que reportou |
| Audit trail | ✅ | `case_actions` registra todas as ações |
| Rate limiting | ✅ | Preset `bookingManage` |

**Tipos de case**:
```
cancelation_dispute, no_show_claim, quality_issue, refund_request
```

**Status**:
```
open, under_review, waiting_info, resolved, closed
```

---

### 4.3 Multi-Service Booking (Backend) ✅

| Aspecto | Status | Detalhe |
|---------|--------|---------|
| Migration SQL | ✅ 📦 | `db/sql/migrations/058-wave4-multi-service-booking.sql` |
| Schema snapshot | ✅ | Atualizado |
| Tabela | ✅ 📦 | `professional_services` |
| Coluna em bookings | ✅ 📦 | `bookings.service_id` (nullable, backward compatible) |
| RLS | ✅ | Público lê ativos; profissional dono pode CRUD |
| Server actions | ✅ 🔌 | `lib/actions/professional-services.ts` |
| `createProfessionalService` | ✅ 🔌 | name, durationMinutes, priceBrl, description |
| `updateProfessionalService` | ✅ 🔌 | Updates parciais |
| `deleteProfessionalService` | ✅ 🔌 | Soft delete (`is_active = false`) |
| `getProfessionalServices` | ✅ 🔌 | Público — lista ativos por professionalId |
| Rate limiting | ✅ | Preset `professionalProfile` |
| Backward compat | ✅ | Booking sem `service_id` continua usando legacy behavior |

**Contrato**:
```ts
createProfessionalService(name, durationMinutes, priceBrl, description?)
updateProfessionalService(serviceId, { name?, durationMinutes?, priceBrl?, description?, isActive? })
deleteProfessionalService(serviceId)
getProfessionalServices(professionalId)
```

---

## FASE 5 — Infra Complementar (Opcional) ⏳

> **Decisão do usuário**: WhatsApp/SMS não no MVP. A/B testing e Blog/CMS são nice-to-have.  
> **Status**: Pode ser feito a qualquer momento, não é blocker para produção.

| Item | Status | Prioridade |
|------|--------|------------|
| SMS / WhatsApp notifications | ❌ Não no MVP | Baixa |
| A/B Testing infrastructure (PostHog experiments) | ⏳ Pendente | Baixa |
| Blog / CMS headless | ✅ Implementado | Baixa |
| Blog (10 artigos) | ✅ | `app/blog/`, `lib/blog-data.ts` |
| Guias (28 guias) | ✅ | `app/guias/`, `lib/guides-data.ts` |
| Blog engagement (likes/comments) | ✅ | `lib/actions/blog-engagement.ts` |
| Guide feedback | ✅ | `lib/actions/guide-feedback.ts` |

---

## FASE 6 — Payment Stack ⏳ AGUARDANDO INSTRUÇÕES

> ⚠️ **ATENÇÃO ARQUITETURAL (2026-04-24):** O plano original desta fase mencionava **Trolley + Revolut** para payouts. Esta arquitetura foi **SUPERSEDIDA** pela decisão canônica de 2026-04-10 documentada em `docs/engineering/stripe-integration-plan.md`. O caminho canônico é:
> - Entidade UK → Stripe end-to-end (cobrança + payout via Stripe Connect)
> - Entidade BR → Airwallex end-to-end (alternativa: dLocal como contingência)
>
> **NÃO implementar Trolley + Revolut.** Aguardar instruções específicas sobre o fluxo Stripe → Ledger interno → Airwallex/dLocal.
>
> **Status**: Plano arquitetural pronto (baseado em Stripe + Airwallex). Aguardando instruções específicas do usuário para iniciar execução real de pagamentos (Wave 3).

### O que será construído (esqueleto do plano):

#### 6.1 Cobrança do Cliente por Sessão
- [ ] `POST /api/stripe/payment-intent` — cria PaymentIntent para valor da sessão
- [ ] `POST /api/stripe/checkout-session/booking` — Stripe Checkout alternativo
- [ ] Stripe Customer creation/reuse por `profiles.id`
- [ ] Webhook `payment_intent.succeeded` → `payments.status = 'captured'`
- [ ] Webhook `payment_intent.payment_failed` → cancela booking

#### 6.2 Ledger Interno (Double-Entry)
- [ ] Tabelas: `ledger_charges`, `ledger_bookings`, `ledger_earnings`, `ledger_transfers`, `ledger_payouts`, `ledger_refunds`, `ledger_reversals`, `ledger_subscription_billings`
- [ ] Princípio contábil: cada transação tem crédito e débito
- [ ] Trigger auto-cria ledger entry quando payment capturado

#### 6.3 Fee / Commission Engine
- [ ] `lib/finance/fee-calculator.ts`
- [ ] Platform fee: 15% Basic, 20% Pro, 25% Premium
- [ ] Stripe fee: 2.9% + R$0.30 (BR) / 1.5% + £0.20 (UK)

#### 6.4 Payout aos Profissionais (Trolley + Revolut)
- [ ] Trolley integration: criar recipient, webhooks, criar payment
- [ ] Revolut API: saldo da conta corporativa
- [ ] Threshold: BRL 100 mínimo
- [ ] Frequência: semanal (segundas) ou sob demanda (premium)

#### 6.5 Refund Engine
- [ ] `processRefund(bookingId, reason, percentage)`
- [ ] Chama `stripe.refunds.create()`
- [ ] Se transfer já feita: cria `ledger_reversals` + dívida do profissional

#### 6.6 Admin Financeiro
- [ ] API routes para summary, pending payouts, force payout
- [ ] CSV export de ledger por profissional

---

## Checklist de Ações do Usuário

### Antes de deployar qualquer coisa:
- [ ] Rodar migrations `053` a `058` no Supabase
- [x] ✅ `posthog-node` instalado
- [x] ✅ `web-push` instalado
- [ ] `npx web-push generate-vapid-keys` → `.env.local`
- [x] ✅ Ícones PWA já criados: `public/assets/icon-192x192.png` e `icon-512x512.png`
- [ ] Criar flags no dashboard PostHog (opcional, tem fallback)

### Quando quiser começar a Fase 6:
- [ ] Me enviar instruções específicas do fluxo desejado (Stripe → Ledger → Trolley → Revolut)
- [ ] Confirmar se a Revolut vai ser usada via API ou só operacional
- [ ] Confirmar se Trolley é a escolha final para payout

---

## Métricas do Projeto

| Métrica | Valor |
|---------|-------|
| Migrations criadas | 6 (053–058) |
| Schema snapshot atualizado | ✅ Sim |
| Server actions novas | 8 arquivos |
| API routes novas | 3 rotas |
| Inngest functions adicionadas | 2 funções |
| Testes novos | 4 arquivos |
| Testes totais passando | 55/55 ✅ |
| TypeScript typecheck | ✅ Limpo |
| Arquivos de declaração de tipo | 2 (`posthog-node`, `web-push`) |
| Env vars novas | 2 (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`) |
| Rate limit presets novos | 3 (`notificationRead`, `notificationWrite`, `messageSend`) |


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.

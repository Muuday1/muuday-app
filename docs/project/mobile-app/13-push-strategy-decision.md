# Decisão: Estratégia de Push Notifications

> **Status:** DECIDIDO — 2026-04-23  
> **Decisor:** Tech Lead (AI agent)  
> **Escopo:** Web push (VAPID) + Native push (iOS/Android)  
> **Impacto:** Sprint 1 (fundamentos) + Sprint 4 (implementação mobile)

---

## 1. Contexto

O app mobile precisa de push notifications nativas. A web já usa VAPID/web-push. Precisamos de uma estratégia unificada que:
- Suporte web push (já funciona)
- Suporte iOS push (APNs)
- Suporte Android push (FCM)
- Seja economicamente viável para startup
- Não exija infraestrutura própria de push

---

## 2. Opções Avaliadas

### 2.1 Expo Push Service (⭐ ESCOLHIDO)

**Como funciona:**
- App envia Expo Push Token para nosso backend
- Backend chama `https://exp.host/--/api/v2/push/send` com o token
- Expo entrega para APNs (iOS) ou FCM (Android)
- Zero configuração de certificados APNs ou FCM no nosso lado

**Custos:**
- Gratuito até onde a Expo documenta (não há limites publicados agressivos)
- Ilimitado para a maioria dos casos de uso

**Pros:**
- ✅ Zero infraestrutura própria
- ✅ Não precisa de conta Apple Developer $99/ano só para push
- ✅ Não precisa configurar FCM no Firebase
- ✅ Funciona com Expo e React Native puro
- ✅ API simples (HTTP POST)
- ✅ Suporta iOS + Android + Web

**Cons:**
- ❌ Vendor lock-in na Expo (mas migração para FCM+APNs direto é possível depois)
- ❌ Tokens da Expo expiram (precisa de refresh logic)

**Veredicto:** Melhor custo-benefício para startup. Migração para FCM+APNs nativo é trivial no futuro se necessário.

### 2.2 OneSignal

**Como funciona:**
- SDK no app → OneSignal gerencia tokens → entrega via APNs/FCM

**Custos:**
- Free: até 10k subscribers, notificações ilimitadas
- Growth: $9/mês (sem limites claros)
- Enterprise: sob consulta

**Pros:**
- ✅ Dashboard de analytics
- ✅ Segmentação avançada
- ✅ Templates e automação

**Cons:**
- ❌ Custo adicional (mesmo que baixo)
- ❌ Mais um vendor na stack
- ❌ Overkill para nosso estágio

**Veredicto:** Boa opção, mas overkill e custo desnecessário no momento.

### 2.3 FCM + APNs Nativo

**Como funciona:**
- Configurar projeto Firebase (FCM para Android)
- Configurar certificados APNs na Apple (iOS)
- Backend chama FCM HTTP API e APNs HTTP/2 API diretamente

**Custos:**
- FCM: gratuito
- APNs: gratuito, mas requer Apple Developer ($99/ano)

**Pros:**
- ✅ Zero vendor lock-in
- ✅ Controle total
- ✅ Gratuito (exceto Apple Dev)

**Cons:**
- ❌ Requer Apple Developer ($99/ano) — gatilho que pode ser adiado
- ❌ Complexidade de configuração de certificados APNs
- ❌ Duas APIs diferentes para manter (FCM + APNs)
- ❌ Mais trabalho no backend

**Veredicto:** Escolha definitiva para escala, mas não para MVP/early stage.

---

## 3. Decisão

**Expo Push Service** é a escolha para as próximas 12-18 meses.

### Por quê:
1. **Custo zero** — não adiciona despesa
2. **Velocidade** — backend pode enviar push nativo em 1 dia de trabalho
3. **Flexibilidade** — tokens da Expo são convertíveis; se precisarmos migrar para FCM+APNs, é trivial
4. **Apple Dev deferral** — podemos testar push no iOS sem pagar $99/ano imediatamente (Expo Go)

### Quando revisar:
- Quando o app atingir 50k+ usuários ativos
- Se a Expo introduzir limites ou custos
- Se precisarmos de features avançadas (rich notifications, notification categories, etc.)

---

## 4. Arquitetura Proposta

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   App (iOS)     │────▶│  Expo Push Token │────▶│  POST /api/v1   │
│   App (Android) │     │  (ExponentPush...)│     │  /push/subscribe│
│   Web (PWA)     │     │  VAPID (web)     │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │ push_subscriptions│
                                                 │ (platform, token) │
                                                 └─────────────────┘
                                                          │
                              ┌───────────────────────────┼───────────────────────────┐
                              │                           │                           │
                              ▼                           ▼                           ▼
                        ┌──────────┐              ┌──────────────┐              ┌──────────┐
                        │ Web Push │              │ Expo Push API│              │  Future  │
                        │ (VAPID)  │              │ (HTTP POST)  │              │ FCM/APNs │
                        └──────────┘              └──────────────┘              └──────────┘
```

### Tabela `push_subscriptions` (pós-migration 069):

| Column | Web | Native (iOS/Android) |
|--------|-----|---------------------|
| `platform` | `'web'` | `'ios'` / `'android'` |
| `endpoint` | VAPID endpoint | `NULL` |
| `p256dh` | VAPID key | `NULL` |
| `auth` | VAPID auth | `NULL` |
| `push_token` | `NULL` | Expo Push Token |
| `device_id` | `NULL` | Device UUID |

### Backend API:

```ts
// lib/push/unified-sender.ts
export async function sendUnifiedPush(userId, payload, options)
  // 1. Query push_subscriptions for user
  // 2. Route web subscriptions → web-push
  // 3. Route native subscriptions → Expo Push API
  // 4. Return delivery stats
```

### API Routes:

- `POST /api/v1/push/subscribe` — Registrar token (web ou native)
- `DELETE /api/v1/push/unsubscribe` — Remover token
- (já existe `POST /api/push/subscribe` para web — manter compatibilidade)

---

## 5. Implementação

### Fase 1 (Sprint 1 — já): Fundamentos
- [x] Migration 069: adicionar `platform`, `push_token`, `device_id`
- [x] Criar `lib/push/unified-sender.ts`
- [x] Atualizar `sendPushToUser` para usar unified sender

### Fase 2 (Sprint 4 — quando app mobile iniciar):
- [ ] App envia Expo Push Token para `POST /api/v1/push/subscribe`
- [ ] Testar delivery em iOS (Expo Go) e Android
- [ ] Dashboard de teste de push no admin

### Fase 3 (Futuro):
- [ ] Migrar para FCM + APNs nativo se necessário
- [ ] Rich notifications (images, actions)
- [ ] Notification categories / actionable buttons

---

## 6. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Expo Push fica pago/limitado | Médio | Arquitetura já abstrai o provider; migração para FCM+APNs é trocar uma função |
| Tokens da Expo expiram | Baixo | App faz refresh automático; backend remove tokens rejeitados |
| Apple exige Apple Dev para produção | Alto (mas esperado) | Pagar $99/ano é inevitável para App Store; Expo Push apenas adia |
| Latência da Expo Push API | Baixo | API é global CDN; fallback para retry com backoff |

---

## 7. Conclusão

Expo Push é a escolha correta para o estágio atual: **zero custo, máxima velocidade, mínima complexidade.** A arquitetura unificada garante que não ficamos presos — podemos migrar para qualquer provider no futuro sem mudar a API pública.

**Próximo passo:** Implementar `lib/push/unified-sender.ts` e migration 069.

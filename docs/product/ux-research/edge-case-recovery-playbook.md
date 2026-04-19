# Edge Case Recovery Playbook

**Status:** New canonical document  
**Last updated:** 2026-04-19  
**Scope:** All 12 edge cases from UX Blueprint with detection, recovery, and fallback paths  
**Actors:** User, Professional, System, Admin  

---

## Edge Case 1: No Professionals Available

### Detection
- Search query returns zero results after all filters applied
- RPC `search_public_professionals_pgtrgm` returns empty
- `filterPubliclyVisibleProfessionals` returns empty

### User Communication
```
[Empty State UI]
├── Heading: "Nenhum profissional encontrado"
├── Subheading: "Tente ajustar seus filtros ou explore categorias relacionadas"
├── Recovery actions:
│   ├── [Remover filtros] — clears all filters
│   ├── [Sugerir categoria] — shows adjacent categories with available pros
│   └── [Me avise quando disponível] — waitlist capture
└── Visual: Illustration of empty search
```

### Recovery Action
1. User clicks "Remove filters" → reloads search with text query only
2. User clicks adjacent category → navigates to that search
3. User joins waitlist → stores intent in `waitlist` table with notification trigger

### Fallback
- If no adjacent categories: suggest widening location radius
- If still nothing: show "We're new in your area. Help us grow by sharing Muuday."

### Operational Alert
- None (normal operational state)

---

## Edge Case 2: Professional Unavailable After Booking

### Detection
- Professional marks themselves unavailable OR
- Professional cancels booking OR
- Professional's calendar sync shows conflict

### User Communication
```
[Notification + Email]
├── "Sua sessão com [Pro] foi cancelada"
├── Reason (if provided): "[Pro] teve um imprevisto"
├── Refund info: "R$ XXX será reembolsado em 5-10 dias úteis"
├── Recovery actions:
│   ├── [Reagendar com [Pro]] — if pro proposes alternative
│   ├── [Buscar profissionais similares]
│   └── [Falar com suporte]
└── Apology: "Pedimos desculpas pelo transtorno."
```

### Recovery Action
1. User rebooks with same pro → request booking flow
2. User searches similar pros → `/buscar?categoria=[same]`
3. User contacts support → creates case

### Fallback
- If no similar pros: priority waitlist notification when pro becomes available
- If refund fails: manual ops case created

### Operational Alert
- Case created if professional cancellation rate > threshold

---

## Edge Case 3: User No-Show

### Detection
- Session time passes. User never joined. Professional clicks "Cliente no-show"
- OR: auto-detection (neither party joined within T+15min)

### Professional Communication
```
[Agenda + Notification]
├── "Sessão marcada como não realizada"
├── "Você receberá o pagamento integral em [date]"
├── "Este é o seu [X]º no-show reportado."
└── [Entender política de no-shows]
```

### User Communication
```
[Email + Notification]
├── "Você perdeu sua sessão com [Pro]"
├── "Como não compareceu, o valor não será reembolsado."
├── Recovery:
│   ├── [Reagendar] — with late-booking fee warning
│   └── [Falar com suporte] — if there was a legitimate reason
└── "Lembrete: você pode cancelar com reembolso total até 24h antes."
```

### Recovery Action
- User reschedules → standard booking with note about previous no-show
- User disputes → creates `no_show_claim` case (user claims they DID show)

### Fallback
- If user has 3+ no-shows: account review flag

### Operational Alert
- Admin case created if user disputes no-show

---

## Edge Case 4: Professional No-Show

### Detection
- Session time passes. Professional never joined. User clicks "Reportar no-show"
- OR: auto-detection (user joined, pro never joined within T+15min)

### User Communication
```
[Agenda + Notification + Email]
├── "Confirmamos que [Pro] não compareceu à sessão"
├── "Reembolso de 100% processado: R$ XXX"
├── "Pedimos desculpas pela experiência."
├── Recovery:
│   ├── [Agendar com outro profissional]
│   ├── [Reagendar com [Pro]] — if user wants to give second chance
│   └── [Deixar avaliação]
└── "Este profissional foi notificado sobre o ocorrido."
```

### Professional Communication
```
[Notification + Email]
├── "Você foi marcado como não comparecimento"
├── "O cliente foi reembolsado integralmente."
├── "Este é o seu [X]º no-show. [Consequências]"
└── [Entender política] [Contest]
```

### Recovery Action
- User books another pro → search with same filters
- User reschedules with same pro → requires pro confirmation
- Pro contests → evidence upload, admin case

### Fallback
- If pro has 2+ no-shows: automatic first-booking gate disable
- If 3+ no-shows: account suspension review

### Operational Alert
- Case created immediately
- Trust & Safety notified if pattern detected

---

## Edge Case 5: Failed Payment

### Detection
- Stripe/Airwallex charge fails
- `payments` status = `failed`
- Webhook receives `payment_intent.payment_failed`

### User Communication
```
[Booking page / Notification]
├── "Não foi possível processar seu pagamento"
├── Reason (from processor):
│   ├── "Cartão recusado"
│   ├── "Saldo insuficiente"
│   ├── "Cartão expirado"
│   └── "Erro temporário. Tente novamente."
├── Recovery:
│   ├── [Tentar novamente] — retry with same method
│   ├── [Usar outro cartão] — update payment method
│   └── [Pagar via Pix] — if BR (future)
└── "Sua sessão está reservada por 10 minutos. Complete o pagamento."
```

### Recovery Action
1. User retries → new charge attempt
2. User changes payment method → new charge
3. User abandons → booking auto-cancels after 10min (slot lock expiry)

### Fallback
- If booking auto-cancels: user notified, slot released
- If user wants to retry after expiry: must reselect slot

### Operational Alert
- None for single failure
- Ops alert if failure rate > 15% in 1 hour (processor issue)

---

## Edge Case 6: Expired Payment Method

### Detection
- Subscription renewal fails due to expired card
- `payments` status = `failed`, reason = `expired_card`

### Professional Communication (for plan billing)
```
[Email + Dashboard banner]
├── "Seu cartão de crédito expirou"
├── "Atualize seu método de pagamento para continuar recebendo agendamentos."
├── Grace period: "Você tem 7 dias para atualizar."
├── Recovery:
│   ├── [Atualizar cartão] → Stripe customer portal
│   └── [Ver planos] → /planos
└── Warning: "Após 7 dias, seu perfil ficará invisível até a regularização."
```

### Recovery Action
- Pro updates card → immediate retry
- Grace period passes → profile hidden, onboarding tracker shows "Billing issue"

### Fallback
- Pro can downgrade to free tier (if available) to maintain visibility

### Operational Alert
- None (automated grace period handling)

---

## Edge Case 7: Session Connection Issue

### Detection
- Agora join fails
- Token fetch fails
- Network disconnect during session
- `VideoSession` component catches error

### User Communication (Pre-Join)
```
[/sessao/[id] — Error State]
├── "Não foi possível conectar à sessão"
├── Diagnosis:
│   ├── "Verifique sua conexão com a internet"
│   ├── "Permita acesso à câmera e microfone"
│   └── "Tente recarregar a página"
├── Recovery:
│   ├── [Testar dispositivo] — device check modal
│   ├── [Usar link alternativo] — if pro provided
│   ├── [Recarregar página]
│   └── [Reportar problema]
└── "Se o problema persistir, sua sessão pode ser remarcada sem custo."
```

### User Communication (Mid-Session)
```
[VideoSession — Disconnect Overlay]
├── "Conexão perdida"
├── "Tentando reconectar..." (auto-retry 3x)
├── [Reconectar agora]
├── [Usar link alternativo]
└── [Sair e reportar]
```

### Recovery Action
1. Auto-retry connection (3 attempts, 5s interval)
2. User reloads page → rejoins session
3. User uses alternative link → external meeting
4. User reports issue → case created, session marked "technical_failure"

### Fallback
- If session cannot happen: auto-reschedule offered OR full refund
- If pro's connection fails but user's is fine: pro gets strike only if at fault

### Operational Alert
- Case created on user report
- Ops alert if >5 connection failures to same professional in 24h (pro's setup issue)

---

## Edge Case 8: Reschedule Conflict

### Detection
- `rescheduleBooking` validates new slot
- `validateSlotAvailability` returns conflict
- Slot lock acquisition fails

### User Communication
```
[Reschedule Panel]
├── "Este horário não está mais disponível"
├── Reason:
│   ├── "Outro cliente acabou de reservar este horário."
│   ├── "[Pro] não atende neste horário."
│   └── "O horário está dentro do período de antecedência mínima."
├── Recovery:
│   ├── [Escolher outro horário] — calendar reopens
│   ├── [Solicitar horário personalizado] → /solicitar
│   └── [Cancelar e reembolso]
└── "Sessões populares se enchem rapidamente."
```

### Recovery Action
1. User picks another slot → standard reschedule
2. User requests booking → request flow
3. User cancels → refund per cancellation policy

### Fallback
- If no slots available in next 30 days: suggest similar professionals

### Operational Alert
- None (normal operational state)

---

## Edge Case 9: Account Blocked / Flagged

### Detection
- `is_publicly_visible = false`
- `first_booking_enabled = false`
- Trust flag triggered
- Admin suspension

### Professional Communication
```
[Dashboard Banner / Email]
├── "Sua conta foi temporariamente suspensa"
├── Reason:
│   ├── "Violação dos termos de uso"
│   ├── "Múltiplos no-shows reportados"
│   ├── "Pagamento off-platform detectado"
│   └── "Investigação de disputa em andamento"
├── Impact:
│   ├── "Seu perfil não aparece nas buscas."
│   └── "Você não pode aceitar novos agendamentos."
├── Recovery:
│   ├── [Entender motivo] — detailed explanation
│   ├── [Contest] — evidence upload
│   └── [Falar com suporte]
└── "Decisões de suspensão são revisadas em até 48h."
```

### Recovery Action
1. Pro contests → evidence upload → admin case
2. Pro waits → automatic review after 48h
3. Pro contacts support → case created

### Fallback
- If suspension upheld: pro can appeal once after 30 days
- If permanent ban: data retention per policy, payout of earned funds

### Operational Alert
- Trust & Safety case created automatically
- Senior ops review required for suspensions > 7 days

---

## Edge Case 10: Refund Denied

### Detection
- User requests refund outside policy window
- Dispute resolved in professional's favor
- `cancelBooking` returns refund = 0

### User Communication
```
[Notification + Email]
├── "Seu pedido de reembolso foi analisado"
├── Decision: "Reembolso não aprovado"
├── Reason:
│   ├── "Cancelamento dentro de 24h da sessão: política não cobre."
│   ├── "A sessão foi realizada conforme agendado."
│   └── "Não há evidência de problema reportado."
├── Recovery:
│   ├── [Entender política] — link to cancellation policy
│   ├── [Contest] — if new evidence
│   └── [Falar com suporte]
└── "Você ainda pode usar o crédito em futuras sessões."
```

### Recovery Action
- User accepts → case closed
- User contests → new evidence → admin review
- User escalates → senior ops / legal review

### Fallback
- If user is repeat complainer: account flag for pattern review

### Operational Alert
- Case created on contest
- Ops review if refund denial rate > 20% for same pro (pattern)

---

## Edge Case 11: Review Moderation Rejection

### Detection
- Admin rejects review
- `reviews.status` = `rejected`

### User Communication
```
[Notification + Email]
├── "Sua avaliação precisa de ajustes"
├── Reason:
│   ├── "Contém linguagem inadequada"
│   ├── "Inclui informações pessoais"
│   ├── "Não reflete uma experiência genuína"
│   └── "Descreve uma sessão que não ocorreu"
├── "Você pode editar e reenviar em até 7 dias."
├── Recovery:
│   ├── [Editar avaliação]
│   └── [Entender diretrizes]
└── "Avaliações devem ser justas e baseadas em experiências reais."
```

### Recovery Action
- User edits → resubmits → re-moderation
- User doesn't edit → review archived after 7 days

### Fallback
- If user repeatedly submits rejected reviews: temporary review ban

### Operational Alert
- None (normal moderation flow)

---

## Edge Case 12: Invalid Verification Submission

### Detection
- `professional_credentials` fails scan (AI/manual)
- Credential photo unreadable
- Document type doesn't match claimed credential

### Professional Communication
```
[Onboarding Tracker / Email]
├── "Seu documento de verificação não pôde ser validado"
├── Reason:
│   ├── "A imagem está borrada ou ilegível."
│   ├── "O documento está expirado."
│   ├── "O tipo de documento não corresponde à categoria profissional."
│   └── "Não conseguimos confirmar a autenticidade."
├── Recovery:
│   ├── [Reenviar documento] — with guidelines
│   ├── [Usar outro documento]
│   └── [Falar com suporte]
└── Guidelines:
    ├── "Fotografe em boa iluminação"
    ├── "Certifique-se de que todos os dados estão visíveis"
    └── "Documentos aceitos: [list]"
```

### Recovery Action
- Pro re-uploads → re-scan
- Pro uploads different document → new scan
- Pro contacts support → manual verification case

### Fallback
- If 3 failed attempts: manual review required (ops case)
- Pro can proceed with "unverified" badge (lower trust)

### Operational Alert
- Case created after 3 failed attempts
- Ops review if credential fraud suspected

---

## Summary Table

| # | Edge Case | Auto-Recovery | User Action | Ops Case | Severity |
|---|-----------|---------------|-------------|----------|----------|
| 1 | No pros available | Suggest alternatives | Adjust filters | No | Low |
| 2 | Pro unavailable after booking | Auto-refund | Rebook/support | If pattern | Medium |
| 3 | User no-show | Mark status | Reschedule/dispute | If dispute | Medium |
| 4 | Pro no-show | Auto-refund | Rebook/review | Yes | High |
| 5 | Failed payment | Slot hold 10min | Retry/cancel | If rate spike | Medium |
| 6 | Expired payment method | Grace period 7d | Update card | No | Medium |
| 7 | Connection issue | Auto-retry 3x | Reload/report | If reported | High |
| 8 | Reschedule conflict | Suggest alternatives | Pick new slot | No | Low |
| 9 | Account blocked | None | Contest/support | Yes | Critical |
| 10 | Refund denied | None | Contest/escalate | If contest | Medium |
| 11 | Review rejected | 7-day edit window | Edit/resubmit | No | Low |
| 12 | Invalid verification | None | Reupload/support | After 3 fails | Medium |

---

## Related Documents

- `docs/product/journeys/session-lifecycle.md` — No-show and dispute flows
- `docs/product/journeys/operator-case-resolution.md` — Case handling
- `docs/product/journeys/trust-safety-compliance.md` — Trust flags

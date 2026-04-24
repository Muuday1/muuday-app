# Journey: Financial Overview

**Status:** New canonical document  
**Last updated:** 2026-04-19  
**Scope:** Professional earnings, payouts, transaction history, and financial health  
**Actors:** Professional (primary), System, Admin  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Frame-by-Frame Analysis](#2-frame-by-frame-analysis)
3. [Financial State Model](#3-financial-state-model)
4. [Business Rules](#4-business-rules)
5. [Deep Review & Recommendations](#5-deep-review--recommendations)
6. [Implementation Plan](#6-implementation-plan)

---

## 1. Executive Summary

The Financial Overview (`/financeiro`) is where professionals track their earnings and payouts. **Today it is essentially a placeholder** — three KPI cards (total captured, pending payments, active bookings) and a "coming soon" list. There is **no transaction history**, **no fee breakdown**, **no payout schedule**, and **no tax documentation**.

**Critical insight:**
> For professionals, the financial page is the #1 retention indicator. If they cannot easily understand what they earned, what fees were taken, and when they'll be paid, they will leave for platforms that offer transparency. The current page tells them almost nothing.

---

## 2. Frame-by-Frame Analysis

### PHASE 1: FINANCIAL DASHBOARD

---

#### Frame 1.1: Financial Overview Entry

**Where:** `app/(app)/financeiro/page.tsx`  
**Current State:** Three cards + "Próximos recursos" placeholder + nav links.

**Frame-by-frame:**
```
[/financeiro]
    ├── Header: "Financeiro"
    ├── Subtext: "Acompanhe ganhos, pagamentos pendentes e volume..."
    ├── KPI Cards (3-col):
    │   ├── Total capturado: R$ X,XXX
    │   ├── Pagamentos pendentes: N
    │   └── Bookings ativos: N
    ├── "Próximos recursos" placeholder:
    │   ├── Historico detalhado por booking
    │   ├── Payouts semanais e falhas de saque
    │   └── Consolidacao com ledger interno
    └── Nav links: [Ver bookings] [Preferencias da conta]
```

**Problems identified:**
1. **"Total capturado" is gross, not net** — Pro doesn't know what they actually receive
2. **No date range** — Is this lifetime? This month? Unclear.
3. **No transaction list** — Cannot drill down into individual payments
4. **No fee transparency** — Platform fee + processing fee are invisible
5. **No payout status** — When will money arrive in my account?
6. **No earnings trend** — Am I earning more or less than last month?
7. **Placeholder admits the page is unfinished** — Unprofessional

**Recommended Frame 1.1 (Target):**
```
[/financeiro — Enhanced]
    ├── Header: "Financeiro" + date range selector: [Este mês ▼]
    ├── Summary Cards (4-col):
    │   ├── A receber: R$ XXX (net of fees, upcoming payout)
    │   ├── Recebido (mês): R$ XXX (↑12% vs anterior)
    │   ├── Em processamento: N pagamentos
    │   └── Taxa média: X%
    ├── Earnings Chart (NEW):
    │   ├── Bar chart: earnings per week (last 12 weeks)
    │   └── Toggle: [Bruto] [Líquido]
    ├── Transaction List (NEW):
    │   ├── Table: Data | Cliente | Booking | Bruto | Taxas | Líquido | Status
    │   ├── Filters: [Todos] [Capturados] [Pendentes] [Reembolsados]
    │   ├── Sort: [Mais recente] [Maior valor]
    │   └── Pagination
    ├── Payout Section (NEW):
    │   ├── "Próximo saque: R$ XXX em [Date]"
    │   ├── "Último saque: R$ XXX em [Date]"
    │   ├── Payout method: [****1234] [Alterar]
    │   └── Payout history link
    └── Tax Documents (NEW, if applicable):
        └── "Nota fiscal / Recibo: [Baixar]"
```

---

### PHASE 2: TRANSACTION DETAIL

---

#### Frame 2.1: Transaction Detail Modal/Drawer

**Where:** New component  
**Current State:** Does not exist.

**Recommended Frame 2.1 (Target):**
```
[Transaction Detail]
    ├── Booking info: Cliente, data, duração
    ├── Financial breakdown:
    │   ├── Valor cobrado do cliente: R$ XXX
    │   ├── Taxa da plataforma (Y%): -R$ XX
    │   ├── Taxa Stripe: -R$ XX
    │   ├── Impostos (if applicable): -R$ XX
    │   └── Você recebeu: R$ XXX
    ├── Timeline:
    │   ├── Pagamento capturado: [Date]
    │   ├── Liberado para saque: [Date]
    │   └── Transferido: [Date] (or "Aguardando próximo ciclo")
    └── [Ver comprovante] [Baixar recibo]
```

---

### PHASE 3: PAYOUT MANAGEMENT

---

#### Frame 3.1: Payout Schedule

**Where:** New section in `/financeiro`  
**Current State:** Does not exist.

**Recommended Frame 3.1 (Target):**
```
[Payout Section]
    ├── "Saque automático: toda [segunda-feira]"
    ├── "Saldo mínimo para saque: R$ 50"
    ├── Current balance: R$ XXX
    ├── "Seu saldo será transferido em: [Date]"
    └── Payout history:
        ├── [Date] — R$ XXX — Status: [Concluído / Falhou / Em andamento]
        └── [Date] — R$ XXX — Status: Concluído
```

---

### PHASE 4: FINANCIAL HEALTH

---

#### Frame 4.1: Earnings Analytics

**Where:** New tab or section  
**Current State:** Does not exist.

**Recommended Frame 4.1 (Target):**
```
[Earnings Analytics]
    ├── Time range: [7 dias] [30 dias] [90 dias] [12 meses]
    ├── Charts:
    │   ├── Earnings over time (line chart)
    │   ├── Bookings vs cancellations (stacked bar)
    │   └── Revenue by booking type (pie: one-off, recurring, request)
    ├── Metrics:
    │   ├── Ticket médio: R$ XXX
    │   ├── Taxa de conversão: X%
    │   ├── Taxa de cancelamento: X%
    │   └── Clientes recorrentes: X%
    └── Comparison:
        └── "Você está no top X% de profissionais da categoria [Category]"
```

---

## 3. Financial State Model

### Payment Status Lifecycle

```
pending ──[ Stripe captures ]──→ captured ──[ Platform hold period ]──→ available
    │                                   │
    ├──[ fails ]──→ failed             ├──[ refunded ]──→ refunded
    └──[ expires ]──→ expired          └──[ disputed ]──→ disputed
```

### Payout Status

```
available ──[ Payout trigger ]──→ processing ──[ Stripe transfer ]──→ paid
                                              │
                                              └──[ fails ]──→ failed ──[ retry ]
```

---

## 4. Business Rules

### Fee Structure

| Component | Value | Display |
|-----------|-------|---------|
| Platform fee | 15-25% (tier-dependent) | Shown at booking confirmation |
| Stripe fee | ~2.9% + R$ 0.30 (BR cards) / 1.5% + £0.20 (EU cards) | Absorbed by Muuday |
| Trolley fee | ~$1-3 + 1% per payout | Absorbed by Muuday (not charged to pro) |
| Muuday platform fee | R$ 15 (weekly) / R$ 10 (biweekly) / R$ 5 (monthly) | Deducted from pro payout |

### Payout Schedule

| Setting | Default | Configurable |
|---------|---------|-------------|
| Frequency | Weekly (Mondays) | Yes (weekly/biweekly/monthly) |
| Minimum balance | R$ 50 | Yes (R$ 50 / R$ 100 / R$ 250) |
| Hold period | 7 days after session | No (fraud protection) |

### Refund Impact on Pro

| Scenario | Pro Impact |
|----------|------------|
| Full refund (before session) | No payout |
| Partial refund (dispute resolved) | Adjusted payout |
| Pro no-show | Full refund to user; pro gets 0 |
| User no-show | Pro keeps full amount |

---

## 5. Deep Review & Recommendations

### Critical Issues

#### C1: Page Is a Placeholder
**Severity:** Critical  
**Impact:** Pros cannot verify earnings; trust erosion  
**Fix:** Build real transaction list with fee breakdown.

#### C2: No Net Earnings Display
**Severity:** Critical  
**Impact:** Pros think they earn more than they do  
**Fix:** Show gross, fees, and net on every transaction.

#### C3: No Payout Information
**Severity:** High  
**Impact:** Pros don't know when they'll be paid  
**Fix:** Add payout schedule, next payout date, and history.

### High Priority

#### H1: No Earnings Trend
**Severity:** High  
**Impact:** Cannot optimize pricing/availability  
**Fix:** Add weekly/monthly earnings chart.

#### H2: No Transaction Drill-Down
**Severity:** High  
**Impact:** Cannot reconcile with bank statement  
**Fix:** Transaction detail modal with full breakdown.

#### H3: No Tax Document Access
**Severity:** Medium  
**Impact:** Pros cannot file taxes  
**Fix:** Generate monthly/annual earning reports.

---

## 6. Implementation Plan

### Phase 1: Transaction List (Week 1)

| Task | File | Effort |
|------|------|--------|
| Transaction list component | `components/finance/TransactionList.tsx` | 2 days |
| Fee breakdown calculation | `lib/finance/fee-breakdown.ts` | 1 day |
| Update financeiro page | `app/(app)/financeiro/page.tsx` | 1 day |

### Phase 2: Payout Section (Week 1-2)

| Task | File | Effort |
|------|------|--------|
| Payout status component | `components/finance/PayoutStatus.tsx` | 1 day |
| Payout history | `components/finance/PayoutHistory.tsx` | 1 day |
| Trolley payout integration | `lib/payments/trolley/client.ts` | 2 days |

### Phase 3: Earnings Analytics (Week 2)

| Task | File | Effort |
|------|------|--------|
| Earnings chart | `components/finance/EarningsChart.tsx` | 2 days |
| Metrics calculation | `lib/finance/metrics.ts` | 1 day |

### Phase 4: Tax Documents (Week 3)

| Task | File | Effort |
|------|------|--------|
| Monthly report generation | `lib/finance/reports.ts` | 2 days |
| Report download (PDF/CSV) | `app/api/finance/reports/route.ts` | 1 day |

---

## Related Documents

- `docs/product/journeys/professional-workspace-journey.md` — Dashboard earnings card
- `docs/product/journeys/payments-billing-revenue.md` — Backend payment flow
- `docs/product/journeys/operator-case-resolution.md` — Dispute/refund cases


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.

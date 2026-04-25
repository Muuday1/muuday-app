# Runbook: Dispute After Payout

> **Scenario:** A customer disputes a charge AFTER the professional has already been paid out.
> **Impact:** Stripe debits Muuday. Professional may no longer have the funds. Debt must be recovered.
> **Severity:** CRITICAL — potential revenue loss + professional relationship damage.

---

## 1. Detection

### Automated Alerts
- Stripe webhook: `charge.dispute.created` event received
- Inngest function: `stripe-webhook-processor` logs dispute creation
- Dashboard: New dispute appears in `/admin/finance/disputes`
- Email alert: Admin receives notification if dispute amount > threshold

### Key Data Points
```sql
-- Find dispute details
SELECT d.id, d.booking_id, d.amount, d.status, d.reason,
       b.professional_id, p.total_debt
FROM dispute_resolutions d
JOIN bookings b ON b.id = d.booking_id
LEFT JOIN professional_balances p ON p.professional_id = b.professional_id
WHERE d.id = '<dispute_id>';
```

---

## 2. Immediate Assessment (First 10 minutes)

### 2.1 Has the Professional Been Paid?
```sql
-- Check if booking was included in a completed payout batch
SELECT pbi.id, pbi.batch_id, pbi.net_amount, pb.status, pb.completed_at
FROM payout_batch_items pbi
JOIN payout_batches pb ON pb.id = pbi.batch_id
JOIN booking_payout_items bpi ON bpi.payout_batch_item_id = pbi.id
WHERE bpi.booking_id = '<booking_id>'
  AND pb.status = 'completed';
```

### 2.2 Current Professional Balance
```sql
SELECT professional_id, available_balance, total_debt, last_payout_at
FROM professional_balances
WHERE professional_id = '<professional_id>';
```

### 2.3 Decision Matrix

| Scenario | Professional Paid? | Balance Covers Debt? | Action |
|----------|-------------------|---------------------|--------|
| A | No | — | Freeze eligibility, deduct from next payout |
| B | Yes | Yes | Create debt record, deduct from balance |
| C | Yes | No | Create debt record, balance goes negative, block future payouts |
| D | Partial | Partial | Create debt for full amount, deduct what possible |

---

## 3. Recovery Procedures

### 3.1 Create Debt Record (All Scenarios)
The system should do this automatically via webhook handler. Verify it happened:
```sql
-- Check if debt was recorded
SELECT * FROM professional_balances
WHERE professional_id = '<professional_id>';

-- Verify ledger entry exists
SELECT * FROM ledger_transactions
WHERE reference_type = 'dispute_after_payout'
  AND reference_id = '<booking_id>';
```

If missing, create manually:
```sql
-- Debit: PROFESSIONAL_DEBT (equity increases = more debt)
-- Credit: CASH_REVOLUT_TREASURY (asset decreases)
INSERT INTO ledger_transactions (account_code, amount, type, reference_type, reference_id, metadata)
VALUES
  ('4100', <dispute_amount>, 'debit', 'dispute_after_payout', '<booking_id>', '{"dispute_id": "<id>"}'),
  ('1000', <dispute_amount>, 'credit', 'dispute_after_payout', '<booking_id>', '{"dispute_id": "<id>"}');

-- Update professional balance
SELECT update_professional_balance_atomic(
  '<professional_id>',
  0, 0, 0,
  '<dispute_amount>'::bigint
);
```

### 3.2 If Professional Has NOT Been Paid (Scenario A)
- Booking is likely still in `pending_balance` or `withheld_balance`
- No debt recovery needed from professional
- Stripe will refund customer from Muuday treasury
- Create ledger entry:
  ```
  Debit: CUSTOMER_DEPOSITS_HELD
  Credit: STRIPE_RECEIVABLE
  ```
- Mark booking as `refunded`

### 3.3 If Professional HAS Been Paid (Scenarios B, C, D)
- Professional now owes Muuday the disputed amount
- Debt is tracked in `professional_balances.total_debt`
- Future payouts will deduct debt first (automatic via `calculatePayout`)
- If debt > available balance, professional is blocked from payouts until debt is cleared

### 3.4 If Professional Refuses to Repay
- **Legal action:** Document all communications
- **Account suspension:** Set `professionals.status = 'suspended'`
- **Escalation:** Finance + Legal team
- **Write-off:** If unrecoverable, admin can use `adjustProfessionalBalance` to zero debt with audit trail

---

## 4. Stripe Dispute Response

### 4.1 Accept Dispute (Refund Customer)
- Use Stripe dashboard or API to accept dispute
- Customer is refunded automatically
- Follow recovery procedures above for debt tracking

### 4.2 Challenge Dispute (Evidence Required)
- Collect evidence: booking confirmation, session completion proof, communication logs
- Submit evidence via Stripe dashboard within deadline (usually 7-21 days)
- If won: no further action needed
- If lost: follow recovery procedures above

### 4.3 Dispute Reversed (Customer Loses)
- Stripe returns funds to Muuday
- If professional was charged debt: reverse the debt
```sql
-- Reverse debt ledger entry
-- Debit: CASH_REVOLUT_TREASURY
-- Credit: PROFESSIONAL_DEBT (negative = debt reduction)

-- Update balance
SELECT update_professional_balance_atomic(
  '<professional_id>',
  0, 0, 0,
  '-<amount>'::bigint
);
```

---

## 5. Communication Templates

### To Professional (Debt Created)
> "Olá [Name], uma sessão sua foi contestada pelo cliente. Como o pagamento já havia sido transferido para você, criamos um registro de dívida no valor de [amount]. Este valor será deduzido automaticamente do seu próximo pagamento. Se tiver dúvidas, entre em contato com o suporte."

### To Professional (Dispute Reversed)
> "Boa notícia! A contestação foi resolvida a seu favor. A dívida registrada foi cancelada e o valor retornará ao seu saldo disponível."

---

## 6. Prevention

1. **Cool-down period:** 48h between session completion and payout eligibility
2. **Dispute window monitoring:** Track disputes within 120 days of charge
3. **Professional education:** Clear terms about dispute liability
4. **KYC quality:** Better KYC = fewer fraudulent professionals

---

## 7. Related Code

- `app/api/webhooks/stripe/route.ts` — `charge.dispute.created` handler
- `lib/payments/ledger/entries.ts` — `buildDisputeAfterPayoutTransaction()`
- `lib/payments/ledger/balance.ts` — `updateProfessionalBalance()`
- `lib/payments/fees/calculator.ts` — `calculatePayout()` (debt deduction)
- `lib/actions/admin/finance.ts` — `adjustProfessionalBalance()`

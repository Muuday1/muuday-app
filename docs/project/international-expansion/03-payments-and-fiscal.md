# Pagamentos e Fiscal — Expansão Internacional Muuday

> Data: 2026-04-23  
> Status: Aprovado pelo founder  
> Escopo: Como o dinheiro entra, como o dinheiro sai, e como declaramos isso no UK.

---

## 1. Visão Geral do Fluxo de Dinheiro

> **ATUALIZAÇÃO (2026-04-24):** O fluxo ativo é **Stripe UK → Revolut Business → Trolley**. Não usamos PayPal para payouts. Airwallex/dLocal são contingência.

```
┌─────────────────┐     Stripe UK      ┌──────────────────┐
│ Cliente (expat) │ ─────────────────► │ Stripe UK        │
│ - Cartão CC     │    (pagamento)     │ (muuday.com)     │
│ - Apple Pay     │                    │                  │
│ - Google Pay    │                    │                  │
│ - PayPal        │                    │                  │
└─────────────────┘                    └────────┬─────────┘
                                                │
                                                │ settlement (T+7 dias)
                                                │
                                                ▼
                                       ┌──────────────────┐
                                       │ Revolut Business │
                                       │ (conta treasury) │
                                       └────────┬─────────┘
                                                │
                                                │ payout
                                                │
                                                ▼
                                       ┌──────────────────┐
                                       │ Trolley          │
                                       │ (mass payouts)   │
                                       └────────┬─────────┘
                                                │
                       ┌────────────────────────┼────────────────────────┐
                       │                        │                        │
                       ▼                        ▼                        ▼
               ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
               │ Profissional │        │ Profissional │        │ Profissional │
               │ (Brasil)     │        │ (México)     │        │ (outros)     │
               │ Recebe BRL   │        │ Recebe MXN   │        │ Recebe local │
               │ na conta     │        │ na conta     │        │ na conta     │
               │ bancária     │        │ bancária     │        │ bancária     │
               └──────────────┘        └──────────────┘        └──────────────┘

PARALELO (auditoria):
┌─────────────────────────────────────────────────────────────┐
│  Ledger Double-Entry (interno)                              │
│  ─────────────────────────────                              │
│  1. Customer pays → Stripe Receivable ↑ / Customer Deposits ↑│
│  2. Stripe settles → Cash ↑ / Stripe Receivable ↓           │
│  3. Payout professional → Professional Payable ↑ / Cash ↓   │
│  4. Dispute/refund → reverso com tracking de dívida        │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Recebimento de Clientes (Stripe UK)

### Decisão
**TODOS os pagamentos de clientes passam pela conta Stripe UK**, independente do país do cliente ou do profissional.

### Por quê
- A empresa é UK; Stripe UK é a entidade correta para receber.
- Stripe UK suporta pagamentos globais em qualquer moeda.
- Não precisamos de conta Stripe Brasil, Stripe México, etc.
- O cliente vê o preço na moeda dele (BRL, MXN, USD, GBP, EUR), mas a transação é processada pela entidade UK.

### Moedas de Apresentação
| Mercado | Moeda de Apresentação | Stripe Currency Code |
|---------|----------------------|----------------------|
| Brasil | Real (R$) | `brl` |
| México | Peso Mexicano ($) | `mxn` |
| Portugal | Euro (€) | `eur` |
| EUA | Dólar ($) | `usd` |
| UK | Libra (£) | `gbp` |
| Genérico | Dólar ($) | `usd` |

### Implementação Técnica
```ts
// lib/stripe/checkout.ts
export async function createCheckoutSession({
  professional,
  sessionType,
  clientCountry,
}: CheckoutParams) {
  const market = MARKETS[professional.market_code]
  
  // Preço em centavos na moeda do mercado do profissional
  const amount = professional.session_price  // já está em cents
  const currency = market.currency.toLowerCase() // 'brl', 'mxn', etc.
  
  const session = await stripeUK.checkout.sessions.create({
    line_items: [{
      price_data: {
        currency,
        unit_amount: amount,
        product_data: {
          name: `Sessão com ${professional.full_name}`,
        },
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${APP_URL}/agenda/sucesso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/profissional/${professional.slug}`,
    // O cliente pode pagar com qualquer método suportado globalmente
    payment_method_types: ['card'], // Apple Pay, Google Pay são automáticos via Stripe
  })
  
  return session
}
```

### Taxas Stripe UK
- 1.5% + £0.20 para cartões europeus
- 2.5% + £0.20 para cartões internacionais
- Essas taxas são absorvidas pela Muuday (incluídas na comissão).

---

## 3. Pagamento aos Profissionais via Trolley

> **ATUALIZAÇÃO (2026-04-24):** Trolley é o payout provider **primário** desde o início. Não usamos PayPal. O ledger double-entry já está implementado.

### Arquitetura Ativa
**Stripe UK (pay-in) → Revolut Business (treasury) → Trolley (payout)**

### Como funciona
1. Profissional completa onboarding no Trolley (via embed ou redirect da Muuday).
2. Trolley coleta PayPal e tax forms (W-8BEN para não-residentes US, W-9 para US persons).
   > **Nota**: No MVP, apenas PayPal é suportado. Transferência bancária será adicionada em fase futura.
3. Stripe UK recebe pagamento do cliente e settle para Revolut Business (T+7 dias).
4. Toda segunda-feira (8am UTC), o sistema:
   - Scaneia bookings elegíveis (48h após sessão, sem disputa aberta)
   - Calcula saldo disponível por profissional
   - Deduza dívida existente (disputas pós-payout)
   - **NÃO deduz fee por payout** — profissionais recebem 100% do valor elegível
   - Fee mensal é cobrada separadamente via Stripe subscription (Phase 6)
   - Verifica se saldo Revolut ≥ total do batch + safety buffer (R$ 10.000)
   - Se suficiente: cria batch no Trolley e envia
   - Se insuficiente: batch fica em `insufficient_funds`, alerta admin
5. Trolley processa e envia para PayPal do profissional.
   > **Nota**: No MVP, payout é via PayPal apenas. Transferência bancária em fase futura.

### Vantagens do Trolley
- Menor taxa que Stripe Connect para corridors internacionais.
- Profissional NÃO precisa criar conta Stripe (menor fricção).
- PayPal (MVP); transferência bancária direta (ACH, SEPA, local rails) em fase futura.
- Tax forms automáticos (W-8BEN, W-9) — compliance IRS.
- Dashboard para profissionais acompanharem status.

### Custo
- Setup: $0
- Por transação: ~$1-3 + 1% (dependendo do método e corridor)
- Plano: gratuito até certo volume, depois ~$50-200/mês

### Ledger Double-Entry
Cada payout gera entries no ledger:
- **Débito**: Professional Payable (reduz liability)
- **Crédito**: Cash (reduz asset)
- Profissional balance: `available` → transferido para `paid_out`

### Implementação (já entregue em Fase 6.1)
```ts
// lib/payments/trolley/client.ts
export async function createTrolleyRecipient(...) { ... }
export async function createPayment(...) { ... }
export async function createBatch(...) { ... }

// lib/payments/ledger/entries.ts
export async function createPayoutEntry(...) { ... }

// inngest/functions/payout-batch-create.ts
// Roda toda segunda 8am UTC
```

### Contingência
Se Trolley falhar para corridor BR:
- **Airwallex**: rail alternativo para BR (já avaliado, API pronta)
- **dLocal**: fallback se Airwallex também falhar
- Ativação manual via admin dashboard (feature flag)

**Implementação:**
```ts
// lib/payouts/trolley.ts
import { Trolley } from '@trolley/core'

const trolley = new Trolley({
  accessKey: process.env.TROLLEY_ACCESS_KEY,
  secretKey: process.env.TROLLEY_SECRET_KEY,
})

export async function createTrolleyRecipient(professional: Professional) {
  const recipient = await trolley.recipient.create({
    type: 'individual',
    firstName: professional.first_name,
    lastName: professional.last_name,
    email: professional.email,
    // ... dados bancários
  })
  return recipient
}

export async function sendTrolleyPayout({
  recipientId,
  amount,
  currency,
}: TrolleyPayoutParams) {
  const payment = await trolley.payment.create({
    recipient: { id: recipientId },
    amount: { value: amount.toString(), currency },
  })
  return payment
}
```

### Fase 3: Wise/Bank Transfer (Futuro)
Para profissionais que preferem transferência bancária direta.

---

## 4. Modelo de Comissão e Split

### Decisão
- **Comissão da plataforma:** 15-20% do valor da sessão (a definir).
- **Taxas de processamento:** Absorvidas pela plataforma (deduzidas da comissão).
- **Payout ao profissional:** Valor da sessão menos comissão da plataforma.

### Exemplo (Brasil)
```
Sessão: R$ 200,00
Comissão Muuday (20%): R$ 40,00
Taxa Stripe (2.5% + £0.20 ≈ R$ 5,50): R$ 5,50
Taxa PayPal/Trolley (≈ R$ 8,00): R$ 8,00

Receita Muuday: R$ 40,00 - R$ 5,50 - R$ 8,00 = R$ 26,50
Payout Profissional: R$ 160,00
```

### Exemplo (México)
```
Sessão: $1.500 MXN
Comissão Muuday (20%): $300 MXN
Taxa Stripe: ≈ $40 MXN
Taxa Payout: ≈ $60 MXN

Receita Muuday: $300 - $40 - $60 = $200 MXN
Payout Profissional: $1.200 MXN
```

### Quando o payout acontece?
**Opção A: Imediato (Stripe Connect style)**
- Cliente paga → Stripe split automaticamente entre plataforma e profissional.
- **Problema:** Requer Stripe Connect, que tem KYC pesado para profissionais internacionais.

**Opção B: Agendado (Trolley/PayPal style)**
- Cliente paga → dinheiro fica na conta UK.
- Toda semana/dois em dois dias: payout em lote para todos os profissionais.
- **Vantagem:** Controle total do cash flow, menos taxas Stripe Connect.
- **Desvantagem:** Profissional não recebe imediatamente.

**Recomendação:** Opção B (agendado). É como funciona a maioria dos marketplaces (Uber, Airbnb).

---

## 5. Fiscalidade UK

### Empresa
- **Nome:** Muuday Ltd (ou equivalente)
- **Jurisdição:** England and Wales
- **Regulador:** Companies House + HMRC

### Obrigações Fiscais

#### Corporation Tax
- Taxa: 25% (a partir de abril 2023 para lucros acima de £250k; 19% para lucros até £50k; tapered entre £50k-£250k).
- A Muuday paga corporation tax sobre o lucro (receita - despesas).
- **Payouts a profissionais são despesas operacionais** (cost of sales), não salários.

#### VAT (Value Added Tax)
- Threshold: £85.000/ano de turnover.
- Se abaixo: não precisa registrar VAT.
- Se acima: obrigatório registrar e cobrar VAT (20%).
- **Serviços digitais para consumidores no EU:** VAT do país do consumidor (MOSS scheme).
- **Serviços para profissionais (B2B):** Reverse charge (não cobra VAT).

> **Nota:** Precisamos de contador UK para confirmar se os serviços da Muuday qualificam como "digital services" e se há VAT sobre a comissão da plataforma.

#### PAYE / NIC
- Não aplica (profissionais são contractors, não funcionários).

#### Anti-Money Laundering (AML)
- A Muuday deve manter registros de:
  - Identidade dos profissionais (KYC).
  - Origem dos fundos (cliente pagou via Stripe).
  - Destino dos fundos (payout para profissional no Brasil/México).
- Trolley ajuda com compliance AML.

### Declaração de Payouts Internacionais
- A Muuday UK precisa declarar para HMRC que fez pagamentos internacionais.
- Isso é feito anualmente na corporation tax return (CT600).
- Não há withholding tax sobre payouts para Brasil ou México (UK não retém imposto na fonte para esses países, exceto em casos específicos de royalties — não aplica).

### O que o profissional precisa fazer no país dele?
- **Brasil:** Declarar receita como "rendimento de trabalho autônomo" no IRPF. A Muuday NÃO emite nota fiscal (a transação é UK-UK, o payout é internacional).
- **México:** Declarar como "prestación de servicios al extranjero". Pode estar isento de IVA se o serviço é para fora do México (art. 15-A LIVA), mas precisa de parecer fiscal mexicano.
- **Portugal:** Declarar como "prestação de serviços" no IRS.

> **A responsabilidade fiscal do profissional é do profissional.** A Muuday fornece um relatório anual de payouts para ajudar na declaração.

---

## 6. Não-Emissão de Nota Fiscal

### Por quê não emitimos nota fiscal no Brasil?
1. **A entidade faturante é UK**, não uma empresa brasileira.
2. **O serviço é prestado fora do Brasil** (cliente está no exterior, profissional atende online).
3. **O dinheiro entra no UK**, não no Brasil.
4. **O payout para o profissional é uma transferência internacional**, não uma transação comercial brasileira.
5. **Não há CNPJ da Muuday no Brasil** para emitir nota fiscal.

### O que o profissional precisa?
- O profissional brasileiro pode emitir nota fiscal (NFS-e) em nome próprio se quiser, mas isso é responsabilidade dele.
- A Muuday fornece um **recibo/comprovante de pagamento** (payout receipt) com:
  - Data do pagamento
  - Valor em BRL
  - Identificação do pagador (Muuday Ltd, UK)
  - Descrição do serviço

### Futuro (se a Muuday abrir subsidiária no Brasil)
- Se um dia a Muuday quiser ter CNPJ no Brasil, aí sim poderia emitir nota fiscal.
- Mas isso é uma decisão estratégica futura, não necessária para o MVP.

---

## 7. Checklist de Ações Imediatas

- [ ] Contratar contador UK (accountant) para confirmar tratamento fiscal.
- [ ] Confirmar com Stripe que UK account suporta apresentação em MXN/BRL/EUR.
- [ ] Criar conta PayPal Business UK para payouts (se ainda não tiver).
- [ ] Criar conta Trolley (gratuita, só para testar API).
- [ ] Documentar o modelo de split (comissão, taxas, payout) para o time.
- [ ] Criar template de "payout receipt" para profissionais.


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.

# Decisões Arquiteturais — Expansão Internacional Muuday

> Data: 2026-04-23  
> Status: Aprovado pelo founder  
> Escopo: Arquitetura de mercado, jurisdição, routing, pagamentos e CMS

---

## 1. Jurisdição Legal e Termos de Uso

### Decisão
**Toda a plataforma Muuday opera sob jurisdição de Londres, Reino Unido (UK), independente do mercado (Brasil, México, Portugal, etc.).**

### Justificativa
- A empresa é registrada no UK.
- Não queremos assumir obrigações fiscais, trabalhistas ou regulatórias secundárias em dezenas de países.
- O modelo de negócio é: plataforma UK conecta cliente (expat em qualquer lugar do mundo) com profissional (no país de origem do expat).
- O serviço é prestado remotamente; a transação comercial passa pela entidade UK.

### Implicações Técnicas
- Os termos de uso, política de privacidade e termos do profissional devem citar:
  - **Lei aplicável:** Laws of England and Wales.
  - **Jurisdição:** Courts of England and Wales, London.
  - **Empresa:** Muuday Ltd (UK), endereço em Londres.
- LGPD, LFPDPPP, GDPR são mencionados como leis de **proteção de dados aplicáveis ao tratamento de dados pessoais** dos titulares residentes naqueles países, mas NÃO alteram a jurisdição contratual.
- Não precisamos de variações de jurisdição por país. Um único documento legal (em português/español) com cláusula de eleição de foro UK é suficiente.

### O que muda no código HOJE
- `lib/legal/professional-terms.ts` e `lib/legal/terms.ts` estão com jurisdição SP/BR — **precisam ser corrigidos AGORA** para UK.
- Cookie consent já menciona LGPD/GDPR — está OK, apenas adicionar LFPDPPP para México quando aplicável.

---

## 2. Modelo de Pagamentos

> **ATUALIZAÇÃO (2026-04-24):** O modelo foi refinado pelo founder. O fluxo ativo é **Stripe UK (pay-in) → Revolut Business (treasury) → Trolley (payout)**. Não usamos Stripe Connect para payouts. Airwallex/dLocal são contingência.

### Decisão
| Ator | Função | Processador | Notas |
|------|--------|-------------|-------|
| **Cliente (expat)** | Pagamento da sessão | Stripe UK | Cartão, Apple Pay, Google Pay, PayPal. Todos os clientes, todas as moedas. |
| **Muuday (treasury)** | Recebimento de Stripe + fundação de payouts | Revolut Business | Conta corporativa UK. Stripe settle aqui. |
| **Profissional** | Recebimento do payout | Trolley | Mass payouts, KYC, tax forms (W-8BEN). NÃO PayPal. |

### Justificativa
- Clientes expats já moram fora; não precisam de Pix, Boleto, SPEI, Oxxo Pay.
- Eles querem métodos globais: CC, Apple Pay, PayPal, Alipay.
- Stripe UK processa pagamentos globais em múltiplas moedas.
- **Stripe Connect foi REJEITADO** para payouts: não queremos que profissionais precisem criar conta Stripe. Trolley é mais simples para o profissional.
- Revolut Business serve como conta treasury: recebe settlements de Stripe e funda os payouts para Trolley.
- Trolley é especializado em mass payouts internacionais, coleta dados bancários e tax forms automaticamente.
- **NÃO haverá emissão de nota fiscal no Brasil** — o serviço é prestado fora do Brasil, a entidade faturante é UK, e o profissional é um contractor independente.

### Fluxo de Dinheiro
```
Cliente (qualquer moeda)
  │
  ▼ Stripe UK
  │
  ▼ Revolut Business (treasury)
  │
  ├─► Trolley ──► Profissional (BRL, MXN, etc.)
  │
  └─► Ledger (double-entry) ──► Auditoria/Compliance
```

### Implicações Fiscais (UK)
- A Muuday UK recebe o dinheiro do cliente expat via Stripe.
- Stripe settle para Revolut Business (conta UK).
- A Muuday UK repassa (menos comissão) ao profissional via Trolley.
- A Muuday UK declara a receita na HMRC (HM Revenue & Customs).
- A Muuday UK precisa manter evidência de que o dinheiro saiu do UK para o profissional no exterior (compliance anti-lavagem de dinheiro).
- **Ledger double-entry interno** provê trilha de auditoria completa para HMRC.
- **Ainda precisamos de contador UK** para definir se há VAT (UK VAT threshold é £85k/ano), se há withholding tax, e como declarar payouts internacionais.
- Profissionais são **independent contractors**, não funcionários. Eles são responsáveis por sua própria tributação local (IR no Brasil, ISR no México).

### O que muda no código
- `lib/stripe/client.ts`: Remover a noção de "Stripe BR" vs "Stripe UK". Usar **Stripe UK para todos os clientes**.
- `lib/stripe/client.ts`: **Remover Stripe Connect** — payouts são Trolley, não Stripe.
- `lib/payments/trolley/client.ts`: Já implementado. Integração ativa.
- `lib/payments/revolut/client.ts`: Já implementado. Snapshot de saldo a cada 15min.
- `lib/payments/ledger/`: Já implementado. Double-entry ledger ativo.
- Colunas `session_price_brl`, `price_brl`: Renomear para `session_price_minor`, `price_minor` + `currency` (BRL, MXN, USD, GBP, EUR).
- Planos de assinatura (`lib/professional/plan-pricing.ts`): Precisam de preços em múltiplas moedas.

---

## 3. CMS Headless

### Decisão
Usar **CMS Headless** para conteúdo por mercado.

### Critérios de Seleção
| Critério | Peso | Notas |
|----------|------|-------|
| Custo | Alto | Startup, não quer pagar $500+/mês |
| Escalabilidade | Alto | Precisa suportar 5+ mercados, 1000+ artigos |
| Self-hosting opcional | Médio | Queremos evitar vendor lock-in |
| i18n nativo | Alto | Suporte a múltiplos locales por item |
| API GraphQL/REST | Alto | Integração fácil com Next.js |
| Rich text | Médio | Para guias e blog posts |
| Relacionamentos | Médio | Guias relacionados a categorias/profissões |

### Opções Avaliadas

| CMS | Custo | Self-hosted | i18n | Prós | Contras |
|-----|-------|-------------|------|------|---------|
| **Strapi** | Gratuito (self-hosted) | Sim | Sim (plugin) | Open source, flexível, Node.js | Precisa hospedar (Vercel não roda Strapi) |
| **Directus** | Gratuito (self-hosted) | Sim | Sim | Open source, muito flexível, SQL puro | Curva de aprendizado |
| **Sanity** | $0-99/mês | Não | Sim | Excelente DX, GROQ queries, previews | SaaS, custo escala com usuários |
| **Contentful** | $0-489/mês | Não | Sim | Enterprise-grade, robusto | Caro em escala, complexo |
| **Ghost** | $0-25/mês | Sim | Sim | Focado em blog/newsletter | Menos flexível para dados estruturados |
| **Notion (com API)** | $0-10/mês | Não | Limitado | Familiar, rápido de usar | Não é CMS, limitado para i18n |
| **Supabase (tabelas custom)** | $0-25/mês | Sim | Manual | Já usamos Supabase | Precisa construir interface de admin |

### Recomendação: Sanity

**Por quê:**
1. **Custo inicial zero** (free tier generoso: 3 usuários, 100k API calls/mês).
2. **DX excepcional** — GROQ queries são perfeitas para Next.js.
3. **i18n nativo** — cada documento pode ter múltiplos locales (`pt-BR`, `es-MX`, `pt-PT`).
4. **Previews em tempo real** — editores veem mudanças instantaneamente.
5. **Não precisa hospedar** — menos infra para gerenciar.
6. **Escala gradualmente** — pague só quando crescer.

**Custo estimado:**
- Até 100k API calls/mês: **Gratuito**
- Growth (10 usuários, 500k calls): **$99/mês**
- Enterprise: sob consulta

**Alternativa se quiser self-hosted:** Directus (roda em Docker, gratuito, SQL puro, i18n nativo).

### O que vai no CMS
- Landing page blocks (hero, stats, features, testimonials, FAQ)
- Guias (todos os países)
- Blog posts
- Termos legais e políticas (por locale, mas mesma jurisdição UK)
- FAQ do produto
- Emails de marketing (templates)

### O que NÃO vai no CMS
- Taxonomia de profissões (fica no Supabase — é dados estruturados)
- Configurações de preço (fica no código/Supabase)
- Configurações de Stripe/Trolley (fica no código)

---

## 4. Estrutura de URLs e SEO

### Decisão
Usar **subdiretórios por locale/market**:

```
muuday.com/br/    → Brasil (pt-BR)
muuday.com/mx/    → México (es-MX)
muuday.com/pt/    → Portugal (pt-PT)
muuday.com/       → Página de detecção de mercado OU redirect para /br/ (atualmente)
```

### Justificativa
- SEO authority concentrada no domínio raiz.
- Fácil implementação no Next.js App Router.
- Compartilhamento de link equity entre mercados.
- Google recomenda subdiretórios para conteúdo similar em idiomas diferentes.
- Custo zero (não precisa registrar TLDs adicionais).

### Implementação no Next.js
```ts
// next.config.js (futuro)
// Ou usar next-intl com App Router

// app/(markets)/br/page.tsx
// app/(markets)/mx/page.tsx
// app/(markets)/layout.tsx → MarketProvider

// middleware.ts detecta mercado e redireciona
```

### hreflang
Cada página deve ter tags `hreflang` apontando para as variantes de mercado:
```html
<link rel="alternate" hreflang="pt-BR" href="https://muuday.com/br/" />
<link rel="alternate" hreflang="es-MX" href="https://muuday.com/mx/" />
<link rel="alternate" hreflang="pt-PT" href="https://muuday.com/pt/" />
<link rel="alternate" hreflang="x-default" href="https://muuday.com/" />
```

---

## 5. Detecção e Direcionamento de Mercado

### Decisão
**Detecção Automática + Confirmação Manual (com override persistente).**

### Como funciona
1. Usuário entra em `muuday.com/`.
2. Sistema coleta múltiplos sinais (ver abaixo).
3. Sistema **sugere** um mercado (ex: México).
4. Mostra um **banner não-intrusivo** no topo:
   > "🇲🇽 Parece que você está procurando por especialistas mexicanos. [Sim, ir para México] [Não, estou procurando por brasileiros 🇧🇷] [Portugal 🇵🇹]"
5. Se o usuário escolher, salva `muuday_market` cookie (365 dias) e recarrega a página no mercado correto.
6. Se o usuário ignorar, continua no mercado detectado (ou no default BR).

### Sinais de detecção (ordem de prioridade)

```ts
// lib/market/detection.ts

function detectMarket(request: NextRequest): string {
  // 1. Cookie existente (escolha anterior do usuário — MÁXIMA prioridade)
  const cookieMarket = request.cookies.get('muuday_market')?.value
  if (cookieMarket) return cookieMarket

  // 2. Parâmetro de URL (?market=mx)
  const urlMarket = request.nextUrl.searchParams.get('market')?.toUpperCase()
  if (urlMarket && MARKETS[urlMarket]) return urlMarket

  // 3. Accept-Language do browser
  const acceptLang = request.headers.get('accept-language')
  if (acceptLang) {
    const primaryLang = acceptLang.split(',')[0]?.toLowerCase()
    if (primaryLang?.startsWith('es')) return 'MX'  // ou detectar es-MX vs es-ES
    if (primaryLang?.startsWith('pt')) {
      // Distinguir pt-BR vs pt-PT
      if (primaryLang.includes('br')) return 'BR'
      if (primaryLang.includes('pt')) return 'PT'
      return 'BR' // default para português
    }
  }

  // 4. IP Geolocation (menor prioridade — expat pode estar em qualquer lugar)
  const ipCountry = request.headers.get('x-vercel-ip-country')?.toUpperCase()
  if (ipCountry === 'BR') return 'BR'
  if (ipCountry === 'MX') return 'MX'
  if (ipCountry === 'PT') return 'PT'

  // 5. Default fallback
  return 'BR'
}
```

### Por que IP geolocation NÃO é suficiente
- Brasileiro morando em Londres → IP UK → detectaria UK (errado, deveria ser BR).
- Mexicano morando em Nova York → IP US → detectaria US (errado, deveria ser MX).
- Por isso, **Accept-Language é mais confiável** que IP para expats.
- Mas o usuário deve SEMPRE poder escolher e persistir a escolha.

### Persistência
```ts
// Cookie com 1 ano de duração
response.cookies.set('muuday_market', market, {
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
})
```

---

## 6. Isolamento de Profissionais por Mercado

### Decisão
Cada profissional pertence a **um mercado principal** (`market_code`). Clientes de um mercado só veem profissionais daquele mercado.

### Implementação
```sql
-- Adicionar à tabela professionals
ALTER TABLE professionals ADD COLUMN market_code TEXT NOT NULL DEFAULT 'BR';
CREATE INDEX idx_professionals_market ON professionals(market_code);

-- Modificar a função de busca
CREATE OR REPLACE FUNCTION search_public_professionals_pgtrgm(
  p_market TEXT DEFAULT NULL,
  p_query TEXT DEFAULT NULL,
  ...
)
RETURNS TABLE (...) AS $$
  SELECT ...
  FROM professionals p
  JOIN profiles pr ON p.user_id = pr.id
  WHERE p.status = 'approved'
    AND (p_market IS NULL OR p.market_code = p_market)
    -- ... resto dos filtros
$$;
```

### Profissional em múltiplos mercados?
Por enquanto: **NÃO**. Um profissional se cadastra em UM mercado.
Futuramente, podemos permitir que um profissional brasileiro que fala espanhol também se cadastre no mercado MX (criando um segundo registro na tabela `professionals` com `market_code = 'MX'`).

---

## 7. Resumo de Decisões

| Decisão | Status |
|---------|--------|
| Jurisdição legal: UK para todos os mercados | ✅ Aprovado |
| Termos: Um documento por idioma, jurisdição UK | ✅ Aprovado |
| Pagamentos cliente: Stripe UK (CC, Apple Pay, PayPal, Alipay) | ✅ Aprovado |
| Pagamentos profissional: PayPal inicial, depois Trolley | ✅ Aprovado |
| Sem nota fiscal no Brasil (entidade UK) | ✅ Aprovado |
| Fiscal: Contador UK para HMRC/VAT | ⚠️ Pendente (contratar) |
| CMS: Sanity (headless, i18n nativo) | ✅ Aprovado |
| URLs: Subdiretórios (`/br/`, `/mx/`) | ✅ Aprovado |
| Detecção: Accept-Language + IP + cookie + confirmação manual | ✅ Aprovado |
| Isolamento: `market_code` em `professionals` | ✅ Aprovado |


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.

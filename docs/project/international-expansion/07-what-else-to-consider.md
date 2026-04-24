# O Que Mais Falta Pensar? — Expansão Internacional Muuday

> Data: 2026-04-23  
> Status: Brainstorm de gaps não cobertos nos outros documentos  
> Escopo: Coisas que ainda não discutimos mas que vão aparecer

---

## 1. Customer Support Multi-Idioma ✅ DECIDIDO

**Decisão:** Intercom/Zendesk com auto-translate (DeepL API) + 1 freelancer mexicano part-time (10-20h/semana). AI-first, custo-eficiente, escalável.

**Fase 1 — Brasil (agora):**
- Continue com equipe atual + Intercom/Zendesk.
- Usar IA para draft de respostas (acelerar tempo de resposta em PT).

**Fase 2 — México (lançamento, primeiros 6-12 meses):**
- **Tool:** Intercom com DeepL API auto-translate.
  - Cobre 80% dos tickets simples (senha, agendamento, pagamento).
  - Custo: ~$300/mês (Intercom Growth).
- **Freelancer mexicano part-time** (10-20h/semana via Deel/Remote):
  - Revisa traduções de tickets complexos (disputas, termos legais, contexto cultural).
  - Valida conteúdo cultural mexicano.
  - Custo: ~$800-1200/mês.
- **Total Fase 2:** ~$1100-1500/mês para suporte bilingue.

**Fase 3 — Escala (12+ meses, >500 tickets/mês):**
- Avalia agência BPO multilíngue (Support Ninja, SupportYourApp) ou contratação full-time.

**Por que AI-first + humano híbrido:**
- AI resolve volume e velocidade (24h, sem férias).
- Humano resolve nuance cultural e complexidade (disputas, compliance, empatia).
- Não precisamos contratar equipe completa desde o dia 1.
- Escalável: adiciona mais freelancers ou mercados sem mudar arquitetura.

**Implementação técnica:**
- Intercom com Inbox multilíngue + DeepL API.
- Tags automáticas: `lang:es`, `lang:pt`, `complexity:high` (para freelancer).
- `profiles.preferred_language` usado para rotear idioma do auto-reply.
- Templates de resposta por idioma no Intercom.

---

## 2. Email Templates por Idioma ✅ DECIDIDO

**Decisão:** Resend (React Email) + CMS (Sanity) híbrido com AI assist para geração de drafts.

**Arquitetura:**
- **Esqueleto visual no código (React Email):** Layout, componentes reutilizáveis (Button, Card, Header, Footer), lógica condicional. Invariante por mercado.
- **Copy (subject, body, CTA) no Sanity:** Editável por marketing/redator, por locale.
- **Renderização:** Fetch do template do CMS + render com React Email + envio via Resend.

**Por que híbrido:**
- Código controla lógica condicional (ex: "se KYC incompleto, mostre aviso") — seguro e testável.
- CMS dá flexibilidade para marketing ajustar copy sem deploy.
- AI gera drafts de ES/EN a partir do PT (acelera, não substitui review humano).

**Fluxo de envio:**
```
1. Busca template no CMS (ex: 'session_reminder', locale: 'es-MX')
2. Busca dados do usuário (nome, data, profissional)
3. Renderiza React Email com layout fixo + copy do CMS
4. Envia via Resend
```

**Implementação:**
- `lib/email/templates/` — componentes React Email reutilizáveis.
- Sanity schema: `emailTemplate` (id, subject{locale}, body{locale}, variables[], category).
- AI assist: script que gera drafts ES/EN a partir do PT-BR para review do redator.

---

## 3. Reviews e Ratings por Mercado ✅ DECIDIDO

**Decisão:** Reviews isoladas por mercado. Nota global visível, texto filtrado por mercado.

**Contexto:** O isolamento de mercado é absoluto por padrão. Brasileiros só veem profissionais brasileiros (a menos que explicitamente mudem para México via dropdown). Portanto, reviews de brasileiros só aparecem em perfis de brasileiros, e vice-versa.

**Regra:**
- Cliente em `/br/` vendo perfil BR → vê só reviews de clientes BR.
- Cliente em `/mx/` vendo perfil MX → vê só reviews de clientes MX.
- Nota média do profissional é **global** (calculada de todos os mercados onde atende).
  - Isso preserva social proof se o profissional expandir para múltiplos mercados no futuro.

**Schema:**
```sql
ALTER TABLE reviews ADD COLUMN client_market_code TEXT;
CREATE INDEX idx_reviews_market ON reviews(client_market_code);
```

**Futuro (quando profissional puder operar em múltiplos mercados):**
- Adicionar toggle no perfil: "Ver reviews de outros países" (com badge).
- Por padrão, ainda mostra só do mercado atual.

---

## 4. Feature Flags por Mercado ✅ DECIDIDO

**Decisão:** PostHog Feature Flags.

**Por que PostHog:**
- Gratuito até 1M requests/mês (suficiente para anos).
- Analytics embutido (sabe quantos usuários viram a feature, conversão, etc.).
- A/B testing nativo.
- Suporta properties custom (ex: `market = 'BR'`).
- Escalável para N mercados e N features sem mudar arquitetura.

**Uso:**
```ts
const isEnabled = await posthog.isFeatureEnabled('video_call', userId, {
  personProperties: { market: 'BR' }
})
```

**Fallback:** Se PostHog estiver down, fallback para `false` (feature desligada) — comportamento seguro.

**Se ainda não usam PostHog:** Vercel Edge Config como MVP temporário até implementar PostHog.

```ts
// lib/features/flags.ts
import { EdgeConfigClient } from '@vercel/edge-config'

const edgeConfig = new EdgeConfigClient(process.env.EDGE_CONFIG)

export async function isFeatureEnabled(feature: string, market: string): Promise<boolean> {
  const flags = await edgeConfig.get('feature_flags')
  return flags?.[feature]?.includes(market) ?? false
}

// Uso:
// Edge Config: { "feature_flags": { "new_checkout": ["BR"], "paypal_payout": ["BR", "MX"] } }
```

---

## 5. Estratégia de Preços por Mercado (PPP) ✅ DECIDIDO

**Decisão:** Profissional define preço na moeda do mercado dele. Cliente vê preço na moeda do profissional + conversão estimada na UI. Stripe processa na moeda do profissional (cliente paga com conversão automática do cartão).

**MVP (agora):**
- Profissional define `session_price` + `session_price_currency` (BRL para BR, MXN para MX).
- Cliente vê: "R$ 200,00".
- UI mostra estimativa: "(~£30 / ~€35 / ~US$40)" baseado no país de residência do cliente.
- Stripe cobra o cliente na moeda do cartão (conversão automática).

**Por que não PPP automático:**
- Profissional não entenderia receber valores diferentes por cliente.
- Complexidade fiscal (receita variável).
- Difícil de explicar.

**Por que não preço por mercado agora:**
- Só faz sentido quando 1 profissional atende múltiplos mercados (não é o caso hoje).
- Adiciona complexidade desnecessária no onboarding.

**Futuro (quando profissional puder operar em múltiplos mercados):**
- Implementar preço por mercado: "BR: R$ 200, MX: $1.500 MXN, PT: €45".

**Exemplo na UI:**
```
Sessão de 50 minutos
R$ 200,00
(~£30 / ~€35 / ~US$40)
```

---

## 6. Depoimentos e Social Proof por Mercado ✅ DECIDIDO

**Decisão:** Depoimentos isolados por mercado no carrossel principal. Volume agregado global como social proof secundário.

**Regra:**
- Landing page mostra **só depoimentos do mercado atual** (brasileiros veem brasileiros, mexicanos veem mexicanos).
- Abaixo do carrossel: seção "Profissionais Muuday já atenderam expats em N países" — dá credibilidade de escala sem poluir.

**Por que não global:**
- Social proof só funciona se o prospect se identifica com quem deu o depoimento.
- Mexicano não se identifica com referências culturais brasileiras (CPF, Receita Federal).

**Schema no Sanity:**
```ts
testimonial: {
  name: string,
  quote: { pt-BR: string, es-MX: string },
  authorMarket: 'BR' | 'MX' | 'PT',
  location: string,  // "Londres", "Madrid"
  profession: string,
  image: asset,
}
```

---

## 7. Parcerias Locais ✅ DECIDIDO

**Decisão:** Programa de Embaixadores (profissionais indicam profissionais) + Digital-Only (influencers, comunidades online) + Freelancer local part-time para outreach institucional.

**Fase 1 — Brasil:**
- Continue consulados, ABEP, podcasts, grupos de Facebook.
- Lançar programa de embaixadores: profissional indica colega → ganha crédito/benefício (ex: 1 mês sem comissão).

**Fase 2 — México (primeiros 6 meses):**
- **Digital-only:** Parcerias com 10-20 influencers mexicanos (Instagram/YouTube/TikTok) sobre "mexicanos en el extranjero". Comissão por profissional cadastrado.
- **Freelancer mexicano (part-time, ~20h/semana):** Prospecta comunidades online, faz cold outreach para consulados/IMEX/universidades. Custo: ~$800-1500/mês.
- **Embaixadores mexicanos:** Primeiros 20 profissionais aprovados viram embaixadores com incentivo de indicação.

**Por que não Country Manager agora:**
- Custo alto ($1500-3000/mês) para mercado não validado.
- Contratar só quando México tiver 100+ profissionais e receita recorrente.

**Métricas:** CPA (custo por profissional cadastrado), CAC (custo por cliente), ROI em 90 dias.

---

## 8. Webinars e Eventos por Mercado ✅ DECIDIDO

**Decisão:** Eventos ao vivo separados por mercado + conteúdo on-demand gravado por mercado.

**Eventos Ao Vivo (mensal/bimestral):**
- Sempre separados por mercado. Brasileiros com brasileiros, mexicanos com mexicanos.
- Tema adaptado: "IR para brasileiros no exterior" (BR) vs "Declaración anual SAT para mexicanos en el extranjero" (MX).
- Formato: 30-45 min palestra + 15 min Q&A.
- Palestrante: profissional da própria plataforma.

**Conteúdo On-Demand (semanal):**
- Vídeos curtos (5-10 min) gravados por profissionais da plataforma.
- Publicados no YouTube/Instagram/TikTok.
- Reutilizáveis eternamente.

**Por que não global:**
- Mexicano não quer ouvir sobre Receita Federal esperando a parte do SAT.
- Evento misto reduz engajamento de ambos os públicos.

**Implementação:**
- Sanity CMS: coleção `events` (título, data, palestrante, mercado, link, replay).
- Notificações por email só para usuários do mercado do evento.

---

## 9. KYC e Verificação de Identidade ✅ DECIDIDO — URGENTE (IMPACTA MVP BRASIL)

**Decisão:** AI pré-triagem (OCR) + human review final. Onfido/SumSub para identidade, AI para registro profissional.

**Por que urgente:** O processo manual de aprovação já está afetando o MVP do Brasil. Com 50+ profissionais na fila, o gargalo é operacional. A AI triagem acelera 5x o throughput sem perder qualidade.

**Arquitetura:**
```
Upload de documentos
  -> AI OCR extrai: nome, número de registro, órgão emissor, data
  -> AI cross-check com base pública (se disponível)
  -> Score de confiança (0-100)
    -> Score > 80%: Aprovação automática + amostragem aleatória de audit
    -> Score 50-80%: Fila para review humano (2 min em vez de 10)
    -> Score < 50%: Rejeição automática + pedido de novo documento
```

**Ferramentas:**
- OCR: AWS Textract, Google Document AI, ou Azure Form Recognizer (~$0.01-0.05/doc).
- Identidade (futuro): Onfido ou SumSub (~$2-5/verificação).
- Human review: Fila no admin com dados AI pré-preenchidos.

**Custo estimado:**
- 100 profissionais/mês: ~$5-25 em AI + 3-4h de review humano (vs 15-20h manual).

**Implementação:**
- Adicionar à FASE A (fazer agora) do plano de implementação.
- Não bloqueia lançamento do Brasil, mas acelera operação imediatamente.

**Evolução:**
- Fase 1 (agora): AI OCR + human review.
- Fase 2: Cross-check automático com APIs públicas (OAB, SEP).
- Fase 3: Aprovação automática para casos >90% score.

---

## 10. Sanctions e PEP Checks ✅ DECIDIDO

**Decisão:** Gratuito por agora (OFAC list + busca manual). ComplyAdvantage quando escalar.

**MVP (agora — Fase B):**
- Baixar OFAC SDN List (CSV gratuito, atualizado regularmente).
- Script simples de match de nome (fuzzy matching básico).
- Revisor humano confirma matches antes de bloquear.
- Custo: $0.

**Futuro (quando volume justificar — >200 profissionais/mês):**
- Migrar para ComplyAdvantage API (~$0.50-2.00 por check).
- Cobertura completa: OFAC + UN + EU + PEP + Adverse Media.

**Quando verificar:**
- Antes do primeiro payout.
- Re-verificação anual.
- Se nome mudar.

**Por que não paga agora:**
- Volume baixo (20-50 profissionais/mês no início). Verificação manual + OFAC gratuito cobre.
- ComplyAdvantage é melhor, mas o custo só se justifica em escala.

---

## 11. Data Residency e GDPR ✅ DECIDIDO

**Decisão:** Documentação + DPA + DPO agora (custo zero). Read Replica na UE só quando lançarmos Portugal/Europa e tivermos tração.

**Agora (Brasil e México):**
- NÃO precisamos de data residency. Nem LGPD nem LFPDPPP exigem dados no país.
- Precisamos de:
  1. **DPA** assinado com Supabase, Stripe, Resend, Vercel, Intercom, Sanity.
  2. **DPO nomeado** (founder inicialmente, ou consultoria externa).
  3. **ROPA** documentado (planilha simples).
  4. Termos de privacidade atualizados mencionando processadores internacionais.

**Quando lançar Portugal/Europa:**
- Avaliar Supabase Read Replica na UE (Frankfurt).
- Clientes europeus começam a usar antes? Sem problema, desde que DPA + SCCs estejam em ordem.

**Checklist imediato (Fase B):**
- [ ] DPA com Supabase (dashboard).
- [ ] DPA com Stripe (automático).
- [ ] Cláusula de processadores internacionais nos termos.
- [ ] Email DPO: dpo@muuday.com no site.
- [ ] ROPA simples documentado.

**Custo:** $0.

---

## 12. Acessibilidade (WCAG) por Mercado ✅ DECIDIDO

**Decisão:** WCAG 2.1 AA como padrão global + AI-first tools no CI/CD.

**Por que global:**
- Europa (EAA 2025) é o mercado mais rigoroso. Se atendermos Europa, atendemos todos.
- Um único padrão, um único processo de desenvolvimento.
- Acessibilidade beneficia SEO e usabilidade para todos.

**Implementação:**
- **CI/CD:** `axe-core` roda em toda build. Falha se violação > critical.
- **Lighthouse CI:** score de acessibilidade > 90.
- **AI para alt text:** Script que gera alt text para imagens (OpenAI Vision ou similar).
- **Componentes acessíveis:** Radix UI / Headless UI (já acessíveis por padrão).
- **Testes E2E:** Playwright com `@axe-core/playwright`.

**Quando:**
- NÃO bloqueia MVP Brasil, mas adotar como padrão de código desde agora.
- Adicionar ao CI/CD na Fase A.
- Auditoria profissional ($5-10k) só quando lançar Europa ou tiver budget.

**Custo:**
- axe-core: gratuito.
- Lighthouse CI: gratuito.
- AI alt text: ~$0.01 por imagem.

---

## 13. Performance e Latência por Mercado ✅ DECIDIDO

**Decisão:** ISR agressivo + Edge Cache + Redis (Upstash) para dados frequentes.

**Arquitetura:**
```
Usuario no Brasil
  -> Vercel Edge Network (CDN)
    -> SE pagina em cache (ISR): serve em < 50ms
    -> SE nao: SSR na origem (~120ms)
      -> SE dado em Redis: < 10ms
      -> SE nao: query no Supabase (~100ms)
```

**ISR (cache):**
- Landing pages: revalidar a cada 1 hora.
- Guias: revalidar a cada 24 horas.
- Perfil do profissional: revalidar a cada 1 hora.
- Termos legais: revalidar a cada 24 horas.

**Nao cachear:**
- Busca (dinamico com filtros).
- Dashboard do usuario (dados pessoais).
- API de checkout (sensivel).

**Redis (Upstash):**
- Taxonomia, configuracoes de mercado, feature flags, resultados de busca populares.
- Custo: ~$10/mes.

**Metricas:**
- LCP < 1.5s para 90% dos usuarios.
- TTFB < 200ms (cache hit), < 600ms (cache miss).

**Quando:** Fase A (agora). Adicionar `revalidate` em paginas publicas e configurar Upstash.

---

## 14. Backup e Disaster Recovery ✅ DECIDIDO

**Decisao:** PITR (Point-in-Time Recovery) da Supabase + dump semanal para Cloudflare R2 + runbook documentado.

**Agora:**
1. **Ativar PITR** no Supabase (se nao estiver ativo).
2. **Script de dump semanal** para R2 (gratuito ate 10GB):
   ```bash
   pg_dump $SUPABASE_URL > backup-$(date +%Y%m%d).sql
   r2 put backup-$(date +%Y%m%d).sql s3://muuday-backups/
   ```
   - Retencao: ultimos 4 dumps (1 mes).
3. **Runbook de DR documentado:**
   - RTO: 2 horas (tempo para voltar).
   - RPO: 15 minutos (dados perdidos, gracas ao PITR).
   - Passo-a-passo de restauracao + DRI (Directly Responsible Individual).

**Por que nao multi-cloud:** Vendor lock-in e acceptable. Multi-cloud DR ($100+/mes) e overkill para estagio atual.

**Custo:** PITR (incluido no plano pago) + R2 (gratuito) + runbook ($0).

**Fase:** Fase A (agora). Testar runbook (drill a cada 6 meses) na Fase B.

---

## 15. Mobile App (Futuro) ✅ DECIDIDO — IMPORTANTE, SAIRÁ EM BREVE

**Decisão:** API-first agora + PWA como bridge + Expo (React Native) quando justificar.

**NOTA:** App nativo será prioridade logo após consolidarmos a web. Depois de terminarmos os 26 pontos, discutiremos o app em detalhe.

**O que fazer AGORA (para facilitar o app depois):**
1. **API-first:** Mover toda lógica de negócio para API routes (`/api/*`). App nativo consumirá as mesmas APIs.
   - Busca: `/api/search?market=BR&q=psicologo`
   - Booking: `/api/bookings` (POST)
   - Pagamento: `/api/payments` (POST)
   - Perfil: `/api/professionals/:id`
2. **Autenticação via JWT** (não cookie-only), para app nativo poder usar.
3. **Traduções em formato ICU** (`next-intl` web = `react-intl` mobile). Compartilhável.
4. **Imagens sempre de CDN** (Sanity). Nunca bundle local.
5. **Feature flags via PostHog** (funciona em web e mobile).

**PWA como bridge (Fase B):**
- Transformar web em PWA (manifest.json, service worker, push notifications via OneSignal).
- Dá 80% do valor de app sem criar app nativo.
- Reduz urgência de app nativo em 12-18 meses.

**App nativo (Fase C — 18-24 meses ou quando justificar):**
- Expo + React Native.
- Consumir mesmas APIs da web.
- Reutilizar traduções ICU do CMS.

**Por que não React Native Web agora:**
- Restringe UI da web. Hoje precisamos da melhor experiência web possível.

**Checklist API-first (Fase A/B):**
- [ ] Toda server action pública tem equivalente API route.
- [ ] Auth via JWT.
- [ ] Imagens de CDN.
- [ ] Traduções ICU.
- [ ] Feature flags PostHog.

---

## 16. Admin Dashboard por Mercado ✅ DECIDIDO

**Decisão:** Híbrido — default por mercado + superadmin override.

**Como funciona:**
1. Todo admin tem `default_market` (BR, MX, PT).
2. Quando entra no admin, vê SÓ profissionais daquele mercado.
3. Superadmin (founder, CTO) tem toggle: "👁️ Ver todos os mercados".
4. Métricas/dashboards filtradas por mercado default.

**Por que não global puro:**
- Revisor mexicano não deve acessar dados pessoais de brasileiros (LGPD/LFPDPPP).
- Polui visualmente (500 BR + 200 MX = caos).

**Schema:**
```sql
ALTER TABLE admin_users ADD COLUMN role TEXT; -- 'superadmin', 'admin'
ALTER TABLE admin_users ADD COLUMN default_market TEXT; -- 'BR', 'MX'
ALTER TABLE admin_users ADD COLUMN can_view_all_markets BOOLEAN DEFAULT false;
```

**Implementação:**
```ts
function canAccessMarket(user, market) {
  if (user.role === 'superadmin') return true
  return user.default_market === market
}
```

**Fase:**
- Fase A (agora): Adicionar `market_code` ao admin. Filtrar por default.
- Fase B: Implementar roles e superadmin toggle.

---

## 17. Relatórios Financeiros por Mercado ✅ DECIDIDO

**Decisão:** Metabase (self-hosted) para BI financeiro + PostHog para eventos de produto.

**Por que Metabase:**
- Gratuito, open-source. VPS ~$20/mês.
- Conecta direto ao Supabase (Postgres). Zero ETL.
- Dashboards compartilháveis (founder, investors, advisors).
- Alertas automáticos ("GMV do México caiu 30% esta semana").
- SQL + GUI (arrasta e solta para não-devs).

**O que vai no Metabase:**
```sql
-- GMV por mercado
SELECT 
  market_code,
  DATE_TRUNC('month', created_at) as month,
  SUM(session_price) / 100 as gmv,
  SUM(session_price * 0.20) / 100 as platform_revenue,
  COUNT(*) as bookings
FROM payments
GROUP BY market_code, month;

-- LTV por cliente (por mercado)
SELECT market_code, AVG(total_spent) as ltv
FROM (
  SELECT client_id, market_code, SUM(session_price) as total_spent
  FROM payments GROUP BY client_id, market_code
) sub GROUP BY market_code;
```

**PostHog para:**
- Eventos de produto (cliques, conversão, A/B testing).
- Não financeiro.

**Por que não Stripe Dashboard puro:**
- Stripe não sabe qual é o mercado Muuday (a menos que passemos metadata).
- Não mostra custos de payout (PayPal/Trolley).

**Fase:** Fase B (paralelo). Subir Metabase em VPS e conectar ao Supabase (read-only user).

**Pré-requisito:** Garantir que tabelas de pagamento tenham `market_code` (Fase A).

---

## 18. Tax Forms para Profissionais Internacionais ✅ DECIDIDO

**Decisão:** Trolley coleta automaticamente quando implementarmos Trolley. MVP com PayPal: sem tax forms (PayPal já cuida). Mover rapidamente para Trolley na Fase B.

**MVP (Paypal — agora):**
- PayPal já coleta tax information do profissional no cadastro Business.
- Adicionar cláusula nos termos: "Profissional é responsável por sua conformidade fiscal local e internacional."
- Nenhum tax form necessário da nossa parte.

**Fase B (Trolley — o mais rápido possível quando implementar pagamentos/financeiro):**
- Trolley coleta W-8BEN/W-9 automaticamente no onboarding do profissional.
- Trolley valida, armazena, e gera relatórios anuais (1099, 1042-S).
- Zero trabalho da nossa parte.

**Por que Trolley e não custom:**
- Trolley já faz isso perfeitamente. Não reinventar a roda.
- W-8BEN digital, validação automática, storage seguro.

**Fase 3:** Se HMRC exigir reporting adicional, consultar contador UK.

---

## 19. Currency Conversion Display ✅ DECIDIDO

**Decisão:** Moeda do profissional como principal + conversão estimada na UI. Stripe converte automaticamente no checkout.

**Aplicação:** Valido para TODOS os mercados, incluindo Brasil (brasileiro em Londres vê R$ 200 + ~£30).

**Como funciona:**
1. **Página do profissional:** "R$ 200,00 (~£30 / ~€35 / ~US$40)".
   - Moeda entre parênteses baseada no `profiles.country` do cliente.
   - Taxa atualizada diariamente (Open Exchange Rates — gratuito até 1000 req/mês).
2. **Checkout Stripe:** Cliente vê valor na moeda do cartão (ex: £30.50). Stripe faz conversão real.

**Por que não só moeda do profissional:**
- Brasileiro em Londres não sabe se R$ 200 é caro. Ele pensa em libras.
- Gera fricção e abandono de checkout.

**Implementação:**
```ts
function formatPriceWithConversion(amount, professionalCurrency, clientCountry) {
  const clientCurrency = countryToCurrency(clientCountry)
  const rate = exchangeRates[`${professionalCurrency}_${clientCurrency}`]
  const converted = (amount / 100) * rate
  return `R$ ${(amount/100).toFixed(2)} (~${symbol(clientCurrency)}${converted.toFixed(0)})`
}
```

**Taxa de câmbio:**
- Fonte: Open Exchange Rates (gratuito) ou Exchangerate-API.
- Cache: Atualiza 1x por dia no Redis.
- Disclaimer: "Conversão estimada. O valor final depende da taxa do seu cartão."

**Fase:** Fase B (paralelo). Simples de implementar.

---

## 20. Minimum Payout Threshold ✅ DECIDIDO

**Decisão:** Threshold global fixo por mercado. Mínimo $50 USD equivalente.

**Valores:**
| Mercado | Moeda | Threshold |
|---------|-------|-----------|
| Brasil | BRL | R$ 250 (~US$50) |
| México | MXN | $1.000 MXN (~US$50) |
| Portugal | EUR | €45 (~US$50) |
| UK | GBP | £40 (~US$50) |
| EUA | USD | US$50 |

**Por que $50 mínimo:**
- PayPal/Trolley taxa fixa representa <5-10% do valor.
- Profissional não fica frustrado (2-3 sessões já atinge).
- Simples de explicar.

**Comportamento:**
- Saldo < threshold: acumula para próxima semana.
- Após 30 dias saldo < threshold: paga mesmo assim (evita espera eterna).

**Implementação:**
```ts
const PAYOUT_THRESHOLDS = {
  BRL: 25000,  // R$ 250 em centavos
  MXN: 100000, // $1.000 MXN em centavos
  EUR: 4500,   // €45 em centavos
  GBP: 4000,   // £40 em centavos
  USD: 5000,   // US$50 em centavos
}
```

**Fase:** Fase B (quando implementar Trolley/PayPal payout).

---

## 21. Payout Frequency ✅ DECIDIDO

**Decisão:** Semanal. Toda segunda-feira, 10h (horário do mercado).

**Por que semanal:**
- Padrão do mercado (Uber, Airbnb, iFood). Profissional espera isso.
- Cash flow não é problema: Stripe já nos pagou (receita entra em 2-7 dias).
- Menos queixas, menor churn de profissionais.
- Operação simples: todo mundo sabe que segunda é payout day.

**Regra:**
- Toda segunda, 10h (BRT/CST/etc.), processa payout da semana anterior (segunda a domingo).
- Só paga se saldo >= threshold (R$ 250 / $1.000 MXN).
- Se saldo < threshold: acumula para próxima semana.
- Se após 30 dias ainda < threshold: paga mesmo assim.

**Timeline exemplo:**
```
Segunda 05/05: Cliente paga sessão de R$ 200
Terça 06/05: Stripe confirma pagamento
Segunda 12/05: Payout para profissional (R$ 200 - comissão 20% = R$ 160)
```

**Implementação:** Cron job semanal (Inngest ou Vercel Cron).

**Fase:** Fase B (quando implementar Trolley/PayPal).

---

## 22. Professional Onboarding Videos ✅ DECIDIDO

**Decisão:** Loom-style com narração AI (ElevenLabs/HeyGen) como MVP. Embaixadores gravam vídeos complementares.

**MVP (Brasil — agora):**
- Gravar telas com Loom/Scribe (3-5 vídeos de 2-3 min).
- Narração em português (founder/equipe).
- Hospedar no YouTube + Sanity + Intercom.

**Para México (Fase B):**
- Mesmos vídeos, narração AI em espanhol mexicano (ElevenLabs).
- Custo: ~$5-10 por vídeo de narração.
- Rápido de atualizar (interface mudou? Regrava em 10 min).

**Complemento (Fase B/C):**
- Embaixadores gravam vídeos curtos no celular: "Como eu uso a Muuday".
- Recompensa: crédito na plataforma.
- Vídeos autênticos, peer-to-peer.

**Conteúdo prioritário:**
1. "Como se cadastrar na Muuday" (3 min)
2. "Como configurar sua agenda" (2 min)
3. "Como receber pagamentos" (2 min)
4. "Como funciona a comissão" (1 min)
5. "Dicas para ter mais clientes" (3 min)

**Por que não vídeo nativo por idioma:**
- Custo proibitivo ($500-2000 por vídeo por idioma).
- Manutenção cara (cada update = regravar tudo).

---

## 23. Referral Program por Mercado ✅ DECIDIDO

**Decisão:** Desde o primeiro dia. Profissional ganha 1 mês gratuito quando referral completa 10 atendimentos. Cliente ganha crédito em moeda local.

**Para profissionais:**
- "Indique 1 colega profissional. Quando ele completar 10 atendimentos, você ganha 1 mês gratuito na plataforma."
- Recompensa: 1 mês de plano gratuito (não é desconto em comissão — não há comissão).
- Tracking: código único do profissional.

**Para clientes:**
- "Indique um amigo e vocês dois ganham crédito na próxima sessão."
- Recompensa em moeda do mercado:
  - BR: R$ 50
  - MX: $500 MXN
  - PT: €10
- Código global (qualquer pessoa pode usar), mas recompensa na moeda do indicador.

**Regra:**
- Carlos (BR) tem código CARLOS2026.
- Maria (MX) usa código CARLOS2026.
- Carlos ganha R$ 50. Maria ganha $500 MXN.
- Sistema tracking por código, não por mercado.

**Implementação:**
```ts
const REFERRAL_REWARDS = {
  BR: { client: 5000 },      // R$ 50 (cents)
  MX: { client: 50000 },     // $500 MXN (cents)
  PT: { client: 1000 },      // €10 (cents)
}

const PRO_REFERRAL_REWARD = {
  monthsFree: 1,
  requiredBookings: 10,  // referral precisa completar 10 atendimentos
}
```

**Fase:** Desde o primeiro dia (Fase A/B).

---

## 24. Domain Strategy ✅ DECIDIDO

**Decisão:** A (subdiretórios) agora. B (registrar TLDs + redirect) logo antes de lançar cada mercado.

**Agora:**
- Principal: `muuday.com/br/`, `muuday.com/mx/`, `muuday.com/pt/`.
- SEO authority concentrada no .com.

**Antes de lançar cada mercado:**
- Registrar TLD como proteção de marca:
  - `muuday.mx` → redirect 301 para `muuday.com/mx/`
  - `muuday.pt` → redirect 301 para `muuday.com/pt/`
  - `muuday.com.br` → redirect 301 para `muuday.com/br/`
- Não hospedar conteúdo nos TLDs (só redirect).

**Por que não TLDs com conteúdo:**
- SEO do zero em cada domínio, marca fragmentada, manutenção triplicada.

**Custo:**
- `muuday.mx`: ~$20/ano
- `muuday.pt`: ~$20/ano
- `muuday.com.br`: ~$40/ano
- Total: ~$80/ano para proteção de marca.

**Fase:** Registrar TLDs na Fase C (antes do lançamento de cada mercado).

---

## 25. Testes E2E por Mercado ✅ DECIDIDO

**Decisão:** Testes separados por mercado para fluxos críticos. Testes genéricos para fluxos simples.

**Estrutura:**
```
e2e/
├── shared/helpers.ts           # Funções reutilizáveis
├── br/
│   ├── landing.spec.ts
│   ├── search.spec.ts
│   ├── booking.spec.ts         # Fluxo completo BR
│   └── pro-onboarding.spec.ts
├── mx/
│   ├── landing.spec.ts
│   ├── search.spec.ts
│   ├── booking.spec.ts         # Fluxo completo MX
│   └── pro-onboarding.spec.ts
└── global/auth.spec.ts         # Auth (mesmo para todos)
```

**O que testar por mercado:**
- Landing page no locale correto.
- Busca filtra só profissionais do mercado.
- Perfil: preço na moeda correta, reviews no idioma correto.
- Booking: checkout com moeda correta.
- Onboarding profissional: campos corretos para o país (OAB vs cédula).

**Mock de Stripe:**
- Stripe Test Mode (`pk_test_...`).
- Mock de webhook para simular pagamento confirmado.

**CI/CD:**
- Playwright roda em toda PR.
- BR primeiro, depois MX (se houver mudança em arquivo de mercado).

**Fase:**
- Fase A: Testes para Brasil.
- Fase C: Adicionar testes para México antes do lançamento.

---

## 26. Rollout Strategy ✅ DECIDIDO

**Decisão:** Beta Fechado → Soft Launch → Big Bang. MESMA estratégia para Brasil (e todos os mercados futuros).

**Fase 1 — Beta Fechado (2-4 semanas):**
- 50 usuários convidados + 20 profissionais pré-aprovados.
- Acesso por invite code.
- Objetivo: feedback, bugs, validar valor real.
- Métricas: NPS > 40, zero bugs críticos, 70% booking rate.

**Fase 2 — Soft Launch (4-8 semanas):**
- Remove invite code. Site aberto.
- Sem marketing pago. SEO + orgânico + boca a boca.
- Objetivo: testar infra com tráfego real.
- Métricas: 100 usuários/mês, 30 bookings/mês.

**Fase 3 — Big Bang (quando métricas validarem):**
- Marketing pago, influencers, press release.
- Gatilho: 500 usuários/mês, 100 bookings/mês, NPS > 50.

**Checklist antes de qualquer lançamento (BR, MX, PT):**
- [ ] 20+ profissionais pré-aprovados e ativos.
- [ ] 5+ guias publicados no mercado.
- [ ] Termos legais no idioma local revisados.
- [ ] Suporte no idioma configurado.
- [ ] Emails transacionais no idioma funcionando.
- [ ] Testes E2E passando.
- [ ] Stripe checkout na moeda local testado.

---

## Checklist Final — O Que Falta Decidir/Documentar

- [ ] Escolher help desk / CRM de suporte (Zendesk, Intercom, Help Scout, Crisp?)
- [ ] Definir threshold mínimo de payout
- [ ] Definir frequência de payout
- [ ] Definir recompensa de referral por mercado
- [ ] Registrar domínios .mx e .pt
- [ ] Definir estratégia de KYC (manual vs automatizado)
- [ ] Definir se teremos sanctions/PEP checks
- [ ] Assinar DPA com todos os processadores de dados
- [ ] Criar ROPA (Record of Processing Activities)
- [ ] Definir estratégia de rollout (beta fechado)
- [ ] Criar testes E2E por mercado
- [ ] Definir se profissional pode ter múltiplos mercados
- [ ] Definir se reviews são globais ou por mercado
- [ ] Definir estratégia de PPP (preços por mercado)
- [ ] Definir se mostramos conversão de moeda para cliente


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.

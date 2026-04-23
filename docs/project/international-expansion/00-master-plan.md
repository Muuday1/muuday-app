# Plano Master — Expansão Internacional Muuday

> Data: 2026-04-23
> Status: Reflexão consolidada de todos os 26 pontos + arquitetura + implementação
> Organização: FAZER JÁ | PARALELO | ESPERAR
> Próximo passo: Após aprovação deste plano, discutir o app nativo.

---

## RESUMO EXECUTIVO

A Muuday está construída hoje como uma plataforma 100% brasileira (pt-BR, landing page BR, profissionais BR, Stripe BR, termos SP/BR). Para expandir para México, Portugal e futuros mercados, precisamos de uma arquitetura de **isolamento por mercado** com subdiretórios (`/br/`, `/mx/`), detecção inteligente de mercado, CMS headless, e pagamentos unificados via Stripe UK + Trolley.

**A decisão mais importante:** NÃO pare o Brasil para construir internacionalização. Faça as fundações silenciosamente enquanto continua o roadmap BR. Quando o Brasil estiver consolidado (500+ profissionais, 1000+ bookings/mês), o México estará pronto para lançar em 4-8 semanas.

---

## PARTE 1: FAZER JÁ (Antes de continuar building o Brasil)

> **Por que:** Se não fizermos isso agora, cada nova tela/feature do Brasil será mais uma para refatorar depois. É 10x mais barato fazer certo com 20 telas do que com 200.

### 1.1 Corrigir Jurisdição Legal para UK (2 dias) — CRÍTICO
**Onde:** `lib/legal/professional-terms.ts`, `lib/legal/terms.ts`, `lib/legal/privacy-policy.ts`, `lib/legal/cookie-policy.ts`

**O que mudar:**
- Remover "foro da Comarca da Capital do Estado de São Paulo/SP"
- Remover "legislação da República Federativa do Brasil" como lei contratual
- Adicionar: "These terms are governed by the laws of England and Wales. Any dispute shall be resolved in the courts of London, United Kingdom."
- Manter LGPD como lei de proteção de dados (não contratual)
- Adicionar LFPDPPP (México) no cookie policy

**Por que urgente:** Os termos atuais estão tecnicamente inválidos (empresa UK não pode eleger foro SP). Isso é um risco legal real.

**Responsável:** Founder + revisão jurídica UK.

---

### 1.2 Componentizar Landing Page (3-5 dias)
**Onde:** `app/page.tsx` → `components/landing/LandingPage.tsx` + `lib/landing/br-data.ts`

**O que fazer:**
- Extrair todo conteúdo hardcoded para arquivo de dados separado
- Criar componentes reutilizáveis: HeroSection, StatsSection, FeaturesSection, FAQSection, TestimonialsSection, CTASection
- A `app/page.tsx` deve ficar: `<LandingPage data={brLandingData} />`
- Futuramente: `app/(markets)/mx/page.tsx` → `<LandingPage data={mxLandingData} />`

**Impacto:** Zero no usuário BR. Facilita 10x a criação de landing pages futuras.

---

### 1.3 Extrair Strings de UI para Arquivos de Mensagens (5-7 dias)
**Onde:** Todo o frontend público

**O que fazer:**
- Criar `lib/i18n/messages/pt-BR.json` (ou `.ts`)
- Extrair strings de: landing, busca, signup, header, footer, search-config, constants
- Criar helper `t(key)` simples (não precisa de `next-intl` ainda)
- NÃO precisa criar es-MX agora — só extrair para JSON

**Por que:** Quando instalar `next-intl` na Fase C, 90% do trabalho já estará feito.

---

### 1.4 Preparar Banco de Dados (1 dia)
**Onde:** Supabase schema

**Mudanças:**
```sql
-- Isolamento de profissionais por mercado
ALTER TABLE professionals ADD COLUMN market_code TEXT NOT NULL DEFAULT 'BR';
CREATE INDEX idx_professionals_market ON professionals(market_code);
UPDATE professionals SET market_code = 'BR' WHERE market_code IS NULL;

-- Taxonomia multilíngue
ALTER TABLE categories ADD COLUMN name_es TEXT;
ALTER TABLE subcategories ADD COLUMN name_es TEXT;
ALTER TABLE specialties ADD COLUMN name_es TEXT;

-- Preço multi-moeda
ALTER TABLE professionals ADD COLUMN session_price INTEGER; -- em centavos
ALTER TABLE professionals ADD COLUMN session_price_currency TEXT DEFAULT 'BRL';
-- Futuramente: migrar dados de session_price_brl para session_price

-- Idioma do usuário
ALTER TABLE profiles ADD COLUMN language TEXT DEFAULT 'pt-BR';

-- Market no review
ALTER TABLE reviews ADD COLUMN client_market_code TEXT;
CREATE INDEX idx_reviews_market ON reviews(client_market_code);
```

**Impacto:** Zero no usuário. Só adiciona colunas.

---

### 1.5 Corrigir Busca para Isolar por Mercado (1 dia)
**Onde:** `db/sql/migrations/019-wave2-search-pgtrgm.sql` + `app/buscar/page.tsx`

**O que fazer:**
- Adicionar `p_market TEXT DEFAULT NULL` na RPC `search_public_professionals_pgtrgm`
- Adicionar filtro: `AND (p_market IS NULL OR p.market_code = p_market)`
- Atualizar `app/buscar/page.tsx` para passar `p_market = 'BR'`

**Impacto:** Hoje a busca retorna TODOS os profissionais do mundo. Isso precisa ser corrigido mesmo que só tenhamos Brasil.

---

### 1.6 Implementar AI OCR para Triagem de Documentos (3-5 dias) — URGENTE
**Onde:** `lib/admin/professional-review.ts` + novo pipeline

**O que fazer:**
- Escolher provedor OCR (AWS Textract vs Google Document AI vs Azure Form Recognizer)
- Criar pipeline: upload → OCR → extração → score
- Adaptar admin dashboard para mostrar dados OCR pré-preenchidos
- Thresholds: auto-aprovação (>80%), fila humana (50-80%), rejeição (<50%)

**Impacto:** Reduz tempo de review de 10 min para 2 min por profissional. Acelera 5x.
**Responsável:** Dev backend.

---

### 1.7 Simplificar Stripe para UK Único (1 dia)
**Onde:** `lib/stripe/client.ts`

**O que fazer:**
- Remover dual-region BR/UK para processamento de clientes
- Usar Stripe UK para TODOS os pagamentos de clientes
- Manter `resolveStripePlatformRegion` apenas se usarmos Stripe Connect no futuro (mas payout será Trolley/PayPal)

**Impacto:** Simplifica código. Um único Stripe para todos os clientes.

---

### 1.8 Configurar Sanity CMS (3-5 dias)
**Onde:** Novo projeto Sanity

**Schemas iniciais:**
- `landingBlock` (hero, stats, features, testimonials, faq, cta)
- `guide` (título, slug, conteúdo, locale, market, categoria)
- `blogPost` (título, slug, conteúdo, locale, market)
- `legalDocument` (type, content, locale, version)
- `emailTemplate` (id, subject{locale}, body{locale}, variables[])
- `testimonial` (name, quote{locale}, authorMarket, location)

**Migrar:** Guias de `lib/guides-data.ts` para Sanity.

---

### 1.9 Configurar Upstash Redis + ISR (1-2 dias)
**Onde:** `next.config.js` + Vercel

**O que fazer:**
- Criar conta Upstash (gratuito)
- Configurar `revalidate` em páginas públicas
- Landing: 1 hora. Guias: 24h. Perfil: 1h.
- Cache no Redis: taxonomia, configurações de mercado, taxas de câmbio

---

### 1.10 Configurar PostHog (1 dia)
**Onde:** Analytics

**O que fazer:**
- Criar conta PostHog (gratuito até 1M events/mês)
- Instalar SDK no Next.js
- Configurar eventos: market_detected, market_changed, booking_started, booking_completed
- Feature flags: criar estrutura para flags por mercado

---

## PARTE 2: PARALELO (Não afeta o roadmap do Brasil, pode fazer ao mesmo tempo)

> **Quem faz:** Pode ser outras pessoas (redator, designer, freelancer, founder) enquanto o dev continua o Brasil.

### 2.1 Conteúdo para México (Redação — 2-4 semanas)
**Responsável:** Redator/Copywriter (pode ser freelancer mexicano)

**Entregáveis:**
- 10-15 guias mexicanas (CURP, SAT, IMSS, Afores, etc.)
- Landing page em espanhol mexicano
- FAQ em espanhol
- Blog posts iniciais (5-10)
- Email templates em espanhol (drafts)

**Obs:** Conteúdo vai para Sanity CMS quando estiver pronto.

---

### 2.2 Setup Trolley (Dev — 2-3 dias)
**Responsável:** Dev backend

**O que fazer:**
- Criar conta Trolley (gratuito para testar)
- Integrar API: create recipient, send payout, check status
- Configurar webhooks para notificações de payout
- Criar UI no dashboard do profissional para configurar dados de payout

**Obs:** Não precisa estar em produção ainda. Só testar e validar.

---

### 2.3 Setup de Payout PayPal Business UK (Founder — 1 dia)
**Responsável:** Founder

**O que fazer:**
- Criar conta PayPal Business UK (se ainda não tiver)
- Configurar Payouts API
- Testar envio para conta BR e MX
- Documentar taxas e limites

---

### 2.4 Design de Landing Page para México (Designer — 1 semana)
**Responsável:** Designer

**Entregáveis:**
- Hero image com contexto mexicano
- Assets gráficos para México (bandeira, ícones de destinos)
- Adaptação de cores/imagens
- Email templates em espanhol (design)

---

### 2.5 Preparação Fiscal UK (Founder + Contador — contínuo)
**Responsável:** Founder

**Ações:**
- Contratar contador UK (accountant) especializado em tech startups
- Definir tratamento fiscal de payouts internacionais (HMRC)
- Verificar necessidade de VAT registration (£85k threshold)
- Definir se há withholding tax sobre payouts para BR/MX
- Estruturar accounting para separar receita por mercado (análise interna)

---

### 2.6 Pre-cadastro de Profissionais Mexicanos (Operação — contínuo)
**Responsável:** Founder / Freelancer mexicano

**Ações:**
- Criar landing page de "Lista de espera" para profissionais mexicanos
- Recrutar 15-20 profissionais (psicólogos, abogados, contadores, nutricionistas)
- Validar documentos mexicanos (cédula profesional, RFC)
- Mapear quais conselhos permitem atendimento remoto

---

### 2.7 Documentação Legal para México (Advogado — 2-3 semanas)
**Responsável:** Advogado mexicano familiarizado com UK law

**Entregáveis:**
- Termos de uso em espanhol (jurisdição UK)
- Política de privacidade em espanhol (LFPDPPP + UK)
- Termos do profissional em espanhol

---

### 2.8 Configurar Intercom + DeepL (Dev — 1 dia)
**Responsável:** Dev

**O que fazer:**
- Criar conta Intercom (ou usar existente)
- Configurar auto-translate com DeepL API
- Criar tags: `lang:es`, `lang:pt`, `complexity:high`
- Templates de resposta por idioma

---

### 2.9 Registrar Domínios de Proteção (Founder — 1 dia)
**Responsável:** Founder

**Ações:**
- Registrar `muuday.mx` (~$20/ano)
- Registrar `muuday.pt` (~$20/ano)
- Configurar redirect 301 para subdiretórios (quando lançar)

---

### 2.10 Configurar Metabase (Dev — 1 dia)
**Responsável:** Dev

**O que fazer:**
- Subir Metabase em VPS ($20/mês) ou usar Metabase Cloud (gratuito para 1 usuário)
- Conectar ao Supabase (read-only user)
- Criar dashboards: GMV por mercado, LTV, CAC, churn
- Configurar alertas

---

### 2.11 Documentação e Compliance (Founder — 1 semana)
**Ações:**
- Assinar DPA com Supabase, Stripe, Resend, Vercel, Intercom, Sanity
- Nomear DPO (founder ou consultoria externa)
- Criar ROPA (Record of Processing Activities)
- Documentar runbook de Disaster Recovery

---

## PARTE 3: ESPERAR (Só depois de consolidar o Brasil)

> **Gatilhos para iniciar:**
> - Brasil: 500+ profissionais ativos, 1.000+ bookings/mês
> - Brasil: receita recorrente positiva (profissionais pagando planos)
> - Brasil: pagamentos 100% funcionais (Stripe UK + Trolley/PayPal)
> - México: 15-20 profissionais pré-cadastrados e aprovados
> - México: 1 pessoa no time que fala espanhol (suporte/aprovação)
> - Tecnologia: i18n framework implementado e testado no Brasil
> - Legal: termos revisados por advogado mexicano
> - Marketing: orçamento para aquisição de clientes mexicanos

### 3.1 Implementar i18n Framework (next-intl)
**Quando:** Depois que o Brasil estiver estável e conteúdo MX estiver pronto
**Duração:** 1-2 semanas
**O que:**
- Instalar `next-intl` ou `react-i18next`
- Configurar routing por locale (`/br/`, `/mx/`, `/pt/`)
- Migrar arquivos de mensagens para JSON por locale
- Adaptar middleware para locale routing

---

### 3.2 Lançar Mercado México
**Quando:** Todos os gatilhos acima atingidos
**Duração:** 2-3 semanas
**O que:**
- Criar `app/(markets)/mx/page.tsx` com landing page mexicana
- Criar `app/(markets)/mx/buscar/` com busca isolada
- Criar `app/(markets)/mx/guias/` com guias mexicanos
- Criar `app/(markets)/mx/registrar-profissional/` com onboarding mexicano
- Traduzir todos os componentes de UI para espanhol mexicano
- Configurar Stripe Checkout para apresentar preços em MXN
- Configurar Trolley para payouts a profissionais mexicanos
- Traduzir todos os emails (Resend templates) para espanhol
- Configurar PostHog segmentação por mercado
- Configurar suporte em espanhol
- Beta fechado → soft launch → big bang

---

### 3.3 Escalar para Portugal
**Quando:** 1-2 meses depois do México estar estável
**Duração:** 1-2 semanas
**O que:**
- Replicar estrutura de `/mx/` para `/pt/`
- Adaptar conteúdo para português europeu (pt-PT)
- Adaptar termos para RGPD (já coberto no UK, mas com cláusulas específicas PT)
- Recrutar profissionais portugueses

---

### 3.4 App Nativo (Expo + React Native)
**Quando:** 18-24 meses ou quando justificar (10k+ usuários ativos mensais)
**Pré-requisitos:**
- API-first 100% implementado
- Auth via JWT funcionando
- Traduções ICU compartilháveis entre web e mobile
- Feature flags PostHog funcionando em mobile

---

## PARTE 4: CHECKLIST COMPLETO POR FASE

### Fase A: Fazer Agora (15-25 dias de dev)
- [ ] 1.1 Corrigir jurisdição legal para UK
- [ ] 1.2 Componentizar landing page
- [ ] 1.3 Extrair strings de UI para JSON
- [ ] 1.4 Preparar banco de dados (market_code, name_es, session_price, language)
- [ ] 1.5 Corrigir busca para isolar por mercado
- [ ] 1.6 Implementar AI OCR para triagem de documentos
- [ ] 1.7 Simplificar Stripe para UK único
- [ ] 1.8 Configurar Sanity CMS
- [ ] 1.9 Configurar Upstash Redis + ISR
- [ ] 1.10 Configurar PostHog

### Fase B: Paralelo (2-4 meses, múltiplas pessoas)
- [ ] 2.1 Conteúdo para México (redação)
- [ ] 2.2 Setup Trolley
- [ ] 2.3 Setup PayPal Business UK
- [ ] 2.4 Design de landing page MX
- [ ] 2.5 Preparação fiscal UK
- [ ] 2.6 Pre-cadastro de profissionais mexicanos
- [ ] 2.7 Documentação legal para México
- [ ] 2.8 Configurar Intercom + DeepL
- [ ] 2.9 Registrar domínios de proteção
- [ ] 2.10 Configurar Metabase
- [ ] 2.11 Documentação e compliance

### Fase C: Depois de consolidar Brasil (3-4 meses depois)
- [ ] 3.1 Implementar i18n framework
- [ ] 3.2 Lançar mercado México
- [ ] 3.3 Escalar para Portugal
- [ ] 3.4 App nativo

---

## PARTE 5: DECISÕES ARQUITETURAIS CONSOLIDADAS

| Área | Decisão |
|------|---------|
| **Jurisdição** | UK para todos os mercados |
| **Pagamentos cliente** | Stripe UK (CC, Apple Pay, PayPal, Alipay) |
| **Pagamentos profissional** | PayPal (MVP) → Trolley (escala) |
| **Nota fiscal** | Não emitimos (entidade UK, serviço prestado fora) |
| **CMS** | Sanity (headless, i18n nativo) |
| **URLs** | Subdiretórios (`/br/`, `/mx/`) |
| **Detecção de mercado** | Cookie > URL > Accept-Language > IP > default BR |
| **Isolamento** | Absoluto por default. User só vê profissionais do mercado atual. |
| **i18n** | next-intl (futuro). Por agora: extrair strings para JSON. |
| **Feature flags** | PostHog |
| **Analytics** | PostHog (produto) + Metabase (financeiro) |
| **Suporte** | Intercom + DeepL + freelancer part-time |
| **Emails** | Resend + CMS híbrido + AI assist |
| **KYC** | AI OCR + human review |
| **Performance** | ISR + Edge Cache + Redis |
| **Backup/DR** | PITR + dump R2 + runbook |
| **Acessibilidade** | WCAG 2.1 AA + axe-core no CI |
| **Payout threshold** | $50 USD equivalente |
| **Payout frequency** | Semanal (segunda-feira) |
| **Referral** | Pro: 1 mês gratuito (após 10 atendimentos do referral). Cliente: crédito local. |
| **Rollout** | Beta fechado → Soft launch → Big bang (mesmo para BR) |

---

## PARTE 6: RISCOS E MITIGAÇÕES

| Risco | Severidade | Mitigação |
|-------|-----------|-----------|
| Jurisdição legal incorreta | CRÍTICO | Corrigir AGORA (Fase A) |
| Busca não isola por mercado | CRÍTICO | Adicionar market_code + filtro (Fase A) |
| Onboarding assume Brasil | CRÍTICO | Extrair config por mercado (Fase C) |
| Sem framework i18n | ALTO | Extrair strings para JSON AGORA (Fase A) |
| Landing page monolítica | ALTO | Componentizar AGORA (Fase A) |
| Taxonomia só em português | ALTO | Adicionar name_es (Fase A) |
| Sem CMS | ALTO | Implementar Sanity (Fase A) |
| KYC manual lento | ALTO | AI OCR (Fase A) |
| Sem feature flags | MÉDIO | PostHog (Fase A) |
| Sem analytics por mercado | MÉDIO | Metabase (Fase B) |
| Suporte só em português | MÉDIO | Intercom + freelancer (Fase B) |
| GDPR/Europe | MÉDIO | DPA + DPO agora, replica EU depois (Fase B/C) |

---

## PRÓXIMOS PASSOS

1. **Revisar e aprovar este plano master**
2. **Priorizar Fase A** — o que pode ser feito em 2-3 semanas de sprint
3. **Alocar responsáveis** para cada item da Fase B
4. **Definir data de início** da Fase C (lançamento México)
5. **Discutir o app nativo** — arquitetura, prioridade, timeline

---

> Documento vivo. Atualizado em: 2026-04-23
> Próxima revisão: quando houver mudanças de escopo ou decisões arquiteturais

# Plano de Implementação — Expansão Internacional Muuday

> Data: 2026-04-23  
> Status: Draft para revisão  
> Organização: Fase A (FAÇA AGORA — antes de continuar o Brasil), Fase B (Em paralelo com o Brasil), Fase C (Só depois de consolidar o Brasil)

---

## FASE A: FAÇA AGORA (Antes de continuar construindo o Brasil)

> **Por quê:** Se não fizermos isso agora, cada nova tela/feature do Brasil será mais uma tela para refatorar depois. É mais barato corrigir as fundações com 20 telas do que com 200.

### A1. Corrigir Jurisdição Legal (2 dias)
- [ ] **A1.1** Atualizar `lib/legal/professional-terms.ts`
  - Remover "legislação da República Federativa do Brasil"
  - Remover "foro da Comarca da Capital do Estado de São Paulo/SP"
  - Adicionar: "These terms are governed by the laws of England and Wales. Any dispute shall be resolved in the courts of London, United Kingdom."
  - Manter referências a LGPD como lei aplicável ao tratamento de dados pessoais de brasileiros, mas NÃO como lei contratual.
- [ ] **A1.2** Atualizar `lib/legal/terms.ts` (termos simplificados para clientes)
  - Mesma mudança: jurisdição UK.
- [ ] **A1.3** Atualizar `lib/legal/privacy-policy.ts`
  - Jurisdição UK.
  - Manter LGPD como uma das leis de dados aplicáveis.
- [ ] **A1.4** Atualizar `lib/legal/cookie-policy.ts`
  - Adicionar LFPDPPP (México) como lei de cookies aplicável para usuários mexicanos.
- [ ] **A1.5** Revisar todos os documentos legais com advogado UK (ou redator jurídico UK).

### A2. Refatorar Landing Page para Componentização (3-5 dias)
- [ ] **A2.1** Extrair todo o conteúdo de `app/page.tsx` para um arquivo de dados separado (`lib/landing/br-data.ts`).
  - Hero text, stats, features, countries list, FAQ, testimonials, CTA copy.
- [ ] **A2.2** Criar componentes reutilizáveis (`components/landing/HeroSection.tsx`, `StatsSection.tsx`, `FAQSection.tsx`, etc.) que recebem dados via props.
- [ ] **A2.3** A `app/page.tsx` deve ficar como:
  ```tsx
  import { brLandingData } from '@/lib/landing/br-data'
  import { LandingPage } from '@/components/landing/LandingPage'
  
  export default function BrazilLanding() {
    return <LandingPage data={brLandingData} />
  }
  ```
- [ ] **A2.4** Isso permite que futuramente `app/mx/page.tsx` seja:
  ```tsx
  import { mxLandingData } from '@/lib/landing/mx-data'
  export default function MexicoLanding() {
    return <LandingPage data={mxLandingData} />
  }
  ```

### A3. Extrair Strings de UI para Constantes/Arquivos (5-7 dias)
- [ ] **A3.1** Criar `lib/i18n/messages/pt-BR.json` (ou `lib/messages/pt-BR.ts` se preferir TypeScript).
- [ ] **A3.2** Extrair todas as strings hardcoded de:
  - `app/page.tsx` (depois de A2)
  - `app/buscar/page.tsx`
  - `app/registrar-profissional/page.tsx`
  - `components/auth/SignupForm.tsx`
  - `components/landing/*`
  - `components/layout/PublicHeader.tsx`, `PublicFooter.tsx`
  - `lib/search-config.ts`
  - `lib/constants.ts`
- [ ] **A3.3** Criar helper `t(key: string)` que lê do arquivo de mensagens.
- [ ] **A3.4** NÃO precisa instalar `next-intl` agora — apenas extrair strings para um objeto/JSON. Isso já facilita 90% do trabalho futuro.

### A4. Preparar Banco de Dados (1 dia)
- [ ] **A4.1** Adicionar `market_code TEXT DEFAULT 'BR'` à tabela `professionals`.
- [ ] **A4.2** Backfill: `UPDATE professionals SET market_code = 'BR' WHERE market_code IS NULL`.
- [ ] **A4.3** Adicionar índice: `CREATE INDEX idx_professionals_market ON professionals(market_code)`.
- [ ] **A4.4** Adicionar `name_es TEXT` às tabelas `categories`, `subcategories`, `specialties`.
- [ ] **A4.5** Renomear/adicionar colunas de preço:
  - `session_price_brl` → `session_price` (DECIMAL)
  - Adicionar `session_price_currency TEXT DEFAULT 'BRL'`
  - Ou criar `session_price_cents INTEGER` + `session_price_currency`
- [ ] **A4.6** Adicionar `profiles.language TEXT DEFAULT 'pt-BR'`.

### A5. Componentizar Search Config (1 dia)
- [ ] **A5.1** Extrair `SEARCH_CATEGORIES`, `LANGUAGE_OPTIONS`, `AVAILABILITY_WINDOWS` de `lib/search-config.ts` para arquivos por mercado:
  - `lib/search-config/br.ts`
  - `lib/search-config/mx.ts` (placeholder)
- [ ] **A5.2** Criar função `loadSearchConfig(marketCode: string)`.

### A6. Corrigir Busca para Suportar Filtro por Mercado (1 dia)
- [ ] **A6.1** Modificar `search_public_professionals_pgtrgm` para aceitar `p_market TEXT DEFAULT NULL`.
- [ ] **A6.2** Adicionar filtro: `AND (p_market IS NULL OR p.market_code = p_market)`.
- [ ] **A6.3** Atualizar `app/buscar/page.tsx` para passar `p_market = 'BR'` (ou detectar do cookie).

### A7. Implementar AI OCR para Triagem de Documentos (KYC) — URGENTE (3-5 dias)
- [ ] **A7.1** Escolher provedor de OCR (AWS Textract vs Google Document AI vs Azure Form Recognizer).
- [ ] **A7.2** Criar pipeline: upload -> OCR -> extração de dados (nome, registro, órgão, data).
- [ ] **A7.3** Criar score de confiança (0-100) baseado em campos extraídos.
- [ ] **A7.4** Adaptar admin dashboard para mostrar dados OCR pré-preenchidos no review.
- [ ] **A7.5** Definir thresholds: auto-aprovação (>80%), fila humana (50-80%), rejeição (<50%).
- [ ] **A7.6** Implementar amostragem aleatória de audit para auto-aprovações.
- [ ] **A7.7** Treinar equipe de review no novo fluxo (2 min vs 10 min por profissional).

**Impacto:** Reduz tempo de review de 10 min para 2 min por profissional. Acelera aprovação em 5x.

**Total Fase A: ~18-25 dias de trabalho de 1 desenvolvedor.**

---

## FASE B: EM PARALELO COM O BRASIL (Não bloqueia o roadmap BR)

> **Por quê:** Essas tarefas podem ser feitas por outra pessoa (redator, designer, advogado) enquanto o dev continua o roadmap do Brasil.

### B1. Conteúdo para México (Redação — 2-4 semanas)
- [ ] **B1.1** Criar 10-15 guias mexicanas (tópicos iniciais):
  - CURP: qué es, cómo tramitar desde el extranjero, cómo actualizar
  - SAT: RFC, declaración anual, régimen fiscal para residentes en el extranjero
  - IMSS: afiliación, pensiones, semanas cotizadas
  - Afores: cómo consultar saldo desde el extranjero
  - Pasaporte mexicano: renovación desde el extranjero
  - Acta de nacimiento: cómo solicitar copia certificada desde el extranjero
  - Revalidación de títulos profesionales (SEP)
  - Bancos mexicanos: cómo mantener cuenta desde el extranjero, SPEI, remesas
  - Votar desde el extranjero (INE)
  - Becas para mexicanos en el extranjero
- [ ] **B1.2** Traduzir landing page para espanhol mexicano.
- [ ] **B1.3** Traduzir FAQ.
- [ ] **B1.4** Traduzir termos legais para espanhol (revisão por advogado mexicano que entenda UK law).
- [ ] **B1.5** Criar blog posts iniciais em espanhol (5-10 posts).

### B2. Setup de Sanity CMS (Dev — 3-5 dias)
- [ ] **B2.1** Criar projeto Sanity.
- [ ] **B2.2** Definir schemas:
  - `guide` (título, slug, conteúdo, locale, market, categoria, tags, publishedAt)
  - `landingBlock` (tipo: hero, stats, features, testimonials, faq, cta — cada um com campos específicos)
  - `blogPost` (título, slug, conteúdo, locale, market, autor, tags)
  - `legalDocument` (título, slug, conteúdo, locale, tipo: terms, privacy, cookies, professional-terms)
  - `faqItem` (pergunta, resposta, locale, market, categoria)
- [ ] **B2.3** Instalar Sanity client no Next.js (`@sanity/client`).
- [ ] **B2.4** Criar funções de fetch: `loadGuides(market, locale)`, `loadLandingBlocks(market)`, `loadLegalDocument(type, locale)`.
- [ ] **B2.5** Migrar guias brasileiros do `lib/guides-data.ts` para Sanity.
- [ ] **B2.6** Configurar preview mode para edição em tempo real.

### B3. Setup Trolley (Dev — 2-3 dias)
- [ ] **B3.1** Criar conta Trolley (https://trolley.com).
- [ ] **B3.2** Configurar tax forms (W-8BEN, W-9) para profissionais internacionais.
- [ ] **B3.3** Integrar API Trolley no backend (`lib/payouts/trolley.ts`):
  - Criar recipiente (profissional)
  - Enviar payout
  - Consultar status
- [ ] **B3.4** Criar webhook handler para notificações de payout.
- [ ] **B3.5** Adicionar UI no dashboard do profissional para configurar conta de payout (PayPal email, dados bancários).

### B4. Setup Stripe para Múltiplas Moedas (Dev — 1-2 dias)
- [ ] **B4.1** Verificar se Stripe UK já suporta apresentação em MXN para clientes.
- [ ] **B4.2** Configurar `presentation_currency` no Stripe Checkout (mostrar preço em MXN para mexicanos, BRL para brasileiros, mas cobrar na moeda do cartão).
- [ ] **B4.3** Atualizar `lib/stripe/client.ts` para remover dual-region BR/UK e usar UK único para todos os clientes.

### B5. Design System por Mercado (Design — 1 semana)
- [ ] **B5.1** Adaptar cores/imagens da landing page para México (bandeira mexicana, imagens de mexicanos, destinos mexicanos).
- [ ] **B5.2** Criar assets gráficos para México (hero images, ícones de países destino mexicanos).
- [ ] **B5.3** Adaptar email templates (Resend) para espanhol.

### B6. Preparação Fiscal UK (Founder + Contador — contínuo)
- [ ] **B6.1** Contratar contador UK (accountant) especializado em tech startups.
- [ ] **B6.2** Definir tratamento fiscal de payouts internacionais (HMRC).
- [ ] **B6.3** Verificar necessidade de VAT registration (threshold £85k/ano).
- [ ] **B6.4** Definir se há withholding tax sobre payouts para Brasil/México.
- [ ] **B6.5** Estruturar accounting para separar receita por mercado (BR vs MX) para análise interna, mesmo que fiscalmente seja tudo UK.

### B7. Pre-cadastro de Profissionais Mexicanos (Operação — contínuo)
- [ ] **B7.1** Criar landing page de "Lista de espera" para profissionais mexicanos.
- [ ] **B7.2** Recrutar 15-20 profissionais mexicanos (psicólogos, abogados, contadores, nutricionistas).
- [ ] **B7.3** Validar documentos mexicanos (cédula profesional, RFC, etc.) — criar checklist de aprovação.
- [ ] **B7.4** Entender quais conselhos profissionais mexicanos permitem atendimento remoto para residentes no exterior.

---

## FASE C: SÓ DEPOIS DE CONSOLIDAR O BRASIL

> **Gatilhos para iniciar:**
> - Brasil: 500+ profissionais ativos, 1.000+ bookings/mês
> - Brasil: receita recorrente positiva (profissionais pagando planos)
> - Brasil: pagamentos 100% funcionais (Stripe UK + Trolley/PayPal)
> - México: 15-20 profissionais pré-cadastrados e aprovados
> - México: 1 pessoa no time que fala espanhol (suporte/aprovação)
> - Tecnologia: i18n implementado e testado no Brasil
> - Legal: termos revisados por advogado mexicano
> - Marketing: orçamento para aquisição de clientes mexicanos

### C1. Implementar i18n Framework (1-2 semanas)
- [ ] **C1.1** Instalar `next-intl` ou `react-i18next`.
- [ ] **C1.2** Configurar routing por locale (`/br/`, `/mx/`, `/pt/`).
- [ ] **C1.3** Migrar arquivos de mensagens (`lib/i18n/messages/pt-BR.json`, `es-MX.json`, `pt-PT.json`).
- [ ] **C1.4** Adaptar `middleware.ts` para locale routing + detecção de mercado.
- [ ] **C1.5** Adaptar `app/layout.tsx` para `<html lang={locale}>`.

### C2. Lançar Mercado México (2-3 semanas)
- [ ] **C2.1** Criar `app/(markets)/mx/page.tsx` com landing page mexicana (dados do CMS).
- [ ] **C2.2** Criar `app/(markets)/mx/buscar/` com busca isolada para profissionais `market_code = 'MX'`.
- [ ] **C2.3** Criar `app/(markets)/mx/guias/` com guias mexicanos (do CMS).
- [ ] **C2.4** Criar `app/(markets)/mx/registrar-profissional/` com onboarding mexicano.
- [ ] **C2.5** Traduzir todos os componentes de UI para espanhol mexicano.
- [ ] **C2.6** Configurar Stripe Checkout para apresentar preços em MXN.
- [ ] **C2.7** Configurar Trolley para payouts a profissionais mexicanos.
- [ ] **C2.8** Traduzir todos os emails (Resend templates) para espanhol.
- [ ] **C2.9** Configurar PostHog segmentação por mercado.
- [ ] **C2.10** Configurar suporte em espanhol (email/chat).
- [ ] **C2.11** Lançamento beta com 20 profissionais e 50 usuários convidados.
- [ ] **C2.12** Lançamento público.

### C3. Escalar para Portugal (1-2 meses depois do México)
- [ ] **C3.1** Replicar estrutura de `/mx/` para `/pt/`.
- [ ] **C3.2** Adaptar conteúdo para português europeu (pt-PT).
- [ ] **C3.3** Adaptar termos para RGPD (já coberto no UK, mas com cláusulas específicas PT).
- [ ] **C3.4** Recrutar profissionais portugueses.

### C4. Otimizações Pós-Lançamento (contínuo)
- [ ] **C4.1** A/B test por mercado.
- [ ] **C4.2** SEO local por mercado (Google Ads, keywords específicas).
- [ ] **C4.3** Parcerias locais (consulados, associações de expats).
- [ ] **C4.4** Localização de métodos de pagamento (se necessário — Apple Pay já cobre tudo).
- [ ] **C4.5** Suporte telefônico/WhatsApp por mercado.

---

## Timeline Resumida

```
Hoje ────────────────────────────────────────────────────────► Futuro
  │
  ├── Fase A: 15-20 dias (DEV — FAÇA AGORA)
  │   ├── Jurisdição UK (2d)
  │   ├── Componentização landing (3-5d)
  │   ├── Extrair strings i18n (5-7d)
  │   ├── DB prep (1d)
  │   ├── Search config (1d)
  │   └── Busca por mercado (1d)
  │
  ├── Fase B: Paralelo (2-4 meses, múltiplas pessoas)
  │   ├── Conteúdo MX (redação)
  │   ├── Sanity CMS (dev)
  │   ├── Trolley setup (dev)
  │   ├── Stripe multi-moeda (dev)
  │   ├── Design MX (design)
  │   ├── Fiscal UK (founder + contador)
  │   └── Pre-cadastro pros MX (operação)
  │
  └── Fase C: Depois de consolidar BR (3-4 meses depois)
      ├── i18n framework (1-2s)
      ├── Lançamento MX (2-3s)
      ├── Lançamento PT (1-2m depois)
      └── Otimizações (contínuo)
```

---

## Dependências Entre Fases

```
Fase A (fundamentos)
    │
    ├──► Fase B pode começar imediatamente (paralelo)
    │
    └──► Fase C depende de:
         ├── Fase A completa
         ├── Fase B: conteúdo MX pronto
         ├── Fase B: Sanity CMS pronto
         ├── Fase B: Trolley configurado
         ├── Fase B: profissionais MX pré-cadastrados
         └── Brasil consolidado (gatilhos de métricas)
```

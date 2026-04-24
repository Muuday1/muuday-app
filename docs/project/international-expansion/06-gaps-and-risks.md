# Gaps e Riscos — Expansão Internacional Muuday

> Data: 2026-04-23  
> Status: Identificação de riscos  
> Organização: Por severidade (Crítico → Alto → Médio → Baixo)

---

## RISCOS CRÍTICOS (Bloqueiam lançamento se não resolvidos)

### R1. Ausência de Isolamento por País na Busca
**Descrição:** A busca atual (`search_public_professionals_pgtrgm`) retorna TODOS os profissionais aprovados globalmente. Um brasileiro vê profissionais mexicanos e vice-versa.

**Impacto:** Viola o modelo de negócio "brasileiros só veem brasileiros". Causa confusão, baixa conversão, e potencial problema legal (ex: profissional mexicano atendendo cliente brasileiro sem registro no Brasil).

**Mitigação:**
- Adicionar `market_code` à tabela `professionals`.
- Modificar a RPC de busca para filtrar por `market_code`.
- Atualizar `app/buscar/page.tsx` para passar o mercado do usuário.

**Status:** Não resolvido. **Deve ser Feito na Fase A.**

---

### R2. Onboarding Profissional 100% Hardcoded para Brasil
**Descrição:** O `SignupForm.tsx` e todo o fluxo de onboarding profissional assumem contexto brasileiro: títulos (Dr., Dra.), qualificações (OAB, CRM, CRC), termos com jurisdição SP/BR.

**Impacto:** Um profissional mexicano não consegue se cadastrar corretamente. Os documentos solicitados não fazem sentido para ele.

**Mitigação:**
- Extrair configuração de onboarding por mercado (`lib/onboarding/br.ts`, `lib/onboarding/mx.ts`).
- Criar validadores de credenciais por país (`lib/admin/credential-checks/br.ts`, `mx.ts`).
- Traduzir termos legais para espanhol (mantendo jurisdição UK).

**Status:** Não resolvido. **Depende de Fase B (conteúdo) + Fase C (implementação).**

---

### R3. Jurisdição Legal Incorreta
**Descrição:** Os termos atuais mencionam "São Paulo/SP" e "legislação da República Federativa do Brasil" como foro e lei aplicável.

**Impacto:** Potencial invalidade contratual (a empresa é UK, não pode eleger foro SP sem presença no Brasil). Risco de não conseguir defender disputas no foro correto.

**Mitigação:**
- Corrigir TODOS os documentos legais para UK jurisdiction.
- Revisar com advogado UK.

**Status:** Não resolvido. **Deve ser Feito na Fase A (imediatamente).**

---

### R4. Sem Framework i18n
**Descrição:** Não existe `next-intl`, `react-i18next`, ou qualquer framework de internacionalização. Todo o copy está hardcoded em português.

**Impacto:** Qualquer tradução exige edição manual de dezenas de arquivos. Manutenção impossível em escala.

**Mitigação:**
- Fase A: extrair strings para arquivos JSON/TS (preparação).
- Fase C: instalar `next-intl` com locale routing.

**Status:** Parcial (preparação pode começar na Fase A).

---

## RISCOS ALTOS (Causam problemas sérios, mas não bloqueiam lançamento)

### R5. Landing Page Monolítica
**Descrição:** `app/page.tsx` é um arquivo enorme com copy, stats, FAQ, guias — tudo hardcoded para Brasil.

**Impacto:** Impossível reutilizar para México sem duplicar código. Manutenção de 2+ landing pages vira pesadelo.

**Mitigação:**
- Componentizar landing page (Fase A).
- Migrar conteúdo para Sanity CMS (Fase B).

**Status:** Não resolvido. **Fase A resolve a componentização.**

---

### R6. Taxonomia Só em Português
**Descrição:** O banco tem `name_pt` e `name_en`, mas o app só lê `name_pt`. Não existe `name_es`.

**Impacto:** Profissionais mexicanos não conseguem selecionar especialidades em espanhol. Clientes mexicanos não conseguem buscar por categorias em espanhol.

**Mitigação:**
- Adicionar `name_es` ao schema (Fase A).
- Atualizar queries para selecionar coluna correta baseada no locale.

**Status:** Parcial (schema pronto, mas não usado).

---

### R7. Sem Sistema de Conteúdo (CMS)
**Descrição:** Guias, blog, FAQ, termos legais são arrays TypeScript estáticos (`lib/guides-data.ts`, `lib/legal/*.ts`).

**Impacto:** Adicionar guias mexicanos requer deploy de código. Redatores não-devs não conseguem publicar conteúdo. Não há preview, versionamento, ou workflow de aprovação.

**Mitigação:**
- Implementar Sanity CMS (Fase B).
- Migrar conteúdo existente para CMS.

**Status:** Não resolvido. **Fase B.**

---

### R8. Stripe Dual-Region Desnecessário
**Descrição:** O código tem `StripePlatformRegion = 'br' | 'uk'` com lógica de dual-region. Mas a decisão é usar Stripe UK para todos os clientes.

**Impacto:** Complexidade desnecessária. `STRIPE_BR_SECRET_KEY` não é necessário se todos os pagamentos passam por UK.

**Mitigação:**
- Simplificar `lib/stripe/client.ts` para usar UK único.
- Remover `resolveStripePlatformRegion` ou mantê-lo apenas para payout routing (se necessário).

**Status:** Não resolvido. **Pode ser Feito na Fase A.**

---

### R9. Colunas de Preço em BRL Only
**Descrição:** `session_price_brl`, `price_brl` hardcodam BRL.

**Impacto:** Não suporta preços em MXN, EUR, USD sem hacks.

**Mitigação:**
- Renomear para `session_price` + `session_price_currency`.
- Ou `session_price_cents` (INTEGER) + `session_price_currency`.

**Status:** Não resolvido. **Fase A (DB).**

---

### R10. Falta de `profiles.language`
**Descrição:** O spec menciona `language` como dimensão, mas o schema não tem `profiles.language`.

**Impacto:** Dificulta rotear emails, notificações, e onboarding no idioma correto do usuário.

**Mitigação:**
- Adicionar `profiles.language TEXT DEFAULT 'pt-BR'`.
- Backfill com base no `profiles.country` ou cookie.

**Status:** Não resolvido. **Fase A (DB).**

---

## RISCOS MÉDIOS (Problemas operacionais, gerenciáveis)

### R11. Profissional Pode Ter Múltiplos Mercados?
**Descrição:** Ainda não decidimos se um profissional brasileiro que fala espanhol pode atender mercado MX também.

**Impacto:** Se não permitirmos, limitamos a oferta. Se permitirmos, complica o modelo (2 profiles, 2 preços, 2 moedas).

**Mitigação:**
- Fase 1: 1 profissional = 1 mercado.
- Fase 2: Permitir múltiplos mercados (criar tabela `professional_markets`).

**Status:** Decisão pendente. **Não bloqueia lançamento.**

---

### R12. Email Marketing Não Localizado
**Descrição:** Emails (Resend) provavelmente são em português hardcoded.

**Impacto:** Usuários mexicanos recebem emails em português.

**Mitigação:**
- Criar templates de email por locale no Resend (ou no CMS).
- Usar `profiles.language` para rotear template correto.

**Status:** Não investigado a fundo. **Fase C.**

---

### R13. Cookie Consent Ignora México
**Descrição:** O cookie consent (`components/cookies/CookieConsentRoot.tsx`) pode não cobrir LFPDPPP (México).

**Impacto:** Risco de não conformidade com lei mexicana de cookies.

**Mitigação:**
- Adicionar LFPDPPP como lei aplicável no cookie policy.
- Verificar se o banner de cookies já cobre requisitos mexicanos (geralmente sim, se cobre LGPD/GDPR).

**Status:** Não verificado. **Fase A (junto com correção legal).**

---

### R14. SEO — Sem hreflang
**Descrição:** Não existem tags `hreflang` apontando entre variantes de mercado.

**Impacto:** Google pode não entender que `/br/` e `/mx/` são versões alternativas da mesma página. Risco de conteúdo duplicado.

**Mitigação:**
- Adicionar `<link rel="alternate" hreflang="...">` em todas as páginas.
- Gerar sitemap internacional.

**Status:** Não resolvido. **Fase C.**

---

### R15. Analytics Sem Segmentação por Mercado
**Descrição:** PostHog/GA provavelmente não segmenta eventos por mercado.

**Impacto:** Não conseguimos comparar métricas BR vs MX.

**Mitigação:**
- Adicionar `market` como propriedade em todos os eventos de tracking.
- Criar dashboards separados por mercado.

**Status:** Não verificado. **Fase C.**

---

## RISCOS BAIXOS (Não bloqueiam, mas merecem atenção)

### R16. Timezones Diferentes
**Descrição:** Brasil (BRT -3), México (CST -6/-5), Portugal (WET/WEST +0/+1).

**Impacto:** Agendamentos podem ficar confusos se o timezone não for tratado corretamente.

**Mitigação:**
- O app já usa `profiles.timezone` — apenas garantir que está correto para MX/PT.
- Armazenar todos os horários em UTC no banco.
- Converter para timezone do usuário na UI.

**Status:** Parcialmente resolvido (schema existe).

---

### R17. Bandeiras e Emojis de País
**Descrição:** A landing page usa emojis de bandeira (`🇧🇷`, `🇲🇽`). Nem todos os sistemas renderizam emojis igualmente.

**Impacto:** UX inconsistente.

**Mitigação:**
- Usar SVGs de bandeiras em vez de emojis.
- Ou usar biblioteca como `country-flag-icons`.

**Status:** Cosmético. **Não urgente.**

---

### R18. Números de Telefone
**Descrição:** O signup pode pedir telefone. Formato brasileiro (+55) é diferente de mexicano (+52) e português (+351).

**Impacto:** Validação de telefone pode quebrar.

**Mitigação:**
- Usar `libphonenumber-js` para validação internacional.
- Detectar prefixo baseado no país selecionado.

**Status:** Não verificado. **Fase C.**

---

## Resumo por Fase

| Fase | Riscos que Resolve |
|------|-------------------|
| **Fase A** | R1 (parcial), R3, R4 (parcial), R5, R8, R9, R10, R13 (parcial) |
| **Fase B** | R7, R2 (parcial — conteúdo), R6 (parcial — dados) |
| **Fase C** | R1 (completo), R2 (completo), R4 (completo), R6 (completo), R11, R12, R14, R15, R16, R17, R18 |

---

## Riscos Externos (Fora do controle da equipe técnica)

### RE1. Regulamentação Mexicana de Telemedicina/Teleconsulta
**Descrição:** O México tem regras específicas sobre atendimento remoto (telemedicina, psicologia online). Alguns conselhos podem proibir ou restringir.

**Impacto:** Profissionais mexicanos podem não poder usar a plataforma legalmente.

**Mitigação:**
- Consultoria jurídica mexicana ANTES de lançar.
- Mapear quais profissões permitidas para atendimento remoto.

### RE2. Câmbio e Volatilidade
**Descrição:** BRL, MXN, EUR têm volatilidade cambial.

**Impacto:** Preços fixos em BRL podem ficar desfavoráveis para expats que ganham em USD/GBP/EUR.

**Mitigação:**
- Permitir que profissionais definam preços em múltiplas moedas.
- Ou converter automaticamente com taxa do dia (Stripe faz isso).

### RE3. Concorrência Local
**Descrição:** No México podem existir plataformas similares já estabelecidas.

**Impacto:** Dificuldade de aquisição de clientes.

**Mitigação:**
- Pesquisa de mercado ANTES de investir em desenvolvimento.
- Diferenciação (foco em expats, não em mercado local).


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.

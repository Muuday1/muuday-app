# Wise Refactor — Gaps: Estado Atual vs. Desejado

> **Date**: 2026-04-19  
> **Goal**: Refactor all UI to match Wise.com aesthetic (flat, clean, modern)  
> **Scope**: Document what exists today vs. what the design system specifies

---

## Resumo das Mudanças Necessárias

| Aspecto | Estado Atual | Estado Desejado (Wise) | Impacto |
|---------|-------------|------------------------|---------|
| **Font body** | Plus Jakarta Sans | Inter | Alta |
| **Font display** | Bricolage Grotesque | Space Grotesk | Alta |
| **Primary color** | `#1a8a50` (escuro) | `#22c55e` (vibrante) | Alta |
| **Button radius** | `rounded-full` (pill) | `rounded-md` (8px) | Alta |
| **Card shadow** | `shadow-sm/md` presente | `shadow-none` + border only | Alta |
| **Card radius** | 16–20px | 12px | Média |
| **Page bg** | `#f4f8f5` | `#f4f8f5` | ✅ Igual |
| **Text primary** | `#102318` | `#1c1917` | Média |

---

## Páginas Atuais vs. Frames Documentados

### ✅ 1. Landing Page (`/`)

**Estado Atual (refatorado em 2026-04-19):**
- Hero com composição geométrica CSS (grid + shapes + mockup cards)
- Stats bar (100% online, 6+ áreas, 24/7)
- Features grid (4 cards flat, sem shadow)
- Como funciona (3 passos em cards brand-50)
- Categorias (4 cards flat)
- FAQ accordion (`rounded-lg`)
- CTA final (banner brand-700, botões `rounded-md`)

**Mudanças aplicadas:**
- Copy reescrito (menos jargão, mais direto)
- Fontes: Inter + Space Grotesk
- Cor brand: `#22c55e`
- Radius: 6–12px (de 12–20px)
- Cards: flat, border-only (sem shadow)
- Botões: `rounded-md` (de pill)
- Composição geométrica CSS na hero (estilo Wise)

**Arquivos alterados:**
- `tailwind.config.ts`
- `app/globals.css`
- `app/page.tsx`
- `components/landing/FaqAccordion.tsx`

---

### 2. Registrar Profissional (`/registrar-profissional`)

**Estado Atual (348 linhas):**
- Landing page de marketing completa
- Hero section com imagem, CTA pill buttons
- Features grid (6 cards com ícones)
- Processo em 3 passos (cards com imagens)
- Especialidades (8 cards alternados)
- Benefícios (lista + resumo)
- CTA final (banner verde)

**Frame Documentado (PE genérico):**
- Formulário wizard simples: nome, email, CRP, especialidade

**Gap**: O frame não captura a complexidade real. Precisa documentar como refatorar cada seção da landing para o estilo Wise.

---

### 3. Signup (`/cadastro`)

**Estado Atual:**
- 2-step wizard (usuário)
- 3-step wizard (profissional)
- Hand-rolled modais com `rounded-2xl` e `shadow-xl`
- Inputs com `rounded-xl` (16px)
- `ring-2 ring-brand-500/20` para focus

**Frame Documentado:**
- Formulário simples de 3 campos

**Gap**: Não documenta o wizard real, nem os modais de confirmação.

---

### 4. Dashboard / App (`/dashboard`, `/agenda`)

**Estado Atual (do agente):**
- 6-stage tracker modal no dashboard pós-signup
- Sidebar com navegação
- Cards com sombra
- Botões pill em CTAs de marketing

**Frame Documentado:**
- Dashboard limpo com stats cards

**Gap**: Não documenta o onboarding tracker, nem a transição entre estados.

---

### 5. Modais / Dialogs

**Estado Atual:**
- Hand-rolled (sem Radix/Headless)
- `fixed inset-0 bg-neutral-900/45` backdrop
- `rounded-2xl` (20px) universal
- `shadow-xl` universal
- `ring-2 ring-brand-500/20` + `border-brand-500` focus

**Design System Especifica:**
- Modal: `radius-lg` (12px), `shadow-lg`
- Drawer: `shadow-lg`
- Toast: `shadow-xl`

**Gap**: Os modais atuais são mais arredondados (20px vs 12px) e usam sombras maiores. Precisam ser ajustados.

---

### 5. Componentes Atuais no Código

| Componente | Implementação Atual | Deve Virar |
|-----------|---------------------|------------|
| `.mu-btn-primary` | `rounded-full`, `bg-[#1a8a50]` | `rounded-md` (8px), `bg-primary-500` |
| `.mu-btn-outline` | `rounded-full`, border suave | `rounded-md` (8px), `border-neutral-200` |
| `.mu-shell-card` | `shadow-sm`, `radius-md` (16px) | `shadow-none`, `radius-lg` (12px), border |
| `.mu-shell-card-lg` | `shadow-md`, `radius-lg` (20px) | `shadow-none`, `radius-xl` (16px), border |
| Inputs | `rounded-xl` (16px) | `rounded-md` (8px) |
| Modais | `rounded-2xl` (20px) | `rounded-lg` (12px) |

---

## O que Precisa Ser Refeito nos Docs

### Frames a Reescrever

| Frame | Motivo |
|-------|--------|
| `professional-onboarding.md` | Precisa refletir a landing page real com hero, features, process cards |
| `user-onboarding.md` | Precisa incluir o wizard real de 2/3 steps |
| `session-lifecycle.md` | Precisa incluir o 6-stage tracker modal |
| `search-booking.md` | OK — mas verificar se o card grid reflete a busca real |

### Tokens a Ajustar

| Token Atual | Token Desejado | Ação |
|-------------|----------------|------|
| `--mu-radius-sm: 12px` | `6px` | Mudar |
| `--mu-radius-md: 16px` | `8px` | Mudar |
| `--mu-radius-lg: 20px` | `12px` | Mudar |
| `shadow-sm/md` nos cards | `shadow-none` | Remover |
| `rounded-full` nos botões | `rounded-md` | Mudar |
| `#1a8a50` brand | `#22c55e` | Mudar |

---

## Pergunta para o Usuário

Quer que eu:

1. **Atualize os frame docs** para refletir a complexidade real das páginas existentes (mas no estilo Wise desejado)?
2. **Crie um documento de migração detalhado** mostrando exatamente o que mudar em cada arquivo do código?
3. **Ambos**?

Os frames genéricos que criei servem como base, mas precisam ser enriquecidos com o contexto real do site.

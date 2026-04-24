# Frame: Landing Page (`/`)

> **Date**: 2026-04-19  
> **Status**: ✅ Refactored to Wise aesthetic  
> **Files**: `app/page.tsx`, `app/globals.css`, `tailwind.config.ts`, `components/landing/FaqAccordion.tsx`

---

## Purpose

Marketing homepage for Muuday. Serves two audiences:
1. **Clients** (brasileiros no exterior) → primary CTA: "Ver profissionais disponíveis"
2. **Professionals** → secondary CTA: "Quero atender pela Muuday"

---

## Sections (top to bottom)

### 1. Hero

**Layout**: 2-col grid on desktop (text left, geometric composition right), single col on mobile.

**Copy:**
- Badge: "Atendimento em vídeo para quem mora fora"
- Headline: "Profissionais brasileiros, no seu fuso, na sua língua."
- Subheadline: "Psicólogos, nutricionistas, coaches e outros especialistas que entendem sua realidade — porque também passaram por isso."
- CTA primary: "Ver profissionais disponíveis"
- CTA secondary: "Quero atender pela Muuday"

**Visual:**
- Background: `var(--mu-surface-muted)` (#f8fbf9)
- No gradient blobs (removed)
- Right side: `GeometricHero` component — CSS-only composition:
  - 48px grid with `rgba(34,197,94,0.05)` lines
  - Floating shapes: rotated squares, circles, small rects (border-only, brand-100/200)
  - Central mockup: 2 stacked cards simulating UI (white bg, brand borders, placeholder bars)
  - SVG connector lines (dashed, brand-200)

**Style rules:**
- Badge: `rounded-md`, border `brand-100`, white bg
- Headline: `font-display`, tracking-tight
- CTAs: `mu-btn-primary` / `mu-btn-outline` (both `rounded-md`, not pill)

---

### 2. Stats Bar

**Layout**: Horizontal wrap, centered.

**Copy:**
- "100%" / "online por vídeo"
- "6+" / "áreas de atuação"
- "24/7" / "agende a qualquer hora"

**Style:**
- Border top/bottom: `brand-100`
- Numbers: `font-display`, `text-brand-700`, semibold
- Labels: `text-sm`, `var(--mu-muted)`

---

### 3. Features ("O que você encontra aqui")

**Layout**: 2×2 grid on desktop, single col on mobile.

**Copy:**
- Headline: "Encontre quem fala a mesma língua — literalmente."
- Cards:
  1. "Filtros que fazem sentido" — Busque por especialidade, idioma, país e horário. Sem enrolação.
  2. "Agende do seu jeito" — Uma sessão, várias, ou recorrente. O fuso horário é ajustado automaticamente.
  3. "Videochamada integrada" — Da busca à sessão, tudo acontece aqui. Sem precisar de Zoom, Teams ou WhatsApp.
  4. "Profissionais revisados" — Cada perfil é verificado antes de entrar no ar. Você sabe com quem está falando.

**Style:**
- Cards: `mu-shell-card` (flat, border-only, `rounded-md`)
- Icon boxes: `h-11 w-11`, `rounded-md`, `bg-brand-50`, `text-brand-700`
- Hover: `border-brand-300` (no shadow elevation)

---

### 4. How It Works

**Layout**: 3-col grid on desktop.

**Copy:**
- Headline: "Três passos. Nada de complicação."
- Step 1: "Busque" — Use filtros práticos para encontrar quem entende sua situação.
- Step 2: "Agende" — Escolha dia e horário. A confirmação chega na hora.
- Step 3: "Conecte" — Faça a sessão por vídeo aqui mesmo. Tudo registrado em um só lugar.

**Style:**
- Cards: `rounded-lg`, border `brand-100`, `bg-brand-50`
- Step number: circle, `bg-brand-600`, white text
- Section has `border-y border-brand-100`

---

### 5. Categories

**Layout**: Left text block + right 2×2 grid on desktop.

**Copy:**
- Headline: "Escolha por especialidade."
- Subheadline: "Cada categoria tem profissionais que combinam expertise com a experiência de viver fora do Brasil."
- Link: "Ver profissionais" + arrow

**Style:**
- Cards: `mu-shell-card` (flat)
- Emoji icon, title, description, link
- Hover: `-translate-y-0.5 border-brand-300` (no shadow)

---

### 6. FAQ

**Layout**: Left text block + right accordion on desktop.

**Copy:**
- Headline: "Perguntas frequentes"
- Sub: "Ainda com dúvida? Entre em contato conosco."
- CTA: "Fale com a equipe"

**Style:**
- Accordion: `rounded-lg`, border `neutral-200`, divide-y
- Questions: `font-semibold`, `text-neutral-900`
- Answers: `text-sm leading-7`, `text-neutral-600`

---

### 7. Final CTA

**Layout**: Centered banner inside shell.

**Copy:**
- Headline: "Comece agora."
- Sub: "Procure um especialista ou cadastre seu perfil para começar a atender."
- CTA 1: "Ver especialistas"
- CTA 2: "Criar perfil profissional"

**Style:**
- Banner: `rounded-xl`, `bg-brand-700`, white text
- Primary button: white bg, `text-brand-700`, `rounded-md`
- Secondary button: `border-white/45`, `bg-white/10`, `rounded-md`

---

## Design Tokens Used

| Token | Value |
|-------|-------|
| `--mu-radius-sm` | 6px |
| `--mu-radius-md` | 8px |
| `--mu-radius-lg` | 12px |
| `--mu-shadow-sm/md` | none |
| `--mu-text` | #1c1917 |
| `--mu-muted` | #57534e |
| `--mu-border` | #dcfce7 |
| Brand 500 | #22c55e |
| Brand 700 | #15803d |
| Font sans | Inter |
| Font display | Space Grotesk |

---

## Component Inventory

| Component | Source | Notes |
|-----------|--------|-------|
| `PublicPageLayout` | `components/public/PublicPageLayout.tsx` | Shell wrapper |
| `FaqAccordion` | `components/landing/FaqAccordion.tsx` | Client component, `rounded-lg` |
| `GeometricHero` | Inline in `app/page.tsx` | CSS-only composition |
| `mu-btn-primary` | `globals.css` utility | `rounded-md`, `bg-[#22c55e]` |
| `mu-btn-outline` | `globals.css` utility | `rounded-md`, border |
| `mu-shell-card` | `globals.css` utility | Flat, border-only |


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.

# Recurring Booking — Frame Specifications

> **Journey:** Recurring Booking  
> **Source:** `docs/product/journeys/recurring-booking-journey.md`  
> **Version:** 1.0  
> **Date:** 2026-04-19

Frames that map the recurring package booking flow: type selection, configuration, slot selection, and success.

---

## RC-01: Type Selection (`/agendar/[id]`)

### Overview

| Property | Value |
|----------|-------|
| **Frame ID** | RC-01 |
| **Route** | `/agendar/[id]` |
| **Actor** | User (client) |
| **Dimensions** | Desktop 1440×900 / Mobile 375×812 |
| **Background** | `surface-page` (`#f4f8f5`) |
| **Layout Grid** | 8px baseline, form max-width 720px centered |

### Layout Structure

The first step of booking asks the user to choose between a single session, a recurring package, or multiple specific dates. The layout presents three equal-option cards with clear visual hierarchy.

```
┌─────────────────────────────────────────────────────────────┐
│ Header (64px, sticky)                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Left Arrow]                            Passo 1 de 4       │
│                                                             │
│  Escolha o tipo de agendamento                              │
│  "Como voce prefere marcar suas sessoes?"                   │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐│
│  │                 │  │                 │  │              ││
│  │  [Calendar icon]│  │  [Repeat icon]  │  │ [Layers icon]││
│  │                 │  │                 │  │              ││
│  │  Sessao unica   │  │ Pacote          │  │ Varias       ││
│  │                 │  │ Recorrente      │  │ Datas        ││
│  │  Uma consulta   │  │ Semanal ou      │  │ 2-20 datas   ││
│  │  individual     │  │ mensal com      │  │ especificas  ││
│  │                 │  │ desconto        │  │              ││
│  │                 │  │ [Save 5pct]     │  │              ││
│  │  Selected       │  │                 │  │              ││
│  │                 │  │                 │  │              ││
│  └─────────────────┘  └─────────────────┘  └──────────────┘│
│                                                             │
│  [Continuar] (disabled until selection)                     │
│                                                             │
│  -- or --                                                   │
│                                                             │
│  "Pacote recorrente disponivel nos planos Essencial e Pro"  │
│  [Ver planos] link                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Components & Layers

| # | Layer Name | Component / Shape | Position (x, y) | Size (w, h) | Tokens & Properties | Constraints |
|---|------------|-------------------|-----------------|-------------|---------------------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: `surface-page`, border-bottom: `border-default` | Top, Left+Right |
| 2 | Back Link | Button/Ghost | (32, 80) | (120, 32) | icon: ArrowLeft, text: `text-sm`, color: `text-secondary` | Top, Left |
| 3 | Step Indicator | Text/Label | (1180, 84) | (200, 20) | font: `text-sm`, color: `text-muted`, text-align: right | Top, Right |
| 4 | Page Title | Text/H1 | (360, 128) | (720, 40) | font: `text-2xl`, `font-display`, color: `text-primary`, text-align: center | Top, Center |
| 5 | Page Subtitle | Text/Body | (360, 176) | (720, 24) | font: `text-base`, color: `text-muted`, text-align: center | Top, Center |
| 6 | Options Row | Row | (360, 232) | (720, 320) | gap: `space-6`, justify: center | Top, Center |
| 7 | Single Card | Card/Selectable | (360, 232) | (216, 320) | bg: `surface-card`, border: `2px solid primary-500` (selected) / `1px solid border-default`, radius: `radius-lg`, padding: `space-6` | Top, Left |
| 8 | Single Icon | Icon/Box | (432, 264) | (48, 48) | color: `primary-500` (selected) / `neutral-400`, stroke-width: 1.5px | Top, Center |
| 9 | Single Title | Text/H3 | (360, 328) | (216, 28) | font: `text-lg`, `font-display`, color: `text-primary`, text-align: center | Top, Center |
| 10 | Single Desc | Text/Body | (360, 364) | (216, 48) | font: `text-sm`, color: `text-muted`, text-align: center | Top, Center |
| 11 | Single Radio | Radio | (456, 428) | (20, 20) | checked: `primary-500` (selected) / `neutral-300` | Top, Center |
| 12 | Recurring Card | Card/Selectable | (600, 232) | (216, 320) | same structure, unselected by default | Top, Center |
| 13 | Recurring Icon | Icon/Box | (672, 264) | (48, 48) | same icon styling | Top, Center |
| 14 | Recurring Title | Text/H3 | (600, 328) | (216, 28) | same text styling | Top, Center |
| 15 | Recurring Desc | Text/Body | (600, 364) | (216, 48) | same text styling | Top, Center |
| 16 | Discount Badge | Badge | (648, 416) | (120, 24) | bg: `brand-bright`, text: `neutral-900`, font: `text-xs`, radius: `radius-full` | Top, Center |
| 17 | Recurring Radio | Radio | (696, 428) | (20, 20) | same radio styling | Top, Center |
| 18 | Batch Card | Card/Selectable | (840, 232) | (216, 320) | same structure | Top, Right |
| 19 | Batch Icon | Icon/Box | (912, 264) | (48, 48) | same icon styling | Top, Center |
| 20 | Batch Title | Text/H3 | (840, 328) | (216, 28) | same text styling | Top, Center |
| 21 | Batch Desc | Text/Body | (840, 364) | (216, 48) | same text styling | Top, Center |
| 22 | Batch Radio | Radio | (936, 428) | (20, 20) | same radio styling | Top, Center |
| 23 | Continue Button | Button/Primary | (480, 580) | (480, 56) | bg: `primary-500`, text: `white`, radius: `radius-md`, font: `text-lg`, `font-semibold` | Top, Center |
| 24 | Divider | Line | (360, 664) | (720, 1) | color: `border-default` | Top, Center |
| 25 | Tier Note | Text/Body | (360, 684) | (720, 24) | font: `text-sm`, color: `text-muted`, text-align: center | Top, Center |
| 26 | Plans Link | Text/Link | (360, 716) | (720, 24) | font: `text-sm`, color: `text-link`, text-align: center | Top, Center |

### Token Values

| Element | Token | Value |
|---------|-------|-------|
| Page background | `surface-page` | `#f4f8f5` |
| Card background | `surface-card` | `#ffffff` |
| Selected border | `primary-500` | `#22c55e` |
| Unselected border | `border-default` | `#e7e5e4` |
| Discount badge bg | `brand-bright` | `#9FE870` |
| Primary CTA | `primary-500` | `#22c55e` |
| CTA text | `text-inverse` | `#ffffff` |
| Title color | `text-primary` | `#1c1917` |
| Muted color | `text-muted` | `#78716c` |
| Link color | `text-link` | `#16a34a` |
| Title font | `font-display` | Space Grotesk |
| Body font | `font-body` | Inter |
| H1 size | `text-2xl` | 31px |
| H3 size | `text-lg` | 20px |
| Body size | `text-sm` | 13px |
| Card radius | `radius-lg` | 12px |
| Button radius | `radius-md` | 8px |
| Card padding | `space-6` | 24px |
| Card gap | `space-6` | 24px |

### States

**Default (No Selection)**
- All three cards have `1px solid border-default`
- All radios unchecked
- Continue button disabled (`opacity-50`)
- Single card has subtle `neutral-100` hover background

**Card Hover**
- Border transitions to `neutral-300`, `duration-fast`
- Background transitions to `neutral-50`
- Cursor: pointer

**Card Selected**
- Border changes to `2px solid primary-500`
- Card background: `primary-50`
- Radio checked: `primary-500` with white dot
- Icon color: `primary-500`
- Continue button enabled

**Recurring Disabled (Tier Gating)**
- Recurring card has `opacity-50`
- Cursor: not-allowed
- Badge text changes to: "Disponivel no plano Essencial"
- Click shows tooltip: "Faca upgrade para agendar pacotes recorrentes"
- Radio hidden

**Continue Loading**
- Button shows spinner + "Carregando..."
- Disabled
- `aria-busy="true"`

**Mobile Layout**
- Cards stack vertically, full width with 16px margins
- Each card becomes horizontal (icon left, text right)
- Continue button becomes full-width sticky bottom bar

### Accessibility Notes

- **Focus order**: Back link -> Single card -> Recurring card -> Batch card -> Continue button -> Plans link
- **Focus ring**: `2px solid primary-500`, offset 2px
- **ARIA**:
  - Options row: `role="radiogroup"`, `aria-label="Tipo de agendamento"`
  - Each card: `role="radio"`, `aria-checked="true/false"`, `tabindex="0"`
  - Continue button: `aria-label="Continuar para configuracao"`
  - Disabled recurring card: `aria-disabled="true"`, `aria-describedby="tier-restriction"`
- **Keyboard**: Arrow keys navigate between cards (Left/Right, Up/Down). Space/Enter selects. Tab moves to Continue button.
- **Screen reader**: Announce card on focus: "Sessao unica, uma consulta individual, nao selecionado". Announce selection change.
- **Color contrast**: Selected border `primary-500` on white = 3.2:1 -- acceptable for UI component border (3:1 minimum for UI components). Badge `brand-bright` (`#9FE870`) text `neutral-900` = 8.1:1.
- **Touch targets**: Each card is minimum 216x320px on desktop. On mobile, minimum 72px height per card.

---

## RC-02: Recurring Config (`/agendar/[id]/recorrente`)

### Overview

| Property | Value |
|----------|-------|
| **Frame ID** | RC-02 |
| **Route** | `/agendar/[id]/recorrente` |
| **Actor** | User (client) |
| **Dimensions** | Desktop 1440x900 / Mobile 375x812 |
| **Background** | `surface-page` (`#f4f8f5`) |
| **Layout Grid** | 8px baseline, form max-width 640px centered |

### Layout Structure

Step 2 of recurring booking. A stepper shows progress. The user configures frequency, duration, and sees a live price preview with discount. Form fields are stacked vertically with generous spacing.

```
┌─────────────────────────────────────────────────────────────┐
│ Header (64px, sticky)                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Left Arrow]                            Passo 2 de 4       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Stepper: (1) Tipo  ->  (2) Config  ->  (3) Horarios -> (4)│
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Configure seu pacote                                       │
│                                                             │
│  Frequencia *                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Semanal]                                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Numero de sessoes *                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [8]                                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Duracao de cada sessao                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [50 minutos]                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Discount Badge: [Economize 5pct]                    │   │
│  │                                                     │   │
│  │ 8 sessoes x R$ 150 = R$ 1.200                       │   │
│  │ Taxa de servico: Gratis                             │   │
│  │                                                     │   │
│  │ Equivalente a sessoes individuais: R$ 1.260         │   │
│  │ Voce economiza: R$ 60                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [checked] Renovacao automatica                             │
│  "Notificaremos 7 dias antes da renovacao. Cancele quando   │
│   quiser."                                                  │
│                                                             │
│  [Continuar]                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Components & Layers

| # | Layer Name | Component / Shape | Position (x, y) | Size (w, h) | Tokens & Properties | Constraints |
|---|------------|-------------------|-----------------|-------------|---------------------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: `surface-page`, border-bottom: `border-default` | Top, Left+Right |
| 2 | Back Link | Button/Ghost | (32, 80) | (120, 32) | icon: ArrowLeft, text: `text-sm`, color: `text-secondary` | Top, Left |
| 3 | Step Indicator | Text/Label | (1180, 84) | (200, 20) | font: `text-sm`, color: `text-muted`, text-align: right | Top, Right |
| 4 | Stepper | Stepper | (400, 128) | (640, 48) | orientation: horizontal, step size: 32px | Top, Center |
| 5 | Step 1 | Step/Completed | (400, 128) | (32, 32) | radius: `radius-full`, bg: `primary-500`, icon: `Check` | Top, Left |
| 6 | Step 1 Label | Text/Label | (400, 164) | (100, 16) | font: `text-xs`, color: `primary-700`, text-align: center | Top, Left |
| 7 | Connector 1 | Line | (432, 142) | (120, 2) | color: `primary-500` | Top, Left |
| 8 | Step 2 | Step/Active | (552, 128) | (32, 32) | radius: `radius-full`, border: `2px solid primary-500`, bg: `white` | Top, Left |
| 9 | Step 2 Label | Text/Label | (552, 164) | (100, 16) | font: `text-xs`, color: `primary-700`, text-align: center | Top, Left |
| 10 | Connector 2 | Line | (584, 142) | (120, 2) | color: `neutral-200` | Top, Left |
| 11 | Step 3 | Step/Pending | (704, 128) | (32, 32) | radius: `radius-full`, bg: `neutral-200`, text: `neutral-500` | Top, Left |
| 12 | Step 3 Label | Text/Label | (704, 164) | (100, 16) | font: `text-xs`, color: `neutral-500`, text-align: center | Top, Left |
| 13 | Connector 3 | Line | (736, 142) | (120, 2) | color: `neutral-200` | Top, Left |
| 14 | Step 4 | Step/Pending | (856, 128) | (32, 32) | same as Step 3 | Top, Left |
| 15 | Step 4 Label | Text/Label | (856, 164) | (100, 16) | font: `text-xs`, color: `neutral-500`, text-align: center | Top, Left |
| 16 | Page Title | Text/H1 | (400, 204) | (640, 36) | font: `text-2xl`, `font-display`, color: `text-primary` | Top, Center |
| 17 | Frequency Label | Text/Label | (400, 268) | (640, 20) | font: `text-sm`, `font-semibold`, color: `text-primary` | Top, Left+Right |
| 18 | Frequency Required | Text/Required | (500, 268) | (16, 20) | color: `error` | Top, Left |
| 19 | Frequency Select | Select | (400, 296) | (640, 48) | bg: `surface-input`, border: `1px solid border-default`, radius: `radius-md` | Top, Left+Right |
| 20 | Sessions Label | Text/Label | (400, 364) | (640, 20) | font: `text-sm`, `font-semibold`, color: `text-primary` | Top, Left+Right |
| 21 | Sessions Required | Text/Required | (560, 364) | (16, 20) | color: `error` | Top, Left |
| 22 | Sessions Select | Select | (400, 392) | (640, 48) | same styling | Top, Left+Right |
| 23 | Duration Label | Text/Label | (400, 460) | (640, 20) | font: `text-sm`, `font-semibold`, color: `text-primary` | Top, Left+Right |
| 24 | Duration Select | Select | (400, 488) | (640, 48) | same styling | Top, Left+Right |
| 25 | Price Card | Card | (400, 556) | (640, 180) | bg: `primary-50`, border: `1px solid primary-200`, radius: `radius-lg`, padding: `space-6` | Top, Left+Right |
| 26 | Discount Badge | Badge | (424, 572) | (140, 28) | bg: `brand-bright`, text: `neutral-900`, font: `text-xs`, radius: `radius-full` | Top, Left |
| 27 | Calculation Row | Row | (424, 612) | (592, 24) | justify: space-between | Top, Left+Right |
| 28 | Calculation Label | Text/Body | (424, 612) | (300, 24) | font: `text-base`, color: `text-secondary` | Top, Left |
| 29 | Calculation Value | Text/Body | (800, 612) | (216, 24) | font: `text-base`, `font-semibold`, color: `text-primary`, text-align: right | Top, Right |
| 30 | Fee Row | Row | (424, 644) | (592, 24) | justify: space-between | Top, Left+Right |
| 31 | Fee Label | Text/Body | (424, 644) | (300, 24) | font: `text-sm`, color: `text-muted` | Top, Left |
| 32 | Fee Value | Text/Body | (800, 644) | (216, 24) | font: `text-sm`, color: `primary-600`, text-align: right | Top, Right |
| 33 | Divider | Line | (424, 676) | (592, 1) | color: `primary-200` | Top, Left+Right |
| 34 | Comparison Row | Row | (424, 688) | (592, 24) | justify: space-between | Top, Left+Right |
| 35 | Comparison Label | Text/Body | (424, 688) | (300, 24) | font: `text-sm`, color: `text-muted` | Top, Left |
| 36 | Comparison Value | Text/Body | (800, 688) | (216, 24) | font: `text-sm`, color: `text-muted`, text-align: right | Top, Right |
| 37 | Savings Row | Row | (424, 720) | (592, 24) | justify: space-between | Top, Left+Right |
| 38 | Savings Label | Text/Body | (424, 720) | (300, 24) | font: `text-base`, `font-semibold`, color: `primary-700` | Top, Left |
| 39 | Savings Value | Text/Body | (800, 720) | (216, 24) | font: `text-base`, `font-semibold`, color: `primary-700`, text-align: right | Top, Right |
| 40 | Renewal Row | Row | (400, 756) | (640, 24) | gap: `space-3` | Top, Left+Right |
| 41 | Renewal Checkbox | Control/Checkbox | (400, 756) | (20, 20) | checked: `primary-500`, radius: `radius-sm` | Top, Left |
| 42 | Renewal Label | Text/Body | (432, 756) | (400, 24) | font: `text-sm`, color: `text-secondary` | Top, Left |
| 43 | Renewal Hint | Text/Body | (432, 788) | (576, 20) | font: `text-xs`, color: `text-muted` | Top, Left |
| 44 | Continue Button | Button/Primary | (400, 836) | (640, 56) | bg: `primary-500`, text: `white`, radius: `radius-md`, font: `text-lg`, `font-semibold` | Bottom, Left+Right |

### Token Values

| Element | Token | Value |
|---------|-------|-------|
| Page background | `surface-page` | `#f4f8f5` |
| Card background | `surface-card` | `#ffffff` |
| Price card bg | `primary-50` | `#f0fdf4` |
| Price card border | `primary-200` | `#bbf7d0` |
| Step active | `primary-500` | `#22c55e` |
| Step pending | `neutral-200` | `#e7e5e4` |
| Primary CTA | `primary-500` | `#22c55e` |
| Discount badge | `brand-bright` | `#9FE870` |
| Savings color | `primary-700` | `#15803d` |
| Title font | `font-display` | Space Grotesk |
| Body font | `font-body` | Inter |
| H1 size | `text-2xl` | 31px |
| Label size | `text-sm` | 13px |
| Body size | `text-base` | 16px |
| Card radius | `radius-lg` | 12px |
| Button radius | `radius-md` | 8px |
| Step radius | `radius-full` | 999px |
| Card padding | `space-6` | 24px |
| Field gap | `space-5` | 20px |

### States

**Default**
- Frequency: "Semanal" (default)
- Sessions: "8" (default)
- Duration: inherits from service default
- Price card calculates and animates values
- Renewal checkbox: checked by default
- Continue button enabled (all required fields have defaults)

**Field Changed**
- Price card values animate with `duration-fast` (150ms)
- Calculation row updates first, then fee, then savings
- If sessions < 4, discount badge hidden and savings row shows "--"

**Validation Error**
- If user clears required select: border turns `error`, error message appears
- Continue button disabled

**Continue Loading**
- Button shows spinner + "Carregando..."
- Disabled
- `aria-busy="true"`

### Accessibility Notes

- **Focus order**: Back link -> Frequency select -> Sessions select -> Duration select -> Renewal checkbox -> Continue button
- **Focus ring**: `2px solid primary-500`, offset 2px
- **ARIA**:
  - Stepper: `role="list"`, `aria-label="Progresso do agendamento, passo 2 de 4"`
  - Each step: `role="listitem"`
  - Completed step: `aria-label="Tipo: concluido"`
  - Active step: `aria-label="Configuracao: etapa atual"`
  - Price card: `aria-live="polite"`, `aria-label="Resumo de precos"`
  - Renewal checkbox: `aria-describedby="renewal-hint"`
- **Labels**: All selects have visible `<label>` associated via `htmlFor`
- **Screen reader**: Price changes announced via `aria-live="polite"`. Announce: "Total atualizado: 8 sessoes por 1.200 reais. Voce economiza 60 reais."
- **Color contrast**: `primary-700` (`#15803d`) on `primary-50` (`#f0fdf4`) = 5.6:1. `primary-600` (`#16a34a`) on `primary-50` = 4.7:1. Both meet WCAG AA.
- **Touch targets**: All selects minimum 48px height. Checkbox minimum 20x20px.

---

## RC-03: Slot Selection (`/agendar/[id]/slots`)

### Overview

| Property | Value |
|----------|-------|
| **Frame ID** | RC-03 |
| **Route** | `/agendar/[id]/slots` |
| **Actor** | User (client) |
| **Dimensions** | Desktop 1440x900 / Mobile 375x812 |
| **Background** | `surface-page` (`#f4f8f5`) |
| **Layout Grid** | 8px baseline, 2-column layout max-width 960px centered |

### Layout Structure

Step 3. The user selects the first session date/time from a calendar, then reviews all generated recurring dates. Each generated date shows as a row with conflict warnings if the professional is unavailable.

```
┌─────────────────────────────────────────────────────────────┐
│ Header (64px, sticky)                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Left Arrow]                            Passo 3 de 4       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Stepper: (1) Tipo  ->  (2) Config  ->  (3) Horarios -> (4)│
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Escolha o primeiro horario                                 │
│                                                             │
│  ┌────────────────────────┐  ┌──────────────────────────┐  │
│  │                        │  │ Sessoes geradas          │  │
│  │   Calendar             │  │                          │  │
│  │   (month view)         │  │  1. Seg, 21 Abr, 10:00   │  │
│  │                        │  │     [selected]           │  │
│  │   [prev] Abril [next]  │  │  2. Seg, 28 Abr, 10:00   │  │
│  │                        │  │     ok                   │  │
│  │   D  S  T  Q  Q  S  S  │  │  3. Seg, 5 Mai, 10:00    │  │
│  │      1  2  3  4  5  6  │  │     [warning icon]       │  │
│  │   7  8  9 10 11 12 13  │  │     Prof. indisponivel   │  │
│  │  14 15 16 17 18 19 20  │  │     [Remover] [Alterar]  │  │
│  │  21 22 23 24 25 26 27  │  │  4. Seg, 12 Mai, 10:00   │  │
│  │  28 29 30              │  │     ok                   │  │
│  │                        │  │                          │  │
│  │   Selected: 21 Abr     │  │  [3 de 8 selecionadas]   │  │
│  │                        │  └──────────────────────────┘  │
│  └────────────────────────┘                                │
│                                                             │
│  Horarios disponiveis                                       │
│  [10:00] [10:30] [11:00] [14:00] [15:00]                   │
│                                                             │
│  [Confirmar] (disabled if conflicts unresolved)             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Components & Layers

| # | Layer Name | Component / Shape | Position (x, y) | Size (w, h) | Tokens & Properties | Constraints |
|---|------------|-------------------|-----------------|-------------|---------------------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: `surface-page`, border-bottom: `border-default` | Top, Left+Right |
| 2 | Back Link | Button/Ghost | (32, 80) | (120, 32) | icon: ArrowLeft, text: `text-sm`, color: `text-secondary` | Top, Left |
| 3 | Step Indicator | Text/Label | (1180, 84) | (200, 20) | font: `text-sm`, color: `text-muted`, text-align: right | Top, Right |
| 4 | Stepper | Stepper | (400, 128) | (640, 48) | same as RC-02, step 3 active | Top, Center |
| 5 | Page Title | Text/H1 | (240, 196) | (960, 36) | font: `text-2xl`, `font-display`, color: `text-primary` | Top, Left |
| 6 | Calendar Card | Card | (240, 252) | (480, 480) | bg: `surface-card`, border: `1px solid border-default`, radius: `radius-lg`, padding: `space-6` | Top, Left |
| 7 | Calendar Nav | Row | (264, 268) | (432, 40) | justify: space-between | Top, Left |
| 8 | Calendar Prev | Button/Icon | (264, 268) | (32, 32) | icon: `ChevronLeft`, color: `text-secondary`, radius: `radius-md` | Top, Left |
| 9 | Calendar Month | Text/H3 | (344, 272) | (200, 28) | font: `text-lg`, `font-display`, color: `text-primary`, text-align: center | Top, Center |
| 10 | Calendar Next | Button/Icon | (664, 268) | (32, 32) | icon: `ChevronRight`, color: `text-secondary`, radius: `radius-md` | Top, Right |
| 11 | Weekday Headers | Row | (264, 316) | (432, 32) | gap: 0 | Top, Left |
| 12 | Weekday Label | Text/Label | (264, 320) | (56, 24) | font: `text-xs`, color: `text-muted`, text-align: center | Top, Left |
| 13 | Day Grid | Grid | (264, 356) | (432, 300) | 7 columns, gap: 4px | Top, Left |
| 14 | Day Cell | Button/Day | (264, 356) | (56, 48) | radius: `radius-md`, font: `text-sm`, color: `text-primary` | Top, Left |
| 15 | Day Selected | Button/Day Selected | (404, 404) | (56, 48) | bg: `primary-500`, text: `white`, radius: `radius-md` | Top, Left |
| 16 | Day Today | Button/Day Today | (264, 356) | (56, 48) | border: `1px solid primary-500`, radius: `radius-md` | Top, Left |
| 17 | Day Disabled | Button/Day Disabled | (264, 356) | (56, 48) | color: `text-disabled`, cursor: not-allowed | Top, Left |
| 18 | Selected Date Label | Text/Body | (264, 664) | (432, 24) | font: `text-base`, color: `text-secondary` | Top, Left |
| 19 | Generated Card | Card | (752, 252) | (448, 480) | bg: `surface-card`, border: `1px solid border-default`, radius: `radius-lg`, padding: `space-6` | Top, Right |
| 20 | Generated Title | Text/H3 | (776, 268) | (400, 28) | font: `text-lg`, `font-display`, color: `text-primary` | Top, Left |
| 21 | Generated List | Scrollable | (776, 308) | (400, 360) | gap: `space-3` | Top, Left |
| 22 | Session Row | Row | (776, 308) | (400, 56) | bg: `neutral-50`, radius: `radius-md`, padding: `space-3` | Top, Left |
| 23 | Session Number | Text/Body | (792, 316) | (24, 24) | font: `text-sm`, `font-semibold`, color: `text-muted` | Top, Left |
| 24 | Session Date | Text/Body | (824, 316) | (200, 24) | font: `text-sm`, color: `text-primary` | Top, Left |
| 25 | Session Status | Icon | (1024, 316) | (20, 20) | color: `success` (ok) / `warning` (conflict) | Top, Right |
| 26 | Session Conflict | Row | (792, 340) | (368, 20) | gap: `space-2` | Top, Left |
| 27 | Conflict Text | Text/Caption | (792, 340) | (200, 20) | font: `text-xs`, color: `warning` | Top, Left |
| 28 | Conflict Actions | Row | (1000, 340) | (160, 20) | gap: `space-2` | Top, Right |
| 29 | Remove Btn | Button/Text | (1000, 340) | (60, 20) | font: `text-xs`, color: `error` | Top, Right |
| 30 | Change Btn | Button/Text | (1072, 340) | (60, 20) | font: `text-xs`, color: `text-link` | Top, Right |
| 31 | Selected Count | Badge | (776, 680) | (160, 28) | bg: `primary-50`, text: `primary-700`, font: `text-xs`, radius: `radius-full` | Bottom, Left |
| 32 | Time Slots Label | Text/Label | (240, 748) | (960, 20) | font: `text-sm`, `font-semibold`, color: `text-primary` | Top, Left |
| 33 | Time Slots Row | Row | (240, 776) | (960, 48) | gap: `space-3` | Top, Left |
| 34 | Time Slot | Button/Chip | (240, 776) | (80, 40) | bg: `surface-card`, border: `1px solid border-default`, radius: `radius-md`, font: `text-sm` | Top, Left |
| 35 | Time Slot Selected | Button/Chip | (240, 776) | (80, 40) | bg: `primary-500`, text: `white`, border: none, radius: `radius-md` | Top, Left |
| 36 | Confirm Button | Button/Primary | (480, 844) | (480, 56) | bg: `primary-500`, text: `white`, radius: `radius-md`, font: `text-lg`, `font-semibold` | Bottom, Center |

### Token Values

| Element | Token | Value |
|---------|-------|-------|
| Page background | `surface-page` | `#f4f8f5` |
| Card background | `surface-card` | `#ffffff` |
| Card border | `border-default` | `#e7e5e4` |
| Day selected bg | `primary-500` | `#22c55e` |
| Day selected text | `text-inverse` | `#ffffff` |
| Day today border | `primary-500` | `#22c55e` |
| Session row bg | `neutral-50` | `#fafaf9` |
| Success icon | `success` | `#22c55e` |
| Warning icon | `warning` | `#e8950f` |
| Conflict text | `warning` | `#e8950f` |
| Remove text | `error` | `#ef4444` |
| Time slot selected | `primary-500` | `#22c55e` |
| Primary CTA | `primary-500` | `#22c55e` |
| Title font | `font-display` | Space Grotesk |
| Body font | `font-body` | Inter |
| H1 size | `text-2xl` | 31px |
| H3 size | `text-lg` | 20px |
| Body size | `text-sm` | 13px |
| Card radius | `radius-lg` | 12px |
| Button radius | `radius-md` | 8px |
| Card padding | `space-6` | 24px |
| Column gap | `space-8` | 32px |

### States

**Default**
- Calendar shows current month
- Today highlighted with `primary-500` border
- No date selected
- Generated list shows placeholder: "Selecione uma data para ver as sessoes geradas"
- Time slots hidden
- Confirm button disabled

**Date Selected**
- Selected day cell: `primary-500` bg, white text
- Generated list populates with all recurring dates
- Each date shows time (inherited from config)
- Time slots appear below calendar
- Confirm button enabled if no conflicts

**Time Slot Selected**
- Selected slot: `primary-500` bg
- All generated dates update to selected time
- Generated list re-renders with new time

**Conflict Detected**
- Session row warning icon: `warning` color
- Conflict text: "Profissional indisponivel"
- Row background subtly tinted `warning-bg`
- Confirm button disabled until resolved
- Count badge shows "X de Y sem conflitos"

**Conflict Resolved (Removed)**
- Session row removed with exit animation (slide up, fade out, 200ms)
- Remaining sessions renumber
- Count badge updates

**Conflict Resolved (Changed)**
- Session row shows new date/time
- Status icon returns to `success`
- Row background returns to `neutral-50`

**Confirm Loading**
- Button shows spinner + "Confirmando..."
- Disabled
- `aria-busy="true"`

### Accessibility Notes

- **Focus order**: Back link -> Calendar prev/next -> Day cells -> Time slots -> Generated list items (if interactive) -> Confirm button
- **Focus ring**: `2px solid primary-500`, offset 2px
- **ARIA**:
  - Calendar: `role="grid"`, `aria-label="Calendario de disponibilidade"`
  - Day cells: `role="gridcell"`, `aria-selected="true/false"`, `aria-disabled="true/false"`
  - Selected day: `aria-label="21 de abril de 2026, selecionado"`
  - Today: `aria-label="Hoje, 19 de abril"`
  - Generated list: `role="list"`, `aria-label="Sessoes geradas do pacote"`
  - Session row: `role="listitem"`
  - Conflict row: `aria-label="Sessao 3, 5 de maio, conflito: profissional indisponivel"`
  - Confirm button: `aria-label="Confirmar 8 sessoes"`
- **Keyboard**: Arrow keys navigate calendar grid. Enter selects day. Tab moves to time slots.
- **Screen reader**: Announce generated session count on date selection. Announce conflicts via `aria-live="polite"`.
- **Color contrast**: `warning` (`#e8950f`) on `warning-bg` (`#fef3c7`) = 4.8:1. Selected day white on `primary-500` = 3.2:1 -- acceptable for large UI element.
- **Touch targets**: Day cells minimum 48x48px. Time slots minimum 40x40px.

---

## RC-04: Success (`/agendar/[id]/confirmacao`)

### Overview

| Property | Value |
|----------|-------|
| **Frame ID** | RC-04 |
| **Route** | `/agendar/[id]/confirmacao` |
| **Actor** | User (client) |
| **Dimensions** | Desktop 1440x900 / Mobile 375x812 |
| **Background** | `surface-page` (`#f4f8f5`) |
| **Layout Grid** | 8px baseline, centered content max-width 640px |

### Layout Structure

The final confirmation screen celebrates the recurring package booking and shows a clear summary with the full session list. Navigation forward is obvious.

```
┌─────────────────────────────────────────────────────────────┐
│ Minimal Header (logo only, centered)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                          Party Popper                       │
│                    (64px success icon)                      │
│                                                             │
│            Pacote recorrente agendado!                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Package Summary Card                                │   │
│  │                                                     │   │
│  │  [Avatar] [Pro Name]                                │   │
│  │  8 sessoes de 50 minutos                            │   │
│  │  Frequencia: Semanal as segundas                    │   │
│  │  Inicio: Seg, 21 Abr, 10:00                         │   │
│  │  Ultima: Seg, 9 Jun, 10:00                          │   │
│  │                                                     │   │
│  │  Total: R$ 1.200                                    │   │
│  │  Economia: R$ 60                                    │   │
│  │                                                     │   │
│  │  -- Proximas sessoes --                             │   │
│  │  1. Seg, 21 Abr, 10:00                              │   │
│  │  2. Seg, 28 Abr, 10:00                              │   │
│  │  3. Seg, 5 Mai, 10:00                               │   │
│  │  ... e mais 5                                       │   │
│  │                                                     │   │
│  │  [Adicionar ao calendario] (.ics)                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│            [ Ir para Agenda ]                               │
│                                                             │
│            [ Buscar mais profissionais ] (text link)        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Components & Layers

| # | Layer Name | Component / Shape | Position (x, y) | Size (w, h) | Tokens & Properties | Constraints |
|---|------------|-------------------|-----------------|-------------|---------------------|-------------|
| 1 | Minimal Header | Shell/Minimal | (0, 0) | (1440, 64) | bg: `surface-page`, centered logo only | Top, Left+Right |
| 2 | Success Icon | Icon/Circle | (688, 120) | (64, 64) | bg: `primary-500`, icon: `PartyPopper`, color: `white`, radius: `radius-full` | Center |
| 3 | Success Title | Text/H1 | (400, 200) | (640, 40) | font: `text-2xl`, `font-display`, color: `text-primary`, text-align: center | Top, Center |
| 4 | Summary Card | Card | (400, 264) | (640, 480) | bg: `surface-card`, border: `1px solid border-default`, radius: `radius-xl`, padding: `space-6` | Top, Center |
| 5 | Pro Row | Row | (424, 288) | (592, 48) | gap: `space-3` | Top, Left |
| 6 | Pro Avatar | Avatar/Small | (424, 288) | (40, 40) | radius: `radius-full` | Top, Left |
| 7 | Pro Name | Text/H3 | (472, 292) | (400, 24) | font: `text-base`, `font-semibold`, color: `text-primary` | Top, Left |
| 8 | Meta Text | Text/Body | (424, 348) | (592, 24) | font: `text-base`, color: `text-secondary` | Top, Left |
| 9 | Frequency Text | Text/Body | (424, 380) | (592, 24) | font: `text-base`, color: `text-secondary` | Top, Left |
| 10 | Start Text | Text/Body | (424, 412) | (592, 24) | font: `text-base`, color: `text-secondary` | Top, Left |
| 11 | End Text | Text/Body | (424, 444) | (592, 24) | font: `text-base`, color: `text-secondary` | Top, Left |
| 12 | Price Divider | Line | (424, 480) | (592, 1) | color: `border-default` | Top, Left |
| 13 | Total Row | Row | (424, 496) | (592, 28) | justify: space-between | Top, Left |
| 14 | Total Label | Text/H3 | (424, 496) | (200, 28) | font: `text-lg`, `font-display`, color: `text-primary` | Top, Left |
| 15 | Total Value | Text/H3 | (800, 496) | (216, 28) | font: `text-lg`, `font-display`, color: `primary-500`, text-align: right | Top, Right |
| 16 | Savings Row | Row | (424, 532) | (592, 24) | justify: space-between | Top, Left |
| 17 | Savings Label | Text/Body | (424, 532) | (200, 24) | font: `text-sm`, color: `text-muted` | Top, Left |
| 18 | Savings Value | Text/Body | (800, 532) | (216, 24) | font: `text-sm`, `font-semibold`, color: `primary-700`, text-align: right | Top, Right |
| 19 | Sessions Divider | Line | (424, 568) | (592, 1) | color: `border-default` | Top, Left |
| 20 | Sessions Title | Text/H3 | (424, 584) | (592, 24) | font: `text-base`, `font-semibold`, color: `text-primary` | Top, Left |
| 21 | Session List | List | (424, 620) | (592, 80) | gap: `space-2` | Top, Left |
| 22 | Session Item | Text/Body | (424, 620) | (592, 20) | font: `text-sm`, color: `text-secondary` | Top, Left |
| 23 | More Sessions | Text/Body | (424, 680) | (592, 20) | font: `text-sm`, color: `text-muted`, text-align: center | Top, Left |
| 24 | Calendar Button | Button/Secondary | (424, 712) | (592, 44) | bg: `surface-card`, border: `1px solid border-default`, text: `text-primary`, radius: `radius-md` | Top, Left |
| 25 | Primary CTA | Button/Primary | (400, 764) | (640, 56) | bg: `primary-500`, text: `white`, radius: `radius-md`, font: `text-lg`, `font-semibold` | Bottom, Center |
| 26 | Secondary CTA | Button/Ghost | (400, 836) | (640, 32) | text: `text-secondary`, font: `text-base` | Bottom, Center |

### Token Values

| Element | Token | Value |
|---------|-------|-------|
| Page background | `surface-page` | `#f4f8f5` |
| Card background | `surface-card` | `#ffffff` |
| Card border | `border-default` | `#e7e5e4` |
| Success icon bg | `primary-500` | `#22c55e` |
| Primary CTA | `primary-500` | `#22c55e` |
| CTA text | `text-inverse` | `#ffffff` |
| Title color | `text-primary` | `#1c1917` |
| Body color | `text-secondary` | `#57534e` |
| Muted color | `text-muted` | `#78716c` |
| Price color | `primary-500` | `#22c55e` |
| Savings color | `primary-700` | `#15803d` |
| Title font | `font-display` | Space Grotesk |
| Body font | `font-body` | Inter |
| H1 size | `text-2xl` | 31px |
| H3 size | `text-lg` | 20px |
| Body size | `text-base` | 16px |
| Card radius | `radius-xl` | 16px |
| Button radius | `radius-md` | 8px |
| Card padding | `space-6` | 24px |
| Icon size | 64x64px | -- |

### States

**Default**
- Success icon scales in with `duration-normal` (250ms)
- Card content fades in with stagger (50ms per item)
- Session list shows first 3 sessions + "... e mais N"
- Calendar button: "Adicionar todas ao meu calendario"
- Primary CTA: "Ir para Agenda"
- Secondary CTA: "Buscar mais profissionais"

**Calendar Export Clicked**
- Calendar button shows spinner
- Text changes to "Gerando arquivo..."
- On complete: text changes to "Download iniciado" + checkmark icon
- Auto-resets after 3 seconds

**Mobile Layout**
- Summary card becomes edge-to-edge with 16px margins
- Session list scrolls horizontally if needed
- CTAs become full-width sticky bottom bar

### Accessibility Notes

- **Focus order**: Success icon (decorative, skipped) -> Calendar button -> Primary CTA -> Secondary CTA
- **Focus ring**: `2px solid primary-500`, offset 2px
- **ARIA**:
  - Success icon: `role="img"`, `aria-label="Pacote recorrente agendado com sucesso"`
  - Summary card: `role="region"`, `aria-label="Resumo do pacote recorrente"`
  - Session list: `role="list"`, `aria-label="Proximas sessoes do pacote"`
  - Calendar button: `aria-label="Baixar arquivo de calendario com todas as sessoes"`
  - Primary CTA: `aria-label="Ir para minha agenda"`
- **Live region**: Title announced via `aria-live="polite"` on page load
- **Screen reader**: Read summary: "Pacote recorrente agendado com [Pro Name]. 8 sessoes de 50 minutos, semanal as segundas, comecando em 21 de abril. Total: 1.200 reais. Voce economiza 60 reais."
- **Color contrast**: `primary-700` (`#15803d`) on white = 5.6:1. `primary-500` price on white = 3.2:1 -- acceptable for large/bold text.
- **Reduced motion**: Disable scale-in animation. Icon appears instantly.

---

*Frame specs are the single source of truth for Figma implementation. Any deviation requires design system review.*

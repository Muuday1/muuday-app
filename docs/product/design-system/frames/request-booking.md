# Request Booking — Frame Specifications

> **Journey:** Request Booking  
> **Source:** `docs/product/journeys/request-booking-journey.md`  
> **Version:** 1.0  
> **Date:** 2026-04-19

Frames that map the negotiated scheduling flow: user submits preferred time, professional responds, negotiation, and success.

---

## RB-01: Profile CTA (`/profissional/[id]`)

### Overview

| Property | Value |
|----------|-------|
| **Frame ID** | RB-01 |
| **Route** | `/profissional/[id]` |
| **Actor** | User (client) |
| **Dimensions** | Desktop 1440×900 / Mobile 375×812 |
| **Background** | `surface-page` (`#f4f8f5`) |
| **Layout Grid** | 8px baseline, 12-column grid, 32px desktop margins, 16px mobile margins |
| **Max Content Width** | 1280px centered |

### Layout Structure

The profile page presents the professional's public identity. The CTA area is the primary conversion zone. When the professional has limited availability, "Solicitar Agendamento" becomes the primary action.

```
┌─────────────────────────────────────────────────────────────┐
│ Header (64px, sticky)                                       │
├─────────────────────────────────────────────────────────────┤
│ Cover Photo (200px height)                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐                                               │
│  │  Avatar  │  [Pro Name]                                   │
│  │  (96px)  │  ★ 4.9 (127 avaliações)                      │
│  └──────────┘  [Especialidade badge] [Verificado badge]     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Bio / About section                                 │   │
│  │ ...                                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Services Preview Cards                              │   │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │   │
│  │ │ Service 1   │ │ Service 2   │ │ Service 3   │    │   │
│  │ │ R$ 150      │ │ R$ 200      │ │ R$ 300      │    │   │
│  │ └─────────────┘ └─────────────┘ └─────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Sticky CTA Bar (desktop) / Bottom Bar (mobile)      │   │
│  │ [Agendar] (primary)  [Solicitar Horário] (secondary)│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Components & Layers

| # | Layer Name | Component / Shape | Position (x, y) | Size (w, h) | Tokens & Properties | Constraints |
|---|------------|-------------------|-----------------|-------------|---------------------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: `surface-page`, border-bottom: `border-default` | Top, Left+Right |
| 2 | Cover Photo | Image/Cover | (0, 64) | (1440, 200) | object-fit: cover, radius: none | Top, Left+Right |
| 3 | Avatar | Avatar/XL | (160, 216) | (96, 96) | radius: `radius-full`, border: `4px solid surface-page` | Top, Left |
| 4 | Pro Name | Text/H1 | (280, 232) | (600, 36) | font: `text-2xl`, `font-display`, color: `text-primary` | Top, Left |
| 5 | Rating Row | Row | (280, 276) | (400, 24) | gap: `space-2` | Top, Left |
| 6 | Star Icon | Icon | (280, 276) | (20, 20) | color: `warning`, fill: `warning` | Top, Left |
| 7 | Rating Text | Text/Body | (308, 276) | (200, 24) | font: `text-base`, color: `text-secondary` | Top, Left |
| 8 | Specialty Badge | Badge/Default | (280, 308) | (140, 28) | bg: `neutral-100`, text: `neutral-700`, radius: `radius-full` | Top, Left |
| 9 | Verified Badge | Badge/Success | (432, 308) | (120, 28) | bg: `primary-50`, text: `primary-700`, radius: `radius-full` | Top, Left |
| 10 | Bio Section | Section | (160, 380) | (680, 120) | max-width: 680px | Top, Left |
| 11 | Bio Title | Text/H3 | (160, 380) | (680, 28) | font: `text-lg`, `font-display`, color: `text-primary` | Top, Left |
| 12 | Bio Text | Text/Body | (160, 416) | (680, 80) | font: `text-base`, color: `text-secondary`, line-clamp: 4 | Top, Left |
| 13 | Services Title | Text/H3 | (160, 524) | (680, 28) | font: `text-lg`, `font-display`, color: `text-primary` | Top, Left |
| 14 | Service Card 1 | Card | (160, 568) | (320, 120) | bg: `surface-card`, border: `1px solid border-default`, radius: `radius-lg`, padding: `space-5` | Top, Left |
| 15 | Service Name 1 | Text/H3 | (184, 584) | (272, 24) | font: `text-base`, `font-semibold`, color: `text-primary` | Top, Left |
| 16 | Service Desc 1 | Text/Body | (184, 616) | (272, 20) | font: `text-sm`, color: `text-muted`, line-clamp: 1 | Top, Left |
| 17 | Service Price 1 | Text/H3 | (184, 648) | (272, 24) | font: `text-lg`, `font-display`, color: `primary-500` | Top, Left |
| 18 | Service Card 2 | Card | (504, 568) | (320, 120) | same as Card 1 | Top, Left |
| 19 | Service Card 3 | Card | (848, 568) | (320, 120) | same as Card 1 | Top, Left |
| 20 | CTA Bar (desktop) | Bar/Sticky | (0, 836) | (1440, 72) | bg: `surface-card`, border-top: `1px solid border-default`, padding: `space-4 space-8`, shadow: `shadow-md` | Bottom, Left+Right |
| 21 | Book Button | Button/Primary | (980, 844) | (200, 56) | bg: `primary-500`, text: `white`, radius: `radius-md`, font: `text-lg`, `font-semibold` | Bottom, Right |
| 22 | Request Button | Button/Secondary | (1196, 844) | (220, 56) | bg: `surface-card`, border: `1px solid border-default`, text: `text-primary`, radius: `radius-md` | Bottom, Right |
| 23 | CTA Hint | Text/Body | (32, 860) | (400, 24) | font: `text-sm`, color: `text-muted` | Bottom, Left |
| 24 | Mobile CTA Bar | Bar/Sticky | (0, 740) | (375, 72) | bg: `surface-card`, border-top: `1px solid border-default`, padding: `space-4`, shadow: `shadow-md` | Bottom, Left+Right |
| 25 | Mobile Book | Button/Primary | (16, 748) | (168, 56) | bg: `primary-500`, text: `white`, radius: `radius-md` | Bottom, Left |
| 26 | Mobile Request | Button/Secondary | (192, 748) | (168, 56) | bg: `surface-card`, border: `1px solid border-default`, text: `text-primary`, radius: `radius-md` | Bottom, Right |

### Token Values

| Element | Token | Value |
|---------|-------|-------|
| Page background | `surface-page` | `#f4f8f5` |
| Card background | `surface-card` | `#ffffff` |
| Card border | `border-default` | `#e7e5e4` |
| Primary CTA | `primary-500` | `#22c55e` |
| Price color | `primary-500` | `#22c55e` |
| Title color | `text-primary` | `#1c1917` |
| Body color | `text-secondary` | `#57534e` |
| Muted color | `text-muted` | `#78716c` |
| Star color | `warning` | `#e8950f` |
| Title font | `font-display` | Space Grotesk |
| Body font | `font-body` | Inter |
| H1 size | `text-2xl` | 31px |
| Body size | `text-base` | 16px |
| Price size | `text-lg` | 20px |
| Card radius | `radius-lg` | 12px |
| Button radius | `radius-md` | 8px |
| Avatar border | `4px solid surface-page` | `#f4f8f5` |
| Service card gap | `space-4` | 16px |
| CTA bar shadow | `shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1)` |

### States

**Default (Pro Has Availability)**
- "Agendar" button is primary (solid green)
- "Solicitar Horário" is secondary (outlined)
- CTA hint: "Agende agora ou peça um horário personalizado"

**Limited Availability**
- "Solicitar Horário" becomes primary (solid green)
- "Agendar" becomes secondary (outlined)
- CTA hint changes to: "Horários esgotados? Peça um horário personalizado"
- Service cards may show "Próxima disponibilidade: [date]" below price

**Hover on Service Card**
- Border transitions to `primary-500`, `duration-fast` (150ms)
- Cursor: pointer
- Entire card is clickable, navigates to booking form with service pre-selected

**Hover on CTA Buttons**
- Primary: bg changes to `primary-600`
- Secondary: bg changes to `neutral-100`

**Loading (Button Clicked)**
- Button shows spinner, disabled
- `aria-busy="true"`

**Pro Tier Restriction**
- If pro is on a tier that doesn't allow requests:
  - "Solicitar Horário" button is hidden entirely
  - Only "Agendar" is shown
  - No empty space — layout collapses to single button

### Accessibility Notes

- **Focus order**: Header nav items → Bio "read more" (if present) → Service Card 1 → Service Card 2 → Service Card 3 → Book button → Request button
- **Focus ring**: `2px solid primary-500`, offset 2px
- **ARIA**:
  - Service cards: `role="button"`, `aria-label="Agendar [Service Name] por R$ [Price]"`
  - CTA bar: `role="region"`, `aria-label="Ações de agendamento"`
  - Profile header: `role="banner"` (within main)
- **Keyboard**: Service cards reachable via Tab. Enter/Space activates.
- **Screen reader**: Rating announced as "4.9 de 5, 127 avaliações". Service cards announce name, description, and price.
- **Color contrast**: All text meets WCAG AA. Price in `primary-500` on white = 3.2:1 — fails normal text. However, price uses `text-lg` (20px, bold) which qualifies as large text (3:1 minimum). ✅
- **Touch targets**: Service cards minimum 120px height. Buttons minimum 56px height.

---

## RB-02: Request Form (`/solicitar/[id]`)

### Overview

| Property | Value |
|----------|-------|
| **Frame ID** | RB-02 |
| **Route** | `/solicitar/[id]` |
| **Actor** | User (client) |
| **Dimensions** | Desktop 1440×900 / Mobile 375×812 |
| **Background** | `surface-page` (`#f4f8f5`) |
| **Layout Grid** | 8px baseline, form max-width 640px centered |

### Layout Structure

A focused, single-column form experience. The user submits their preferred time for a session. The form communicates expectations clearly: the professional will respond within 24 hours.

```
┌─────────────────────────────────────────────────────────────┐
│ Header (64px, sticky)                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [← Voltar ao perfil]                                       │
│                                                             │
│  Solicitar horário com [Pro Name]                           │
│  "Envie um horário preferencial. O profissional pode       │
│   aprovar, recusar ou propor alternativa."                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Pro Summary Card                                    │   │
│  │ [Avatar] [Name] [Price preview: R$ XXX / 50min]     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Serviço *                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Selecione um serviço ▼]                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Horários preferidos *                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Opção 1: [datetime-local]                           │   │
│  │ Opção 2: [datetime-local] (optional)                │   │
│  │ Opção 3: [datetime-local] (optional)                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Flexibilidade                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Tenho flexibilidade de ± ▼]                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Urgência *                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Selecione a urgência ▼]                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Detalhes adicionais                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Textarea                                          ]│   │
│  │ 0 / 1200 caracteres                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Fuso horário                                               │
│  Seu fuso: [User TZ]  •  Fuso do profissional: [Pro TZ]    │
│                                                             │
│  [ Enviar Solicitação ]                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Components & Layers

| # | Layer Name | Component / Shape | Position (x, y) | Size (w, h) | Tokens & Properties | Constraints |
|---|------------|-------------------|-----------------|-------------|---------------------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: `surface-page`, border-bottom: `border-default` | Top, Left+Right |
| 2 | Back Link | Button/Ghost | (32, 80) | (180, 32) | icon: ArrowLeft, text: `text-sm`, color: `text-secondary` | Top, Left |
| 3 | Page Title | Text/H1 | (400, 128) | (640, 40) | font: `text-2xl`, `font-display`, color: `text-primary` | Top, Left+Right |
| 4 | Page Subtitle | Text/Body | (400, 176) | (640, 48) | font: `text-base`, color: `text-muted` | Top, Left+Right |
| 5 | Pro Card | Card/Compact | (400, 244) | (640, 80) | bg: `surface-card`, border: `1px solid border-default`, radius: `radius-lg`, padding: `space-4` | Top, Left+Right |
| 6 | Pro Avatar | Avatar/Small | (424, 260) | (48, 48) | radius: `radius-full` | Top, Left |
| 7 | Pro Name | Text/H3 | (488, 264) | (300, 24) | font: `text-base`, `font-semibold`, color: `text-primary` | Top, Left |
| 8 | Price Preview | Text/Body | (488, 292) | (300, 20) | font: `text-sm`, color: `primary-600` | Top, Left |
| 9 | Service Label | Text/Label | (400, 348) | (640, 20) | font: `text-sm`, `font-semibold`, color: `text-primary` | Top, Left+Right |
| 10 | Service Required | Text/Required | (480, 348) | (16, 20) | color: `error` | Top, Left |
| 11 | Service Select | Select | (400, 376) | (640, 48) | bg: `surface-input`, border: `1px solid border-default`, radius: `radius-md` | Top, Left+Right |
| 12 | Dates Label | Text/Label | (400, 444) | (640, 20) | font: `text-sm`, `font-semibold`, color: `text-primary` | Top, Left+Right |
| 13 | Dates Required | Text/Required | (540, 444) | (16, 20) | color: `error` | Top, Left |
| 14 | Date Option 1 | Input/Datetime | (400, 476) | (640, 48) | bg: `surface-input`, border: `1px solid border-default`, radius: `radius-md` | Top, Left+Right |
| 15 | Date Option 2 | Input/Datetime | (400, 536) | (640, 48) | same, optional | Top, Left+Right |
| 16 | Date Option 3 | Input/Datetime | (400, 596) | (640, 48) | same, optional | Top, Left+Right |
| 17 | Flexibility Label | Text/Label | (400, 664) | (640, 20) | font: `text-sm`, `font-semibold`, color: `text-primary` | Top, Left+Right |
| 18 | Flexibility Select | Select | (400, 692) | (640, 48) | same styling as Service Select | Top, Left+Right |
| 19 | Urgency Label | Text/Label | (400, 760) | (640, 20) | font: `text-sm`, `font-semibold`, color: `text-primary` | Top, Left+Right |
| 20 | Urgency Required | Text/Required | (480, 760) | (16, 20) | color: `error` | Top, Left |
| 21 | Urgency Select | Select | (400, 788) | (640, 48) | same styling | Top, Left+Right |
| 22 | Details Label | Text/Label | (400, 856) | (640, 20) | font: `text-sm`, `font-semibold`, color: `text-primary` | Top, Left+Right |
| 23 | Details Textarea | Input/Textarea | (400, 884) | (640, 120) | bg: `surface-input`, border: `1px solid border-default`, radius: `radius-md`, min-height: 120px | Top, Left+Right |
| 24 | Details Counter | Text/Caption | (400, 1012) | (640, 16) | font: `text-xs`, color: `text-muted`, text-align: right | Top, Right |
| 25 | Timezone Row | Row | (400, 1044) | (640, 24) | gap: `space-4` | Top, Left+Right |
| 26 | User TZ | Text/Body | (400, 1044) | (300, 24) | font: `text-sm`, color: `text-muted` | Top, Left |
| 27 | Pro TZ | Text/Body | (700, 1044) | (340, 24) | font: `text-sm`, color: `text-muted` | Top, Right |
| 28 | Submit Button | Button/Primary | (400, 1092) | (640, 56) | bg: `primary-500`, text: `white`, radius: `radius-md`, font: `text-lg`, `font-semibold` | Bottom, Left+Right |

### Token Values

| Element | Token | Value |
|---------|-------|-------|
| Page background | `surface-page` | `#f4f8f5` |
| Card/input bg | `surface-card` / `surface-input` | `#ffffff` |
| Card border | `border-default` | `#e7e5e4` |
| Primary CTA | `primary-500` | `#22c55e` |
| Required asterisk | `error` | `#ef4444` |
| Label color | `text-primary` | `#1c1917` |
| Body color | `text-secondary` | `#57534e` |
| Muted color | `text-muted` | `#78716c` |
| Link color | `text-link` | `#16a34a` |
| Title font | `font-display` | Space Grotesk |
| Body font | `font-body` | Inter |
| H1 size | `text-2xl` | 31px |
| Label size | `text-sm` | 13px |
| Body size | `text-base` | 16px |
| Input height | 48px | — |
| Input radius | `radius-md` | 8px |
| Button radius | `radius-md` | 8px |
| Form gap | `space-6` | 24px |
| Field gap | `space-5` | 20px |

### States

**Default**
- Service select shows placeholder: "Selecione um serviço"
- Date inputs show placeholder with user's timezone
- Flexibility shows default: "Sem flexibilidade"
- Urgency shows placeholder: "Selecione a urgência"
- Textarea empty, counter: "0 / 1200"
- Submit button disabled until required fields filled

**Service Selected**
- Price preview updates dynamically based on selected service
- Pro card animates height if price changes

**Date Input Focus**
- Border changes to `primary-500`
- Focus ring visible
- Native datetime picker opens

**Validation Error (Submit)**
- Empty required fields get `error` border
- Error message below field: `text-sm`, `error` color
- First invalid field receives focus
- Form scrolls to first error

**Submitting**
- Button shows spinner + "Enviando..."
- All inputs disabled
- `aria-busy="true"`

**Success**
- Form replaced by EmptyState:
  - Icon: `CheckCircle`, 64px, `primary-500`
  - Title: "Solicitação enviada!"
  - Description: "[Pro Name] tem até 24h para responder. Você receberá uma notificação quando responder."
  - Request summary card (times suggested, expected response)
  - CTAs: "Ver minha agenda" (primary) + "Buscar outros profissionais" (ghost)

### Accessibility Notes

- **Focus order**: Back link → Service select → Date option 1 → Date option 2 → Date option 3 → Flexibility select → Urgency select → Details textarea → Submit button
- **Focus ring**: `2px solid primary-500`, offset 2px
- **ARIA**:
  - Form: `role="form"`, `aria-label="Formulário de solicitação de horário"`
  - Required fields: `aria-required="true"`
  - Service select: `aria-describedby="service-help"`
  - Date inputs: `aria-describedby="dates-help"`
  - Details textarea: `aria-describedby="details-counter"`
  - Counter: `aria-live="polite"`
- **Labels**: All inputs have visible `<label>` associated via `htmlFor`
- **Error association**: `aria-describedby` points to error message ID
- **Screen reader**: Announce validation errors via `aria-live="assertive"`. Announce success state via `aria-live="polite"`.
- **Timezone**: Both timezones are read aloud. Date inputs should announce the selected date/time in both timezones if possible.
- **Color contrast**: `error` text (`#ef4444`) on white = 5.6:1 ✅. All labels meet 4.5:1 ✅.

---

## RB-03: Pro Response Panel (`/dashboard/solicitacoes`)

### Overview

| Property | Value |
|----------|-------|
| **Frame ID** | RB-03 |
| **Route** | `/dashboard/solicitacoes` |
| **Actor** | Professional |
| **Dimensions** | Desktop 1440×900 / Mobile 375×812 |
| **Background** | `surface-page` (`#f4f8f5`) |
| **Layout Grid** | 8px baseline, sidebar 240px + main content area |

### Layout Structure

The professional's request inbox. Sidebar provides navigation context. Main area shows request cards with clear action hierarchy. Status badges communicate urgency.

```
┌─────────────────────────────────────────────────────────────┐
│ Header (64px, sticky)                                       │
├────────┬────────────────────────────────────────────────────┤
│        │ Header Area                                        │
│        │ "Solicitações de Agendamento"   [Filter ▼]        │
│        │                                                    │
│Sidebar │ ┌────────────────────────────────────────────────┐ │
│(240px) │ │ Request Card 1                                 │ │
│        │ │ [Avatar] [Client Name]     [Status: Aberta]    │ │
│        │ │ "Quer marcar para Primeira consulta"           │ │
│        │ │ User message: "Preciso de tarde..."            │ │
│        │ │                                                │ │
│        │ │ Opção 1: Seg, 21 Abr, 14:00                    │ │
│        │ │ Opção 2: Ter, 22 Abr, 10:00                    │ │
│        │ │                                                │ │
│        │ │ [Aceitar opção 1] [Aceitar opção 2]            │ │
│        │ │ [Propor alternativa]      [Recusar]            │ │
│        │ └────────────────────────────────────────────────┘ │
│        │                                                    │
│        │ ┌────────────────────────────────────────────────┐ │
│        │ │ Request Card 2 — Urgency (expires in 2h)       │ │
│        │ │ [Status: Proposta enviada] [Expires: 2h]       │ │
│        │ └────────────────────────────────────────────────┘ │
│        │                                                    │
└────────┴────────────────────────────────────────────────────┘
```

### Components & Layers

| # | Layer Name | Component / Shape | Position (x, y) | Size (w, h) | Tokens & Properties | Constraints |
|---|------------|-------------------|-----------------|-------------|---------------------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: `surface-page`, border-bottom: `border-default` | Top, Left+Right |
| 2 | Sidebar | Sidebar | (0, 64) | (240, 836) | bg: `surface-page`, border-right: `1px solid border-default`, padding: `space-4` | Left, Full height |
| 3 | Sidebar Nav | Nav/List | (0, 80) | (240, 400) | — | Left, Top |
| 4 | Sidebar Item | Nav/Item | (16, 96) | (208, 40) | radius: `radius-md`, padding: `space-3` | Left, Top |
| 5 | Sidebar Active | Nav/Item Active | (16, 96) | (208, 40) | bg: `primary-50`, color: `primary-700` | Left, Top |
| 6 | Main Header | Box | (240, 64) | (1200, 80) | bg: `surface-page`, border-bottom: `1px solid border-default`, padding: `space-6 space-8` | Top, Left+Right |
| 7 | Page Title | Text/H1 | (272, 80) | (400, 36) | font: `text-2xl`, `font-display`, color: `text-primary` | Top, Left |
| 8 | Filter Dropdown | Select | (1100, 84) | (200, 40) | bg: `surface-input`, border: `1px solid border-default`, radius: `radius-md` | Top, Right |
| 9 | Request Card 1 | Card | (272, 168) | (1136, 280) | bg: `surface-card`, border: `1px solid border-default`, radius: `radius-lg`, padding: `space-6` | Top, Left+Right |
| 10 | Client Avatar | Avatar/Medium | (296, 192) | (48, 48) | radius: `radius-full` | Top, Left |
| 11 | Client Name | Text/H3 | (360, 196) | (300, 24) | font: `text-lg`, `font-display`, color: `text-primary` | Top, Left |
| 12 | Client Badge | Badge | (360, 224) | (120, 20) | bg: `neutral-100`, text: `neutral-600`, font: `text-xs`, radius: `radius-full` | Top, Left |
| 13 | Status Badge | Badge | (1100, 196) | (140, 28) | variant depends on status (see table below) | Top, Right |
| 14 | Request Purpose | Text/Body | (296, 256) | (1088, 24) | font: `text-base`, color: `text-secondary` | Top, Left |
| 15 | User Message | Box/Muted | (296, 292) | (1088, 48) | bg: `neutral-50`, radius: `radius-md`, padding: `space-3` | Top, Left |
| 16 | Message Text | Text/Body | (312, 300) | (1056, 32) | font: `text-sm`, color: `text-secondary`, italic | Top, Left |
| 17 | Options Label | Text/Label | (296, 356) | (200, 20) | font: `text-sm`, `font-semibold`, color: `text-primary` | Top, Left |
| 18 | Option 1 | Text/Body | (296, 384) | (400, 24) | font: `text-base`, color: `text-secondary` | Top, Left |
| 19 | Option 2 | Text/Body | (296, 416) | (400, 24) | font: `text-base`, color: `text-secondary` | Top, Left |
| 20 | Action Row | Row | (296, 460) | (1088, 48) | gap: `space-3` | Top, Left |
| 21 | Accept Btn 1 | Button/Primary | (296, 460) | (180, 44) | bg: `primary-500`, text: `white`, radius: `radius-md`, font: `text-sm` | Top, Left |
| 22 | Accept Btn 2 | Button/Primary | (488, 460) | (180, 44) | same | Top, Left |
| 23 | Offer Btn | Button/Secondary | (680, 460) | (180, 44) | bg: `surface-card`, border: `1px solid border-default`, text: `text-primary`, radius: `radius-md` | Top, Left |
| 24 | Decline Btn | Button/Ghost | (872, 460) | (120, 44) | text: `error`, radius: `radius-md` | Top, Left |
| 25 | Expiration Badge | Badge | (1100, 224) | (120, 24) | bg: `warning-bg`, text: `warning`, font: `text-xs` | Top, Right |
| 26 | Request Card 2 | Card | (272, 472) | (1136, 160) | same as Card 1, collapsed | Top, Left+Right |

#### Status Badge Variants

| Status | Background | Text | Icon |
|--------|-----------|------|------|
| Aberta | `neutral-100` | `neutral-700` | `Circle` |
| Proposta enviada | `info-bg` | `info` | `Clock` |
| Aceita | `success-bg` | `primary-700` | `CheckCircle` |
| Recusada | `error-bg` | `error` | `XCircle` |
| Expirada | `neutral-100` | `neutral-500` | `AlertCircle` |

### Token Values

| Element | Token | Value |
|---------|-------|-------|
| Page background | `surface-page` | `#f4f8f5` |
| Card background | `surface-card` | `#ffffff` |
| Card border | `border-default` | `#e7e5e4` |
| Muted box bg | `neutral-50` | `#fafaf9` |
| Primary action | `primary-500` | `#22c55e` |
| Error action text | `error` | `#ef4444` |
| Title font | `font-display` | Space Grotesk |
| Body font | `font-body` | Inter |
| H1 size | `text-2xl` | 31px |
| Body size | `text-base` | 16px |
| Card radius | `radius-lg` | 12px |
| Button radius | `radius-md` | 8px |
| Card padding | `space-6` | 24px |
| Card gap | `space-6` | 24px |
| Sidebar width | 240px | — |

### States

**Default (Card Expanded)**
- All action buttons visible
- User message expanded
- Both date options visible (if provided)

**Card Collapsed**
- Only header row visible (avatar, name, status, expiration)
- Click to expand
- Chevron icon rotates 180°

**Hover on Action Buttons**
- Accept: bg → `primary-600`
- Offer: bg → `neutral-100`
- Decline: text → darker `error`

**Action Loading**
- Clicked button shows spinner, disabled
- Other buttons disabled
- `aria-busy="true"` on button

**Urgency (Expires < 4h)**
- Expiration badge turns `warning` bg + text
- Card border subtly pulses (animation, 2s loop)
- Status badge gains `warning` variant

**Pro Offer Form (Inline)**
- Card body expands to show offer form:
  - Date/time picker
  - Duration select
  - Message textarea
  - Price preview
  - "Enviar proposta" / "Cancelar" buttons
- Focus moves to first field

**Empty State**
- When no requests: EmptyState pattern
  - Icon: `Inbox`, 64px, `neutral-300`
  - Title: "Nenhuma solicitação"
  - Description: "Quando um paciente solicitar um horário, aparecerá aqui."
  - CTA: "Ver agenda" (secondary)

### Accessibility Notes

- **Focus order**: Sidebar nav items → Filter dropdown → Request Card 1 (expandable) → Action buttons within card → Request Card 2 → ...
- **Focus ring**: `2px solid primary-500`, offset 2px
- **ARIA**:
  - Request card: `role="article"`, `aria-label="Solicitação de [Client Name]"`
  - Card expand button: `aria-expanded="true/false"`
  - Action row: `role="group"`, `aria-label="Ações da solicitação"`
  - Status badge: `aria-label="Status: [status label]"`
  - Expiration badge: `aria-label="Expira em [time]"`
- **Keyboard**: Cards reachable via Tab. Enter expands/collapses. Action buttons activate with Space/Enter.
- **Screen reader**: Announce card content on focus: "Solicitação de [Name]. [Purpose]. Status: [Status]. Expira em [time]." Then list available actions.
- **Live region**: When a request's status changes (e.g., user accepts offer), announce: "Solicitação de [Name] atualizada para [Status]."
- **Color contrast**: All badge text meets WCAG AA. Action button text meets 4.5:1.

---

## RB-04: Negotiation (`/solicitar/[id]/negociar`)

### Overview

| Property | Value |
|----------|-------|
| **Frame ID** | RB-04 |
| **Route** | `/solicitar/[id]/negociar` |
| **Actor** | User (client) + Professional |
| **Dimensions** | Desktop 1440×900 / Mobile 375×812 |
| **Background** | `surface-page` (`#f4f8f5`) |
| **Layout Grid** | 8px baseline, 2-column layout max-width 960px centered |

### Layout Structure

A split-screen negotiation interface. Left side shows the message thread and negotiation history. Right side shows the current proposal and counter-proposal form. On mobile, it stacks vertically.

```
┌─────────────────────────────────────────────────────────────┐
│ Header (64px, sticky)                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────┐  ┌──────────────────────────┐  │
│  │ Message Thread Card    │  │ Current Proposal Card    │  │
│  │                        │  │                          │  │
│  │ ┌──────────────────┐   │  │ Status: Proposta enviada │  │
│  │ │ [Avatar] Pro:    │   │  │                          │  │
│  │ │ "Tenho disponível│   │  │ Data: Seg, 21 Abr, 10:00 │  │
│  │ │  neste horário." │   │  │ Duração: 50 minutos      │  │
│  │ └──────────────────┘   │  │ Preço: R$ 150            │  │
│  │                        │  │ Expira em: 18h 32min     │  │
│  │ ┌──────────────────┐   │  │                          │  │
│  │ │ [Avatar] Você:   │   │  │ ───────────────────────  │  │
│  │ │ "Perfeito!"      │   │  │                          │  │
│  │ └──────────────────┘   │  │ Counter-proposal Form:   │  │
│  │                        │  │ Nova data: [date picker] │  │
│  │ [Type message...][Send]│  │ Nova hora: [time picker] │  │
│  │                        │  │ Mensagem: [textarea    ] │  │
│  └────────────────────────┘  │                          │  │
│                              │ [Enviar contraproposta]  │  │
│                              │ [Aceitar proposta]       │  │
│                              │ [Recusar]                │  │
│                              └──────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Components & Layers

| # | Layer Name | Component / Shape | Position (x, y) | Size (w, h) | Tokens & Properties | Constraints |
|---|------------|-------------------|-----------------|-------------|---------------------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: `surface-page`, border-bottom: `border-default` | Top, Left+Right |
| 2 | Back Link | Button/Ghost | (32, 80) | (160, 32) | icon: ArrowLeft, text: `text-sm`, color: `text-secondary` | Top, Left |
| 3 | Page Title | Text/H1 | (240, 80) | (400, 36) | font: `text-2xl`, `font-display`, color: `text-primary` | Top, Left |
| 4 | Thread Card | Card | (240, 144) | (560, 600) | bg: `surface-card`, border: `1px solid border-default`, radius: `radius-lg`, padding: `space-6` | Top, Left |
| 5 | Thread Header | Row | (264, 160) | (512, 40) | border-bottom: `1px solid border-default`, padding-bottom: `space-3` | Top, Left |
| 6 | Thread Avatar | Avatar/Small | (264, 160) | (40, 40) | radius: `radius-full` | Top, Left |
| 7 | Thread Name | Text/H3 | (316, 164) | (300, 24) | font: `text-base`, `font-semibold`, color: `text-primary` | Top, Left |
| 8 | Thread Status | Badge | (600, 164) | (140, 24) | variant depends on status | Top, Right |
| 9 | Messages Area | Scrollable | (264, 216) | (512, 440) | padding: `space-4`, gap: `space-4` | Top, Left |
| 10 | Message Bubble (Pro) | Box | (264, 224) | (400, auto) | bg: `neutral-100`, radius: `radius-lg` (top-left: 4px), padding: `space-3` | Top, Left |
| 11 | Message Text (Pro) | Text/Body | (280, 236) | (368, auto) | font: `text-base`, color: `text-primary` | Top, Left |
| 12 | Message Time (Pro) | Text/Caption | (280, 264) | (100, 16) | font: `text-xs`, color: `text-muted` | Top, Left |
| 13 | Message Bubble (User) | Box | (376, 296) | (400, auto) | bg: `primary-50`, radius: `radius-lg` (top-right: 4px), padding: `space-3` | Top, Right |
| 14 | Message Text (User) | Text/Body | (392, 308) | (368, auto) | font: `text-base`, color: `text-primary` | Top, Right |
| 15 | Message Time (User) | Text/Caption | (664, 336) | (100, 16) | font: `text-xs`, color: `text-muted`, text-align: right | Top, Right |
| 16 | Thread Input Row | Row | (264, 668) | (512, 56) | border-top: `1px solid border-default`, padding-top: `space-3` | Bottom, Left |
| 17 | Thread Input | Input/Text | (264, 672) | (440, 48) | bg: `surface-input`, border: `1px solid border-default`, radius: `radius-md` | Bottom, Left |
| 18 | Thread Send | Button/Icon | (720, 672) | (48, 48) | bg: `primary-500`, icon: `Send`, color: `white`, radius: `radius-md` | Bottom, Right |
| 19 | Proposal Card | Card | (832, 144) | (480, auto) | bg: `surface-card`, border: `1px solid border-default`, radius: `radius-lg`, padding: `space-6` | Top, Right |
| 20 | Proposal Title | Text/H2 | (856, 160) | (432, 32) | font: `text-xl`, `font-display`, color: `text-primary` | Top, Left |
| 21 | Proposal Status | Badge | (1100, 164) | (160, 28) | variant: `info` | Top, Right |
| 22 | Proposal Divider | Line | (856, 204) | (432, 1) | color: `border-default` | Top, Left |
| 23 | Date Label | Text/Label | (856, 220) | (200, 20) | font: `text-sm`, color: `text-muted` | Top, Left |
| 24 | Date Value | Text/Body | (856, 244) | (432, 24) | font: `text-lg`, `font-semibold`, color: `text-primary` | Top, Left |
| 25 | Duration Label | Text/Label | (856, 280) | (200, 20) | font: `text-sm`, color: `text-muted` | Top, Left |
| 26 | Duration Value | Text/Body | (856, 304) | (432, 24) | font: `text-lg`, `font-semibold`, color: `text-primary` | Top, Left |
| 27 | Price Label | Text/Label | (856, 340) | (200, 20) | font: `text-sm`, color: `text-muted` | Top, Left |
| 28 | Price Value | Text/Body | (856, 364) | (432, 24) | font: `text-lg`, `font-display`, color: `primary-500` | Top, Left |
| 29 | Expiration Row | Row | (856, 400) | (432, 24) | bg: `warning-bg`, radius: `radius-md`, padding: `space-2` | Top, Left |
| 30 | Expiration Icon | Icon | (868, 404) | (16, 16) | color: `warning` | Top, Left |
| 31 | Expiration Text | Text/Body | (892, 400) | (380, 24) | font: `text-sm`, color: `warning` | Top, Left |
| 32 | Counter Divider | Line | (856, 440) | (432, 1) | color: `border-default` | Top, Left |
| 33 | Counter Title | Text/H3 | (856, 456) | (432, 24) | font: `text-lg`, `font-display`, color: `text-primary` | Top, Left |
| 34 | Counter Date Label | Text/Label | (856, 492) | (200, 20) | font: `text-sm`, `font-semibold`, color: `text-primary` | Top, Left |
| 35 | Counter Date | Input/Date | (856, 520) | (432, 48) | bg: `surface-input`, border: `1px solid border-default`, radius: `radius-md` | Top, Left |
| 36 | Counter Time Label | Text/Label | (856, 580) | (200, 20) | font: `text-sm`, `font-semibold`, color: `text-primary` | Top, Left |
| 37 | Counter Time | Input/Time | (856, 608) | (432, 48) | same styling | Top, Left |
| 38 | Counter Message Label | Text/Label | (856, 668) | (200, 20) | font: `text-sm`, `font-semibold`, color: `text-primary` | Top, Left |
| 39 | Counter Message | Input/Textarea | (856, 696) | (432, 80) | same styling, min-height: 80px | Top, Left |
| 40 | Counter Submit | Button/Secondary | (856, 792) | (432, 48) | bg: `surface-card`, border: `1px solid border-default`, text: `text-primary`, radius: `radius-md` | Bottom, Left |
| 41 | Accept Button | Button/Primary | (856, 848) | (432, 48) | bg: `primary-500`, text: `white`, radius: `radius-md` | Bottom, Left |
| 42 | Decline Button | Button/Ghost | (856, 904) | (432, 40) | text: `error`, radius: `radius-md` | Bottom, Left |

### Token Values

| Element | Token | Value |
|---------|-------|-------|
| Page background | `surface-page` | `#f4f8f5` |
| Card background | `surface-card` | `#ffffff` |
| Pro message bg | `neutral-100` | `#f5f5f4` |
| User message bg | `primary-50` | `#f0fdf4` |
| Card border | `border-default` | `#e7e5e4` |
| Primary CTA | `primary-500` | `#22c55e` |
| Price color | `primary-500` | `#22c55e` |
| Expiration bg | `warning-bg` | `#fef3c7` |
| Expiration text | `warning` | `#e8950f` |
| Decline text | `error` | `#ef4444` |
| Title font | `font-display` | Space Grotesk |
| Body font | `font-body` | Inter |
| H2 size | `text-xl` | 25px |
| Body size | `text-base` | 16px |
| Card radius | `radius-lg` | 12px |
| Button radius | `radius-md` | 8px |
| Message radius | `radius-lg` | 12px (with one corner 4px) |
| Card padding | `space-6` | 24px |
| Column gap | `space-8` | 32px |

### States

**Default**
- Thread shows all messages
- Proposal card shows latest active proposal
- Counter form fields are empty
- Accept/Decline/Counter buttons enabled

**Message Sending**
- Input disabled
- Send button shows spinner
- New message appears optimistically in thread with reduced opacity

**Counter Proposal Submitting**
- Counter form disabled
- Submit button shows spinner
- Accept/Decline buttons disabled

**Proposal Accepted**
- Proposal card updates: status badge → "Aceita" (`success` variant)
- Counter form hidden
- Accept button replaced by: "Agendamento confirmado!" text + "Ir para pagamento" button
- Decline button hidden

**Proposal Declined**
- Status badge → "Recusada" (`error` variant)
- Counter form hidden
- Accept/Decline buttons hidden
- Message: "Esta proposta foi recusada."
- CTA: "Nova solicitação" button

**Expired**
- Status badge → "Expirada" (`neutral` variant)
- Counter form hidden
- Action buttons hidden
- Expiration row: "Esta proposta expirou."

**Empty Thread**
- Messages area shows EmptyState mini:
  - Icon: `MessageSquare`, 32px, `neutral-300`
  - Text: "Nenhuma mensagem ainda."

### Accessibility Notes

- **Focus order**: Back link → Thread messages (read-only, skip) → Thread input → Thread send → Counter date → Counter time → Counter message → Counter submit → Accept button → Decline button
- **Focus ring**: `2px solid primary-500`, offset 2px
- **ARIA**:
  - Thread: `role="log"`, `aria-live="polite"`, `aria-label="Histórico de mensagens"`
  - Message bubbles: `role="article"`
  - Pro messages: no special role
  - User messages: no special role
  - Proposal card: `role="complementary"`, `aria-label="Proposta atual"`
  - Counter form: `role="form"`, `aria-label="Enviar contraproposta"`
  - Accept button: `aria-label="Aceitar proposta de [date] às [time]"`
  - Decline button: `aria-label="Recusar proposta"`
- **Keyboard**: Thread input and send reachable. Enter in input sends message (Shift+Enter for newline).
- **Screen reader**: New messages announced via `aria-live="polite"`. Proposal status changes announced.
- **Color contrast**: All text meets WCAG AA. Warning expiration text on `warning-bg` = 4.8:1 ✅.
- **Reduced motion**: Disable message slide-in animation. Messages appear instantly.

---

## RB-05: Success (`/solicitar/[id]/sucesso`)

### Overview

| Property | Value |
|----------|-------|
| **Frame ID** | RB-05 |
| **Route** | `/solicitar/[id]/sucesso` |
| **Actor** | User (client) |
| **Dimensions** | Desktop 1440×900 / Mobile 375×812 |
| **Background** | `surface-page` (`#f4f8f5`) |
| **Layout Grid** | 8px baseline, centered content max-width 560px |

### Layout Structure

A celebratory confirmation screen. Clear success signal, request summary, and navigation forward. No distractions — single path with optional secondary action.

```
┌─────────────────────────────────────────────────────────────┐
│ Minimal Header (logo only, centered)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                          ✓                                  │
│                    (64px check circle)                      │
│                                                             │
│               Solicitação enviada!                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Request Summary Card                                │   │
│  │                                                     │   │
│  │  Profissional: [Avatar] [Name]                      │   │
│  │  Serviço: [Service name]                            │   │
│  │  Horários sugeridos:                                │   │
│  │    • Seg, 21 Abr, 14:00                             │   │
│  │    • Ter, 22 Abr, 10:00                             │   │
│  │                                                     │   │
│  │  Resposta esperada até:                             │   │
│  │  Ter, 22 Abr, 14:00 (24h)                           │   │
│  │                                                     │   │
│  │  [?] Você receberá uma notificação quando           │   │
│  │      o profissional responder.                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│            [ Ver Minhas Solicitações ]                      │
│                                                             │
│            [ Voltar à Página Inicial ] (text link)          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Components & Layers

| # | Layer Name | Component / Shape | Position (x, y) | Size (w, h) | Tokens & Properties | Constraints |
|---|------------|-------------------|-----------------|-------------|---------------------|-------------|
| 1 | Minimal Header | Shell/Minimal | (0, 0) | (1440, 64) | bg: `surface-page`, centered logo only | Top, Left+Right |
| 2 | Success Icon | Icon/Circle | (688, 120) | (64, 64) | bg: `primary-500`, icon: `Check`, color: `white`, radius: `radius-full` | Center |
| 3 | Success Title | Text/H1 | (440, 200) | (560, 40) | font: `text-2xl`, `font-display`, color: `text-primary`, text-align: center | Top, Center |
| 4 | Summary Card | Card | (440, 264) | (560, 320) | bg: `surface-card`, border: `1px solid border-default`, radius: `radius-xl`, padding: `space-6` | Top, Center |
| 5 | Summary Pro Row | Row | (464, 288) | (512, 48) | gap: `space-3` | Top, Left |
| 6 | Summary Avatar | Avatar/Small | (464, 288) | (40, 40) | radius: `radius-full` | Top, Left |
| 7 | Summary Pro Name | Text/H3 | (512, 292) | (400, 24) | font: `text-base`, `font-semibold`, color: `text-primary` | Top, Left |
| 8 | Service Row | Row | (464, 348) | (512, 24) | gap: `space-2` | Top, Left |
| 9 | Service Label | Text/Label | (464, 348) | (120, 24) | font: `text-sm`, color: `text-muted` | Top, Left |
| 10 | Service Value | Text/Body | (592, 348) | (384, 24) | font: `text-sm`, `font-semibold`, color: `text-primary` | Top, Left |
| 11 | Dates Label | Text/Label | (464, 388) | (200, 20) | font: `text-sm`, color: `text-muted` | Top, Left |
| 12 | Date 1 | Text/Body | (464, 416) | (512, 24) | font: `text-base`, color: `text-secondary` | Top, Left |
| 13 | Date 2 | Text/Body | (464, 448) | (512, 24) | font: `text-base`, color: `text-secondary` | Top, Left |
| 14 | Divider | Line | (464, 488) | (512, 1) | color: `border-default` | Top, Left |
| 15 | Response Label | Text/Label | (464, 504) | (200, 20) | font: `text-sm`, color: `text-muted` | Top, Left |
| 16 | Response Value | Text/Body | (464, 532) | (512, 24) | font: `text-base`, `font-semibold`, color: `text-primary` | Top, Left |
| 17 | Notification Hint | Row | (464, 572) | (512, 40) | gap: `space-2` | Top, Left |
| 18 | Hint Icon | Icon | (464, 580) | (16, 16) | color: `text-muted` | Top, Left |
| 19 | Hint Text | Text/Body | (488, 576) | (488, 24) | font: `text-sm`, color: `text-muted` | Top, Left |
| 20 | Primary CTA | Button/Primary | (440, 608) | (560, 56) | bg: `primary-500`, text: `white`, radius: `radius-md`, font: `text-lg`, `font-semibold` | Bottom, Center |
| 21 | Secondary CTA | Button/Ghost | (440, 680) | (560, 32) | text: `text-secondary`, font: `text-base` | Bottom, Center |

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
| Title font | `font-display` | Space Grotesk |
| Body font | `font-body` | Inter |
| H1 size | `text-2xl` | 31px |
| Body size | `text-base` | 16px |
| Card radius | `radius-xl` | 16px |
| Button radius | `radius-md` | 8px |
| Card padding | `space-6` | 24px |
| Icon size | 64×64px | — |

### States

**Default (Request Submitted)**
- Success icon scales in with `duration-normal` (250ms) ease-out
- Card content fades in with 100ms stagger
- Primary CTA: "Ver Minhas Solicitações"
- Secondary CTA: "Voltar à Página Inicial"

**Proposal Received (User Returns Later)**
- If user visits this page after receiving a proposal:
  - Success icon changes to `Bell`, color: `info`
  - Title: "[Pro Name] respondeu sua solicitação!"
  - Summary card shows proposal details
  - Primary CTA: "Ver proposta" (navigates to negotiation)
  - Secondary CTA: "Ir para agenda"

**Expired**
- If request expired before response:
  - Icon: `AlertCircle`, color: `warning`
  - Title: "Esta solicitação expirou"
  - Description: "O profissional não respondeu dentro de 24h."
  - CTA: "Nova solicitação" (primary) + "Buscar outros profissionais" (secondary)

### Accessibility Notes

- **Focus order**: Success icon (decorative, skipped) → Primary CTA → Secondary CTA
- **Focus ring**: `2px solid primary-500`, offset 2px
- **ARIA**:
  - Success icon: `role="img"`, `aria-label="Solicitação enviada com sucesso"`
  - Summary card: `role="region"`, `aria-label="Resumo da solicitação"`
  - Primary CTA: `aria-label="Ver minhas solicitações de agendamento"`
- **Live region**: Title announced via `aria-live="polite"` on page load
- **Screen reader**: Read summary card content: "Solicitação enviada para [Pro Name]. Serviço: [Name]. Horários sugeridos: [dates]. Resposta esperada até [date]."
- **Color contrast**: Success icon bg `primary-500` with white check = 3.2:1 — acceptable for large graphical element. Title text meets 4.5:1 ✅.
- **Reduced motion**: Disable scale-in animation. Icon appears instantly.

---

*Frame specs are the single source of truth for Figma implementation. Any deviation requires design system review.*

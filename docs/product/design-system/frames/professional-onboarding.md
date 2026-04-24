# Professional Onboarding Journey — Frame Specs

> **Journey:** Professional registration, verification, and first-time dashboard  
> **Priority:** P2  
> **Route Prefix:** `/registrar-profissional`  
> **Total Frames:** 4  
> **Date:** 2026-04-19

---

## Frame PO-01: Registration (`/registrar-profissional`)

### Overview
Initial registration form for wellness professionals. Collects identity and professional information. Uses a stepper to set expectations for the multi-step verification process.

### Dimensions
| Viewport | Width | Height | Margins |
|----------|-------|--------|---------|
| Desktop | 1440px | 900px | 32px |
| Mobile | 375px | 812px | 16px |

### Layout Structure
```
Page (surface-page, 100vh)
├── Header (64px, minimal, with "Voltar" link)
└── Main (max-width 640px, centered, py-10)
    ├── Stepper (horizontal, 4 steps)
    │   ├── Step 1: "Dados" (active)
    │   ├── Step 2: "Verificação" (pending)
    │   ├── Step 3: "Análise" (pending)
    │   └── Step 4: "Pronto" (pending)
    ├── Title Block (mt-8)
    │   ├── H1: "Cadastro de Profissional"
    │   └── Subtitle: "Informe seus dados para começar"
    └── Form Card (mt-8, p-8)
        ├── Input: Nome completo
        ├── Input: E-mail profissional
        ├── Input: CPF (masked)
        ├── Select: Especialidade
        ├── Textarea: Bio profissional (min 100 chars)
        └── Button: "Continuar" (primary, full-width)
```

### Components Used
| Component | Variant | Count | Notes |
|-----------|---------|-------|-------|
| Header | minimal | 1 | With back arrow link |
| Stepper | horizontal | 1 | 4 steps, step 1 active |
| Input | text, email | 3 | CPF uses mask pattern |
| Select | default | 1 | Dropdown with specialties |
| Textarea | default | 1 | Min-height 120px |
| Button | primary, lg | 1 | Full-width CTA |
| Button | ghost, sm | 1 | Back link in header |
| Card | default | 1 | Form container, `radius-lg`, `p-8` |
| Text | H1, body, label | — | Hierarchy |

### Token Values
| Element | Token | Value |
|---------|-------|-------|
| Stepper active border | `primary-500` | `#22c55e` |
| Stepper pending bg | `neutral-200` | `#e7e5e4` |
| Form card max-width | — | `640px` |
| Form card padding | `space-8` | `32px` |
| Input gap | `space-5` | `20px` |
| Label font | `text-sm` / `font-medium` / `text-primary` | `13px` |
| Label margin | `mb-1.5` | `6px` below label |
| CPF helper text | `text-xs` / `text-muted` | `10px` `#78716c` |
| Bio char min indicator | `text-xs` | Turns `error` if below minimum |
| Content gap | `space-8` | `32px` |

### States
| State | Trigger | Visual |
|-------|---------|--------|
| Default | Initial load | Empty form, CTA disabled |
| Typing | User input | Real-time validation on blur |
| Valid | All required fields valid | CTA enabled |
| Invalid | Field fails validation | Red border + error message |
| Select open | Dropdown opened | `shadow-md` on menu, `surface-elevated` |
| Loading | Form submitted | CTA spinner, inputs disabled |
| Success | API success | Redirect to PO-02 |

### Accessibility Notes
- **Stepper**: `aria-label="Progresso do cadastro"`, active step `aria-current="step"`
- **CPF input**: `inputmode="numeric"`, `pattern` attribute for validation, `aria-describedby` linked to format helper
- **Select**: Native `<select>` or custom with `role="combobox"`, `aria-expanded`, `aria-activedescendant`
- **Bio textarea**: `aria-describedby` linked to min-char helper and char counter
- **Back link**: `aria-label="Voltar para página anterior"`
- **Focus order**: Back → Stepper (non-interactive) → Name → Email → CPF → Specialty → Bio → CTA
- **Error announcement**: `aria-live="polite"` on error summary for screen readers

---

## Frame PO-02: Verification (`/registrar-profissional/verificacao`)

### Overview
Identity verification step. Professionals upload credentials, documents, and a live selfie. This is a critical trust-building frame with clear visual guidance.

### Dimensions
| Viewport | Width | Height | Margins |
|----------|-------|--------|---------|
| Desktop | 1440px | 900px | 32px |
| Mobile | 375px | 812px | 16px |

### Layout Structure
```
Page (surface-page, 100vh)
├── Header (64px, minimal, back link)
└── Main (max-width 720px, centered, py-10)
    ├── Stepper (horizontal, 4 steps, step 2 active)
    ├── Title Block (mt-8)
    │   ├── H1: "Verificação de Identidade"
    │   └── Subtitle: "Envie seus documentos para segurança"
    └── Verification Stack (mt-8, gap-6)
        ├── Document Upload Zone (Card, p-6)
        │   ├── Icon: Upload (32px, primary-500)
        │   ├── Title: "Documento de Identidade"
        │   ├── Subtitle: "RG ou CNH (frente e verso)"
        │   └── Dropzone (dashed border, 120px height)
        ├── Credentials Card (p-6)
        │   ├── Input: Número do Registro Profissional
        │   ├── Input: Órgão Emissor (CRP, CREFITO, etc.)
        │   └── Input: UF do Registro
        └── Selfie Capture Card (p-6)
            ├── Icon: Camera (32px, primary-500)
            ├── Title: "Selfie ao Vivo"
            ├── Subtitle: "Para confirmar sua identidade"
            ├── Camera Preview (240x240, circle mask, border)
            └── Button: "Capturar" (secondary, centered)
    └── Submit Block (mt-8)
        └── Button: "Enviar para Análise" (primary, full-width)
```

### Components Used
| Component | Variant | Count | Notes |
|-----------|---------|-------|-------|
| Header | minimal | 1 | With back link |
| Stepper | horizontal | 1 | Step 2 active |
| Card | default | 3 | Upload, credentials, selfie |
| Icon | Upload, Camera | 2 | 32px, `primary-500` |
| Dropzone | dashed | 1 | Upload area |
| Input | text | 3 | Credential fields |
| Button | primary, lg | 1 | Submit CTA |
| Button | secondary, md | 1 | Capture selfie |
| Button | ghost, sm | 1 | Back link |
| Avatar/preview | circle | 1 | 240px camera preview |
| Text | H1, body, label | — | Hierarchy |

### Token Values
| Element | Token | Value |
|---------|-------|-------|
| Dropzone border | `border-default`, dashed | `1px dashed #e7e5e4` |
| Dropzone hover border | `primary-500` | `#22c55e` |
| Dropzone bg | `surface-card` | `#ffffff` |
| Dropzone radius | `radius-lg` | `12px` |
| Dropzone height | — | `120px` |
| Camera preview size | — | `240px` |
| Camera preview radius | `radius-full` | `999px` |
| Camera preview border | `border-strong` | `2px solid #d6d3d1` |
| Section card gap | `space-6` | `24px` |
| Card padding | `space-6` | `24px` |
| Submit block margin | `space-8` | `32px` |

### States
| State | Trigger | Visual |
|-------|---------|--------|
| Default | Initial load | Empty dropzones, disabled CTA |
| Drag over | File dragged onto dropzone | Border turns `primary-500`, bg `primary-50` |
| Uploading | File dropped/selected | Skeleton loader in dropzone |
| Upload success | File uploaded | Thumbnail preview + "Trocar" link |
| Upload error | Upload fails | Error border + retry button |
| Camera active | Camera permission granted | Live preview in circle |
| Captured | Selfie taken | Still image in preview, "Refazer" button |
| All complete | All fields filled | CTA enabled |
| Loading | Form submitted | CTA spinner, all inputs disabled |
| Success | API success | Redirect to PO-03 |

### Accessibility Notes
- **Dropzone**: `role="button"`, `tabindex="0"`, `aria-label="Área de upload de documento"`
- **Dropzone keyboard**: Enter/Space triggers file picker
- **Camera**: Request permission with clear explanation. Fallback to file upload if camera denied.
- **Selfie preview**: `aria-label="Prévia da selfie"`, live region announces "Câmera ativa"
- **Progress**: `aria-live="polite"` announces upload progress
- **Error recovery**: Each section has independent error state and retry action
- **Focus order**: Back → Stepper → Doc upload → Credentials (3 fields) → Camera → Capture → CTA

---

## Frame PO-03: Approval Waiting (`/registrar-profissional/aguardando`)

### Overview
Interstitial state while the professional's application is under review. Calming, informative design that manages expectations with a clear timeline.

### Dimensions
| Viewport | Width | Height | Margins |
|----------|-------|--------|---------|
| Desktop | 1440px | 900px | 32px |
| Mobile | 375px | 812px | 16px |

### Layout Structure
```
Page (surface-page, 100vh, flex column center)
├── Header (64px, minimal)
└── Main (flex-1, centered, max-width 560px)
    ├── EmptyState (centered)
    │   ├── Icon: Clock (64px, neutral-300)
    │   ├── H1: "Estamos Analisando seu Cadastro"
    │   └── Body: "Nossa equipe verifica cada profissional para garantir a segurança da plataforma."
    ├── Status Card (mt-10, p-6)
    │   ├── Badge: "Em Análise" (warning variant)
    │   └── Timeline (vertical)
    │       ├── Item 1: "Cadastro Enviado" (completed, check icon)
    │       ├── Item 2: "Verificação de Documentos" (active, spinner)
    │       └── Item 3: "Aprovação Final" (pending, empty circle)
    └── Action Block (mt-10)
        ├── Button: "Entendi" (primary, lg)
        └── Text: "Você receberá um e-mail quando for aprovado."
```

### Components Used
| Component | Variant | Count | Notes |
|-----------|---------|-------|-------|
| Header | minimal | 1 | Logo only |
| EmptyState | notification | 1 | Clock/waiting variant |
| Card | default | 1 | Status card, `radius-lg`, `p-6` |
| Badge | warning | 1 | "Em Análise" |
| Icon | Clock, Check, Loader | 3 | Timeline icons |
| Button | primary, lg | 1 | CTA |
| Text | H1, body, caption | — | Hierarchy |

### Token Values
| Element | Token | Value |
|---------|-------|-------|
| EmptyState icon color | `neutral-300` | `#d6d3d1` |
| EmptyState icon size | — | `64px` |
| Status card bg | `surface-card` | `#ffffff` |
| Status card border | `border-default` | `1px solid #e7e5e4` |
| Timeline connector | `neutral-200` | `2px solid #e7e5e4` |
| Completed step color | `primary-500` | `#22c55e` |
| Active step color | `warning` | `#e8950f` |
| Pending step color | `neutral-200` | `#e7e5e4` |
| Timeline dot size | — | `12px` |
| Timeline gap | `space-4` | `16px` between items |
| Content max-width | — | `560px` |
| Action block gap | `space-4` | `16px` |

### States
| State | Trigger | Visual |
|-------|---------|--------|
| Default | Page load | Timeline shows current progress |
| Polling | Periodic status check | Active step spinner rotates |
| Approved (rare) | Approved while on page | Badge changes to success, timeline completes, CTA changes to "Ir para Dashboard" |
| Rejected | Rejected while on page | Badge changes to error, timeline shows rejection step, CTA becomes "Entendi" + link to support |
| CTA clicked | User acknowledges | Closes interstitial or navigates to home |

### Accessibility Notes
- **Status announcement**: `aria-live="polite"` announces status changes (approved/rejected)
- **Timeline**: `role="list"`, each item `role="listitem"`
- **Active spinner**: `aria-label="Verificação em andamento"`
- **Badge**: `aria-label="Status atual: Em análise"`
- **CTA**: If auto-redirect on approval, announce "Redirecionando em 5 segundos"
- **Color independence**: Timeline status conveyed by icon + text, not color alone
- **Reduced motion**: Spinner becomes static icon; no pulsing animations

---

## Frame PO-04: First Booking Enabled (`/dashboard`)

### Overview
First-time professional dashboard after approval. Celebratory welcome with actionable next steps. Introduces the sidebar navigation pattern for the professional workspace.

### Dimensions
| Viewport | Width | Height | Margins |
|----------|-------|--------|---------|
| Desktop | 1440px | 900px | Sidebar 240px |
| Mobile | 375px | 812px | No sidebar; bottom nav |

### Layout Structure
```
Page (surface-page, 100vh, flex row)
├── Sidebar (240px, sticky, border-right, desktop only)
│   ├── Logo (collapsed: icon only)
│   ├── Nav Items (Dashboard, Agenda, Serviços, Financeiro)
│   └── User Mini-Profile (bottom)
├── Main (flex-1, flex column)
│   ├── Header (64px, border-bottom)
│   │   └── H1: "Dashboard"
│   └── Content (p-8, scrollable)
│       ├── Welcome Banner Card (p-6, full-width)
│       │   ├── Badge: "Novo" (pro variant)
│       │   ├── H2: "Bem-vindo, [Nome]!"
│       │   ├── Body: "Seu perfil está aprovado."
│       │   └── Button: "Configurar Agenda" (secondary)
│       ├── Section: Agenda (mt-8)
│       │   ├── Section Header
│       │   │   ├── H3: "Próximos Atendimentos"
│       │   │   └── Link: "Ver agenda"
│       │   └── EmptyState Card (centered, p-12)
│       │       ├── Icon: Calendar (48px, neutral-300)
│       │       ├── Title: "Nenhum agendamento"
│       │       ├── Body: "Quando clientes agendarem, aparecerão aqui."
│       │       └── Button: "Compartilhar Perfil" (secondary)
│       └── Section: Quick Setup (mt-8)
│           ├── H3: "Complete sua Configuração"
│           └── Checklist Card (p-6)
│               ├── Item 1: "Adicionar foto de perfil" (checked)
│               ├── Item 2: "Configurar serviços" (unchecked, link)
│               ├── Item 3: "Definir horários de atendimento" (unchecked, link)
│               ├── Item 4: "Conectar conta bancária" (unchecked, link)
│               └── Progress: 1/4 (25%)
```

### Components Used
| Component | Variant | Count | Notes |
|-----------|---------|-------|-------|
| Sidebar | expanded | 1 | 240px, desktop only |
| Header | default | 1 | With page title |
| Card | default | 3 | Welcome banner, empty state, checklist |
| Badge | pro | 1 | "Novo" or celebratory badge |
| EmptyState | data | 1 | Agenda empty state |
| Button | secondary, md | 2 | Configurar agenda, Compartilhar |
| Button | ghost, sm | 1 | "Ver agenda" link |
| Checkbox | read-only | 4 | Checklist items |
| ProgressBar | default | 1 | Setup progress |
| Icon | Calendar, Check | — | Various |
| Avatar | sm | 1 | User mini-profile |
| Text | H1, H2, H3, body | — | Hierarchy |

### Token Values
| Element | Token | Value |
|---------|-------|-------|
| Sidebar width | — | `240px` |
| Sidebar bg | `surface-page` | `#f4f8f5` |
| Sidebar border | `border-default` (right) | `1px solid #e7e5e4` |
| Content padding | `space-8` | `32px` |
| Welcome banner bg | `primary-50` | `#f0fdf4` |
| Welcome banner border | `primary-200` | `1px solid #bbf7d0` |
| Welcome banner radius | `radius-lg` | `12px` |
| EmptyState card padding | `space-12` | `48px` |
| Checklist gap | `space-4` | `16px` |
| Checked item color | `primary-500` | `#22c55e` |
| Unchecked item color | `neutral-500` | `#78716c` |
| Progress track | `neutral-100` | `#f5f5f4` |
| Progress fill | `primary-500` | `#22c55e` |
| Section gap | `space-8` | `32px` |

### States
| State | Trigger | Visual |
|-------|---------|--------|
| Default | First visit | Welcome banner visible, checklist at 25% |
| Banner dismissed | User clicks X | Welcome banner collapses with animation |
| Checklist progress | Item completed | Checkbox checks, progress bar updates |
| All complete | 4/4 items done | Progress bar full, success message appears |
| Agenda populated | Booking received | EmptyState replaced by booking card |
| Mobile | < 1024px | Sidebar collapses to hamburger menu, bottom nav appears |

### Accessibility Notes
- **Sidebar**: `role="navigation"`, `aria-label="Navegação principal"`
- **Nav items**: Current page has `aria-current="page"`, active state `bg-primary-50`
- **Welcome banner**: `role="banner"` or `region` with `aria-label="Boas-vindas"`
- **Dismiss button**: `aria-label="Fechar banner"`, returns focus to main content
- **Checklist**: `role="list"`, each item `role="listitem"`, unchecked items are links
- **Progress bar**: `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label="Progresso da configuração"`
- **Focus order**: Sidebar nav → Header → Welcome banner → Agenda section → Checklist
- **Reduced motion**: Banner dismissal is instant; progress bar animates only if motion allowed

---

*Frame specs for Professional Onboarding complete. Reference `tokens.md` and `components.md` for component-level details.*


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.

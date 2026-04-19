# Trust & Safety Journey — Frame Specs

> **Journey:** Reporting, disputes, and resolution flows  
> **Priority:** P2  
> **Route Prefix:** `/reportar`, `/disputa`  
> **Total Frames:** 3  
> **Date:** 2026-04-19

---

## Frame TS-01: Report Flow (`/reportar`)

### Overview
Modal-based reporting interface accessible from any page. Allows users to report inappropriate behavior, content, or technical issues. Designed for speed and clarity to reduce friction in submitting reports.

### Dimensions
| Viewport | Width | Height | Margins |
|----------|-------|--------|---------|
| Desktop | 560px (modal) | auto | Centered |
| Mobile | 375px (full-screen) | 812px | 16px |

### Layout Structure
```
Modal Overlay (surface-overlay, z-modal)
└── Modal (max-width 560px, centered)
    ├── Modal Header (p-6, border-bottom)
    │   ├── H2: "Reportar"
    │   └── Close Button (X icon, top-right)
    ├── Modal Body (p-6, gap-5)
    │   ├── Select: Motivo do Report
    │   │   ├── Option: "Comportamento inadequado"
    │   │   ├── Option: "Conteúdo impróprio"
    │   │   ├── Option: "Problema técnico"
    │   │   ├── Option: "Fraude ou golpe"
    │   │   └── Option: "Outro"
    │   ├── Textarea: Detalhes
    │   │   └── Helper: "Descreva o ocorrido com o máximo de detalhes"
    │   ├── Evidence Upload (optional)
    │   │   ├── Label: "Anexar evidências"
    │   │   └── Dropzone (compact, 80px height)
    │   └── Severity Indicator (auto-filled)
    │       ├── Badge: "Prioridade" (info | warning | error)
    │       └── Text: "Este report será analisado em até 24h"
    └── Modal Footer (p-6, border-top, flex end)
        ├── Button: "Cancelar" (ghost)
        └── Button: "Enviar Report" (primary)
```

### Components Used
| Component | Variant | Count | Notes |
|-----------|---------|-------|-------|
| Modal | md | 1 | `shadow-lg`, `radius-lg` |
| Select | default | 1 | 5 options |
| Textarea | default | 1 | Min-height 120px |
| Dropzone | compact | 1 | 80px, optional |
| Badge | info/warning/error | 1 | Dynamic based on reason |
| Button | ghost, md | 1 | Cancel |
| Button | primary, md | 1 | Submit |
| Icon | X, Upload | 2 | Close and upload |
| Text | H2, body, label | — | Hierarchy |

### Token Values
| Element | Token | Value |
|---------|-------|-------|
| Modal bg | `surface-elevated` | `#ffffff` |
| Modal shadow | `shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1)` |
| Modal radius | `radius-lg` | `12px` |
| Modal max-width | — | `560px` |
| Modal padding | `space-6` | `24px` |
| Backdrop | `surface-overlay` | `rgba(28,25,23,0.5)` |
| Header border | `border-default` | `1px solid #e7e5e4` |
| Footer border | `border-default` | `1px solid #e7e5e4` |
| Dropzone height | — | `80px` |
| Dropzone border | dashed `border-default` | `1px dashed #e7e5e4` |
| Severity info | `info-bg` / `info` | `#eff6ff` / `#3b82f6` |
| Severity warning | `warning-bg` / `warning` | `#fef3c7` / `#e8950f` |
| Severity error | `error-bg` / `error` | `#fef2f2` / `#ef4444` |
| Body gap | `space-5` | `20px` |

### States
| State | Trigger | Visual |
|-------|---------|--------|
| Default | Modal opens | Select at first option, empty textarea, CTA disabled |
| Reason selected | User picks reason | Severity badge updates dynamically |
| Typing | User enters details | Char counter appears ("120/1000") |
| Valid | Reason + min 20 chars | CTA enabled |
| Uploading | File dropped | Dropzone shows filename + remove icon |
| Loading | Form submitted | CTA spinner, inputs disabled |
| Success | API success | Modal content swaps to success state with check icon |
| Error | API failure | Error toast, CTA returns to default |

### Accessibility Notes
- **Modal**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="report-title"`
- **Focus trap**: Tab cycles within modal only; Escape closes
- **Return focus**: On close, focus returns to trigger element
- **Select**: Native `<select>` preferred; if custom, implement `role="listbox"`
- **Textarea**: `aria-describedby` linked to helper text and char counter
- **Severity badge**: `aria-live="polite"` announces priority change
- **Close button**: `aria-label="Fechar modal"`
- **Success state**: `role="alert"` announces "Report enviado com sucesso"

---

## Frame TS-02: Dispute Initiation (`/disputa`)

### Overview
Modal for initiating a formal dispute about a booking or transaction. More structured than a general report — requires a booking reference and has clearer escalation paths.

### Dimensions
| Viewport | Width | Height | Margins |
|----------|-------|--------|---------|
| Desktop | 560px (modal) | auto | Centered |
| Mobile | 375px (full-screen) | 812px | 16px |

### Layout Structure
```
Modal Overlay (surface-overlay, z-modal)
└── Modal (max-width 560px, centered)
    ├── Modal Header (p-6, border-bottom)
    │   ├── H2: "Abrir Disputa"
    │   └── Close Button (X icon)
    ├── Modal Body (p-6, gap-5)
    │   ├── Booking Reference Input
       │   ├── Input: "Número da Reserva"
    │   │   └── Helper: "Encontre no e-mail de confirmação"
    │   ├── Select: Motivo da Disputa
    │   │   ├── Option: "Profissional não compareceu"
    │   │   ├── Option: "Serviço não foi prestado"
    │   │   ├── Option: "Cobrança indevida"
    │   │   ├── Option: "Qualidade insatisfatória"
    │   │   └── Option: "Outro"
    │   ├── Textarea: Descrição Detalhada
    │   │   └── Helper: "Explique o que aconteceu e o que você espera"
    │   └── Info Banner (p-4, radius-md)
    │       ├── Icon: Info (20px, info color)
    │       └── Text: "Disputas são analisadas em até 5 dias úteis."
    └── Modal Footer (p-6, border-top, flex end)
        ├── Button: "Cancelar" (ghost)
        └── Button: "Abrir Disputa" (primary)
```

### Components Used
| Component | Variant | Count | Notes |
|-----------|---------|-------|-------|
| Modal | md | 1 | `shadow-lg`, `radius-lg` |
| Input | text | 1 | Booking reference |
| Select | default | 1 | Dispute reasons |
| Textarea | default | 1 | Detailed description |
| Button | ghost, md | 1 | Cancel |
| Button | primary, md | 1 | Submit |
| Icon | X, Info | 2 | Close and info |
| Card/banner | info | 1 | Info banner inside modal body |
| Text | H2, body, label | — | Hierarchy |

### Token Values
| Element | Token | Value |
|---------|-------|-------|
| Modal bg | `surface-elevated` | `#ffffff` |
| Modal shadow | `shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1)` |
| Modal radius | `radius-lg` | `12px` |
| Info banner bg | `info-bg` | `#eff6ff` |
| Info banner border | `info` | `1px solid #3b82f6` |
| Info banner radius | `radius-md` | `8px` |
| Info banner padding | `space-4` | `16px` |
| Info icon color | `info` | `#3b82f6` |
| Body gap | `space-5` | `20px` |
| Input helper font | `text-xs` / `text-muted` | `10px` `#78716c` |

### States
| State | Trigger | Visual |
|-------|---------|--------|
| Default | Modal opens | Empty form, CTA disabled |
| Prefilled | Opened from booking page | Booking reference auto-filled, read-only |
| Typing | User input | Real-time validation on reference format |
| Valid | All fields valid | CTA enabled |
| Invalid | Bad reference | Input border `error`, helper shows format |
| Loading | Form submitted | CTA spinner, modal stays open |
| Success | Dispute created | Modal swaps to confirmation with dispute ID |
| Error | API failure | Inline error banner in modal footer |

### Accessibility Notes
- **Modal**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="dispute-title"`
- **Focus trap**: Active while modal is open
- **Booking reference**: `aria-describedby` linked to helper text; `inputmode="numeric"` if reference is numeric
- **Select reason**: `aria-required="true"`
- **Textarea**: `aria-describedby` linked to helper and expectation text
- **Info banner**: `role="note"`, non-interactive
- **Success state**: Dispute ID is selectable text with `aria-label="Número da disputa"`
- **Error banner**: `role="alert"`, `aria-live="assertive"`

---

## Frame TS-03: Resolution (`/disputa/resolucao`)

### Overview
Full-page view showing the current status of a dispute, message thread between parties, and the final resolution with accept/reject actions. Used by both clients and professionals.

### Dimensions
| Viewport | Width | Height | Margins |
|----------|-------|--------|---------|
| Desktop | 1440px | 900px | 32px |
| Mobile | 375px | 812px | 16px |

### Layout Structure
```
Page (surface-page, 100vh)
├── Header (64px, default)
│   ├── Back Button
│   ├── H1: "Disputa #[ID]"
│   └── Status Badge (top-right)
└── Main (max-width 800px, centered, py-8, gap-6)
    ├── Dispute Status Card (p-6, full-width)
    │   ├── Header Row (flex between)
    │   │   ├── H2: "Detalhes da Disputa"
    │   │   └── Badge: Status (warning | info | success | error)
    │   ├── Meta Grid (2-col desktop, 1-col mobile)
    │   │   ├── Item: "Reserva" → #12345
    │   │   ├── Item: "Aberta em" → 15/04/2026
    │   │   ├── Item: "Motivo" → Cobrança indevida
    │   │   └── Item: "Valor" → R$ 150,00
    │   └── Resolution Section (border-top, pt-4, mt-4)
    │       ├── Label: "Resolução Proposta"
    │       ├── Body: "Reembolso parcial de R$ 75,00 aprovado."
    │       └── Resolution Badge: "Aguardando aceite" (warning)
    ├── Message Thread Card (p-0, overflow-hidden)
    │   ├── Thread Header (p-4, border-bottom)
    │   │   └── H3: "Mensagens"
    │   └── Message List (max-height 400px, overflow-y-auto)
    │       ├── Message (left, support/admin)
    │       │   ├── Avatar (sm)
    │       │   ├── Bubble (bg-neutral-100, radius-md)
    │       │   └── Meta: "Equipe Muuday · 2h atrás"
    │       └── Message (right, user)
    │           ├── Bubble (bg-primary-50, border-primary-200)
    │           └── Meta: "Você · 5h atrás"
    └── Action Card (p-6, flex gap-4)
        ├── Button: "Aceitar Resolução" (primary)
        ├── Button: "Solicitar Revisão" (secondary)
        └── Button: "Fechar" (ghost, mobile only)
```

### Components Used
| Component | Variant | Count | Notes |
|-----------|---------|-------|-------|
| Header | default | 1 | With back button and dispute ID |
| Card | default | 3 | Status, messages, actions |
| Badge | dynamic | 2 | Dispute status + resolution status |
| Avatar | sm | 2+ | Message participants |
| Button | primary, md | 1 | Accept resolution |
| Button | secondary, md | 1 | Request review |
| Button | ghost, sm | 1 | Close/back |
| Icon | ArrowLeft | 1 | Back button |
| Text | H1, H2, H3, body, caption | — | Hierarchy |

### Token Values
| Element | Token | Value |
|---------|-------|-------|
| Content max-width | — | `800px` |
| Card bg | `surface-card` | `#ffffff` |
| Card border | `border-default` | `1px solid #e7e5e4` |
| Card radius | `radius-lg` | `12px` |
| Status badge warning | `warning-bg` / `warning` | `#fef3c7` / `#e8950f` |
| Status badge success | `success-bg` / `primary-700` | `#f0fdf4` / `#15803d` |
| Status badge error | `error-bg` / `error` | `#fef2f2` / `#ef4444` |
| Message thread max-height | — | `400px` |
| Support bubble bg | `neutral-100` | `#f5f5f4` |
| User bubble bg | `primary-50` | `#f0fdf4` |
| User bubble border | `primary-200` | `1px solid #bbf7d0` |
| Meta font | `text-xs` / `text-muted` | `10px` `#78716c` |
| Action card gap | `space-4` | `16px` |
| Section gap | `space-6` | `24px` |
| Meta grid gap | `space-4` | `16px` |

### States
| State | Trigger | Visual |
|-------|---------|--------|
| Default | Page load | Shows current dispute state |
| Open | Dispute active | Both action buttons visible |
| Resolved | User accepts | Success toast, buttons hide, status badge updates to success |
| Under review | Admin revisiting | Status badge info, action buttons disabled |
| Rejected | User rejects/reviews | Form appears for additional comments |
| Closed | Dispute closed | Read-only mode, no action buttons |
| Messaging | User types reply | Input appears below thread (if allowed) |

### Accessibility Notes
- **Dispute header**: `aria-label="Disputa número [ID]"`
- **Status badge**: `aria-label="Status da disputa: [status]"`
- **Message thread**: `role="log"`, `aria-live="polite"`, new messages announced
- **Message bubbles**: `role="article"`, `aria-labelledby` points to author + timestamp
- **Support vs user**: Support messages have `aria-label="Mensagem da equipe Muuday"`; user messages `aria-label="Sua mensagem"`
- **Action buttons**: Accept has `aria-describedby` linked to resolution terms
- **Timeline**: If dispute has timeline, use `role="list"` with `aria-label="Histórico da disputa"`
- **Reduced motion**: Message thread scrolls instantly without smooth behavior

---

*Frame specs for Trust & Safety complete. Reference `tokens.md` and `components.md` for component-level details.*

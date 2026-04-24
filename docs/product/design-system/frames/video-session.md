# Video Session Journey — Frame Specs

> **Journey:** Pre-session lobby, active video call, and post-session review  
> **Priority:** P2  
> **Route Prefix:** `/sessao`  
> **Total Frames:** 3  
> **Date:** 2026-04-19

---

## Frame VS-01: Session Lobby (`/sessao/[id]/lobby`)

### Overview
Pre-join waiting area where users test their camera, microphone, and network before entering the video session. Designed to reduce technical issues during the actual call.

### Dimensions
| Viewport | Width | Height | Margins |
|----------|-------|--------|---------|
| Desktop | 1440px | 900px | 32px |
| Mobile | 375px | 812px | 16px |

### Layout Structure
```
Page (surface-page, 100vh, flex column)
├── Header (64px, minimal)
│   ├── Back Button + "Voltar"
│   └── Session Info (right): "Consulta com [Nome]"
└── Main (flex-1, centered, max-width 720px, py-8)
    ├── Title Block (centered)
    │   ├── H1: "Sala de Espera"
    │   └── Subtitle: "Teste seu equipamento antes da sessão"
    ├── Video Preview Card (mt-8, centered, p-0)
    │   ├── Video Container (aspect-ratio 16/9, max-width 640px)
    │   │   ├── Video Feed (object-cover, radius-lg)
    │   │   ├── Blur Overlay (when toggled, backdrop-blur-md)
    │   │   └── Self-view Label (bottom-left, caption)
    │   └── Video Controls (flex center, gap-4, p-4)
    │       ├── Button: Mute Toggle (icon only, circle)
    │       ├── Button: Video Toggle (icon only, circle)
    │       ├── Button: Blur Toggle (icon only, circle)
    │       └── Button: Settings (icon only, circle)
    ├── Device Test Row (mt-6, flex center, gap-6)
    │   ├── Test Mic Button (secondary, sm)
    │   ├── Test Speaker Button (secondary, sm)
    │   └── Network Indicator (badge)
    │       ├── Icon: Wifi
    │       └── Text: "Boa" | "Regular" | "Fraca"
    ├── Session Countdown (mt-8, centered)
    │   ├── Label: "A sessão começa em"
    │   └── Timer: "04:32" (text-3xl, font-display)
    └── Action Block (mt-8, centered)
        ├── Button: "Entrar na Sessão" (primary, lg, 280px)
        └── Text: "ou aguarde o início automático"
```

### Components Used
| Component | Variant | Count | Notes |
|-----------|---------|-------|-------|
| Header | minimal | 1 | With session info |
| Card | default | 1 | Video preview container, `p-0` |
| Button | icon-only, circle | 4 | Mute, video, blur, settings |
| Button | secondary, sm | 2 | Test mic, test speaker |
| Button | primary, lg | 1 | Entrar |
| Button | ghost, sm | 1 | Back |
| Badge | network status | 1 | Wifi indicator |
| Icon | Mic, MicOff, Video, VideoOff, Blur, Settings, Wifi, ArrowLeft | — | Various |
| Text | H1, body, caption | — | Hierarchy |

### Token Values
| Element | Token | Value |
|---------|-------|-------|
| Video container max-width | — | `640px` |
| Video container radius | `radius-lg` | `12px` |
| Video container bg | `neutral-900` | `#1c1917` |
| Video aspect ratio | — | `16/9` |
| Self-view label bg | `surface-overlay` | `rgba(28,25,23,0.5)` |
| Self-view label font | `text-xs` / `white` | `10px` |
| Control button size | — | `48px` circle |
| Control button bg | `neutral-800` | `#292524` |
| Control button color | `white` | `#ffffff` |
| Control button hover | `neutral-700` | `#44403c` |
| Control active bg | `error` | `#ef4444` (when muted/off) |
| Network good | `success-bg` / `primary-700` | `#f0fdf4` / `#15803d` |
| Network regular | `warning-bg` / `warning` | `#fef3c7` / `#e8950f` |
| Network weak | `error-bg` / `error` | `#fef2f2` / `#ef4444` |
| Countdown font | `text-3xl` / `font-display` | `39px` Space Grotesk |
| Countdown color | `text-primary` | `#1c1917` |
| CTA width | — | `280px` |
| Content max-width | — | `720px` |
| Section gap | `space-6` / `space-8` | `24px` / `32px` |

### States
| State | Trigger | Visual |
|-------|---------|--------|
| Default | Page load | Camera active, mic on, video on, blur off |
| Camera denied | Permission blocked | Video container shows error icon + "Permita o acesso à câmera" |
| Mic muted | User clicks mute | Mic icon changes to MicOff, button bg turns `error` |
| Video off | User clicks video | Video icon changes to VideoOff, button bg turns `error`, feed pauses |
| Blur on | User clicks blur | Backdrop-blur applied to video feed, icon active state |
| Settings open | User clicks settings | Dropdown with device selection |
| Mic test | Test mic clicked | Audio level visualizer appears for 5 seconds |
| Speaker test | Test speaker clicked | Plays test sound, button shows "Tocando..." |
| Network check | Periodic | Badge color updates based on latency |
| Countdown | Every second | Timer decrements |
| Session ready | Countdown reaches 0 | CTA pulses subtly, "Entrar agora" |
| Entering | User clicks enter | Button spinner, transition to VS-02 |
| Auto-join | Countdown 0 + allowed | Toast "Entrando automaticamente...", then redirect |

### Accessibility Notes
- **Video feed**: `aria-label="Prévia da sua câmera"`, `role="img"` when off
- **Mute toggle**: `aria-label="Microfone ligado"` / `aria-label="Microfone desligado"`, `aria-pressed` toggle state
- **Video toggle**: `aria-label="Câmera ligada"` / `aria-label="Câmera desligada"`, `aria-pressed`
- **Blur toggle**: `aria-label="Fundo desfocado"` / `aria-label="Fundo nítido"`, `aria-pressed`
- **Settings**: `aria-label="Configurações de dispositivo"`, dropdown `role="menu"`
- **Network badge**: `aria-live="polite"` announces connection changes
- **Countdown**: `aria-live="off"` (too verbose); announced every minute: "Sessão começa em 4 minutos"
- **CTA**: `aria-describedby` linked to countdown label
- **Camera error**: `role="alert"`, provides link to browser settings help
- **Reduced motion**: Countdown numbers change instantly; no pulsing CTA

---

## Frame VS-02: Active Call (`/sessao/[id]`)

### Overview
Full-screen video call interface using Agora. Minimal chrome to maximize video real estate. Floating toolbar for essential controls. Optimized for therapeutic sessions requiring focus and privacy.

### Dimensions
| Viewport | Width | Height | Margins |
|----------|-------|--------|---------|
| Desktop | 1440px | 900px | Full-bleed |
| Mobile | 375px | 812px | Full-bleed |

### Layout Structure
```
Page (bg-neutral-950, 100vh, 100vw, overflow-hidden, relative)
├── Main Video (absolute, inset-0)
│   └── Remote Video (object-cover, 100% width/height)
│       └── Placeholder (when no remote)
│           ├── Avatar (xl, 96px, centered)
│           ├── Name: "[Profissional/Cliente]"
│           └── Text: "Aguardando conexão..."
├── Self View Picture-in-Picture (absolute, bottom-right, 240x180)
│   ├── Local Video (object-cover, radius-md)
│   └── Name Label (bottom-left, caption, overlay)
├── Participant Thumbnails (absolute, top-right, flex col, gap-3, p-4)
│   └── Thumbnail (120x90, radius-md, border-2)
│       ├── Video or Avatar fallback
│       └── Name caption
├── Floating Toolbar (absolute, bottom-center, mb-8)
│   ├── Toolbar Container (bg-neutral-800/80, backdrop-blur, radius-xl, px-6 py-3)
│   ├── Button: Mute (48px circle, icon)
│   ├── Button: Video (48px circle, icon)
│   ├── Button: Screen Share (48px circle, icon)
│   ├── Button: Chat (48px circle, icon, badge count)
│   └── Button: End Call (48px circle, bg-error, icon)
├── Chat Drawer (absolute, right-0, top-0, bottom-0, 320px)
│   ├── Chat Header (p-4, border-bottom)
│   ├── Chat Messages (flex-1, overflow-y-auto, p-4)
│   └── Chat Input (p-4, border-top)
├── Session Timer (absolute, top-center, mt-4)
│   ├── Badge (bg-neutral-800/80, text-white)
│   └── Text: "45:00" (mono)
└── Reconnecting Overlay (absolute, inset-0, bg-neutral-950/90, hidden)
    ├── Spinner (48px, primary-500)
    └── Text: "Reconectando..."
```

### Components Used
| Component | Variant | Count | Notes |
|-----------|---------|-------|-------|
| Video | remote | 1 | Full-screen background |
| Video | local | 1 | PiP window |
| Video | thumbnail | N | Additional participants |
| Avatar | xl | 1 | Remote placeholder |
| Button | icon-only, circle | 5 | Toolbar controls |
| Button | icon-only, danger | 1 | End call |
| Badge | chat count | 1 | Unread messages |
| Badge | timer | 1 | Session duration |
| Drawer | chat | 1 | Right-side chat panel |
| Input | text | 1 | Chat message input |
| Icon | Mic, MicOff, Video, VideoOff, Monitor, MessageSquare, PhoneOff | — | Toolbar icons |
| Text | caption, mono | — | Labels and timer |

### Token Values
| Element | Token | Value |
|---------|-------|-------|
| Page bg | `neutral-950` | `#0c0a09` |
| PiP size | — | `240px x 180px` (desktop), `120px x 90px` (mobile) |
| PiP position | — | `right: 24px; bottom: 104px` |
| PiP radius | `radius-md` | `8px` |
| PiP border | `white` | `2px solid rgba(255,255,255,0.2)` |
| Thumbnail size | — | `120px x 90px` |
| Thumbnail gap | `space-3` | `12px` |
| Toolbar bg | `neutral-800` | `rgba(41,37,36,0.8)` with `backdrop-blur` |
| Toolbar radius | `radius-xl` | `16px` |
| Toolbar padding | `px-6 py-3` | `24px 12px` |
| Toolbar button size | — | `48px` circle |
| Toolbar button bg | `neutral-700` | `#44403c` |
| Toolbar button hover | `neutral-600` | `#57534e` |
| Active button bg | `error` | `#ef4444` (when muted/off) |
| End call bg | `error` | `#ef4444` |
| End call hover | darker error | `#dc2626` |
| Chat drawer width | — | `320px` |
| Chat drawer bg | `surface-elevated` | `#ffffff` |
| Chat drawer shadow | `shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1)` |
| Timer font | `text-sm` / `font-mono` / `white` | `13px` monospace |
| Timer badge bg | `neutral-800` | `rgba(41,37,36,0.8)` |
| Reconnect overlay bg | `neutral-950` | `rgba(12,10,9,0.9)` |

### States
| State | Trigger | Visual |
|-------|---------|--------|
| Default | Call connected | Both videos visible, toolbar visible |
| Connecting | Initial join | Remote shows placeholder + spinner |
| Reconnecting | Network drop | Overlay appears, spinner + message |
| Muted | User mutes | Mic button turns red, PiP shows mute indicator |
| Video off | User stops video | Video button turns red, PiP shows avatar fallback |
| Screen sharing | User shares screen | Screen replaces remote video, share button active |
| Chat open | User clicks chat | Drawer slides in from right, chat badge cleared |
| Chat message | New message arrives | Badge increments, brief sound (if chat closed) |
| Ending | User clicks end | Confirmation dialog, then redirect to VS-03 |
| Remote left | Other party disconnects | Remote placeholder appears with "[Name] desconectou" |
| Recording | Session being recorded | Red dot indicator top-left with "REC" label |
| Mobile | Touch device | Toolbar slightly larger (56px buttons), swipe to show/hide |

### Accessibility Notes
- **Video elements**: `aria-label="Vídeo de [nome]"`, `role="img"` when video off
- **Mute toggle**: `aria-pressed`, `aria-label="Microfone [ligado/desligado]"`
- **Video toggle**: `aria-pressed`, `aria-label="Câmera [ligada/desligada]"`
- **Screen share**: `aria-label="Compartilhar tela"`, `aria-pressed` when active
- **Chat toggle**: `aria-label="Chat [3 mensagens não lidas]"`, `aria-expanded` for drawer state
- **End call**: `aria-label="Encerrar chamada"`, `role="button"`, requires confirmation
- **Chat drawer**: `role="complementary"`, `aria-label="Chat da sessão"`
- **Chat input**: `aria-label="Enviar mensagem"`, Enter to send
- **Timer**: `aria-live="off"`, `aria-label="Tempo de sessão: 45 minutos"`
- **Reconnection**: `aria-live="assertive"` announces "Reconectando, por favor aguarde"
- **Recording indicator**: `aria-live="polite"` announces "Esta sessão está sendo gravada" on start
- **Keyboard shortcuts**: Space = mute, V = video, C = chat, Escape = end call (with confirmation)
- **Reduced motion**: No entrance animations; drawer appears instantly

---

## Frame VS-03: End Screen (`/sessao/[id]/review`)

### Overview
Post-session review and rating page. Collects structured feedback while the session experience is fresh. Session summary provides closure and transparency.

### Dimensions
| Viewport | Width | Height | Margins |
|----------|-------|--------|---------|
| Desktop | 1440px | 900px | 32px |
| Mobile | 375px | 812px | 16px |

### Layout Structure
```
Page (surface-page, 100vh, flex column)
├── Header (64px, minimal)
│   ├── Logo (centered)
│   └── Close Button (right, "Pular")
└── Main (flex-1, centered, max-width 560px, py-10)
    ├── Session Summary Card (p-6, centered)
    │   ├── Icon: CheckCircle (48px, primary-500)
    │   ├── H1: "Sessão Concluída"
    │   ├── Body: "Obrigado por usar a Muuday."
    │   └── Session Meta (mt-4, flex col, gap-2)
    │       ├── Row: "Duração" → "50 minutos"
    │       ├── Row: "Profissional" → "[Nome]"
    │       └── Row: "Data" → "15/04/2026"
    ├── Notes Card (mt-6, p-6)
    │   ├── H3: "Anotações da Sessão"
    │   └── Textarea: "Adicione notas privadas..." (optional)
    ├── Rating Card (mt-6, p-6)
    │   ├── H3: "Avalie sua experiência"
    │   ├── Star Rating (5 stars, 40px each, flex center, gap-2)
    │   ├── Rating Labels (below stars, text-sm)
    │   │   ├── 1: "Muito insatisfatório"
    │   │   └── 5: "Excelente"
    │   └── Tag Selector (flex wrap, gap-2, mt-4)
    │       ├── Tag: "Profissional atencioso"
    │       ├── Tag: "Boa comunicação"
    │       ├── Tag: "Ambiente confortável"
    │       ├── Tag: "Técnica eficiente"
    │       └── Tag: "Não resolviu meu problema"
    ├── Review Textarea Card (mt-6, p-6)
    │   ├── H3: "Deixe um comentário"
    │   └── Textarea: "Sua opinião é importante..."
    └── Action Block (mt-8, centered)
        ├── Button: "Enviar Avaliação" (primary, lg, full-width)
        └── Link: "Avaliar depois" (ghost, sm)
```

### Components Used
| Component | Variant | Count | Notes |
|-----------|---------|-------|-------|
| Header | minimal | 1 | Logo + skip |
| Card | default | 4 | Summary, notes, rating, review |
| Icon | CheckCircle | 1 | 48px, `primary-500` |
| Star Rating | interactive | 1 | 5 stars, 40px |
| Tag/Chip | selectable | 5+ | Experience tags |
| Textarea | default | 2 | Notes + review |
| Button | primary, lg | 1 | Submit |
| Button | ghost, sm | 2 | Skip + Avaliar depois |
| Text | H1, H3, body, caption | — | Hierarchy |

### Token Values
| Element | Token | Value |
|---------|-------|-------|
| Content max-width | — | `560px` |
| Summary card padding | `space-6` | `24px` |
| Check icon size | — | `48px` |
| Check icon color | `primary-500` | `#22c55e` |
| Meta row font | `text-sm` / `text-secondary` | `13px` `#57534e` |
| Meta value font | `text-sm` / `font-medium` | `13px` |
| Star size | — | `40px` |
| Star color empty | `neutral-200` | `#e7e5e4` |
| Star color filled | `warning` | `#e8950f` |
| Star color hover | `warning` | `#e8950f` |
| Tag bg default | `surface-card` | `#ffffff` |
| Tag border default | `border-default` | `1px solid #e7e5e4` |
| Tag bg selected | `primary-50` | `#f0fdf4` |
| Tag border selected | `primary-500` | `#22c55e` |
| Tag text selected | `primary-700` | `#15803d` |
| Tag radius | `radius-md` | `8px` |
| Tag padding | `px-3 py-1.5` | `12px 6px` |
| Tag gap | `space-2` | `8px` |
| Card gap | `space-6` | `24px` |
| Action block gap | `space-4` | `16px` |

### States
| State | Trigger | Visual |
|-------|---------|--------|
| Default | Page load | Empty stars, no tags selected, empty textareas |
| Star hover | Mouse over star | Stars fill up to hovered position |
| Star selected | Click star | Stars fill up to selection, label updates |
| Tag selected | Click tag | Border turns `primary-500`, bg `primary-50`, text `primary-700` |
| Tag deselected | Click again | Returns to default |
| Typing | Textarea input | Char counter appears for review textarea |
| Valid | Rating selected | CTA enabled |
| Loading | Form submitted | CTA spinner, all inputs disabled |
| Success | API success | Success animation, redirect to dashboard or home |
| Skip | User clicks skip | Confirmation "Sua avaliação ajuda outros usuários", then allow skip |
| Notes saved | Blur on notes | Auto-save toast "Anotações salvas" |

### Accessibility Notes
- **Star rating**: `role="radiogroup"`, `aria-label="Avaliação de 1 a 5 estrelas"`, each star `role="radio"`, `aria-checked`
- **Star keyboard**: Arrow keys navigate, Space/Enter selects, Home goes to 1, End goes to 5
- **Rating label**: `aria-live="polite"` announces selected rating description
- **Tags**: `role="group"`, `aria-label="Tags de experiência"`, each tag `role="checkbox"`, `aria-checked`
- **Textareas**: `aria-describedby` linked to char counters
- **Skip/Close**: `aria-label="Pular avaliação"`
- **Notes auto-save**: `aria-live="polite"` announces "Anotações salvas automaticamente"
- **Focus order**: Skip → Notes → Star 1-5 → Tags → Review textarea → Submit → Avaliar depois
- **Reduced motion**: Stars fill instantly without scale animation; no success confetti

---

*Frame specs for Video Session complete. Reference `tokens.md` and `components.md` for component-level details.*


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.

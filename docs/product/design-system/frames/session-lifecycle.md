# Session Lifecycle — Frame Specifications

> **Journey:** Session Lifecycle  
> **Source:** `docs/product/journeys/session-lifecycle.md`  
> **Version:** 1.0  
> **Date:** 2026-04-19

Frames that map the post-booking video session experience: pre-join lobby, active session, and post-session review.

---

## SL-01: Pre-join (`/sessao/[id]/lobby`)

### Overview

| Property | Value |
|----------|-------|
| **Frame ID** | SL-01 |
| **Route** | `/sessao/[id]/lobby` |
| **Actor** | User (client) + Professional |
| **Dimensions** | Desktop 1440x900 / Mobile 375x812 |
| **Background** | `surface-page` (`#f4f8f5`) |
| **Layout Grid** | 8px baseline, 12-column grid, 32px desktop margins, 16px mobile margins |
| **Max Content Width** | 960px centered |

### Layout Structure

The lobby is a vertically centered, contained experience. It reassures the user before entering the video call and validates their devices.

```
+-------------------------------------------------------------+
| Header (64px, sticky)                                       |
+-------------------------------------------------------------+
|                                                             |
|  +-----------------------------------------------------+   |
|  | Session Info Header                                 |   |
|  | "Sessao com [Pro Name]" + countdown timer           |   |
|  +-----------------------------------------------------+   |
|                                                             |
|  +------------------------+  +--------------------------+  |
|  |                        |  | Session Info Card        |  |
|  |   Video Preview Card   |  | - Date & time            |  |
|  |   (camera feed or      |  | - Duration               |  |
|  |    avatar placeholder) |  | - Professional avatar    |  |
|  |                        |  | - Session type badge     |  |
|  |   [camera off overlay] |  | - Status badge           |  |
|  |                        |  +--------------------------+  |
|  +------------------------+                                |
|                                                             |
|  +-----------------------------------------------------+   |
|  | Device Settings Toolbar                             |   |
|  | [Mic] [Camera] [Speaker] [Settings]                 |   |
|  +-----------------------------------------------------+   |
|                                                             |
|  +-----------------------------------------------------+   |
|  | Connection Quality Indicator                        |   |
|  | [Green dot] Conexao estavel - Ping: 24ms            |   |
|  +-----------------------------------------------------+   |
|                                                             |
|           [ Entrar na Sessao ] (full width, max 480px)      |
|                                                             |
|  +-----------------------------------------------------+   |
|  | Fallback help text                                  |   |
|  | "Problemas? [Testar dispositivos] [Usar link alt]"  |   |
|  +-----------------------------------------------------+   |
|                                                             |
+-------------------------------------------------------------+
```

### Components & Layers

| # | Layer Name | Component / Shape | Position (x, y) | Size (w, h) | Tokens & Properties | Constraints |
|---|------------|-------------------|-----------------|-------------|---------------------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface-page, border-bottom: neutral-200 | Top, Left+Right |
| 2 | Header Title | Text/Body | (72, 20) | (400, 24) | font: text-base, font-body, color: text-primary | Top, Left |
| 3 | Back Link | Button/Ghost | (32, 16) | (120, 32) | icon: ArrowLeft 20px, text: text-sm, color: text-secondary | Top, Left |
| 4 | Page Title | Text/H1 | (240, 96) | (960, 40) | font: text-2xl, font-display, color: text-primary, text-align: center | Top, Left+Right |
| 5 | Countdown | Text/Body | (240, 140) | (960, 24) | font: text-base, font-display, color: text-muted, text-align: center | Top, Left+Right |
| 6 | Video Preview Card | Card/Media | (240, 192) | (560, 420) | bg: surface-card, border: 1px solid border-default, radius: radius-lg | Top, Left |
| 7 | Video Feed | Video/Local | (256, 208) | (528, 388) | bg: neutral-900, radius: radius-md, object-fit: cover | Top, Left |
| 8 | Camera Off Overlay | Box/Centered | (256, 208) | (528, 388) | bg: neutral-100, radius: radius-md | Top, Left |
| 9 | Camera Off Avatar | Avatar/XL | (480, 356) | (80, 80) | radius: radius-full, bg: neutral-200 | Center |
| 10 | Camera Off Label | Text/Body | (256, 452) | (528, 24) | font: text-sm, color: text-muted, text-align: center | Top, Left |
| 11 | Session Info Card | Card/Info | (832, 192) | (368, 280) | bg: surface-card, border: 1px solid border-default, radius: radius-lg, padding: space-6 | Top, Right |
| 12 | Pro Avatar | Avatar/Medium | (856, 216) | (48, 48) | radius: radius-full | Top, Left |
| 13 | Pro Name | Text/H3 | (920, 220) | (256, 24) | font: text-lg, font-display, color: text-primary | Top, Left |
| 14 | Pro Specialty | Text/Body | (920, 248) | (256, 20) | font: text-sm, color: text-muted | Top, Left |
| 15 | Divider | Line | (856, 280) | (320, 1) | color: border-default | Top, Left |
| 16 | Date Label | Text/Label | (856, 296) | (120, 20) | font: text-sm, color: text-muted | Top, Left |
| 17 | Date Value | Text/Body | (856, 320) | (320, 24) | font: text-base, font-semibold, color: text-primary | Top, Left |
| 18 | Time Label | Text/Label | (856, 356) | (120, 20) | font: text-sm, color: text-muted | Top, Left |
| 19 | Time Value | Text/Body | (856, 380) | (320, 24) | font: text-base, font-semibold, color: text-primary | Top, Left |
| 20 | Duration Label | Text/Label | (856, 416) | (120, 20) | font: text-sm, color: text-muted | Top, Left |
| 21 | Duration Value | Text/Body | (856, 440) | (320, 24) | font: text-base, font-semibold, color: text-primary | Top, Left |
| 22 | Session Type Badge | Badge/Info | (856, 268) | (120, 24) | bg: info-bg, text: info, font: text-xs | Top, Left |
| 23 | Device Settings Bar | Toolbar | (240, 636) | (560, 56) | bg: surface-card, border: 1px solid border-default, radius: radius-lg, padding: space-3 | Top, Left |
| 24 | Mic Toggle | Button/Icon | (264, 644) | (40, 40) | radius: radius-md, bg: neutral-100 (off) / primary-500 (on) | Top, Left |
| 25 | Mic Icon | Icon | (272, 652) | (24, 24) | color: neutral-600 (off) / white (on) | Top, Left |
| 26 | Camera Toggle | Button/Icon | (320, 644) | (40, 40) | same as Mic Toggle | Top, Left |
| 27 | Speaker Test | Button/Icon | (376, 644) | (40, 40) | same styling | Top, Left |
| 28 | Settings Button | Button/Icon | (432, 644) | (40, 40) | same styling | Top, Left |
| 29 | Device Labels | Text/Caption | (240, 700) | (560, 20) | font: text-xs, color: text-muted, text-align: center | Top, Left |
| 30 | Connection Indicator | Row | (240, 740) | (560, 32) | bg: success-bg, border: 1px solid primary-200, radius: radius-md, padding: space-2 | Top, Left |
| 31 | Connection Dot | Shape/Circle | (256, 748) | (16, 16) | radius: radius-full, bg: success | Top, Left |
| 32 | Connection Text | Text/Body | (280, 748) | (400, 16) | font: text-sm, color: primary-700 | Top, Left |
| 33 | Join Button | Button/Primary | (480, 796) | (480, 56) | bg: primary-500, text: white, radius: radius-md, font: text-lg, font-semibold | Bottom, Center |
| 34 | Join Button Icon | Icon | (504, 812) | (24, 24) | color: white | Bottom, Center |
| 35 | Help Row | Row | (240, 872) | (960, 24) | text-align: center | Bottom, Left+Right |
| 36 | Test Devices Link | Text/Link | (560, 872) | (160, 24) | font: text-sm, color: text-link | Bottom, Center |
| 37 | Alt Link | Text/Link | (736, 872) | (200, 24) | font: text-sm, color: text-link | Bottom, Center |

### Token Values

| Element | Token | Value |
|---------|-------|-------|
| Page background | `surface-page` | `#f4f8f5` |
| Card background | `surface-card` | `#ffffff` |
| Card border | `border-default` | `#e7e5e4` |
| Primary CTA bg | `primary-500` | `#22c55e` |
| Primary CTA text | `text-inverse` | `#ffffff` |
| Title font | `font-display` | Space Grotesk |
| Body font | `font-body` | Inter |
| H1 size | `text-2xl` | 31px |
| Body size | `text-base` | 16px |
| Caption size | `text-xs` | 10px |
| Card radius | `radius-lg` | 12px |
| Button radius | `radius-md` | 8px |
| Card padding | `space-6` | 24px |
| Section gap | `space-8` | 32px |

### States

**Default State**
- Camera preview shows local video feed
- Mic is enabled by default
- Connection indicator shows green dot + "Conexao estavel"
- Join button is enabled

**Camera Disabled**
- Video feed replaced by centered avatar placeholder (80px)
- Label: "Sua camera esta desligada"
- Camera toggle button shows VideoOff icon on neutral-100 bg

**Mic Disabled**
- Mic toggle button shows MicOff icon on neutral-100 bg
- Mic toggle bg changes to neutral-100

**Poor Connection**
- Connection dot turns warning (#e8950f)
- Background changes to warning-bg
- Text: "Conexao instavel. Verifique sua rede."

**Join Window Not Open**
- Join button is disabled (opacity-50, cursor-not-allowed)
- Countdown shows time until join window opens
- Button label: "Disponivel em 12 min"

**Loading (Join Clicked)**
- Join button shows spinner + "Entrando..."
- Button disabled
- `aria-busy="true"`

**Error (Device Permission Denied)**
- Video preview shows error icon (AlertTriangle, error color)
- Text: "Permissao de camera negada. Verifique as configuracoes do navegador."
- Help row gains prominent "Como permitir" link

### Accessibility Notes

- **Focus order**: Back link -> Mic toggle -> Camera toggle -> Speaker test -> Settings -> Join button -> Test devices link -> Alternative link
- **Focus ring**: `2px solid primary-500`, offset 2px on all interactive elements
- **ARIA**:
  - Mic toggle: `aria-pressed="true/false"`, `aria-label="Ativar/desativar microfone"`
  - Camera toggle: `aria-pressed="true/false"`, `aria-label="Ativar/desativar camera"`
  - Join button: `aria-label="Entrar na sessao de video com [Pro Name]"`
  - Video preview: `aria-label="Pre-visualizacao da sua camera"`
- **Live region**: Countdown timer announces every minute via `aria-live="polite"`
- **Color contrast**: All text meets WCAG AA (4.5:1 minimum). Connection indicator text uses primary-700 on success-bg (5.2:1)
- **Keyboard**: All toggles and buttons reachable via Tab. Space/Enter activates toggles.
- **Reduced motion**: Disable countdown pulse animation when `prefers-reduced-motion: reduce`

---

## SL-02: In-session (`/sessao/[id]`)

### Overview

| Property | Value |
|----------|-------|
| **Frame ID** | SL-02 |
| **Route** | `/sessao/[id]` |
| **Actor** | User (client) + Professional |
| **Dimensions** | Desktop 1440x900 / Mobile 375x812 |
| **Background** | `neutral-950` (`#0c0a09`) -- full dark chrome |
| **Layout Grid** | None (free positioning for video layout) |

### Layout Structure

The in-session frame is a full-screen dark chrome video experience. No app header -- the video dominates. Controls float at the bottom. Chat is a slide-out drawer on desktop, bottom sheet on mobile.

**Desktop Layout (1440x900):**
```
+-------------------------------------------------------------+
| +---------------------------------------------------------+ |
| |                                                         | |
| |              REMOTE VIDEO (PROFESSIONAL)                | |
| |              1440x900 full bleed                        | |
| |                                                         | |
| |  +-------------+                                        | |
| |  | LOCAL VIDEO |  (picture-in-picture)                  | |
| |  |  320x240    |  draggable, bottom-right default       | |
| |  |  radius-lg  |                                        | |
| |  +-------------+                                        | |
| |                                                         | |
| +---------------------------------------------------------+ |
| |  [Timer]  [Connection]                    [Minimize]    | |
| +---------------------------------------------------------+ |
|                                                             |
|  +-----------------------------------------------------+   |
|  | [Mic] [Camera] [Chat] [ScreenShare] [End Call]      |   |
|  +-----------------------------------------------------+   |
|                                                             |
|  +------------------------+  +--------------------------+  |
|  |                        |  | Chat Drawer (400px wide) |  |
|  |   Waiting State        |  | +----------------------+ |  |
|  |   "Aguardando..."      |  | | Chat messages        | |  |
|  |   + spinner            |  | | scrollable           | |  |
|  |                        |  | +----------------------+ |  |
|  +------------------------+  | [Input____________][Send]|  |
|                              +--------------------------+  |
+-------------------------------------------------------------+
```

**Mobile Layout (375x812):**
- Remote video fills viewport
- Local video: 120x160, top-right corner, 16px inset
- Toolbar: full-width sticky bottom, 72px height
- Chat: slides up from bottom as sheet (85% height)

### Components & Layers

| # | Layer Name | Component / Shape | Position (x, y) | Size (w, h) | Tokens & Properties | Constraints |
|---|------------|-------------------|-----------------|-------------|---------------------|-------------|
| 1 | Remote Video Container | Video/Remote | (0, 0) | (1440, 900) | bg: neutral-950, object-fit: cover | All sides |
| 2 | Remote User Label | Text/Overlay | (32, 32) | (400, 28) | font: text-lg, font-display, color: text-inverse, text-shadow: 0 1px 4px rgba(0,0,0,0.5) | Top, Left |
| 3 | Local Video PIP | Video/Local | (1088, 608) | (320, 240) | bg: neutral-900, border: 2px solid rgba(255,255,255,0.2), radius: radius-lg, object-fit: cover | Bottom, Right |
| 4 | Local Label | Text/Overlay | (1104, 816) | (120, 20) | font: text-sm, color: text-inverse, text-shadow | Bottom, Right |
| 5 | Session Timer | Text/Overlay | (32, 836) | (200, 28) | font: text-lg, font-display, color: text-inverse, text-shadow | Bottom, Left |
| 6 | Connection Dot | Shape/Circle | (240, 844) | (12, 12) | radius: radius-full, bg: success | Bottom, Left |
| 7 | Connection Label | Text/Overlay | (260, 840) | (200, 20) | font: text-sm, color: text-inverse, text-shadow | Bottom, Left |
| 8 | Minimize Button | Button/Icon | (1352, 836) | (40, 40) | bg: rgba(0,0,0,0.5), radius: radius-md, icon: Minimize2 | Bottom, Right |
| 9 | Fullscreen Button | Button/Icon | (1400, 836) | (40, 40) | same styling, icon: Maximize | Bottom, Right |
| 10 | Toolbar Container | Toolbar | (416, 812) | (608, 72) | bg: rgba(0,0,0,0.6), backdrop-blur: 8px, radius: radius-xl (top), padding: space-4 | Bottom, Center |
| 11 | Mic Button | Button/Icon | (448, 820) | (56, 56) | radius: radius-md, bg: neutral-700 (on) / error (off/muted) | Bottom, Center |
| 12 | Camera Button | Button/Icon | (520, 820) | (56, 56) | same styling | Bottom, Center |
| 13 | Chat Button | Button/Icon | (592, 820) | (56, 56) | same styling, badge dot if unread | Bottom, Center |
| 14 | Screen Share Button | Button/Icon | (664, 820) | (56, 56) | same styling, active: primary-500 bg | Bottom, Center |
| 15 | End Call Button | Button/Icon | (800, 820) | (56, 56) | radius: radius-md, bg: error, icon: PhoneOff | Bottom, Center |
| 16 | Chat Drawer | Drawer | (1040, 0) | (400, 900) | bg: surface-elevated, shadow: shadow-lg, border-left: 1px solid border-default | Right, Full height |
| 17 | Chat Header | Box | (1040, 0) | (400, 64) | bg: surface-card, border-bottom: 1px solid border-default, padding: space-4 | Top, Right |
| 18 | Chat Title | Text/H3 | (1056, 20) | (200, 24) | font: text-lg, font-display, color: text-primary | Top, Left |
| 19 | Chat Close | Button/Icon | (1392, 16) | (32, 32) | icon: X, color: text-muted | Top, Right |
| 20 | Chat Messages | Scrollable | (1040, 64) | (400, 740) | padding: space-4 | Top+Bottom, Right |
| 21 | Chat Input Row | Row | (1040, 804) | (400, 96) | bg: surface-card, border-top: 1px solid border-default, padding: space-4 | Bottom, Right |
| 22 | Chat Input | Input/Text | (1056, 820) | (320, 48) | bg: surface-input, border: 1px solid border-default, radius: radius-md | Bottom, Left |
| 23 | Chat Send | Button/Icon | (1392, 820) | (48, 48) | bg: primary-500, icon: Send, color: white, radius: radius-md | Bottom, Right |
| 24 | Waiting Overlay | Box/Centered | (0, 0) | (1440, 900) | bg: rgba(0,0,0,0.7) | All sides |
| 25 | Waiting Card | Card | (480, 300) | (480, 200) | bg: surface-card, radius: radius-xl, padding: space-8 | Center |
| 26 | Waiting Avatar | Avatar/Large | (672, 324) | (96, 96) | radius: radius-full | Center |
| 27 | Waiting Text | Text/H3 | (480, 436) | (480, 28) | font: text-xl, font-display, color: text-primary, text-align: center | Center |
| 28 | Waiting Subtext | Text/Body | (480, 472) | (480, 20) | font: text-sm, color: text-muted, text-align: center | Center |

### Token Values

| Element | Token | Value |
|---------|-------|-------|
| Video chrome bg | `neutral-950` | `#0c0a09` |
| Toolbar bg | `rgba(0,0,0,0.6)` + `backdrop-blur: 8px` | -- |
| Toolbar button bg (on) | `neutral-700` | `#44403c` |
| Toolbar button bg (muted) | `error` | `#ef4444` |
| Toolbar button active | `primary-500` | `#22c55e` |
| End call button | `error` | `#ef4444` |
| Overlay text | `text-inverse` | `#ffffff` |
| Chat drawer bg | `surface-elevated` | `#ffffff` |
| Chat drawer shadow | `shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1)` |
| Chat border | `border-default` | `#e7e5e4` |
| Timer font | `font-display` | Space Grotesk |
| Label font | `font-body` | Inter |
| Timer size | `text-lg` | 20px |
| Button size | 56x56px | -- |
| Toolbar radius | `radius-xl` (top only) | 16px |
| Button radius | `radius-md` | 8px |

### States

**Waiting State (Other Party Not Joined)**
- Remote video shows waiting overlay (rgba(0,0,0,0.7))
- Waiting card centered with pro avatar + "[Pro Name] will join shortly"
- Subtext: "You can send a message while waiting"
- Chat drawer is open by default

**Both Parties Joined**
- Waiting overlay hidden
- Remote video shows professional's feed
- Local video shows user's PIP
- Timer starts counting up from 00:00
- Connection dot is green

**Mic Muted**
- Mic button bg turns error
- Icon changes to MicOff
- Local video shows muted badge: "Mutado"

**Camera Off**
- Camera button bg turns error
- Icon changes to VideoOff
- Local PIP shows initials avatar instead of video

**Screen Sharing Active**
- Screen share button bg turns primary-500
- Remote video swaps to screen share tile
- Screen share tile gets "Sharing screen" label

**Chat Open (Desktop)**
- Chat drawer slides in from right, 400px wide
- Chat button has primary-500 bg when open
- Backdrop on video dims slightly

**Chat Closed (Desktop)**
- Drawer slides out to right
- Chat button returns to neutral-700 bg
- Unread messages show red badge dot (8px, error)

**Connection Degraded**
- Connection dot turns warning (yellow)
- Label: "Conexao instavel"
- If severe: dot turns error (red), label: "Reconectando..."

**Session Ending (User Clicks End Call)**
- Confirmation modal appears: "End session for both parties?"
- Options: "End for everyone" (danger) + "Cancel" (ghost)
- Timer pauses

**Mobile Chat Sheet**
- Chat occupies 85% of viewport height from bottom
- Drag handle at top (40px, neutral-300 bar, 40px wide)
- Backdrop overlay on video

### Accessibility Notes

- **Focus trap**: When chat drawer is open, focus is trapped within drawer. Close button is first focusable element.
- **ARIA**:
  - Toolbar: `role="toolbar"`, `aria-label="Controles da sessao de video"`
  - Mic button: `aria-pressed="true/false"`, `aria-label="Microfone ativado/desativado"`
  - Camera button: `aria-pressed="true/false"`, `aria-label="Camera ativada/desativada"`
  - End call: `aria-label="Encerrar chamada"`
  - Chat drawer: `role="complementary"`, `aria-label="Chat da sessao"`
  - Chat messages: `role="log"`, `aria-live="polite"`
  - Timer: `aria-label="Tempo decorrido da sessao"`
- **Keyboard shortcuts** (documented in UI):
  - `M` = toggle mic
  - `V` = toggle camera
  - `C` = toggle chat
  - `Esc` = close chat drawer / cancel end call
- **Screen reader**: Announce when other participant joins/leaves via `aria-live="polite"`
- **Reduced motion**: Disable PIP drag animation. Instant snap to position.
- **High contrast**: Toolbar buttons have 2px white border in Windows high-contrast mode.

---

## SL-03: Post-session (`/sessao/[id]/review`)

### Overview

| Property | Value |
|----------|-------|
| **Frame ID** | SL-03 |
| **Route** | `/sessao/[id]/review` |
| **Actor** | User (client) |
| **Dimensions** | Desktop 1440x900 / Mobile 375x812 |
| **Background** | `surface-page` (`#f4f8f5`) |
| **Layout Grid** | 8px baseline, form max-width 640px centered |

### Layout Structure

A contained, centered form experience. The user has just finished their session and is prompted to leave a review. The layout is calm and appreciative -- no urgency.

```
+-------------------------------------------------------------+
| Header (64px, sticky)                                       |
+-------------------------------------------------------------+
|                                                             |
|  +-----------------------------------------------------+   |
|  | Header Area                                         |   |
|  | "Como foi sua sessao?"                              |   |
|  | Subtitle: "Sua avaliacao ajuda outros pacientes."   |   |
|  +-----------------------------------------------------+   |
|                                                             |
|  +-----------------------------------------------------+   |
|  | Professional Card                                   |   |
|  | [Avatar] [Name] [Specialty] [Session date]          |   |
|  +-----------------------------------------------------+   |
|                                                             |
|  +-----------------------------------------------------+   |
|  | Rating Section                                      |   |
|  |                                                     |   |
|  |   *  *  *  *  *                                     |   |
|  |   "Toque nas estrelas para avaliar"                |   |
|  |                                                     |   |
|  +-----------------------------------------------------+   |
|                                                             |
|  +-----------------------------------------------------+   |
|  | Review Textarea                                     |   |
|  | Label: "Conte mais sobre sua experiencia"           |   |
|  | [                                                  ]|   |
|  | 0 / 1000 caracteres                                |   |
|  +-----------------------------------------------------+   |
|                                                             |
|  +-----------------------------------------------------+   |
|  | Private Feedback (optional)                         |   |
|  | Label: "Algo que gostaria de nos contar em privado?"|   |
|  | [                                                  ]|   |
|  +-----------------------------------------------------+   |
|                                                             |
|  +-----------------------------------------------------+   |
|  | Consent Checkbox                                    |   |
|  | [checked] Confirmo que esta avaliacao reflete minha |   |
|  |     experiencia genuina.                            |   |
|  +-----------------------------------------------------+   |
|                                                             |
|  [ Enviar Avaliacao ]                                     |
|                                                             |
|  +-----------------------------------------------------+   |
|  | Booking Summary Card                                |   |
|  | - Session details                                   |   |
|  | - Price paid                                        |   |
|  | - Duration                                          |   |
|  +-----------------------------------------------------+   |
|                                                             |
+-------------------------------------------------------------+
```

### Components & Layers

| # | Layer Name | Component / Shape | Position (x, y) | Size (w, h) | Tokens & Properties | Constraints |
|---|------------|-------------------|-----------------|-------------|---------------------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface-page, border-bottom: border-default | Top, Left+Right |
| 2 | Back Link | Button/Ghost | (32, 80) | (120, 32) | icon: ArrowLeft, text: text-sm, color: text-secondary | Top, Left |
| 3 | Page Title | Text/H1 | (400, 96) | (640, 40) | font: text-2xl, font-display, color: text-primary, text-align: center | Top, Left+Right |
| 4 | Page Subtitle | Text/Body | (400, 144) | (640, 24) | font: text-base, color: text-muted, text-align: center | Top, Left+Right |
| 5 | Pro Card | Card/Horizontal | (400, 196) | (640, 88) | bg: surface-card, border: 1px solid border-default, radius: radius-lg, padding: space-4 | Top, Left+Right |
| 6 | Pro Avatar | Avatar/Medium | (424, 212) | (56, 56) | radius: radius-full | Top, Left |
| 7 | Pro Name | Text/H3 | (496, 216) | (400, 24) | font: text-lg, font-display, color: text-primary | Top, Left |
| 8 | Pro Specialty | Text/Body | (496, 244) | (400, 20) | font: text-sm, color: text-muted | Top, Left |
| 9 | Session Date | Text/Body | (496, 268) | (400, 20) | font: text-sm, color: text-muted | Top, Left |
| 10 | Rating Card | Card | (400, 308) | (640, 140) | bg: surface-card, border: 1px solid border-default, radius: radius-lg, padding: space-6 | Top, Left+Right |
| 11 | Rating Label | Text/H3 | (424, 332) | (592, 24) | font: text-lg, font-display, color: text-primary, text-align: center | Top, Left+Right |
| 12 | Star Row | Row | (400, 372) | (640, 48) | gap: space-3, justify: center | Top, Center |
| 13 | Star 1 | Button/Icon | (452, 372) | (48, 48) | icon: Star, color: neutral-300 (empty) / warning (filled), stroke-width: 1.5px | Top, Center |
| 14 | Star 2 | Button/Icon | (512, 372) | (48, 48) | same | Top, Center |
| 15 | Star 3 | Button/Icon | (572, 372) | (48, 48) | same | Top, Center |
| 16 | Star 4 | Button/Icon | (632, 372) | (48, 48) | same | Top, Center |
| 17 | Star 5 | Button/Icon | (692, 372) | (48, 48) | same | Top, Center |
| 18 | Rating Hint | Text/Body | (400, 428) | (640, 20) | font: text-sm, color: text-muted, text-align: center | Top, Center |
| 19 | Textarea Card | Card | (400, 468) | (640, 200) | bg: surface-card, border: 1px solid border-default, radius: radius-lg, padding: space-6 | Top, Left+Right |
| 20 | Textarea Label | Text/Label | (424, 492) | (592, 20) | font: text-sm, font-semibold, color: text-primary | Top, Left+Right |
| 21 | Review Textarea | Input/Textarea | (424, 524) | (592, 120) | bg: surface-input, border: 1px solid border-default, radius: radius-md, min-height: 120px | Top, Left+Right |
| 22 | Char Counter | Text/Caption | (424, 652) | (592, 16) | font: text-xs, color: text-muted, text-align: right | Top, Right |
| 23 | Private Card | Card | (400, 688) | (640, 160) | bg: surface-card, border: 1px solid border-default, radius: radius-lg, padding: space-6 | Top, Left+Right |
| 24 | Private Label | Text/Label | (424, 712) | (592, 20) | font: text-sm, font-semibold, color: text-primary | Top, Left+Right |
| 25 | Private Hint | Text/Body | (424, 736) | (592, 20) | font: text-xs, color: text-muted | Top, Left+Right |
| 26 | Private Textarea | Input/Textarea | (424, 764) | (592, 72) | bg: surface-input, border: 1px solid border-default, radius: radius-md, min-height: 72px | Top, Left+Right |
| 27 | Consent Row | Row | (400, 864) | (640, 24) | gap: space-3 | Top, Left+Right |
| 28 | Consent Checkbox | Control/Checkbox | (424, 864) | (20, 20) | checked: primary-500, radius: radius-sm | Top, Left |
| 29 | Consent Label | Text/Body | (456, 864) | (560, 24) | font: text-sm, color: text-secondary | Top, Left+Right |
| 30 | Submit Button | Button/Primary | (400, 912) | (640, 56) | bg: primary-500, text: white, radius: radius-md, font: text-lg, font-semibold | Bottom, Left+Right |
| 31 | Summary Card | Card | (400, 992) | (640, 160) | bg: surface-card, border: 1px solid border-default, radius: radius-lg, padding: space-6 | Bottom, Left+Right |
| 32 | Summary Title | Text/H3 | (424, 1016) | (592, 24) | font: text-lg, font-display, color: text-primary | Bottom, Left+Right |
| 33 | Summary Divider | Line | (424, 1048) | (592, 1) | color: border-default | Bottom, Left+Right |
| 34 | Summary Row 1 | Row | (424, 1064) | (592, 24) | justify: space-between | Bottom, Left+Right |
| 35 | Summary Label 1 | Text/Body | (424, 1064) | (200, 24) | font: text-sm, color: text-muted | Bottom, Left |
| 36 | Summary Value 1 | Text/Body | (800, 1064) | (216, 24) | font: text-sm, font-semibold, color: text-primary, text-align: right | Bottom, Right |
| 37 | Summary Row 2 | Row | (424, 1096) | (592, 24) | justify: space-between | Bottom, Left+Right |
| 38 | Summary Row 3 | Row | (424, 1128) | (592, 24) | justify: space-between | Bottom, Left+Right |

### Token Values

| Element | Token | Value |
|---------|-------|-------|
| Page background | `surface-page` | `#f4f8f5` |
| Card background | `surface-card` | `#ffffff` |
| Input background | `surface-input` | `#ffffff` |
| Card border | `border-default` | `#e7e5e4` |
| Title color | `text-primary` | `#1c1917` |
| Subtitle/muted | `text-muted` | `#78716c` |
| Star empty | `neutral-300` | `#d6d3d1` |
| Star filled | `warning` | `#e8950f` |
| Primary CTA | `primary-500` | `#22c55e` |
| CTA text | `text-inverse` | `#ffffff` |
| Title font | `font-display` | Space Grotesk |
| Body font | `font-body` | Inter |
| H1 size | `text-2xl` | 31px |
| Body size | `text-base` | 16px |
| Star size | 48x48px | -- |
| Card radius | `radius-lg` | 12px |
| Button radius | `radius-md` | 8px |
| Card padding | `space-6` | 24px |
| Form max-width | 640px | -- |
| Form gap | `space-6` | 24px |

### States

**Default State**
- All 5 stars are empty (neutral-300 outline)
- Rating hint: "Toque nas estrelas para avaliar"
- Textareas are empty
- Char counter: "0 / 1000"
- Consent checkbox unchecked
- Submit button disabled (opacity-50, cursor-not-allowed)

**Hover on Star**
- Stars up to hovered index fill with warning color
- Stars after hovered index remain empty
- Rating hint updates dynamically:
  - 1 star: "Muito ruim"
  - 2 stars: "Ruim"
  - 3 stars: "Regular"
  - 4 stars: "Bom"
  - 5 stars: "Excelente"

**Star Selected**
- Selected stars remain filled on mouse leave
- Hint shows the selected label persistently
- Submit button remains disabled until consent checkbox is checked

**Textarea Focus**
- Border changes to primary-500
- Focus ring: 2px solid primary-500, offset 2px

**Consent Checked**
- Submit button becomes enabled (opacity-100)
- cursor: pointer

**Submitting**
- Submit button shows spinner + "Enviando..."
- Button disabled
- All inputs disabled
- `aria-busy="true"` on form

**Success State**
- Form replaced by EmptyState pattern:
  - Icon: CheckCircle, 64px, primary-500
  - Title: "Obrigado pela sua avaliacao!"
  - Description: "Sua avaliacao sera analisada e publicada em breve."
  - Status tracker: "Enviada -> Em analise -> Publicada"
  - CTA: "Voltar a agenda" (primary)
  - Secondary: "Agendar nova sessao" (ghost)

**Already Reviewed State**
- Shows read-only view:
  - Stars filled with user's previous rating
  - Review text displayed as static text
  - Private feedback hidden (not shown to user)
  - Badge: "Avaliacao enviada"
  - CTA: "Voltar a agenda"

**Validation Error**
- If textarea exceeds 1000 chars: border turns error, counter turns error
- If submit attempted without rating: shake animation on star row, error text below

### Accessibility Notes

- **Focus order**: Back link -> Star 1 -> Star 2 -> Star 3 -> Star 4 -> Star 5 -> Review textarea -> Private textarea -> Consent checkbox -> Submit button
- **Focus ring**: `2px solid primary-500`, offset 2px on all interactive elements
- **ARIA**:
  - Star row: `role="radiogroup"`, `aria-label="Avaliacao geral"`
  - Each star: `role="radio"`, `aria-checked="true/false"`, `aria-label="X de 5 estrelas"`
  - Review textarea: `aria-describedby="char-counter review-hint"`
  - Char counter: `aria-live="polite"`
  - Form: `aria-label="Formulario de avaliacao da sessao"`
- **Keyboard**: Arrow keys navigate between stars (Left/Right). Space/Enter selects. Tab moves to next field.
- **Screen reader**: Announce rating label when star selected (e.g., "4 de 5 estrelas, Bom").
- **Color contrast**: Star empty state uses neutral-300 -- ensure it is perceivable against white (7.4:1). Star filled uses warning on white (3.1:1 -- acceptable for large graphical UI element).
- **Reduced motion**: Disable star fill animation. Instant color change.
- **Error announcement**: Validation errors announced via `aria-live="assertive"`.

---

*Frame specs are the single source of truth for Figma implementation. Any deviation requires design system review.*

# Settings & Preferences Frames

> **Journey:** Account settings, notification preferences, and platform configuration  
> **Users:** Standard user (SP-01) and Verified professional (SP-02)  
> **Source:** `docs/product/design-system/frames/settings-preferences.md`  
> **Version:** 1.0  
> **Date:** 2026-04-19

---

## Shared Patterns

### Settings Card

All settings sections use a consistent card pattern:

| Property | Token / Value |
|----------|---------------|
| Background | `surface-card` (#ffffff) |
| Border | 1px solid `neutral-200` |
| Radius | `radius-lg` (12px) |
| Shadow | `shadow-none` |
| Padding | `p-6` (24px) |
| Gap between cards | 24px (space-6) |

### Settings Row

Within each card, individual settings use a row pattern:

| Property | Token / Value |
|----------|---------------|
| Height | 56px (minimum) |
| Padding | `px-0 py-3` (vertical only, card handles horizontal) |
| Border-bottom | 1px solid `neutral-200` (between rows) |
| Last row | no border-bottom |
| Layout | flex, justify-between, align-center |

**Row content (left side):**
- Label: `text-base`, `neutral-900`, `font-medium`
- Description (optional): `text-sm`, `neutral-500`, below label
- Gap between label and description: 2px

**Row content (right side):**
- Action: Toggle, Select, Button, or ChevronRight icon

### Toggle Switch

| Property | Token / Value |
|----------|---------------|
| Width | 44px |
| Height | 24px |
| Track radius | `radius-full` (999px) |
| Track off | `neutral-300` |
| Track on | `primary-500` |
| Thumb | 20px circle, white |
| Thumb offset | 2px |
| Thumb shadow | `shadow-sm` |
| Transition | 150ms ease |

---

## SP-01: User Settings (`/configuracoes`)

### Overview
Standard user configures account, notification preferences, privacy settings, and payment methods. Clean, card-based layout with clear section grouping. No sidebar — uses header-only layout like other user-facing pages.

### Dimensions

| Breakpoint | Width | Height | Notes |
|------------|-------|--------|-------|
| Desktop | 1440px | 900px (min) | Cards max-width 720px, centered |
| Tablet | 768px | 1024px | Cards max-width 640px, centered |
| Mobile | 375px | 812px | Full-width cards, 16px margins |

### Layout Structure

**Desktop/Tablet:**
- Header: standard Shell/Header, 64px, sticky
- Content: vertically scrollable
- Cards container: max-width 720px, centered
- Content padding-top: 32px below header
- Gap between cards: 24px
- Bottom padding: 64px

**Mobile:**
- Header sticky
- Cards: full width minus 32px (16px margins)
- Card padding: `p-4` (16px) instead of `p-6`

### Layers (desktop)

| # | Layer Name | Component | Position (x, y) | Size (w, h) | Tokens |
|---|------------|-----------|-----------------|-------------|--------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface-page, border-bottom: neutral-200 |
| 2 | Page Title | Text/H1 | (360, 80) | (720, 36) | font: text-2xl, font-display, color: neutral-900 |
| 3 | Page Subtitle | Text/Body | (360, 120) | (720, 24) | font: text-base, color: neutral-500 |
| 4 | Account Card | Card/Settings | (360, 168) | (720, 280) | bg: surface-card, border: neutral-200, radius: radius-lg |
| 5 | Card Header "Conta" | Row/Header | (376, 184) | (688, 32) | border-bottom: neutral-200 |
| 6 | Card Header Title | Text/H3 | (376, 188) | (200, 24) | font: text-lg, font-display, color: neutral-900 |
| 7 | Account Row 1 — E-mail | Row/Setting | (376, 232) | (688, 56) | border-bottom: neutral-200 |
| 8 | Row Label "E-mail" | Text/Body | (376, 236) | (200, 20) | font: text-base, font-medium, color: neutral-900 |
| 9 | Row Value | Text/Body | (376, 260) | (300, 16) | font: text-sm, color: neutral-500 |
| 10 | Row Action "Alterar" | Button/Text | (1000, 244) | (80, 24) | font: text-sm, color: primary-600 |
| 11 | Account Row 2 — Senha | Row/Setting | (376, 304) | (688, 56) | border-bottom: neutral-200 |
| 12 | Account Row 3 — Telefone | Row/Setting | (376, 376) | (688, 56) | border-bottom: neutral-200 |
| 13 | Account Row 4 — Excluir conta | Row/Setting | (376, 448) | (688, 56) | no border |
| 14 | Delete Action | Button/Text | (1000, 460) | (120, 24) | font: text-sm, color: error |
| 15 | Notifications Card | Card/Settings | (360, 472) | (720, 240) | bg: surface-card, border: neutral-200, radius: radius-lg |
| 16 | Card Header "Notificações" | Row/Header | (376, 488) | (688, 32) | border-bottom: neutral-200 |
| 17 | Notify Row 1 — E-mail | Row/Setting | (376, 536) | (688, 56) | border-bottom: neutral-200 |
| 18 | Row Label "Notificações por e-mail" | Text/Body | (376, 540) | (300, 20) | font: text-base, font-medium, color: neutral-900 |
| 19 | Row Description | Text/Caption | (376, 564) | (400, 16) | font: text-xs, color: neutral-500 |
| 20 | Row Toggle | Switch | (1024, 548) | (44, 24) | track: neutral-300 or primary-500 |
| 21 | Notify Row 2 — SMS | Row/Setting | (376, 608) | (688, 56) | border-bottom: neutral-200 |
| 22 | Notify Row 3 — Push | Row/Setting | (376, 680) | (688, 56) | border-bottom: neutral-200 |
| 23 | Notify Row 4 — Marketing | Row/Setting | (376, 752) | (688, 56) | no border |
| 24 | Privacy Card | Card/Settings | (360, 736) | (720, 200) | bg: surface-card, border: neutral-200, radius: radius-lg |
| 25 | Card Header "Privacidade" | Row/Header | (376, 752) | (688, 32) | border-bottom: neutral-200 |
| 26 | Privacy Row 1 — Perfil público | Row/Setting | (376, 800) | (688, 56) | border-bottom: neutral-200 |
| 27 | Privacy Row 2 — Localização | Row/Setting | (376, 872) | (688, 56) | no border |
| 28 | Payment Methods Card | Card/Settings | (360, 960) | (720, 240) | bg: surface-card, border: neutral-200, radius: radius-lg |
| 29 | Card Header "Métodos de pagamento" | Row/Header | (376, 976) | (688, 32) | border-bottom: neutral-200 |
| 30 | Payment Row 1 — Cartão principal | Row/Setting | (376, 1024) | (688, 72) | border-bottom: neutral-200 |
| 31 | Card Icon | Icon | (376, 1032) | (40, 40) | CreditCard, color: neutral-500 |
| 32 | Card Details | Text/Body | (432, 1032) | (300, 20) | font: text-base, color: neutral-900 |
| 33 | Card Expiry | Text/Caption | (432, 1056) | (200, 16) | font: text-xs, color: neutral-500 |
| 34 | Card Default Badge | Badge | (740, 1036) | (80, 24) | variant: default |
| 35 | Card Menu | Button/Icon | (1024, 1036) | (32, 32) | icon: MoreVertical, color: neutral-500 |
| 36 | "Adicionar cartão" Button | Button/Secondary | (376, 1112) | (688, 40) | border: neutral-200, radius: radius-md |
| 37 | Bottom Spacer | Box | (360, 1224) | (720, 64) | scroll padding |

### Components Used

| Component | Variants | Count |
|-----------|----------|-------|
| Header | standard user | 1 |
| Card | settings (4x) | 4 |
| Button | text, secondary, icon | 5+ |
| Toggle | switch | 4 |
| Badge | default | 1 |
| Icon | Lucide — CreditCard, MoreVertical, ChevronRight, Bell, Mail, MessageSquare, Smartphone, Eye, MapPin, Trash2 | — |

### Token Values

**Settings Card Header:**
- Padding-bottom: 12px
- Border-bottom: 1px solid `neutral-200`
- Title: `text-lg`, `font-display`, `neutral-900`
- Margin-bottom to first row: 16px

**Settings Row:**
- Min-height: 56px
- Padding: `py-3` (12px vertical)
- Border-bottom: 1px solid `neutral-200` (except last)
- Label: `text-base`, `font-medium`, `neutral-900`
- Description: `text-xs`, `neutral-500`, margin-top 2px
- Action alignment: vertically centered

**Text Link Actions:**
- "Alterar", "Adicionar" — `text-sm`, `primary-600`, hover `primary-700`
- "Excluir" — `text-sm`, `error`, hover darker
- No underline by default, underline on hover

**Payment Card Icon:**
- Size: 40px × 40px
- Background: `neutral-100`
- Radius: `radius-md` (8px)
- Icon: 20px, `neutral-500`

**Card Details:**
- Masked number: "•••• •••• •••• 4242"
- Font: `text-base`, `neutral-900`
- Expiry: "Expira 12/27" — `text-xs`, `neutral-500`

### States

**Toggle Interaction:**
- Toggle animates 150ms when clicked
- Haptic feedback on mobile (if available)
- Toast confirmation: "Preferência salva" (auto-dismiss 3s)

**Row with Chevron (navigates to sub-page):**
- ChevronRight icon, 16px, `neutral-400`
- Entire row is clickable
- Hover: row bg `neutral-50`, 150ms
- Active: `neutral-100`

**Delete Account Flow:**
- Click "Excluir conta" → ConfirmationDialog
- Title: "Excluir conta?"
- Description: "Esta ação é irreversível. Todos seus dados serão removidos."
- Required: Type "EXCLUIR" to confirm
- Actions: "Cancelar" (ghost) + "Excluir permanentemente" (danger)

**Add Payment Method:**
- Opens modal or navigates to `/configuracoes/pagamento`
- Stripe Elements integration
- Modal: 560px wide, `shadow-lg`, `radius-lg`

**Loading State:**
- Cards show skeleton headers + 3 rows each
- Skeleton: `bg-neutral-100`, `radius-md`, pulse

**Error State:**
- Toast: "Não foi possível carregar configurações"
- Retry button in toast

### Accessibility Notes

- **Page title:** `<h1>` with "Configurações"
- **Cards:** Use `<section>` with `aria-labelledby` pointing to header title
- **Settings rows:** `role="listitem"` inside `role="list"`
- **Toggles:** Native `<input type="checkbox">` with `role="switch"`, `aria-checked`
- **Toggle labels:** Clicking label toggles switch (implicit association)
- **Text actions:** "Alterar" has `aria-label="Alterar e-mail"` for context
- **Delete action:** `aria-label="Excluir conta permanentemente"`
- **Payment menu:** `aria-label="Opções do cartão final 4242"`
- **Focus order:** Header → Page title → Card 1 rows → Card 2 rows → etc.
- **Focus ring:** All interactive elements have 2px `primary-500` ring, 2px offset
- **Color alone:** Toggle state indicated by position AND color; text actions have labels, not just color

---

## SP-02: Professional Settings (`/configuracoes`)

### Overview
Professional configures platform-specific settings: availability schedule, notification routing, payout preferences, and subscription tier. Uses sidebar layout consistent with other professional workspace frames. Pro tier badge visible in header area.

### Dimensions

| Breakpoint | Width | Height | Notes |
|------------|-------|--------|-------|
| Desktop | 1440px | 900px (min) | Sidebar 240px |
| Tablet | 768px | 1024px | Sidebar 72px |
| Mobile | 375px | 812px | Bottom nav, stacked cards |

### Layout Structure

**Desktop:**
- Sidebar: 240px fixed (same as PW frames)
- Header: full width, 64px
- Content area: fills remaining width
- Content padding: 32px
- Cards: max-width 800px within content area
- Cards stack vertically with 24px gap

**Mobile:**
- Bottom nav (same as PW frames)
- Cards full-width, 16px margins
- Card padding reduced to `p-4`

### Layers (desktop)

| # | Layer Name | Component | Position (x, y) | Size (w, h) | Tokens |
|---|------------|-----------|-----------------|-------------|--------|
| 1 | Sidebar | Nav/Sidebar | (0, 0) | (240, 900) | active item: Configurações |
| 2 | Header | Shell/Header | (240, 0) | (1200, 64) | standard |
| 3 | Page Title | Text/H1 | (272, 80) | (400, 36) | font: text-2xl, font-display, color: neutral-900 |
| 4 | Pro Tier Badge | Badge | (1200, 84) | (80, 24) | variant: pro (bg: brand-bright, text: neutral-900) |
| 5 | Page Subtitle | Text/Body | (272, 120) | (600, 20) | font: text-sm, color: neutral-500 |
| 6 | Availability Card | Card/Settings | (272, 168) | (800, 480) | bg: surface-card, border: neutral-200, radius: radius-lg |
| 7 | Card Header "Disponibilidade" | Row/Header | (288, 184) | (768, 32) | border-bottom: neutral-200 |
| 8 | Card Header Title | Text/H3 | (288, 188) | (300, 24) | font: text-lg, font-display, color: neutral-900 |
| 9 | "Copiar semana" Button | Button/Text | (900, 188) | (140, 24) | font: text-sm, color: primary-600 |
| 10 | Day Row "Segunda" | Row/DaySchedule | (288, 232) | (768, 56) | border-bottom: neutral-200 |
| 11 | Day Toggle | Switch | (288, 248) | (44, 24) | track: neutral-300 or primary-500 |
| 12 | Day Label | Text/Body | (348, 240) | (100, 20) | font: text-base, font-medium, color: neutral-900 |
| 13 | Time Slot "09:00–12:00" | Tag/Removable | (460, 240) | (120, 32) | bg: primary-50, border: primary-200, text: primary-700, radius: radius-md |
| 14 | Time Slot "14:00–18:00" | Tag/Removable | (592, 240) | (120, 32) | same |
| 15 | "+ Horário" Button | Button/Text | (724, 244) | (80, 24) | font: text-sm, color: primary-600 |
| 16 | Day Row "Terça" | Row/DaySchedule | (288, 304) | (768, 56) | border-bottom: neutral-200 |
| 17 | Day Row "Quarta" | Row/DaySchedule | (288, 376) | (768, 56) | border-bottom: neutral-200 |
| 18 | Day Row "Quinta" | Row/DaySchedule | (288, 448) | (768, 56) | border-bottom: neutral-200 |
| 19 | Day Row "Sexta" | Row/DaySchedule | (288, 520) | (768, 56) | border-bottom: neutral-200 |
| 20 | Day Row "Sábado" | Row/DaySchedule | (288, 592) | (768, 56) | border-bottom: neutral-200 |
| 21 | Day Row "Domingo" | Row/DaySchedule | (288, 664) | (768, 56) | no border |
| 22 | Notifications Card | Card/Settings | (272, 672) | (800, 280) | bg: surface-card, border: neutral-200, radius: radius-lg |
| 23 | Card Header "Notificações" | Row/Header | (288, 688) | (768, 32) | border-bottom: neutral-200 |
| 24 | Notify Row 1 — Novos agendamentos | Row/Setting | (288, 736) | (768, 56) | border-bottom: neutral-200 |
| 25 | Row Label | Text/Body | (288, 740) | (300, 20) | font: text-base, font-medium, color: neutral-900 |
| 26 | Row Description | Text/Caption | (288, 764) | (400, 16) | font: text-xs, color: neutral-500 |
| 27 | Channel Select | Select | (900, 744) | (140, 36) | bg: surface-card, border: neutral-200, radius: radius-md |
| 28 | Notify Row 2 — Cancelamentos | Row/Setting | (288, 808) | (768, 56) | border-bottom: neutral-200 |
| 29 | Notify Row 3 — Lembretes | Row/Setting | (288, 880) | (768, 56) | border-bottom: neutral-200 |
| 30 | Notify Row 4 — Mensagens | Row/Setting | (288, 952) | (768, 56) | no border |
| 31 | Payout Settings Card | Card/Settings | (272, 976) | (800, 240) | bg: surface-card, border: neutral-200, radius: radius-lg |
| 32 | Card Header "Pagamentos" | Row/Header | (288, 992) | (768, 32) | border-bottom: neutral-200 |
| 33 | Payout Row 1 — Conta bancária | Row/Setting | (288, 1040) | (768, 56) | border-bottom: neutral-200 |
| 34 | Bank Icon | Icon | (288, 1048) | (40, 40) | Landmark, color: neutral-500 |
| 35 | Bank Details | Text/Body | (344, 1048) | (400, 20) | font: text-base, color: neutral-900 |
| 36 | Bank Meta | Text/Caption | (344, 1072) | (300, 16) | font: text-xs, color: neutral-500 |
| 37 | "Alterar" Link | Button/Text | (940, 1056) | (80, 24) | font: text-sm, color: primary-600 |
| 38 | Payout Row 2 — Frequência | Row/Setting | (288, 1112) | (768, 56) | border-bottom: neutral-200 |
| 39 | Frequency Select | Select | (900, 1116) | (140, 36) | bg: surface-card, border: neutral-200, radius: radius-md |
| 40 | Payout Row 3 — Automático | Row/Setting | (288, 1184) | (768, 56) | no border |
| 41 | Auto Toggle | Switch | (900, 1188) | (44, 24) | track: neutral-300 or primary-500 |
| 42 | Subscription Card | Card/Settings | (272, 1240) | (800, 200) | bg: surface-card, border: primary-200, radius: radius-lg |
| 43 | Card Header "Assinatura" | Row/Header | (288, 1256) | (768, 32) | border-bottom: primary-200 |
| 44 | Plan Name | Text/H3 | (288, 1300) | (400, 28) | font: text-xl, font-display, color: neutral-900 |
| 45 | Plan Price | Text/Body | (288, 1332) | (400, 20) | font: text-base, color: neutral-500 |
| 46 | Plan Features | List/Features | (288, 1364) | (400, 80) | flex-col, gap: space-2 |
| 47 | Feature Item | Row | varies | varies | Check icon + text, gap: space-2 |
| 48 | Feature Text | Text/Body | varies | varies | font: text-sm, color: neutral-700 |
| 49 | "Gerenciar" Button | Button/Secondary | (900, 1300) | (140, 40) | border: primary-500, text: primary-600, radius: radius-md |
| 50 | "Upgrade para Pro" Button | Button/Primary | (900, 1352) | (140, 40) | bg: primary-500, text: white, radius: radius-md |
| 51 | Bottom Spacer | Box | (272, 1464) | (800, 64) | scroll padding |

### Components Used

| Component | Variants | Count |
|-----------|----------|-------|
| Sidebar | professional nav | 1 |
| Header | standard | 1 |
| Card | settings (4x), highlighted subscription | 4 |
| Button | primary, secondary, text, icon | 6+ |
| Toggle | switch | 7 |
| Select | dropdown | 3 |
| Tag | removable time slot | N variable |
| Badge | pro | 1 |
| Icon | Lucide — Landmark, Check, Plus, X, Settings, Bell, Mail, Calendar, Clock, CreditCard, Shield | — |

### Token Values

**Availability Day Row:**
- Height: 56px
- Day toggle: left-aligned
- Day label: 100px wide, `text-base`, `font-medium`
- Time slots: inline, flex-wrap, gap 8px
- Time slot tag: `bg-primary-50`, border `primary-200`, text `primary-700`
- Tag padding: `px-3 py-1.5`
- Tag radius: `radius-md` (8px)
- Tag font: `text-sm`, `font-medium`
- Remove icon in tag: 14px, `primary-500`, hover `error`

**Add Time Slot Interaction:**
- Click "+ Horário" → inline time pickers appear
- Two Select inputs: "Início" and "Fim"
- "Salvar" text button (primary-600) + "Cancelar" text button (neutral-500)
- Gap: 8px

**Notification Channel Select:**
- Width: 140px
- Height: 36px
- Background: `surface-card`
- Border: 1px solid `neutral-200`
- Radius: `radius-md`
- Options: E-mail, SMS, Push, Todos

**Subscription Card (Highlighted):**
- Border: 1px solid `primary-200` (instead of `neutral-200`)
- Background: `surface-card` (same)
- Pro badge in header area: `brand-bright` bg, `neutral-900` text
- Feature check icon: 16px, `primary-500`
- Feature text: `text-sm`, `neutral-700`

**Plan Comparison (if Essencial tier):**
- "Upgrade para Pro" button prominent
- Features list shows locked items with Lock icon (`neutral-400`)
- Locked text: `neutral-400`, strikethrough

### States

**Day Toggle Off:**
- Time slots hidden
- Day label: `neutral-400` (disabled appearance)
- Row height collapses to 40px

**Day Toggle On:**
- Time slots visible
- Day label: `neutral-900`
- "+ Horário" button visible

**Time Slot Conflict:**
- Overlapping slots show `error` border
- Tooltip: "Horários não podem se sobrepor"
- Save disabled until resolved

**Notification Channel Change:**
- Select opens dropdown with `shadow-md`
- Selection saved immediately (no extra button)
- Toast: "Preferência de notificação atualizada"

**Payout Account Missing:**
- Bank details show "Nenhuma conta cadastrada"
- "Alterar" becomes "Adicionar"
- Button style: primary instead of text

**Auto Payout Toggle:**
- On: payouts processed automatically per frequency
- Off: manual payout initiation only
- Tooltip on hover explains behavior

**Subscription States:**

| State | Card Border | Badge | CTA |
|-------|-------------|-------|-----|
| Essencial (active) | primary-200 | none | "Upgrade para Pro" (primary) |
| Pro (active) | primary-200 | brand-bright | "Gerenciar" (secondary) |
| Pro (trial) | info | info | "Gerenciar" (secondary) |
| Pro (expiring) | warning | warning | "Renovar" (primary) |
| Cancelled | neutral-200 | error | "Reativar" (primary) |

**Copy Week Action:**
- Click "Copiar semana" → ConfirmationDialog
- "Copiar horários para todos os dias?"
- Existing day schedules overwritten
- Undo available via Toast action for 5 seconds

**Loading:**
- All toggles show skeleton (44×24px rectangles)
- Cards show 3 skeleton rows each

### Accessibility Notes

- **Availability toggles:** Each day toggle has `aria-label="Ativar disponibilidade de [day]"`
- **Time slots:** `role="list"`, each slot `role="listitem"`, remove button `aria-label="Remover horário [time]"`
- **Add time slot:** Focus moves to first Select when "+ Horário" clicked
- **Day rows:** When toggle off, time slots have `aria-hidden="true"`
- **Notification selects:** `aria-label="Canal de notificação para [event type]"`
- **Subscription card:** `aria-label="Seu plano atual: [plan name]"`
- **Upgrade button:** `aria-describedby` linking to plan benefits summary
- **Focus management:** After saving time slot, focus returns to "+ Horário" button
- **Live regions:** Toggle changes announce "Disponibilidade de segunda ativada" via `aria-live="polite"`
- **Color not alone:** Toggle position indicates state; subscription status has text + icon + border color
- **Keyboard:** Tab navigates through all toggles and selects; Enter/Space activates

---

*Settings & Preferences frames complete. For shared components, see `components.md`. For tokens, see `tokens.md`.*

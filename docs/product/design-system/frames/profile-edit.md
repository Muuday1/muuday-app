# Profile Edit Frames

> **Journey:** User and professional profile editing flows  
> **Users:** Standard user (PE-01) and Verified professional (PE-02)  
> **Source:** `docs/product/design-system/frames/profile-edit.md`  
> **Version:** 1.0  
> **Date:** 2026-04-19

---

## Shared Header — Edit Profile

Both frames use a compact sticky header with back navigation and save action.

| Property | Token / Value |
|----------|---------------|
| Height | 64px |
| Background | `surface-page` (#f4f8f5) |
| Border-bottom | 1px solid `neutral-200` |
| Shadow | `shadow-none` |
| Z-index | `z-sticky` (100) |
| Padding | `px-4` (16px horizontal) |

**Header content (left to right):**
1. **Back button** — ArrowLeft icon, 20px, `neutral-500`, 40px touch target, `radius-md` hover bg
2. **Spacer**
3. **Page title** — `text-lg`, `font-display`, `neutral-900`, centered
4. **Spacer**
5. **Save button** — "Salvar" text, `primary-600`, `text-base`, `font-medium`. Disabled until form dirty.

**Mobile header:** Same layout, title truncates with ellipsis if needed.

---

## PE-01: User Edit Profile (`/editar-perfil`)

### Overview
Standard user edits their personal information. Simple, centered form layout with avatar upload at top. Minimal fields — designed for quick updates.

### Dimensions

| Breakpoint | Width | Height | Notes |
|------------|-------|--------|-------|
| Desktop | 1440px | 900px (min) | Form max-width 560px, centered |
| Tablet | 768px | 1024px | Form max-width 560px, centered |
| Mobile | 375px | 812px | Form full-width, 16px margins |

### Layout Structure

**Desktop/Tablet:**
- Header: full width, sticky
- Content: vertically scrollable
- Form container: max-width 560px, centered horizontally
- Form padding-top: 32px below header
- Section gaps: 32px (space-8)

**Mobile:**
- Header sticky
- Form: 100% width minus 32px (16px margins each side)
- Same vertical rhythm, scaled down

### Layers (desktop)

| # | Layer Name | Component | Position (x, y) | Size (w, h) | Tokens |
|---|------------|-----------|-----------------|-------------|--------|
| 1 | Header | Shell/CompactHeader | (0, 0) | (1440, 64) | bg: surface-page, border-bottom: neutral-200 |
| 2 | Back Button | Button/Icon | (32, 12) | (40, 40) | icon: ArrowLeft, color: neutral-500 |
| 3 | Page Title | Text/H1 | (600, 16) | (240, 32) | font: text-lg, font-display, color: neutral-900 |
| 4 | Save Button | Button/Text | (1352, 16) | (80, 32) | font: text-base, color: primary-600 |
| 5 | Avatar Section | Box/Center | (440, 96) | (560, 180) | centered content |
| 6 | Avatar | Avatar/XLarge | (640, 96) | (120, 120) | radius: radius-full, object-fit: cover |
| 7 | Camera Overlay | Button/Icon | (720, 176) | (40, 40) | bg: surface-card 80% opacity, radius: radius-full, shadow: shadow-sm |
| 8 | Camera Icon | Icon | (730, 186) | (20, 20) | color: neutral-700 |
| 9 | "Alterar foto" Link | Text/Link | (640, 232) | (120, 20) | font: text-sm, color: primary-600 |
| 10 | Section Title "Dados pessoais" | Text/H3 | (440, 304) | (560, 28) | font: text-lg, font-display, color: neutral-900 |
| 11 | Label "Nome completo" | Text/Label | (440, 348) | (560, 20) | font: text-sm, font-medium, color: neutral-900 |
| 12 | Input "Nome completo" | Input/Text | (440, 376) | (560, 48) | bg: surface-card, border: neutral-200, radius: radius-md |
| 13 | Label "Nome de exibição" | Text/Label | (440, 440) | (560, 20) | font: text-sm, font-medium, color: neutral-900 |
| 14 | Input "Nome de exibição" | Input/Text | (440, 468) | (560, 48) | bg: surface-card, border: neutral-200, radius: radius-md |
| 15 | Helper Text | Text/Caption | (440, 524) | (560, 16) | font: text-xs, color: neutral-500 |
| 16 | Label "Bio" | Text/Label | (440, 556) | (560, 20) | font: text-sm, font-medium, color: neutral-900 |
| 17 | Textarea "Bio" | Input/Textarea | (440, 584) | (560, 120) | bg: surface-card, border: neutral-200, radius: radius-md |
| 18 | Char Counter | Text/Caption | (880, 712) | (120, 16) | font: text-xs, color: neutral-500 |
| 19 | Section Title "Contato" | Text/H3 | (440, 752) | (560, 28) | font: text-lg, font-display, color: neutral-900 |
| 20 | Label "E-mail" | Text/Label | (440, 796) | (560, 20) | font: text-sm, font-medium, color: neutral-900 |
| 21 | Input "E-mail" | Input/Email | (440, 824) | (560, 48) | bg: surface-card, border: neutral-200, radius: radius-md |
| 22 | Verified Badge | Icon/Text | (984, 832) | (80, 20) | icon: CheckCircle, color: primary-500, font: text-xs |
| 23 | Label "Telefone" | Text/Label | (440, 888) | (560, 20) | font: text-sm, font-medium, color: neutral-900 |
| 24 | Input "Telefone" | Input/Tel | (440, 916) | (560, 48) | bg: surface-card, border: neutral-200, radius: radius-md |
| 25 | Label "Data de nascimento" | Text/Label | (440, 980) | (560, 20) | font: text-sm, font-medium, color: neutral-900 |
| 26 | Input "Data de nascimento" | Input/Date | (440, 1008) | (560, 48) | bg: surface-card, border: neutral-200, radius: radius-md |
| 27 | Section Title "Preferências" | Text/H3 | (440, 1072) | (560, 28) | font: text-lg, font-display, color: neutral-900 |
| 28 | Toggle Row "Perfil público" | Row/Toggle | (440, 1116) | (560, 48) | justify-between |
| 29 | Toggle Label | Text/Body | (440, 1124) | (400, 20) | font: text-base, color: neutral-900 |
| 30 | Toggle | Switch | (960, 1124) | (44, 24) | track: neutral-300/off, primary-500/on |
| 31 | Toggle Helper | Text/Caption | (440, 1168) | (560, 16) | font: text-xs, color: neutral-500 |
| 32 | Bottom Spacer | Box | (440, 1200) | (560, 64) | ensures scroll padding |

### Components Used

| Component | Variants | Count |
|-----------|----------|-------|
| Header | compact edit | 1 |
| Avatar | xl (80px implementation) / 2xl (128px display) | 1 |
| Button | icon, text | 2 |
| Input | text, email, tel, date | 5 |
| Textarea | standard | 1 |
| Toggle | switch | 1 |
| Icon | Lucide — ArrowLeft, Camera, CheckCircle, User | — |

### Token Values

**Avatar Section:**
- Avatar size: 120px (display scale, `2xl`)
- Avatar radius: `radius-full` (999px)
- Avatar border: 4px solid `surface-page` (if on colored bg)
- Camera overlay: 40px circle, `surface-card` at 80% opacity, `shadow-sm`
- Camera icon: 20px, `neutral-700`
- "Alterar foto" link: `text-sm`, `primary-600`, underline on hover

**Form Fields:**
- Label: `text-sm`, `font-medium`, `neutral-900`, margin-bottom 4px
- Input height: 44px
- Input padding: `px-4 py-2.5`
- Input background: `surface-card` (#ffffff)
- Input border: 1px solid `neutral-200`
- Input radius: `radius-md` (8px)
- Input focus: border `primary-500`, ring 2px `primary-500` offset 2px
- Gap between label+input pairs: 20px (space-5)
- Gap between sections: 32px (space-8)

**Textarea:**
- Min-height: 120px
- Max-height: 240px
- Resize: vertical
- Same border/focus as input

**Toggle:**
- Track width: 44px, height: 24px
- Track radius: `radius-full`
- Track off: `neutral-300`
- Track on: `primary-500`
- Thumb: 20px circle, white, 2px offset
- Thumb shadow: `shadow-sm`

**Save Button States:**
- Default (disabled): `neutral-400`, `cursor-not-allowed`
- Active (dirty): `primary-600`, hover `primary-700`
- Loading: spinner replaces text, disabled

### States

**Initial Load:**
- All fields pre-filled with current user data
- Save button disabled (form not dirty)
- Avatar shows current photo or fallback initials

**Avatar Upload Hover:**
- Avatar opacity: 80%
- Camera overlay fades in (opacity 0 → 1, 150ms)
- Cursor: pointer

**Avatar Uploading:**
- Avatar shows skeleton/loading spinner
- "Alterar foto" hidden

**Form Dirty:**
- Save button enabled (color changes from `neutral-400` to `primary-600`)
- Browser native beforeunload warning if navigating away

**Field Validation (blur):**
- Error border: `error` (#ef4444)
- Error text: `text-sm`, `error`, below input, 4px gap
- Error icon: AlertCircle, 16px, inline with error text
- Valid field: Check icon, 16px, `primary-500`, right inside input

**Submitting:**
- All fields disabled
- Save button shows spinner, disabled
- Header back button disabled

**Success:**
- Toast: "Perfil atualizado com sucesso" — success variant
- Save button returns to disabled (form now clean)

**Error:**
- Toast: "Não foi possível salvar. Tente novamente." — error variant
- Fields re-enabled
- First invalid field receives focus

**Unsaved Changes Dialog:**
- Triggered when navigating away with dirty form
- ConfirmationDialog pattern
- Title: "Descartar alterações?"
- Description: "Você tem alterações não salvas."
- Actions: "Continuar editando" (primary) + "Descartar" (ghost)

### Accessibility Notes

- **Form:** Wrap in `<form>` with `aria-label="Editar perfil"`
- **Labels:** All inputs have visible `<label>` with `htmlFor`
- **Required fields:** Mark with `*` and `aria-required="true"`
- **Avatar upload:** `role="button"`, `tabindex="0"`, `aria-label="Alterar foto de perfil"`
- **Hidden file input:** `<input type="file" accept="image/*" hidden>` triggered by avatar click
- **Character counter:** `aria-live="polite"`, announces when near limit
- **Toggle:** Native `<input type="checkbox">` with `role="switch"`, `aria-checked`
- **Save button:** `aria-disabled` when disabled, not just `disabled` attribute (keeps focusable)
- **Focus management:** On validation error, focus moves to first invalid field
- **Error summary:** Optionally show at top of form for screen readers

---

## PE-02: Professional Edit Profile (`/editar-perfil-profissional`)

### Overview
Professional edits their public-facing profile with rich content: credentials, specialties, gallery, and verification status. Uses a tabbed layout to organize dense information. Live preview panel shows how the profile appears to clients.

### Dimensions

| Breakpoint | Width | Height | Notes |
|------------|-------|--------|-------|
| Desktop | 1440px | 900px (min) | 2-column: form + preview |
| Tablet | 768px | 1024px | Tabs + form only, preview as modal toggle |
| Mobile | 375px | 812px | Tabs scroll horizontal, stacked sections |

### Layout Structure

**Desktop (2-column):**
- Header: full width, sticky
- Left column: form content, max-width 640px, scrollable
- Right column: live preview panel, 688px fixed, sticky top below header
- Preview panel: `surface-card` bg, `neutral-200` left border, `shadow-md`
- Column gap: 32px
- Content padding: 32px from edges

**Tablet:**
- Edit/Preview toggle button in header
- Preview opens as modal overlay (centered, 560px wide)

**Mobile:**
- Horizontal scrollable tabs
- Each tab section stacks vertically
- Preview opens as full-screen modal

### Layers (desktop)

| # | Layer Name | Component | Position (x, y) | Size (w, h) | Tokens |
|---|------------|-----------|-----------------|-------------|--------|
| 1 | Header | Shell/CompactHeader | (0, 0) | (1440, 64) | bg: surface-page, border-bottom: neutral-200 |
| 2 | Back Button | Button/Icon | (32, 12) | (40, 40) | icon: ArrowLeft, color: neutral-500 |
| 3 | Page Title | Text/H1 | (80, 16) | (400, 32) | font: text-lg, font-display, color: neutral-900 |
| 4 | "Ver preview" Button | Button/Secondary | (1200, 12) | (120, 40) | border: neutral-200, radius: radius-md |
| 5 | Save Button | Button/Primary | (1336, 12) | (100, 40) | bg: primary-500, text: white, radius: radius-md |
| 6 | Tab Bar | Nav/Tabs | (32, 80) | (640, 48) | border-bottom: neutral-200 |
| 7 | Tab "Informações" | Nav/Tab Active | (32, 80) | (160, 48) | text: neutral-900, border-bottom: 2px primary-500 |
| 8 | Tab "Credenciais" | Nav/Tab | (192, 80) | (160, 48) | text: neutral-500 |
| 9 | Tab "Especialidades" | Nav/Tab | (352, 80) | (160, 48) | text: neutral-500 |
| 10 | Tab "Galeria" | Nav/Tab | (512, 80) | (160, 48) | text: neutral-500 |
| 11 | Verification Banner | Banner/Status | (32, 144) | (640, 72) | bg: primary-50, border-left: 4px primary-500, radius: radius-md |
| 12 | Verification Icon | Icon | (56, 168) | (24, 24) | color: primary-500 |
| 13 | Verification Text | Text/Body | (88, 160) | (500, 20) | font: text-base, color: neutral-900 |
| 14 | Verification Badge | Badge | (600, 160) | (100, 24) | variant: success or warning |
| 15 | Section Card "Informações básicas" | Card/Form | (32, 232) | (640, 520) | bg: surface-card, border: neutral-200, radius: radius-lg |
| 16 | Section Title | Text/H2 | (48, 248) | (608, 28) | font: text-xl, font-display, color: neutral-900 |
| 17 | Avatar Row | Row | (48, 292) | (608, 128) | align: center, gap: space-4 |
| 18 | Avatar | Avatar/2xl | (48, 292) | (128, 128) | radius: radius-full |
| 19 | Avatar Actions | Box | (192, 332) | (200, 48) | flex-col, gap: space-2 |
| 20 | "Alterar foto" Link | Text/Link | (192, 332) | (200, 20) | font: text-sm, color: primary-600 |
| 21 | "Remover" Link | Text/Link | (192, 356) | (200, 20) | font: text-sm, color: error |
| 22 | Label "Nome" | Text/Label | (48, 444) | (608, 20) | font: text-sm, font-medium, color: neutral-900 |
| 23 | Input "Nome" | Input/Text | (48, 472) | (608, 48) | bg: surface-card, border: neutral-200, radius: radius-md |
| 24 | Label "Título profissional" | Text/Label | (48, 536) | (608, 20) | font: text-sm, font-medium, color: neutral-900 |
| 25 | Input "Título" | Input/Text | (48, 564) | (608, 48) | bg: surface-card, border: neutral-200, radius: radius-md |
| 26 | Helper Text | Text/Caption | (48, 620) | (608, 16) | font: text-xs, color: neutral-500 |
| 27 | Label "Bio profissional" | Text/Label | (48, 652) | (608, 20) | font: text-sm, font-medium, color: neutral-900 |
| 28 | Textarea "Bio" | Input/Textarea | (48, 680) | (608, 160) | bg: surface-card, border: neutral-200, radius: radius-md |
| 29 | Char Counter | Text/Caption | (536, 848) | (120, 16) | font: text-xs, color: neutral-500 |
| 30 | Section Card "Credenciais" | Card/Form | (32, 768) | (640, 400) | bg: surface-card, border: neutral-200, radius: radius-lg |
| 31 | Section Title | Text/H2 | (48, 784) | (608, 28) | font: text-xl, font-display, color: neutral-900 |
| 32 | Credential Item | Row/Card | (48, 828) | (576, 72) | bg: neutral-50, border: neutral-200, radius: radius-md |
| 33 | Credential Icon | Icon | (64, 844) | (24, 24) | color: primary-500 |
| 34 | Credential Text | Text/Body | (96, 840) | (400, 20) | font: text-base, color: neutral-900 |
| 35 | Credential Meta | Text/Body | (96, 864) | (400, 16) | font: text-sm, color: neutral-500 |
| 36 | Credential Menu | Button/Icon | (576, 848) | (32, 32) | icon: MoreVertical, color: neutral-500 |
| 37 | "Adicionar credencial" Button | Button/Secondary | (48, 916) | (608, 40) | border: neutral-200, radius: radius-md |
| 38 | Section Card "Especialidades" | Card/Form | (32, 1184) | (640, 280) | bg: surface-card, border: neutral-200, radius: radius-lg |
| 39 | Section Title | Text/H2 | (48, 1200) | (608, 28) | font: text-xl, font-display, color: neutral-900 |
| 40 | Specialty Tags | Tag/Input | (48, 1244) | (608, 40) | flex-wrap, gap: space-2 |
| 41 | Specialty Chip | Tag/Removable | varies | varies | bg: primary-50, border: primary-200, text: primary-700, radius: radius-md |
| 42 | Remove Chip Icon | Icon | varies | (16, 16) | color: primary-500 |
| 43 | Specialty Input | Input/Text | (48, 1296) | (608, 48) | placeholder: "Adicionar especialidade..." |
| 44 | Suggestions List | List/Dropdown | (48, 1348) | (608, 160) | bg: surface-elevated, shadow: shadow-md, radius: radius-md |
| 45 | Section Card "Galeria" | Card/Form | (32, 1480) | (640, 400) | bg: surface-card, border: neutral-200, radius: radius-lg |
| 46 | Section Title | Text/H2 | (48, 1496) | (608, 28) | font: text-xl, font-display, color: neutral-900 |
| 47 | Gallery Grid | Grid/Images | (48, 1540) | (608, 240) | 3 columns, gap: space-3 |
| 48 | Gallery Image | Image/Thumbnail | varies | (192, 128) | radius: radius-md, object-fit: cover |
| 49 | Image Overlay | Box | varies | (192, 128) | bg: neutral-900/50, opacity-0 hover:opacity-100 |
| 50 | Delete Image Button | Button/Icon | varies | (32, 32) | bg: error, icon: Trash2, color: white, radius: radius-md |
| 51 | "Adicionar imagem" Button | Button/Secondary | (48, 1796) | (608, 40) | border: neutral-200, radius: radius-md |
| 52 | Tier Status Card | Card/Status | (32, 1856) | (640, 120) | bg: surface-card, border: neutral-200, radius: radius-lg |
| 53 | Tier Badge | Badge | (48, 1872) | (100, 24) | variant: pro or default |
| 54 | Tier Label | Text/Body | (48, 1904) | (608, 20) | font: text-base, color: neutral-900 |
| 55 | Profile Completion Bar | Progress/Bar | (48, 1936) | (608, 8) | fill: primary-500, track: neutral-200, radius: radius-full |
| 56 | Completion Text | Text/Caption | (536, 1952) | (120, 16) | font: text-xs, color: neutral-500 |
| 57 | Preview Panel | Panel/Preview | (704, 80) | (688, 820) | bg: surface-card, border-left: neutral-200, shadow: shadow-md |
| 58 | Preview Header | Box | (704, 80) | (688, 48) | border-bottom: neutral-200, padding: space-4 |
| 59 | Preview Title | Text/Label | (720, 92) | (200, 20) | font: text-sm, color: neutral-500 |
| 60 | Preview Content | ScrollArea | (704, 128) | (688, 772) | overflow-y: auto |

### Preview Panel Content

The preview panel renders the professional's public profile as clients see it:

1. **Cover Photo** — 688×200px, `object-cover`, `radius-lg` bottom corners
2. **Avatar** — 96px, overlaps cover by 32px, `radius-full`, 4px `surface-card` border
3. **Name** — `text-2xl`, `font-display`
4. **Title** — `text-base`, `neutral-500`
5. **Verification Badge** — CheckCircle + "Perfil verificado"
6. **Bio** — `text-base`, `neutral-700`, max 4 lines
7. **Stats Row** — Rating (Star icon) + Review count + Experience
8. **Services Preview** — First 3 services as compact cards
9. **CTA** — "Agendar consulta" primary button (full width, sticky bottom)

### Components Used

| Component | Variants | Count |
|-----------|----------|-------|
| Header | compact edit with preview toggle | 1 |
| Tabs | underline style, 4 tabs | 1 |
| Card | form section (5x), status (1x) | 6 |
| Button | primary, secondary, icon, ghost | 8+ |
| Input | text, textarea | 4+ |
| Avatar | 2xl (128px) | 1 |
| Badge | success, warning, pro, default | 2+ |
| Tag | removable chip | N variable |
| ProgressBar | completion | 1 |
| Panel | preview slide | 1 |
| Icon | Lucide — ArrowLeft, Camera, CheckCircle, Award, MoreVertical, Plus, X, Trash2, Eye, Star, Clock | — |

### Token Values

**Tab Bar:**
- Border-bottom: 2px solid `neutral-200`
- Active tab: `neutral-900` text, 2px `primary-500` bottom border
- Inactive tab: `neutral-500` text, no border
- Tab padding: `px-4 py-3`
- Tab font: `text-base`, `font-medium`
- Gap between tabs: 0 (border separation)

**Section Cards:**
- Background: `surface-card` (#ffffff)
- Border: 1px solid `neutral-200`
- Radius: `radius-lg` (12px)
- Shadow: `shadow-none`
- Padding: `p-4` (16px)
- Gap between cards: 24px (space-6)

**Verification Banner:**
- Background: `primary-50` (#f0fdf4)
- Left border: 4px solid `primary-500`
- Radius: `radius-md` (8px)
- Padding: `px-5 py-4`

**Credential Item:**
- Background: `neutral-100` (#f5f5f4)
- Border: 1px solid `neutral-200`
- Radius: `radius-md` (8px)
- Padding: `px-4 py-3`
- Icon: 24px, `primary-500`

**Specialty Chip:**
- Background: `primary-50` (#f0fdf4)
- Border: 1px solid `primary-200` (#bbf7d0)
- Text: `primary-700` (#15803d)
- Radius: `radius-md` (8px)
- Padding: `px-2.5 py-1`
- Font: `text-sm`, `font-medium`
- Remove icon: 16px, `primary-500`, hover `error`

**Gallery Grid:**
- Columns: 3 (desktop), 2 (tablet), 1 (mobile)
- Gap: 12px (space-3)
- Image radius: `radius-md` (8px)
- Image aspect ratio: 3:2
- Overlay: `bg-neutral-900/50`, opacity 0 → 100 on hover, 150ms

**Preview Panel:**
- Background: `surface-card` (#ffffff)
- Border-left: 1px solid `neutral-200`
- Shadow: `shadow-md` (floating element)
- Sticky: top 64px (below header)
- Max-height: `calc(100vh - 64px)`
- Overflow-y: auto

### States

**Tab Switching:**
- Active tab: underline slides to selected tab, 250ms ease
- Content area: fade out/in, 150ms
- URL updates: `?tab=credenciais`

**Verification Banner States:**

| Status | Banner BG | Border | Badge | Icon |
|--------|-----------|--------|-------|------|
| Verificado | primary-50 | primary-500 | success | CheckCircle |
| Em análise | warning-bg | warning | warning | Clock |
| Não verificado | neutral-100 | neutral-300 | default | AlertCircle |
| Rejeitado | error-bg | error | error | XCircle |

**Avatar Upload:**
- Hover: opacity 80%, overlay appears
- Uploading: skeleton pulse over avatar
- Error: Toast "Formato não suportado. Use JPG ou PNG."
- Success: avatar updates immediately

**Credential Add/Edit:**
- Opens inline form within card
- Fields: Título, Instituição, Ano, Documento (file upload)
- Save/cancel buttons inline
- File upload: drag-drop zone, `neutral-100` bg, dashed border `neutral-300`, radius-md

**Gallery Upload:**
- Click "Adicionar imagem" opens file picker
- Max 6 images (Essencial), 12 images (Pro)
- Upload progress: inline progress bar per image
- Error: "Limite de imagens atingido" or format error

**Profile Completion:**
- Bar fill percentage based on filled fields
- 0-30%: `error`
- 31-70%: `warning`
- 71-99%: `primary-500`
- 100%: `primary-500` + CheckCircle icon

**Preview Panel — Refresh:**
- Updates in real-time as form fields change
- 300ms debounce on text inputs
- Immediate on toggles/selects

### Accessibility Notes

- **Tabs:** `role="tablist"`, tabs have `role="tab"`, panels have `role="tabpanel"`
- **Tab keyboard:** ArrowLeft/Right switches tabs, Home/End to first/last
- **Avatar upload:** `role="button"`, `tabindex="0"`, `aria-label="Alterar foto de perfil"`
- **Credential items:** `role="listitem"`, menu button `aria-label="Opções de [credential title]"`
- **Specialty chips:** Each chip has `aria-label="Remover [specialty]"` on remove button
- **Gallery images:** `alt` text auto-generated or editable; delete button `aria-label="Excluir imagem"`
- **Preview panel:** `aria-label="Pré-visualização do perfil"`, updates announced via `aria-live="polite"`
- **Verification banner:** `role="status"` so screen readers announce changes
- **Focus management:** When opening credential edit form, focus moves to first field
- **File inputs:** Hidden but accessible — triggered by visible button with `aria-controls`

---

*Profile Edit frames complete. For shared components, see `components.md`. For tokens, see `tokens.md`.*


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.

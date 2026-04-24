# User Onboarding Journey — Frame Specs

> **Journey:** New user registration and profile setup  
> **Priority:** P2  
> **Route Prefix:** `/cadastro`  
> **Total Frames:** 3  
> **Date:** 2026-04-19

---

## Frame UO-01: Signup (`/cadastro`)

### Overview
First-touch registration screen for new clients. Centered card layout on a clean page background with minimal chrome. No sidebar — this is a public, unauthenticated flow.

### Dimensions
| Viewport | Width | Height | Margins |
|----------|-------|--------|---------|
| Desktop | 1440px | 900px | 32px (space-8) |
| Mobile | 375px | 812px | 16px (space-4) |

### Layout Structure
```
Page (surface-page, 100vh, flex column center)
├── Header (64px, sticky, surface-header, border-bottom)
│   ├── Logo (left, 32px from edge)
│   └── "Entrar" Link (right, ghost button)
└── Main (flex-1, centered vertically and horizontally)
    └── Card (max-width 480px, centered)
        ├── Title Block
        │   ├── H1: "Criar Conta"
        │   └── Subtitle: "Comece sua jornada de bem-estar"
        ├── Form Block (gap: space-5 / 20px)
        │   ├── Input: Email
        │   ├── Input: Senha
        │   ├── Input: Confirmar Senha
        │   └── Checkbox Row: Terms
        ├── Action Block (gap: space-4)
        │   ├── Button: "Criar Conta" (primary, full-width)
        │   └── Text Row: "Já tem conta? Entrar"
        └── Divider + Social (optional, hidden)
```

### Components Used
| Component | Variant | Count | Notes |
|-----------|---------|-------|-------|
| Header | minimal | 1 | Logo only + right link, no nav |
| Card | default | 1 | `radius-lg`, `p-8`, max-width 480px |
| Input | email, password | 3 | md size, full-width inside card |
| Checkbox | md | 1 | Terms acceptance |
| Button | primary, lg | 1 | Full-width CTA |
| Button | ghost, sm | 1 | "Entrar" link in header |
| Text | H1, body, link | — | Title, subtitle, terms text |

### Token Values
| Element | Token | Value |
|---------|-------|-------|
| Page background | `surface-page` | `#f4f8f5` |
| Card background | `surface-card` | `#ffffff` |
| Card border | `border-default` | `1px solid #e7e5e4` |
| Card radius | `radius-lg` | `12px` |
| Card shadow | `shadow-none` | `none` |
| Card padding | `space-8` | `32px` |
| Title font | `text-3xl` / `font-display` / `font-bold` | `39px` Space Grotesk |
| Title color | `text-primary` | `#1c1917` |
| Subtitle font | `text-base` / `font-body` | `16px` Inter |
| Subtitle color | `text-secondary` | `#57534e` |
| Input gap | `space-5` | `20px` |
| CTA height | `px-6 py-3` | `48px` |
| CTA radius | `radius-md` | `8px` |
| Link color | `text-link` | `#16a34a` |

### States
| State | Trigger | Visual |
|-------|---------|--------|
| Default | Initial load | All inputs empty, CTA disabled |
| Typing | User input in any field | Real-time validation on blur |
| Valid | All fields pass validation | CTA enabled (`opacity-100`) |
| Invalid | Field fails validation | Input border turns `error`, error text below |
| Loading | Form submitted | CTA shows spinner, `aria-busy="true"` |
| Success | Account created | Redirect to UO-02 |
| Error | API error | Toast with error message, CTA returns to default |

### Accessibility Notes
- **Focus order**: Header link → Email → Password → Confirm Password → Checkbox → CTA → Login link
- **Focus ring**: `2px solid primary-500`, offset `2px`
- **Password fields**: Toggle visibility button with `aria-label="Mostrar senha"`
- **Checkbox**: Native `<input type="checkbox">` with custom styling, linked to label
- **Terms link**: Opens in new tab, `aria-label` indicates external link
- **Error messages**: Linked via `aria-describedby` to respective inputs
- **Color contrast**: `text-link` (`#16a34a`) on white = 4.6:1 ✅ WCAG AA
- **Reduced motion**: Disable entrance animations when `prefers-reduced-motion: reduce`

---

## Frame UO-02: Profile Basics (`/cadastro/perfil`)

### Overview
Second step of user onboarding. Collects essential profile information. Features a horizontal stepper to indicate progress and an avatar upload area for personalisation.

### Dimensions
| Viewport | Width | Height | Margins |
|----------|-------|--------|---------|
| Desktop | 1440px | 900px | 32px |
| Mobile | 375px | 812px | 16px |

### Layout Structure
```
Page (surface-page, 100vh)
├── Header (64px, minimal)
└── Main (max-width 640px, centered, py-12)
    ├── Stepper (horizontal, 3 steps)
    │   ├── Step 1: "Conta" (completed)
    │   ├── Step 2: "Perfil" (active)
    │   └── Step 3: "Pronto" (pending)
    ├── Title Block (mt-8)
    │   ├── H1: "Complete seu Perfil"
    │   └── Subtitle: "Conte-nos um pouco sobre você"
    ├── Avatar Upload (centered, mt-8)
    │   ├── Avatar (2xl, 128px, circle)
    │   ├── Camera Icon Overlay (bottom-right)
    │   └── Helper Text: "Adicionar foto"
    └── Form Card (mt-8, p-6)
        ├── Input: Nome completo
        ├── Input: Telefone
        ├── Textarea: Bio (opcional, max 300 chars)
        └── Button: "Continuar" (primary, full-width)
```

### Components Used
| Component | Variant | Count | Notes |
|-----------|---------|-------|-------|
| Header | minimal | 1 | Logo only |
| Stepper | horizontal | 1 | 3 steps, step 2 active |
| Avatar | 2xl, circle | 1 | 128px, upload overlay |
| Icon | Camera | 1 | 24px, on avatar overlay |
| Input | text, tel | 2 | md size |
| Textarea | default | 1 | md size, min-height 100px |
| Button | primary, lg | 1 | Full-width |
| Card | default | 1 | Wraps form, `radius-lg`, `p-6` |
| Text | H1, body, caption | — | Hierarchy |

### Token Values
| Element | Token | Value |
|---------|-------|-------|
| Stepper active border | `primary-500` | `#22c55e` |
| Stepper completed bg | `primary-500` | `#22c55e` |
| Stepper pending bg | `neutral-200` | `#e7e5e4` |
| Avatar size | `2xl` | `128px` |
| Avatar radius | `radius-full` | `999px` |
| Avatar fallback bg | `neutral-200` | `#e7e5e4` |
| Camera overlay bg | `surface-overlay` | `rgba(28,25,23,0.5)` |
| Camera icon color | `white` | `#ffffff` |
| Content max-width | — | `640px` |
| Section gap | `space-8` | `32px` |
| Char counter font | `text-xs` / `text-muted` | `10px` `#78716c` |

### States
| State | Trigger | Visual |
|-------|---------|--------|
| Default | Initial load | Empty form, CTA enabled (fields optional except name) |
| Upload hover | Hover on avatar | Overlay opacity increases, cursor pointer |
| Upload loading | File selected | Avatar shows skeleton pulse while uploading |
| Upload success | Upload complete | Avatar displays uploaded image |
| Upload error | Upload fails | Toast error, avatar returns to fallback |
| Typing | Bio input | Char counter updates ("0/300") |
| Valid | Name filled | CTA ready |
| Loading | Form submitted | CTA spinner, inputs disabled |
| Success | Profile saved | Redirect to UO-03 |

### Accessibility Notes
- **Stepper**: `role="list"`, each step `role="listitem"`, active step has `aria-current="step"`
- **Avatar upload**: Hidden `<input type="file" accept="image/*">`, triggered by button with `aria-label="Upload foto de perfil"`
- **Bio textarea**: `aria-describedby` linked to char counter
- **Focus order**: Stepper (non-interactive) → Avatar upload → Name → Phone → Bio → CTA
- **Phone input**: Use `tel` type with `inputmode="tel"` for mobile keyboards
- **Reduced motion**: Stepper transitions disabled

---

## Frame UO-03: Onboarding Complete (`/cadastro/concluido`)

### Overview
Final step celebrating successful onboarding. EmptyState pattern with feature cards highlighting platform value. Designed to drive users toward their first action — exploring professionals.

### Dimensions
| Viewport | Width | Height | Margins |
|----------|-------|--------|---------|
| Desktop | 1440px | 900px | 32px |
| Mobile | 375px | 812px | 16px |

### Layout Structure
```
Page (surface-page, 100vh, flex column)
├── Header (64px, minimal)
└── Main (flex-1, centered, max-width 720px)
    ├── EmptyState (centered, py-12)
    │   ├── Icon Circle (64px, primary-500 bg, white check)
    │   ├── H1: "Bem-vindo à Muuday!"
    │   └── Body: "Sua conta está pronta."
    ├── Feature Cards Row (mt-10, 3-col desktop, 1-col mobile)
    │   ├── Card 1: "Busque Profissionais" (Search icon)
    │   ├── Card 2: "Agende com Facilidade" (Calendar icon)
    │   └── Card 3: "Sessões Online" (Video icon)
    └── Action Block (mt-10, centered)
        ├── Button: "Explorar Profissionais" (primary, lg)
        └── Link: "Ir para o Dashboard" (ghost)
```

### Components Used
| Component | Variant | Count | Notes |
|-----------|---------|-------|-------|
| Header | minimal | 1 | Logo only |
| EmptyState | notification | 1 | Success variant |
| Icon | Check, Search, Calendar, Video | 4 | 64px for hero, 32px for cards |
| Card | default | 3 | Feature cards, `radius-lg`, `p-6` |
| Button | primary, lg | 1 | Main CTA |
| Button | ghost, md | 1 | Secondary link |
| Text | H1, body | — | Typography hierarchy |

### Token Values
| Element | Token | Value |
|---------|-------|-------|
| Success icon bg | `primary-500` | `#22c55e` |
| Success icon color | `white` | `#ffffff` |
| Success icon size | — | `64px` |
| Success icon radius | `radius-full` | `999px` |
| Feature card bg | `surface-card` | `#ffffff` |
| Feature card border | `border-default` | `1px solid #e7e5e4` |
| Feature card radius | `radius-lg` | `12px` |
| Feature card shadow | `shadow-none` | `none` |
| Feature card padding | `space-6` | `24px` |
| Feature icon color | `primary-500` | `#22c55e` |
| Feature title font | `text-lg` / `font-semibold` | `20px` |
| Feature desc font | `text-sm` / `text-secondary` | `13px` `#57534e` |
| Cards gap | `space-6` | `24px` |
| Content max-width | — | `720px` |
| CTA width | — | `280px` (desktop), full-width (mobile) |

### States
| State | Trigger | Visual |
|-------|---------|--------|
| Default | Page load | Icon scales in with subtle animation |
| Card hover | Hover on feature card | Border transitions to `neutral-300`, `duration-fast` |
| CTA hover | Hover on primary CTA | Background shifts to `primary-600` |
| Loading | CTA clicked | Button shows spinner, redirect in progress |

### Accessibility Notes
- **Success announcement**: `aria-live="polite"` region announces "Bem-vindo à Muuday" on load
- **Feature cards**: Entire card is clickable, `role="link"`, focusable with visible ring
- **Iconography**: Decorative icons have `aria-hidden="true"`; semantic meaning conveyed by text
- **CTA focus**: Primary button gets initial focus after 1s delay (post-animation)
- **Color contrast**: Success icon uses white on green (3:1 for large graphic — acceptable for decorative)
- **Reduced motion**: Success icon appears instantly without scale animation

---

*Frame specs for User Onboarding complete. Reference `tokens.md` and `components.md` for component-level details.*


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.

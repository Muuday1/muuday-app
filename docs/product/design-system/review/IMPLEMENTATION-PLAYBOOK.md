# Muuday Design System — Implementation Playbook

> **Version:** 1.0  
> **Last updated:** 2026-04-19  
> **Status:** Active  
> **Audience:** Designers, Frontend Engineers, Product Managers  
> **Source docs:** `tokens.md`, `components.md`, `principles.md`, `handoff.md`, 13 journey frame specs in `frames/`

---

## How to Use This Playbook

1. **Do not skip phases.** Each phase has explicit exit criteria. Do not begin Phase N+1 until Phase N exit criteria are signed off.
2. **Use the Decision Log.** Any deviation from this playbook must be recorded in the Decision Log (see Additional Sections).
3. **Track blockers daily.** If a dependency is missing, escalate via the Communication Plan channel within 4 hours.
4. **Preserve exact values.** All hex codes, rem values, and easing curves listed here are derived directly from `tokens.md`. Do not round, approximate, or reinterpret.

---

## Phase 0: Preparation (Before Any Design Work)

### Step 0.1: Environment Setup

**Figma Account & Team**
- Create a dedicated Figma team named `Muuday Design System`.
- Invite all stakeholders with correct permissions:
  - Designers: `Can edit`
  - Engineers: `Can view` (upgrade to `Can edit` for handoff week if needed)
  - Product Managers: `Can view`
- Enable **Dev Mode** for the team.

**Required Figma Plugins (Install in this order)**

| Plugin | Purpose | Config |
|--------|---------|--------|
| Tokens Studio (Figma Tokens) | Sync tokens from JSON to Figma Variables | Connect to GitHub repo `muuday-app` branch `design-tokens` |
| Autoflow | Prototype connection arrows | Default: `#78716c` lines, 1px stroke |
| Unsplash | Placeholder imagery | Not for production assets |
| Iconify | Lucide icon search | Filter to `Lucide` set only |
| Stark | Contrast & accessibility checks | WCAG 2.1 AA target |
| Figma Wireframe | Grid overlay verification | 8px grid |

**Font Installation (Local Machines)**
- Install **Inter** (variable font, Google Fonts)
- Install **Space Grotesk** (Google Fonts)
- Install **JetBrains Mono** (Google Fonts)
- In Figma: `Settings > Assets > Fonts` — verify all three appear.

**Figma File Structure (Create Empty Shells)**

```
Muuday Design System
├── 01 — Foundations (Week 1)
├── 02 — Primitives (Week 2)
├── 03 — Composites (Week 2–3)
├── 04 — Layout (Week 3)
├── 05 — Patterns (Week 3)
├── 06 — Journeys (Week 4–8)
│   ├── 06a — User Onboarding
│   ├── 06b — Professional Onboarding
│   ├── 06c — Search & Booking
│   ├── 06d — Request Booking
│   ├── 06e — Recurring Booking
│   ├── 06f — Session Lifecycle
│   ├── 06g — Video Session
│   ├── 06h — Trust & Safety
│   ├── 06i — Admin Operations
│   ├── 06j — Payments & Billing
│   ├── 06k — Professional Workspace
│   ├── 06l — Profile Edit
│   └── 06m — Settings & Preferences
├── 07 — Prototyping (Week 9)
└── 99 — Archive
```

### Step 0.2: Asset Inventory

**Assets That Already Exist**

| Asset | Location | Status | Action |
|-------|----------|--------|--------|
| Lucide React icon set | `node_modules/lucide-react` | Exists | Verify all needed icons exist |
| Avatar fallback pattern | `components/ui/avatar.tsx` | Exists | Ensure `--radius-full` and `--color-surface-muted` bg |
| Header component | `components/layout/header.tsx` | Exists | Token swap only |
| Footer component | `components/layout/footer.tsx` | Exists | Token swap only |
| Agora SDK integration | `lib/video/agora.ts` | Exists | Reuse for video session frames |

**Assets That Must Be Created**

| Asset | Needed For | Priority | Owner |
|-------|-----------|----------|-------|
| Success illustration (onboarding) | User Onboarding Frame 3 | P1 | Designer + Illustrator |
| Pending illustration (approval wait) | Professional Onboarding Frame 3 | P1 | Designer + Illustrator |
| Empty state illustrations (set of 4) | All list views | P2 | Designer + Illustrator |
| Celebration icon (approved pro) | Professional Onboarding Frame 4 | P1 | Designer |
| Video session placeholder | Video Session Frame 1 | P2 | Designer |
| Pro badge icon | Search & Booking, Profile | P1 | Designer |

**Illustration Style Rules (Non-Negotiable)**
- Style: Flat, minimal, no gradients
- Colors: `--color-primary-500` accent, `--color-neutral-500` neutral elements, `--color-surface-muted` backgrounds
- Stroke: 1.5px rounded caps
- Padding: `--space-8` (32px) minimum around focal element
- Format: SVG preferred, PNG fallback at 2x

### Step 0.3: Team Roles & Responsibilities

| Role | Responsibilities | Deliverables |
|------|-----------------|--------------|
| **Lead Designer** | Token fidelity, component architecture, design review sign-off | Figma file ownership, quality gate approvals |
| **Design Engineer** | Token JSON maintenance, Figma Variables sync, design-dev translation | `design-tokens.json`, CSS variable mappings |
| **Frontend Lead** | Component implementation priority, code review, performance | React component library, Storybook |
| **Product Manager** | Journey prioritization, acceptance criteria, stakeholder communication | Signed-off exit criteria per phase |
| **QA Engineer** | Visual regression, accessibility audit, cross-browser testing | Test reports, bug tickets |
| **Content Designer** | Microcopy, error messages, empty states | Copy deck per journey |

**RACI Matrix for Phase Gates**

| Activity | Lead Designer | Design Eng | Frontend Lead | PM | QA |
|----------|:-------------:|:----------:|:-------------:|:--:|:--:|
| Token creation | R | A | C | I | I |
| Component design | A | C | C | I | I |
| Component code | I | C | A | I | C |
| Frame construction | A | C | C | I | I |
| Prototyping | A | C | I | C | I |
| Developer handoff | C | A | R | I | I |
| Code implementation | I | C | A | I | C |
| Launch QA | C | I | C | A | R |

*R = Responsible, A = Accountable, C = Consulted, I = Informed*

### Step 0.4: Kickoff Checklist

- [ ] All team members have Figma access and correct permissions
- [ ] All team members have fonts installed locally
- [ ] All plugins installed and tested
- [ ] `design-tokens.json` source file created in `design-tokens` branch
- [ ] Asset inventory reviewed and missing assets assigned to owners
- [ ] Team calendar blocked for weekly design reviews (see Communication Plan)
- [ ] First sprint planned with story points for Phase 1

---

## Phase 1: Figma Foundation (Week 1)

**Goal:** Translate every value in `tokens.md` into Figma Variables and Figma Styles. No components yet. No frames yet. Just the raw design language.

**Exit Criteria:**
- Every token in `tokens.md` exists as a Figma Variable or Style
- Zero hex codes or font names are hardcoded anywhere in Figma
- Stark audit passes with zero contrast failures on all text/surface combinations
- Design Engineer has exported `design-tokens.json` and it validates against schema

### Step 1.1: Color Variables

**Create Figma Variable Collections:**

| Collection | Mode | Variables |
|------------|------|-----------|
| `colors/primitive` | (no modes) | All hex values from tokens |
| `colors/semantic` | Light / Dark | Aliases to primitives |
| `colors/component` | Light / Dark | Aliases to semantic |

**Example: Create `colors/primitive` collection**

For each entry in `tokens.md` colors section:
1. In Figma, open `Local variables`
2. Click `Create collection` → name it `colors/primitive`
3. Add variable `primary/50` → value `#E6F2E6`
4. Add variable `primary/100` → value `#C2E0C2`
5. Continue through `primary/900` = `#001A00`
6. Repeat for `neutral/*`, `semantic/*`, `surface/*`, `text/*`, `border/*`

**Example: Create `colors/semantic` collection with modes**

1. Create collection `colors/semantic`
2. Add mode `Light` (default)
3. Add mode `Dark`
4. For each semantic token, create a variable that **aliases** to the primitive:
   - `action/primary/default` → `colors/primitive.primary/500` in Light mode
   - `action/primary/default` → `colors/primitive.primary/400` in Dark mode
5. Variables to create from `tokens.md`:
   - `action/primary/*` (default, hover, active, disabled, text)
   - `action/secondary/*`
   - `action/destructive/*`
   - `feedback/success/*`
   - `feedback/warning/*`
   - `feedback/error/*`
   - `feedback/info/*`
   - `surface/*` (default, elevated, overlay, inset, sunken, interactive, interactive-hover, interactive-active, muted)
   - `text/*` (default, muted, placeholder, inverse, primary, on-primary, on-destructive)
   - `border/*` (default, muted, interactive, focus, error, success)

**Naming Convention:**
- Use `/` as the delimiter (Figma will auto-create folders)
- All lowercase
- No spaces
- Example: `action/primary/default` not `Action Primary Default`

### Step 1.2: Typography Styles

**Create Figma Text Styles (in order):**

| Style Name | Font | Weight | Size | Line Height | Letter Spacing | Usage |
|-----------|------|--------|------|-------------|----------------|-------|
| `Display/01` | Space Grotesk | 600 | 64px (4rem) | 1.1 | -1px | Hero headlines |
| `Display/02` | Space Grotesk | 600 | 48px (3rem) | 1.15 | -0.5px | Section headers |
| `H1` | Inter | 700 | 40px (2.5rem) | 1.2 | -0.5px | Page titles |
| `H2` | Inter | 600 | 32px (2rem) | 1.25 | -0.25px | Section titles |
| `H3` | Inter | 600 | 24px (1.5rem) | 1.3 | 0 | Card titles |
| `H4` | Inter | 600 | 20px (1.25rem) | 1.4 | 0 | Subsection titles |
| `H5` | Inter | 600 | 16px (1rem) | 1.5 | 0.25px | Labels, captions |
| `Body/Large` | Inter | 400 | 18px (1.125rem) | 1.6 | 0 | Lead paragraphs |
| `Body/Regular` | Inter | 400 | 16px (1rem) | 1.6 | 0 | Default body text |
| `Body/Small` | Inter | 400 | 14px (0.875rem) | 1.5 | 0 | Captions, metadata |
| `Body/Tiny` | Inter | 400 | 12px (0.75rem) | 1.4 | 0.25px | Badges, timestamps |
| `Mono/Regular` | JetBrains Mono | 400 | 14px (0.875rem) | 1.5 | 0 | Code, IDs |
| `Mono/Small` | JetBrains Mono | 400 | 12px (0.75rem) | 1.4 | 0.25px | Inline code |
| `Button/Large` | Inter | 500 | 16px (1rem) | 1 | 0.5px | Primary CTAs |
| `Button/Regular` | Inter | 500 | 14px (0.875rem) | 1 | 0.5px | Secondary actions |
| `Button/Small` | Inter | 500 | 12px (0.75rem) | 1 | 0.5px | Tertiary, icon buttons |
| `Label` | Inter | 500 | 12px (0.75rem) | 1.2 | 0.5px | Form labels |
| `Caption` | Inter | 400 | 12px (0.75rem) | 1.4 | 0.25px | Helper text |
| `Overline` | Space Grotesk | 600 | 12px (0.75rem) | 1 | 2px | Section labels |

**How to create in Figma:**
1. Create a text layer
2. Set font, weight, size, line height, letter spacing exactly as above
3. Right-click → `Create text style` → name it exactly as listed
4. Repeat for all 19 styles

### Step 1.3: Spacing & Dimension Variables

**Create collection `spacing`:**

| Variable Name | Value | Pixel Equivalent |
|--------------|-------|-----------------|
| `space/0` | 0 | 0px |
| `space/1` | 0.25rem | 4px |
| `space/2` | 0.5rem | 8px |
| `space/3` | 0.75rem | 12px |
| `space/4` | 1rem | 16px |
| `space/5` | 1.25rem | 20px |
| `space/6` | 1.5rem | 24px |
| `space/8` | 2rem | 32px |
| `space/10` | 2.5rem | 40px |
| `space/12` | 3rem | 48px |
| `space/16` | 4rem | 64px |
| `space/20` | 5rem | 80px |
| `space/24` | 6rem | 96px |
| `space/32` | 8rem | 128px |
| `space/40` | 10rem | 160px |
| `space/48` | 12rem | 192px |
| `space/64` | 16rem | 256px |

**Create collection `sizing`:**

| Variable Name | Value | Usage |
|--------------|-------|-------|
| `size/icon/sm` | 16px | Inline icons |
| `size/icon/md` | 20px | Form field icons |
| `size/icon/lg` | 24px | Button icons, standalone |
| `size/icon/xl` | 32px | Feature icons |
| `size/avatar/sm` | 32px | Comment avatars |
| `size/avatar/md` | 40px | List item avatars |
| `size/avatar/lg` | 64px | Profile page avatar |
| `size/avatar/xl` | 96px | Hero/profile edit |
| `size/button/height` | 40px | Standard button |
| `size/button/height-lg` | 48px | CTA buttons |
| `size/input/height` | 40px | Text inputs |
| `size/max-content` | 1200px | Max content width |
| `size/sidebar` | 280px | Sidebar width |
| `size/header` | 64px | Header height |

### Step 1.4: Border Radius Variables

**Create collection `border/radius`:**

| Variable Name | Value | Usage |
|--------------|-------|-------|
| `radius/none` | 0px | Tables, data grids |
| `radius/sm` | 4px | Tags, small badges |
| `radius/md` | 8px | Inputs, small cards |
| `radius/lg` | 12px | Cards, modals |
| `radius/xl` | 16px | Large cards, sections |
| `radius/2xl` | 24px | Hero sections, feature blocks |
| `radius/full` | 9999px | Avatars, pills, chips |

### Step 1.5: Shadow Styles

**Create Figma Effect Styles:**

| Style Name | X | Y | Blur | Spread | Color | Usage |
|-----------|---|---|------|--------|-------|-------|
| `Shadow/SM` | 0 | 1px | 2px | 0 | rgba(0,0,0,0.05) | Subtle elevation |
| `Shadow/MD` | 0 | 4px | 6px | -1px | rgba(0,0,0,0.1) | Cards, dropdowns |
| `Shadow/LG` | 0 | 10px | 15px | -3px | rgba(0,0,0,0.1) | Modals, drawers |
| `Shadow/XL` | 0 | 20px | 25px | -5px | rgba(0,0,0,0.1) | Overlays, toasts |
| `Shadow/Inner` | 0 | 2px | 4px | 0 | rgba(0,0,0,0.05) | Inset inputs |
| `Shadow/Focus` | 0 | 0 | 0 | 2px | rgba(26,128,26,0.2) | Focus rings |

### Step 1.6: Grid & Breakpoint Styles

**Create Figma Grid Styles:**

| Style Name | Columns | Gutter | Margin | Usage |
|-----------|---------|--------|--------|-------|
| `Grid/Mobile` | 4 cols | 16px | 16px | < 640px |
| `Grid/Tablet` | 8 cols | 24px | 24px | 640–1024px |
| `Grid/Desktop` | 12 cols | 32px | 32px | > 1024px |
| `Grid/Wide` | 12 cols | 32px | 48px | > 1440px |

**Create collection `breakpoints`:**

| Variable | Value |
|----------|-------|
| `breakpoint/mobile` | 640px |
| `breakpoint/tablet` | 1024px |
| `breakpoint/desktop` | 1440px |

### Step 1.7: Animation Timing Variables

**Create collection `animation`:**

| Variable | Value | Usage |
|----------|-------|-------|
| `duration/fast` | 150ms | Hover states |
| `duration/normal` | 250ms | Transitions |
| `duration/slow` | 350ms | Page transitions |
| `duration/slower` | 500ms | Complex animations |
| `easing/ease` | ease | Standard transitions |
| `easing/ease-out` | ease-out | Entering elements |
| `easing/ease-in` | ease-in | Exiting elements |
| `easing/spring` | cubic-bezier(0.34,1.56,0.64,1) | Bouncy interactions |

### Step 1.8: Weekly Design Review Gate

**Phase 1 Exit Checklist (Lead Designer signs off):**

- [ ] All color primitives match `tokens.md` exactly (sample check: 10 random tokens)
- [ ] All semantic aliases are correct in both Light and Dark modes
- [ ] All 19 text styles exist with correct font, weight, size, line height, letter spacing
- [ ] All spacing values match the 8pt grid system
- [ ] All shadow values match the spec
- [ ] Stark plugin reports zero contrast failures for text-on-surface combinations
- [ ] `design-tokens.json` exports successfully and passes schema validation
- [ ] No hardcoded colors, fonts, or sizes anywhere in the Figma file

---

## Phase 2: Component Library (Weeks 2–3)

**Goal:** Build every component from `components.md` as a Figma Component with Variants, Auto Layout, and proper constraints. No frames yet. Just the reusable building blocks.

**Exit Criteria:**
- All 35 components exist as Figma Components with proper Variants
- Every component uses only Figma Variables (no hardcoded values)
- Auto Layout is configured correctly for all resize scenarios
- Component descriptions include usage rules and accessibility notes
- Frontend Lead has reviewed all components for build feasibility

**File Organization:**
- `02 — Primitives`: Buttons, inputs, badges, avatars, icons
- `03 — Composites`: Cards, modals, drawers, toasts, tooltips, dropdowns, tabs, accordions, steppers, tables
- `04 — Layout`: Shell, header, footer, sidebar, grid, section
- `05 — Patterns`: Empty states, skeletons, error boundaries, confirmation dialogs, search bars, filter chips, pagination, breadcrumbs, progress bars

### Step 2.1: Primitives (Week 2, Days 1–3)

Build these 10 components first. They have zero dependencies on other components.

#### 2.1.1 Button

**Variants to create:**

| Variant Property | Values |
|-----------------|--------|
| `Type` | Primary, Secondary, Destructive, Ghost, Link |
| `Size` | Large (48px height), Regular (40px), Small (32px) |
| `State` | Default, Hover, Active, Disabled, Loading |
| `Icon` | None, Leading, Trailing, Icon Only |

**Structure:**
```
Button (Auto Layout: hug contents, horizontal)
├── Icon Leading (optional, 20px, Lucide)
├── Label (Text style: Button/Regular or Button/Large or Button/Small)
├── Icon Trailing (optional, 20px, Lucide)
└── Spinner (for Loading state, 16px, replaces icon)
```

**Variable bindings:**
- Background: `action/primary/default` (Type=Primary, State=Default)
- Text color: `action/primary/text`
- Border radius: `radius/md` (Regular), `radius/lg` (Large)
- Padding horizontal: `space-6` (Large), `space-5` (Regular), `space-4` (Small)
- Gap between elements: `space-2`

**Hover state:** Change background to `action/primary/hover`
**Active state:** Change background to `action/primary/active`
**Disabled state:** Opacity 50%, cursor not-allowed
**Loading state:** Show spinner, disable text, maintain dimensions

#### 2.1.2 Input

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Type` | Text, Password, Number, Email, Search |
| `Size` | Regular (40px), Large (48px) |
| `State` | Default, Hover, Focus, Error, Disabled, Filled |
| `Icon` | None, Leading, Trailing |
| `Helper` | None, Text |

**Structure:**
```
Input (Auto Layout: fill container, vertical)
├── Label (Text style: Label, optional)
├── Input Field (Auto Layout: fill container, horizontal)
│   ├── Icon Leading (optional, 20px)
│   ├── Text Placeholder (Text style: Body/Regular, color: text/placeholder)
│   └── Icon Trailing (optional, 20px, e.g. eye for password)
├── Helper Text (Text style: Caption, color: text/muted, optional)
└── Error Text (Text style: Caption, color: feedback/error/text, optional)
```

**Variable bindings:**
- Background: `surface/default`
- Border: `border/default` (Default), `border/focus` (Focus), `border/error` (Error)
- Border radius: `radius/md`
- Padding: `space-3` horizontal, `space-2` vertical
- Focus ring: `Shadow/Focus` effect style
- Error state: Border color → `border/error`, show error text

#### 2.1.3 Select

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Size` | Regular, Large |
| `State` | Default, Open, Disabled, Error |
| `Value` | Empty, Filled |

**Structure:**
```
Select (Auto Layout: fill container, horizontal)
├── Placeholder/Value (Text style: Body/Regular)
├── Chevron Down Icon (20px, rotates 180deg when Open)
└── Dropdown Panel (appears when Open, overlaps)
    └── Option List (vertical, max-height ~240px)
        └── Option Item (hover: surface/interactive-hover)
```

#### 2.1.4 Textarea

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Size` | Regular (min 80px height), Large (min 120px) |
| `State` | Default, Focus, Error, Disabled |
| `Resize` | Fixed, Auto-grow |

**Structure:** Similar to Input but multi-line. Resize handle indicator in bottom-right.

#### 2.1.5 Checkbox

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `State` | Unchecked, Checked, Indeterminate, Disabled |
| `Size` | Regular (20px), Large (24px) |
| `Label` | None, Right, Bottom |

**Structure:**
```
Checkbox (Auto Layout: hug contents, horizontal)
├── Box (square, border-radius: radius/sm)
│   └── Check Icon (appears when Checked, Lucide Check)
└── Label (Text style: Body/Regular, optional)
```

**Variable bindings:**
- Box border: `border/interactive` (Unchecked), `action/primary/default` (Checked)
- Box fill: `surface/default` (Unchecked), `action/primary/default` (Checked)
- Check icon color: `action/primary/text`
- Indeterminate: Horizontal line instead of check

#### 2.1.6 Radio

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `State` | Unchecked, Checked, Disabled |
| `Size` | Regular (20px), Large (24px) |
| `Label` | None, Right |

**Structure:**
```
Radio (Auto Layout: hug contents, horizontal)
├── Circle (border-radius: radius/full)
│   └── Inner Dot (appears when Checked, 50% size, centered)
└── Label (Text style: Body/Regular, optional)
```

**Variable bindings:**
- Circle border: `border/interactive` (Unchecked), `action/primary/default` (Checked)
- Inner dot fill: `action/primary/default`

#### 2.1.7 Toggle (Switch)

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `State` | Off, On, Disabled |
| `Size` | Regular (24px track), Large (32px track) |
| `Label` | None, Right |

**Structure:**
```
Toggle (Auto Layout: hug contents, horizontal)
├── Track (rounded full, width ~44px Regular)
│   └── Thumb (circle, slides left/right)
└── Label (Text style: Body/Regular, optional)
```

**Variable bindings:**
- Track background: `surface/muted` (Off), `action/primary/default` (On)
- Thumb fill: `surface/default`
- Thumb shadow: `Shadow/MD`

#### 2.1.8 Badge

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Type` | Default, Primary, Success, Warning, Error, Info |
| `Size` | Small (20px height), Regular (24px) |
| `Style` | Filled, Outline, Soft |
| `Icon` | None, Leading, Trailing |

**Structure:**
```
Badge (Auto Layout: hug contents, horizontal)
├── Icon (optional, 12px)
└── Label (Text style: Body/Tiny)
```

**Variable bindings:**
- Background: derived from Type (e.g. `feedback/success/surface` for Success + Soft)
- Text color: derived from Type (e.g. `feedback/success/text`)
- Border radius: `radius/full`

#### 2.1.9 Avatar

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Size` | Small (32px), Medium (40px), Large (64px), Extra Large (96px) |
| `Type` | Image, Initials, Placeholder |
| `Status` | None, Online, Offline, Busy, Away |
| `Shape` | Circle, Rounded |

**Structure:**
```
Avatar (frame, constraints: scale)
├── Image/Initials/Icon (fill container)
└── Status Indicator (absolute positioned, bottom-right)
    └── Dot (8px–12px depending on size)
```

**Variable bindings:**
- Border radius: `radius/full` (Circle), `radius-lg` (Rounded)
- Placeholder background: `surface/muted`
- Placeholder text: `text/muted`
- Status colors: `feedback/success/default` (Online), `neutral/400` (Offline), `feedback/warning/default` (Away), `feedback/error/default` (Busy)

#### 2.1.10 Icon

**Create a master Icon component:**

```
Icon (frame, 24x24)
└── Vector/Lucide icon (scale to fit, color: currentColor)
```

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Size` | Small (16px), Medium (20px), Large (24px), Extra Large (32px) |
| `Color` | Current, Primary, Muted, Inverse, Success, Warning, Error |

**Usage:** Do not create separate components for each icon. Use this master component and swap the icon instance via the Instance Swap property or by replacing the vector inside.

### Step 2.2: Composites (Week 2, Days 4–5 + Week 3, Days 1–2)

Build these 10 components. Each depends on primitives.

#### 2.2.1 Card

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Type` | Default, Interactive, Outlined, Elevated |
| `Padding` | Small (16px), Medium (24px), Large (32px) |
| `Header` | None, Title, Title+Subtitle, Title+Action |
| `Media` | None, Top, Background |
| `Footer` | None, Actions, Meta |

**Structure:**
```
Card (Auto Layout: fill container, vertical)
├── Header (optional, Auto Layout: fill container, horizontal)
│   ├── Title (Text style: H3)
│   ├── Subtitle (Text style: Body/Small, optional)
│   └── Action (Button/Ghost, optional)
├── Media (optional, Image fill, aspect ratio 16:9)
├── Content (Auto Layout: fill container, vertical)
│   └── [Slot content]
└── Footer (optional, Auto Layout: fill container, horizontal)
    ├── Meta (Text style: Body/Tiny, optional)
    └── Actions (Button group, optional)
```

**Variable bindings:**
- Background: `surface/default` (Default), `surface/elevated` (Elevated)
- Border: `border/default` (Default, Outlined), none (Elevated)
- Border radius: `radius-lg`
- Shadow: none (Default), `Shadow/MD` (Elevated)

#### 2.2.2 Modal

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Size` | Small (400px), Medium (560px), Large (720px), Fullscreen |
| `Header` | None, Title, Title+Close |
| `Footer` | None, Single Action, Dual Action |
| `Scroll` | None, Content |

**Structure:**
```
Modal (fixed overlay, centered)
├── Overlay (fill container, background: surface/overlay, 50% opacity)
└── Dialog (Auto Layout: vertical, max-width per size)
    ├── Header (Auto Layout: fill container, horizontal)
    │   ├── Title (Text style: H2)
    │   └── Close Button (Icon Button, 32px)
    ├── Content (Auto Layout: vertical, scroll if needed)
    │   └── [Slot content]
    └── Footer (Auto Layout: fill container, horizontal)
        ├── Cancel (Button/Secondary, optional)
        └── Confirm (Button/Primary, optional)
```

**Variable bindings:**
- Dialog background: `surface/elevated`
- Dialog border radius: `radius-xl`
- Dialog shadow: `Shadow/XL`
- Overlay: `surface/overlay` at 50% opacity

#### 2.2.3 Drawer

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Position` | Left, Right, Top, Bottom |
| `Size` | Small (320px), Medium (400px), Large (560px) |
| `Header` | None, Title, Title+Close |

**Structure:** Similar to Modal but slides from edge. Use `Smart Animate` for open/close.

#### 2.2.4 Toast

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Type` | Default, Success, Warning, Error, Info |
| `Action` | None, Undo, Close, Action+Close |
| `Position` | Top Left, Top Center, Top Right, Bottom Left, Bottom Center, Bottom Right |

**Structure:**
```
Toast (Auto Layout: hug contents, horizontal)
├── Icon (20px, type-dependent)
├── Message (Text style: Body/Small)
└── Action (Button/Link Small, optional)
    └── Close Icon (16px, optional)
```

**Variable bindings:**
- Background: `surface/elevated`
- Border left: 4px solid, color from Type
- Shadow: `Shadow/MD`
- Border radius: `radius-md`

#### 2.2.5 Tooltip

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Position` | Top, Bottom, Left, Right |
| `Size` | Small (max 200px), Medium (max 320px) |
| `Arrow` | Show, Hide |

**Structure:**
```
Tooltip (Auto Layout: hug contents)
├── Arrow (triangle, absolute positioned)
└── Content (Text style: Body/Tiny, color: text/inverse)
```

**Variable bindings:**
- Background: `text/default` (dark bg for contrast)
- Text color: `text/inverse`
- Border radius: `radius-sm`

#### 2.2.6 Dropdown Menu

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Size` | Small (180px), Medium (240px), Large (320px) |
| `Type` | Default, Checkbox, Radio |
| `Section` | None, With Divider |

**Structure:**
```
Dropdown Menu (Auto Layout: vertical, hug contents width)
├── Menu Item (Auto Layout: fill container, horizontal)
│   ├── Icon (optional, 16px)
│   ├── Label (Text style: Body/Regular)
│   ├── Shortcut (Text style: Mono/Small, optional)
│   └── Check/Icon (optional, for Checkbox/Radio types)
├── Divider (1px line, color: border/muted)
└── ... more items
```

**Variable bindings:**
- Background: `surface/elevated`
- Menu item hover: `surface/interactive-hover`
- Menu item active: `surface/interactive-active`
- Shadow: `Shadow/MD`
- Border radius: `radius-md`

#### 2.2.7 Tabs

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Type` | Underline, Pill, Button |
| `Size` | Small, Regular, Large |
| `Alignment` | Start, Center, End, Stretch |

**Structure:**
```
Tabs (Auto Layout: fill container, horizontal)
├── Tab List (Auto Layout: horizontal, hug contents)
│   └── Tab Item (Auto Layout: hug contents)
│       ├── Icon (optional)
│       └── Label (Text style: Button/Regular)
└── Tab Panel (fill container)
    └── [Slot content]
```

**Active tab indicator:**
- Underline type: 2px bottom border, color `action/primary/default`
- Pill type: background `action/primary/default`, text `action/primary/text`
- Button type: same as Button/Primary component

#### 2.2.8 Accordion

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Type` | Single, Multiple |
| `Size` | Small, Regular, Large |
| `Icon` | Chevron, Plus/Minus, None |

**Structure:**
```
Accordion (Auto Layout: fill container, vertical)
└── Accordion Item (Auto Layout: fill container, vertical)
    ├── Header (Auto Layout: fill container, horizontal)
    │   ├── Title (Text style: H4 or H5)
    │   └── Icon (Chevron/Plus, rotates on open)
    └── Content (Auto Layout: vertical, appears on open)
        └── [Slot content]
```

**Variable bindings:**
- Border: `border/default` bottom
- Header hover: `surface/interactive-hover`
- Content padding top: `space-4`

#### 2.2.9 Stepper

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Type` | Horizontal, Vertical |
| `Size` | Small, Regular, Large |
| `State` | Current, Completed, Upcoming, Error |

**Structure:**
```
Stepper (Auto Layout: horizontal or vertical)
└── Step (Auto Layout: horizontal for Horizontal type)
    ├── Indicator (circle or number)
    │   ├── Number/Check (Text style: Body/Small or Icon)
    │   └── Ring (border, color varies by state)
    ├── Label (Text style: Body/Regular)
    ├── Description (Text style: Body/Small, optional)
    └── Connector (line to next step, color varies)
```

**State colors:**
- Current: Ring `action/primary/default`, Label `text/primary`
- Completed: Ring `feedback/success/default`, Label `text/default`, Check icon
- Upcoming: Ring `border/default`, Label `text/muted`
- Error: Ring `feedback/error/default`, Label `feedback/error/text`

#### 2.2.10 Table

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Style` | Default, Striped, Bordered |
| `Size` | Small, Regular, Large |
| `Selection` | None, Single, Multi |
| `Actions` | None, Row Actions |

**Structure:**
```
Table (Auto Layout: vertical, fill container)
├── Header Row (Auto Layout: horizontal, fill container)
│   └── Header Cell (Auto Layout: horizontal, hug/fill)
│       ├── Checkbox (optional, for Multi selection)
│       ├── Label (Text style: Label)
│       └── Sort Icon (optional, 16px)
└── Body (vertical)
    └── Data Row (Auto Layout: horizontal, fill container)
        ├── Checkbox (optional)
        ├── Data Cell (Auto Layout: horizontal)
        │   └── [Content]
        └── Actions (Button/Ghost, optional)
```

**Variable bindings:**
- Header background: `surface/sunken`
- Header text: `text/muted`
- Row border bottom: `border/muted`
- Row hover: `surface/interactive-hover`
- Striped rows: alternate `surface/default` and `surface/sunken`
- Selected row: `surface/interactive` background

### Step 2.3: Layout Components (Week 3, Days 1–2)

Build these 6 components. They define page structure.

#### 2.3.1 Shell

**Structure:**
```
Shell (Auto Layout: fill container, vertical)
├── Header (fixed height: size/header = 64px)
├── Main (Auto Layout: fill container, horizontal)
│   ├── Sidebar (optional, fixed width: size/sidebar = 280px)
│   └── Content (Auto Layout: fill container, vertical)
│       └── [Page content]
└── Footer (optional)
```

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Sidebar` | None, Left, Right |
| `Footer` | Show, Hide |
| `Max Width` | Full, Contained (1200px) |

**Variable bindings:**
- Header background: `surface/elevated`
- Header border bottom: `border/default`
- Sidebar background: `surface/sunken`
- Content background: `surface/default`
- Content max-width: `size/max-content`
- Content padding: `space-8` (32px) desktop, `space-4` (16px) mobile

#### 2.3.2 Header

**Structure:**
```
Header (Auto Layout: fill container, horizontal, height: 64px)
├── Logo (fixed width, left-aligned)
├── Navigation (Auto Layout: horizontal, hug contents, center)
│   └── Nav Item (Text style: Body/Regular, padding: space-4 horizontal)
├── Actions (Auto Layout: horizontal, hug contents, right)
│   ├── Search Button (Icon Button)
│   ├── Notification Bell (Icon Button with Badge)
│   ├── Avatar (size: Medium, 40px)
│   └── Mobile Menu Button (Icon Button, visible < 1024px)
└── Mobile Menu (Drawer, appears on menu button click)
```

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Type` | Default, Transparent, Sticky |
| `Auth State` | Guest, User, Professional |
| `Scroll State` | Top, Scrolled |

**Variable bindings:**
- Default background: `surface/elevated`
- Transparent background: none
- Sticky: position fixed, `Shadow/MD` on scroll
- Scrolled state: add `Shadow/MD`
- Active nav item: `text/primary` + bottom border 2px `action/primary/default`
- Inactive nav item: `text/muted`

#### 2.3.3 Footer

**Structure:**
```
Footer (Auto Layout: fill container, vertical)
├── Main (Auto Layout: fill container, horizontal)
│   ├── Brand Column (Logo + tagline + social icons)
│   ├── Link Columns (3–4 columns of link lists)
│   └── Newsletter (Input + Button)
├── Divider (1px, color: border/muted)
└── Bottom (Auto Layout: fill container, horizontal)
    ├── Copyright (Text style: Body/Tiny)
    └── Legal Links (Text style: Body/Tiny)
```

**Variable bindings:**
- Background: `surface/sunken`
- Text: `text/muted`
- Link hover: `text/default`
- Border top: `border/default`

#### 2.3.4 Sidebar

**Structure:**
```
Sidebar (fixed width: 280px, vertical scroll)
├── Logo/Brand (top, optional)
├── Navigation (vertical)
│   └── Nav Section (Auto Layout: vertical)
│       └── Nav Item (Auto Layout: horizontal, fill container)
│           ├── Icon (20px)
│           ├── Label (Text style: Body/Regular)
│           └── Badge (optional)
├── Divider (optional)
└── User Section (bottom, optional)
    └── User Card (Avatar + Name + Role)
```

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Type` | Fixed, Collapsible, Rail |
| `Size` | Full (280px), Collapsed (72px) |
| `Theme` | Default, Inverted |

**Variable bindings:**
- Background: `surface/sunken`
- Border right: `border/default`
- Active item: `surface/interactive` background, `text/primary` text
- Hover item: `surface/interactive-hover`
- Collapsed: show icons only, tooltip on hover

#### 2.3.5 Grid

**Structure:**
```
Grid (Auto Layout: wrap, horizontal)
└── Grid Item (Auto Layout: fill container)
    └── [Content]
```

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Columns` | 1, 2, 3, 4, 6, 12 |
| `Gap` | Small (16px), Medium (24px), Large (32px) |
| `Responsive` | Desktop, Tablet, Mobile |

**Constraints:** Use Figma's `Fill container` + `Wrap` for responsive behavior simulation.

#### 2.3.6 Section

**Structure:**
```
Section (Auto Layout: fill container, vertical)
├── Header (optional)
│   ├── Overline (Text style: Overline)
│   ├── Title (Text style: H2)
│   └── Description (Text style: Body/Large)
├── Content (Auto Layout: fill container)
│   └── [Slot content]
└── Footer (optional)
```

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Padding` | Small (48px), Medium (80px), Large (128px) |
| `Background` | Default, Muted, Elevated, Primary |
| `Width` | Full, Contained |

**Variable bindings:**
- Default background: `surface/default`
- Muted background: `surface/sunken`
- Elevated background: `surface/elevated`
- Primary background: `action/primary/default` (text becomes `text/inverse`)

### Step 2.4: Patterns (Week 3, Days 3–5)

Build these 10 patterns. They combine primitives and composites into reusable UX patterns.

#### 2.4.1 Empty State

**Structure:**
```
Empty State (Auto Layout: vertical, center aligned, max-width: 400px)
├── Illustration (96px–128px, optional)
├── Icon (48px, optional, if no illustration)
├── Title (Text style: H3, centered)
├── Description (Text style: Body/Regular, centered, color: text/muted)
└── Action (Button/Primary, optional)
```

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Size` | Small (compact), Medium (default), Large (hero) |
| `Type` | Default, Search, Error, Success, Action Required |
| `Illustration` | None, Icon, Image |

**Usage rules (document in component description):**
- Always provide a clear next action when possible
- Never use "Oops" or generic apologies. Be specific about what is empty and why.
- Example: "No sessions scheduled" not "Nothing here"

#### 2.4.2 Skeleton

**Structure:**
```
Skeleton (Auto Layout: vertical, fill container)
└── Skeleton Item (rounded rectangle, animated shimmer)
```

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Type` | Text (single line), Text (multi-line), Avatar, Card, Table, Custom |
| `Lines` | 1, 2, 3, 4, 5 |
| `Avatar` | None, Small, Medium, Large |

**Variable bindings:**
- Background: `surface/muted`
- Shimmer: gradient from `surface/muted` to `surface/default` to `surface/muted`
- Border radius: `radius-sm` (text), `radius-md` (card), `radius-full` (avatar)

**Figma implementation:** Use a linear gradient fill that simulates the shimmer. In code, this will be animated.

#### 2.4.3 Error Boundary

**Structure:**
```
Error Boundary (Auto Layout: vertical, center aligned, fill container)
├── Icon (48px, AlertTriangle or Bug, color: feedback/error/default)
├── Title (Text style: H2, "Something went wrong")
├── Description (Text style: Body/Regular, error details)
├── Actions (Auto Layout: horizontal)
│   ├── Retry Button (Button/Primary)
│   └── Go Home Button (Button/Secondary)
└── Error ID (Text style: Mono/Small, color: text/muted)
```

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Type` | Full Page, Inline, Modal |
| `Details` | Show, Hide |
| `Retry` | Show, Hide |

#### 2.4.4 Confirmation Dialog

**Structure:**
```
Confirmation Dialog (Modal component variant)
├── Icon (optional, 48px, color by type)
├── Title (Text style: H3)
├── Description (Text style: Body/Regular)
├── Details (optional, Card component, muted)
└── Actions (Auto Layout: horizontal, right-aligned)
    ├── Cancel (Button/Secondary)
    └── Confirm (Button/Primary or Button/Destructive)
```

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Type` | Info, Warning, Destructive |
| `Size` | Small, Medium |
| `Details` | None, Summary, List |

#### 2.4.5 Search Bar

**Structure:**
```
Search Bar (Auto Layout: fill container, horizontal)
├── Icon (Search, 20px, color: text/muted)
├── Input (Text style: Body/Regular, placeholder: "Search...")
├── Clear Button (X icon, appears when filled)
└── Action (Button or Icon, optional)
```

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Size` | Small (36px), Regular (40px), Large (48px) |
| `Style` | Filled, Outlined, Minimal |
| `Scope` | Global, Filtered |

**Variable bindings:**
- Background: `surface/default` (Filled), none (Minimal)
- Border: `border/default` (Outlined), none (Minimal)
- Focus: `Shadow/Focus`

#### 2.4.6 Filter Chip

**Structure:**
```
Filter Chip (Auto Layout: hug contents, horizontal)
├── Icon (optional, 16px)
├── Label (Text style: Body/Small)
└── Remove Button (X icon, 14px, appears when active)
```

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `State` | Default, Active, Disabled |
| `Type` | Default, Removable |
| `Size` | Small, Regular |

**Variable bindings:**
- Default: background `surface/muted`, border `border/default`
- Active: background `action/primary/default`, text `action/primary/text`
- Border radius: `radius-full`

#### 2.4.7 Pagination

**Structure:**
```
Pagination (Auto Layout: hug contents, horizontal)
├── Previous Button (Icon Button, ChevronLeft, disabled on first page)
├── Page Numbers (Auto Layout: horizontal)
│   └── Page Button (Text style: Button/Small)
│       ├── Default state
│       └── Active state (background: action/primary/default)
├── Ellipsis (Text style: Body/Small, optional)
└── Next Button (Icon Button, ChevronRight, disabled on last page)
```

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Size` | Small, Regular |
| `Type` | Numbered, Simple (Prev/Next only) |
| `Show` | All, Compact (current + 2 neighbors + first/last) |

#### 2.4.8 Breadcrumb

**Structure:**
```
Breadcrumb (Auto Layout: hug contents, horizontal)
└── Breadcrumb Item (Auto Layout: horizontal)
    ├── Label (Text style: Body/Small)
    └── Separator (ChevronRight, 16px, color: text/muted)
```

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Size` | Small, Regular |
| `Style` | Default, Collapsed (home + ... + current) |

**Variable bindings:**
- Active/last item: `text/default`, no hover
- Inactive items: `text/muted`, hover → `text/default`
- Separator: `text/muted`

#### 2.4.9 Progress Bar

**Structure:**
```
Progress Bar (Auto Layout: fill container, vertical)
├── Track (fill container, height: 8px, background: surface/muted)
│   └── Fill (width: X%, background: action/primary/default)
└── Label (optional, Text style: Body/Tiny, "X%")
```

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Size` | Small (4px), Regular (8px), Large (12px) |
| `Color` | Primary, Success, Warning, Error |
| `Label` | None, Percentage, Fraction |

**Variable bindings:**
- Track: `surface/muted`
- Fill color by type: `action/primary/default`, `feedback/success/default`, etc.
- Border radius: `radius-full`

#### 2.4.10 Progress Step

**Structure:** Same as Stepper component but used inline for linear progress.

**Variants:**

| Variant Property | Values |
|-----------------|--------|
| `Type` | Horizontal, Vertical |
| `Size` | Small, Regular |
| `Labels` | None, Below, Beside |

### Step 2.5: Component Documentation Standards

**Every component must have:**

1. **Component Description** (Figma right panel):
   - What this component does
   - When to use it
   - When NOT to use it (and what to use instead)

2. **Variant Documentation:**
   - List all variant properties and their values
   - Explain what each combination means

3. **Usage Examples:**
   - Create a separate page in each component file showing 2–3 real-world usages
   - Example: Card component → Profile Card, Pricing Card, Article Card

4. **Accessibility Notes:**
   - ARIA role
   - Keyboard interaction
   - Focus management
   - Screen reader behavior

5. **Token Mapping:**
   - List which Figma Variables this component uses
   - This will be used in Phase 5 for handoff

### Step 2.6: Weekly Design Review Gate

**Phase 2 Exit Checklist (Lead Designer + Frontend Lead sign off):**

- [ ] All 35 components exist as Figma Components
- [ ] Every component uses only Figma Variables (zero hardcoded values)
- [ ] All variants are documented with usage rules
- [ ] Auto Layout is correct: resizing works for all variant combinations
- [ ] Component descriptions include accessibility notes
- [ ] Frontend Lead has reviewed all components and confirmed build feasibility
- [ ] Usage examples page exists for each component category
- [ ] Stark audit: all text/background combinations in components pass contrast

---

## Phase 3: Frame Construction (Weeks 4–8)

**Goal:** Build all frames for all 13 journeys using only the components from Phase 2. No new components should be created during this phase. If a needed component doesn't exist, it should have been built in Phase 2 — escalate immediately.

**Exit Criteria:**
- All frames from all 13 journeys exist in Figma
- Every frame uses only Phase 2 components and Phase 1 variables
- All frames have annotations for interactions, state changes, and edge cases
- All frames have responsive variants (Desktop + Mobile minimum)
- Content Designer has reviewed and approved all microcopy

**Weekly Structure:**
- **Week 4:** Journeys 1–3 (User Onboarding, Professional Onboarding, Search & Booking)
- **Week 5:** Journeys 4–6 (Request Booking, Recurring Booking, Session Lifecycle)
- **Week 6:** Journeys 7–9 (Video Session, Trust & Safety, Admin Operations)
- **Week 7:** Journeys 10–11 (Payments & Billing, Professional Workspace)
- **Week 8:** Journeys 12–13 (Profile Edit, Settings & Preferences) + Frame review + responsive pass

### Step 3.1: Frame Building Rules

**Before building any frame:**

1. **Read the journey spec** from `frames/<journey-name>.md`
2. **Identify all components needed.** If any component is missing, STOP and escalate.
3. **List all states** described in the spec (empty, loading, error, success, etc.)
4. **Determine responsive breakpoints:** Desktop (1440px), Tablet (1024px), Mobile (375px)
5. **Prepare copy:** Get final copy from Content Designer before building

**Frame Structure in Figma:**

```
Page: 06a — User Onboarding
├── Frame: Desktop — Step 1 — Welcome
│   ├── [Component instances only]
│   └── Annotations layer (hidden in exports)
├── Frame: Desktop — Step 2 — Profile
│   └── ...
├── Frame: Desktop — Step 3 — Interests
│   └── ...
├── Frame: Desktop — Step 4 — Complete
│   └── ...
├── Frame: Mobile — Step 1 — Welcome
│   └── ...
└── ... etc
```

**Annotation Standards:**
- Use a separate layer called `Annotations` on each frame
- Annotations use `Text style: Caption` in red (`feedback/error/default`)
- Include: interaction triggers, state transitions, error conditions, loading states
- Hide annotations before exporting for stakeholder review

### Step 3.2: Journey 1 — User Onboarding (Week 4, Days 1–2)

**Source:** `frames/user-onboarding.md`

**Frames to build:**

| Frame | Desktop Size | Mobile Size | Key Components |
|-------|-------------|-------------|---------------|
| Welcome Screen | 1440x900 | 375x812 | Section (Primary bg), Display/01, Button/Large, Illustration |
| Profile Setup | 1440x900 | 375x812 | Stepper, Input, Select, Textarea, Avatar |
| Interest Selection | 1440x900 | 375x812 | Card (Selectable), Checkbox, Button |
| Confirmation | 1440x900 | 375x812 | Success illustration, Display/02, Button |
| Loading State | 1440x900 | 375x812 | Skeleton (multi-line), Spinner |
| Error State | 1440x900 | 375x812 | Error Boundary (Inline) |

**Key Rules from Spec:**
- Stepper must show 4 steps: Welcome → Profile → Interests → Complete
- Welcome screen: full-bleed primary background, white text
- Profile: Avatar upload with fallback initials
- Interests: Grid of selectable cards, 3 columns desktop, 1 column mobile
- Confirmation: Celebration animation trigger (document in annotations)

### Step 3.3: Journey 2 — Professional Onboarding (Week 4, Days 2–3)

**Source:** `frames/professional-onboarding.md`

**Frames to build:**

| Frame | Desktop Size | Mobile Size | Key Components |
|-------|-------------|-------------|---------------|
| Registration Form | 1440x900 | 375x812 | Input, Select, Textarea, Button, Stepper |
| Document Upload | 1440x900 | 375x812 | Card (Upload), Progress Bar, Button |
| Verification Pending | 1440x900 | 375x812 | Illustration, Display/02, Card (Info) |
| Approval Success | 1440x900 | 375x812 | Celebration, Display/02, Button |
| Rejection Notice | 1440x900 | 375x812 | Error Boundary, Card, Button |
| Loading States | 1440x900 | 375x812 | Skeleton, Progress Bar |

**Key Rules from Spec:**
- Stepper: Registration → Documents → Review → Result
- Document upload: drag-and-drop zone, file type validation UI
- Pending state: auto-refresh every 30 seconds (document in annotations)
- Rejection: specific reason list, re-upload CTA

### Step 3.4: Journey 3 — Search & Booking (Week 4, Days 3–5)

**Source:** `frames/search-booking.md`

**Frames to build:**

| Frame | Desktop Size | Mobile Size | Key Components |
|-------|-------------|-------------|---------------|
| Search Results | 1440x900 | 375x812 | Search Bar, Filter Chip, Card (Professional), Pagination |
| Filter Panel | 1440x900 | 375x812 | Drawer (Right), Checkbox, Radio, Select, Button |
| Professional Profile | 1440x900 | 375x812 | Avatar (XL), Tabs, Card, Button |
| Booking Calendar | 1440x900 | 375x812 | Calendar component, Button, Card |
| Booking Confirmation | 1440x900 | 375x812 | Modal, Card, Button |
| Empty Search | 1440x900 | 375x812 | Empty State |
| Loading | 1440x900 | 375x812 | Skeleton (Card grid) |

**Key Rules from Spec:**
- Search bar: auto-suggest dropdown, recent searches
- Filter panel: collapsible on mobile, drawer on tablet
- Professional cards: Avatar, name, specialty, rating, price, availability badge
- Calendar: available slots in green, booked in gray, selected in primary
- Confirmation modal: summary card with all booking details

### Step 3.5: Journey 4 — Request Booking (Week 5, Days 1–2)

**Source:** `frames/request-booking.md`

**Frames to build:**

| Frame | Desktop Size | Mobile Size | Key Components |
|-------|-------------|-------------|---------------|
| Request Form | 1440x900 | 375x812 | Input, Textarea, Select, Button, Card |
| Professional Matching | 1440x900 | 375x812 | Card (Professional), Progress Step, Button |
| Request Sent | 1440x900 | 375x812 | Empty State (Success variant), Button |
| Proposal Received | 1440x900 | 375x812 | Card (Proposal), Tabs, Button |
| Accept/Decline | 1440x900 | 375x812 | Confirmation Dialog |
| Loading | 1440x900 | 375x812 | Skeleton, Progress Bar |

**Key Rules from Spec:**
- Request form: dynamic fields based on service type selection
- Matching: show 3–5 professionals with availability
- Proposal card: professional info, proposed time, price, message
- Accept/decline: destructive action for decline, confirmation dialog

### Step 3.6: Journey 5 — Recurring Booking (Week 5, Days 2–3)

**Source:** `frames/recurring-booking.md`

**Frames to build:**

| Frame | Desktop Size | Mobile Size | Key Components |
|-------|-------------|-------------|---------------|
| Recurrence Setup | 1440x900 | 375x812 | Select, Radio, Input, Card, Button |
| Schedule Overview | 1440x900 | 375x812 | Table, Tabs, Button |
| Edit Recurrence | 1440x900 | 375x812 | Modal, Select, Radio, Button |
| Cancellation | 1440x900 | 375x812 | Confirmation Dialog, Radio |
| Confirmation | 1440x900 | 375x812 | Toast, Card |

**Key Rules from Spec:**
- Recurrence: daily, weekly, bi-weekly, monthly options
- Schedule table: sortable, filterable by status
- Edit: apply to this only / this and future / all instances
- Cancellation: reason selection required

### Step 3.7: Journey 6 — Session Lifecycle (Week 5, Days 3–5)

**Source:** `frames/session-lifecycle.md`

**Frames to build:**

| Frame | Desktop Size | Mobile Size | Key Components |
|-------|-------------|-------------|---------------|
| Upcoming Sessions | 1440x900 | 375x812 | Card (Session), Tabs, Badge, Button |
| Session Detail | 1440x900 | 375x812 | Card, Avatar, Tabs, Button |
| Pre-Session Checklist | 1440x900 | 375x812 | Stepper, Checkbox, Card, Button |
| In-Session | 1440x900 | 375x812 | Shell (no header), Card, Button |
| Post-Session | 1440x900 | 375x812 | Card, Textarea, Button, Rating |
| Cancel Session | 1440x900 | 375x812 | Confirmation Dialog, Radio |
| Reschedule | 1440x900 | 375x812 | Modal, Calendar, Button |

**Key Rules from Spec:**
- Session cards: status badge (upcoming, in-progress, completed, cancelled)
- Pre-session: checklist with time-based items (24h before, 1h before)
- In-session: minimal UI, focus on video/content
- Post-session: rating (1–5 stars), review text, optional tip
- Reschedule: reason required, professional approval workflow

### Step 3.8: Journey 7 — Video Session (Week 6, Days 1–2)

**Source:** `frames/video-session.md`

**Frames to build:**

| Frame | Desktop Size | Mobile Size | Key Components |
|-------|-------------|-------------|---------------|
| Lobby/Waiting | 1440x900 | 375x812 | Card, Avatar, Button, Spinner |
| Active Video Call | 1440x900 | 375x812 | Shell (custom), Video placeholder, Button |
| Controls Overlay | 1440x900 | 375x812 | Button (Icon), Tooltip, Badge |
| Screen Share | 1440x900 | 375x812 | Shell, Card, Button |
| End Call | 1440x900 | 375x812 | Confirmation Dialog |
| Connection Error | 1440x900 | 375x812 | Error Boundary, Button |
| Reconnecting | 1440x900 | 375x812 | Toast, Spinner |

**Key Rules from Spec:**
- Lobby: show self-preview, mic/camera tests
- Active call: main video (other person), self picture-in-picture
- Controls: mute, video toggle, screen share, chat, end call (red, destructive)
- Screen share: presenter view with participant thumbnails
- Connection error: auto-retry count, manual retry button

### Step 3.9: Journey 8 — Trust & Safety (Week 6, Days 2–3)

**Source:** `frames/trust-safety.md`

**Frames to build:**

| Frame | Desktop Size | Mobile Size | Key Components |
|-------|-------------|-------------|---------------|
| Report Form | 1440x900 | 375x812 | Select, Textarea, Radio, Button |
| Report Submitted | 1440x900 | 375x812 | Empty State (Success), Button |
| Block User | 1440x900 | 375x812 | Confirmation Dialog, Checkbox |
| Safety Center | 1440x900 | 375x812 | Section, Card, Accordion, Button |
| Verification Badges | 1440x900 | 375x812 | Badge, Card, Tooltip |
| Emergency Contact | 1440x900 | 375x812 | Card, Button, Input |

**Key Rules from Spec:**
- Report: category selection, detailed description, optional evidence upload
- Block: confirmation with optional "also report" checkbox
- Safety center: accordion sections for different topics
- Verification: badge types (email, phone, ID, professional cert)

### Step 3.10: Journey 9 — Admin Operations (Week 6, Days 3–5)

**Source:** `frames/admin-operations.md`

**Frames to build:**

| Frame | Desktop Size | Mobile Size | Key Components |
|-------|-------------|-------------|---------------|
| Dashboard | 1440x900 | 375x812 | Shell (Sidebar), Card, Table, Badge |
| User Management | 1440x900 | 375x812 | Table, Search Bar, Filter Chip, Pagination |
| Professional Review | 1440x900 | 375x812 | Card, Avatar, Tabs, Button |
| Approval Workflow | 1440x900 | 375x812 | Stepper, Card, Button, Modal |
| Metrics & Analytics | 1440x900 | 375x812 | Card, Table, Tabs, Badge |
| Moderation Queue | 1440x900 | 375x812 | Table, Badge, Button, Modal |

**Key Rules from Spec:**
- Dashboard: summary cards with key metrics, recent activity table
- User management: sortable/filterable table, bulk actions
- Professional review: document viewer, verification checklist
- Approval: stepper showing submitted → under review → approved/rejected
- Moderation: reported content cards, action buttons (dismiss, warn, suspend)

### Step 3.11: Journey 10 — Payments & Billing (Week 7, Days 1–2)

**Source:** `frames/payments-billing.md`

**Frames to build:**

| Frame | Desktop Size | Mobile Size | Key Components |
|-------|-------------|-------------|---------------|
| Payment Methods | 1440x900 | 375x812 | Card, Button, Radio, Modal |
| Add Card | 1440x900 | 375x812 | Input, Button, Modal |
| Checkout | 1440x900 | 375x812 | Card, Button, Tabs, Input |
| Invoice History | 1440x900 | 375x812 | Table, Filter Chip, Pagination |
| Invoice Detail | 1440x900 | 375x812 | Card, Table, Button |
| Refund Request | 1440x900 | 375x812 | Modal, Textarea, Radio, Button |
| Subscription Management | 1440x900 | 375x812 | Card, Tabs, Button, Badge |

**Key Rules from Spec:**
- Payment methods: card brand icons, default indicator, expiration warnings
- Checkout: summary card, payment method selection, promo code input
- Invoice: downloadable PDF, line items, tax breakdown
- Refund: reason required, amount editable, confirmation modal
- Subscription: current plan badge, upgrade/downgrade CTAs, cancellation flow

### Step 3.12: Journey 11 — Professional Workspace (Week 7, Days 2–4)

**Source:** `frames/professional-workspace.md`

**Frames to build:**

| Frame | Desktop Size | Mobile Size | Key Components |
|-------|-------------|-------------|---------------|
| Dashboard | 1440x900 | 375x812 | Shell (Sidebar), Card, Table, Badge |
| Calendar View | 1440x900 | 375x812 | Calendar component, Card, Button |
| Client List | 1440x900 | 375x812 | Table, Search Bar, Filter Chip, Avatar |
| Client Detail | 1440x900 | 375x812 | Card, Avatar, Tabs, Button |
| Availability Settings | 1440x900 | 375x812 | Toggle, Select, Button, Card |
| Service Pricing | 1440x900 | 375x812 | Table, Input, Button, Card |
| Earnings Overview | 1440x900 | 375x812 | Card, Table, Tabs, Badge |

**Key Rules from Spec:**
- Dashboard: upcoming sessions, earnings summary, new client requests
- Calendar: day/week/month views, availability blocks, session colors
- Client list: sortable by last session, total spent, status
- Availability: recurring schedule + exceptions, timezone handling
- Pricing: service tiers, duration options, custom pricing toggle
- Earnings: payout schedule, pending vs. available, tax documents

### Step 3.13: Journey 12 — Profile Edit (Week 8, Days 1–2)

**Source:** `frames/profile-edit.md`

**Frames to build:**

| Frame | Desktop Size | Mobile Size | Key Components |
|-------|-------------|-------------|---------------|
| Edit Profile | 1440x900 | 375x812 | Avatar (XL), Input, Textarea, Button |
| Change Password | 1440x900 | 375x812 | Input, Button, Modal |
| Notification Settings | 1440x900 | 375x812 | Toggle, Section, Button |
| Privacy Settings | 1440x900 | 375x812 | Toggle, Radio, Button |
| Delete Account | 1440x900 | 375x812 | Confirmation Dialog, Input, Button |
| Loading | 1440x900 | 375x812 | Skeleton |
| Save Success | 1440x900 | 375x812 | Toast |

**Key Rules from Spec:**
- Profile: avatar upload with preview, bio character counter
- Password: current password required, strength indicator
- Notifications: granular toggles (email, push, SMS) per event type
- Privacy: profile visibility, search indexing, data download
- Delete: confirmation with "type DELETE to confirm" pattern

### Step 3.14: Journey 13 — Settings & Preferences (Week 8, Days 2–3)

**Source:** `frames/settings-preferences.md`

**Frames to build:**

| Frame | Desktop Size | Mobile Size | Key Components |
|-------|-------------|-------------|---------------|
| General Settings | 1440x900 | 375x812 | Select, Toggle, Button, Section |
| Language & Region | 1440x900 | 375x812 | Select, Radio, Button |
| Accessibility | 1440x900 | 375x812 | Toggle, Select, Section, Button |
| Theme | 1440x900 | 375x812 | Radio (cards), Button |
| Data & Storage | 1440x900 | 375x812 | Card, Button, Progress Bar |
| Connected Accounts | 1440x900 | 375x812 | Card, Button, Badge |
| Help & Support | 1440x900 | 375x812 | Accordion, Card, Button |

**Key Rules from Spec:**
- General: timezone, date format, time format, default view
- Language: current selection, available languages, beta indicators
- Accessibility: font size scaling, reduced motion, high contrast
- Theme: Light/Dark/System with preview cards
- Data: cache size, download my data, delete history
- Connected accounts: Google, Apple, social logins with unlink
- Help: FAQ accordion, contact form, live chat trigger

### Step 3.15: Responsive Pass (Week 8, Days 4–5)

**For every frame built in Weeks 4–8:**

1. **Create Mobile variant** (375px width, 812px height)
2. **Create Tablet variant** (768px width, 1024px height) if time permits
3. **Verify component scaling:**
   - Do cards stack vertically on mobile?
   - Does the sidebar become a drawer or bottom nav?
   - Do tables become cards or horizontal scroll?
   - Do modals become full-screen sheets on mobile?
4. **Test with Figma's "Preview"** at different widths
5. **Document breakpoints** in frame annotations

**Responsive Decision Matrix:**

| Element | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Sidebar | Fixed 280px left | Collapsible icon rail | Bottom nav or hamburger |
| Header | Full nav | Condensed nav | Hamburger + search |
| Card grid | 3–4 columns | 2 columns | 1 column |
| Table | Full table | Horizontal scroll | Card list |
| Modal | Centered dialog | Centered dialog | Full-screen sheet |
| Filter panel | Left sidebar | Top bar chips | Drawer (bottom) |
| Search bar | Full width | Full width | Icon-only, expands on tap |

### Step 3.16: Weekly Design Review Gates

**After each week (Weeks 4–8):**

- [ ] All frames for that week's journeys exist
- [ ] Every frame uses only Phase 2 components and Phase 1 variables
- [ ] All states (empty, loading, error, success) are built
- [ ] Mobile variants exist for all frames
- [ ] Annotations are complete (interactions, edge cases)
- [ ] Content Designer has approved all microcopy
- [ ] Stark audit: all text/background combinations pass contrast

**Phase 3 Final Exit Checklist (Lead Designer + PM sign off):**

- [ ] All 13 journeys have all frames built
- [ ] Desktop + Mobile variants exist for every frame
- [ ] No hardcoded values anywhere
- [ ] All edge cases documented in annotations
- [ ] Component usage is consistent across all journeys
- [ ] Navigation flow between frames is logical and complete
- [ ] All illustrations and assets are placed and sized correctly

---

## Phase 4: Prototyping & Interaction (Week 9)

**Goal:** Connect all frames with interactive prototypes. Define all animations, transitions, and micro-interactions. This is the "clickable demo" that stakeholders will review.

**Exit Criteria:**
- Every user flow has a complete clickable prototype
- All transitions have defined animation curves and durations
- All interactive elements (buttons, links, form submissions) are wired
- Mobile and desktop prototypes are separate but parallel
- PM and stakeholders can complete any journey without assistance

### Step 4.1: Prototype Setup

**Create separate prototype flows:**

| Flow Name | Starting Frame | Journeys Covered |
|-----------|---------------|------------------|
| `User Sign Up` | Welcome Screen | User Onboarding |
| `Professional Sign Up` | Registration Form | Professional Onboarding |
| `Book a Session` | Search Results | Search & Booking |
| `Request a Session` | Request Form | Request Booking |
| `Manage Schedule` | Upcoming Sessions | Session Lifecycle |
| `Join Video Call` | Lobby | Video Session |
| `Admin Review` | Dashboard | Admin Operations |
| `Manage Payments` | Payment Methods | Payments & Billing |
| `Professional Dashboard` | Dashboard | Professional Workspace |
| `Edit Profile` | Edit Profile | Profile Edit |
| `Settings` | General Settings | Settings & Preferences |

### Step 4.2: Connection Rules

**Wire every interactive element:**

| Element | Trigger | Action | Animation |
|---------|---------|--------|-----------|
| Button (CTA) | On tap | Navigate to next frame | Smart Animate, 250ms, ease-out |
| Button (secondary) | On tap | Navigate to previous frame | Smart Animate, 200ms, ease |
| Link | On tap | Navigate to target frame | Instant |
| Form submit | On tap | Navigate to success/error frame | Smart Animate, 300ms, ease-out |
| Modal open | On tap | Open overlay | Smart Animate, 250ms, spring |
| Modal close | On tap / ESC | Close overlay | Smart Animate, 200ms, ease-in |
| Drawer open | On tap | Slide from edge | Smart Animate, 300ms, ease-out |
| Drawer close | On tap / swipe | Slide to edge | Smart Animate, 250ms, ease-in |
| Tab switch | On tap | Swap content | Smart Animate, 200ms, ease |
| Accordion toggle | On tap | Expand/collapse | Smart Animate, 250ms, ease |
| Toast appear | After action | Slide in | Smart Animate, 300ms, ease-out |
| Toast dismiss | Auto (3s) / tap | Slide out | Smart Animate, 200ms, ease-in |
| Dropdown open | On tap | Expand list | Smart Animate, 150ms, ease-out |
| Dropdown close | On tap outside | Collapse list | Smart Animate, 100ms, ease-in |
| Card hover | While hovering | Scale 1.02, shadow MD | Smart Animate, 150ms, ease |
| Card press | While pressing | Scale 0.98 | Smart Animate, 100ms, ease |
| Input focus | On focus | Border focus color, shadow focus | Smart Animate, 150ms, ease |
| Loading state | After submit | Skeleton shimmer | After delay, loop |
| Error state | On validation fail | Shake + red border | Smart Animate, 300ms, spring |
| Success state | On success | Check animation + green | Smart Animate, 400ms, spring |
| Scroll | On scroll | Parallax header | Scroll animation |
| Pull to refresh | On drag | Spinner + reload | After release, 1s spinner |
| Swipe item | On swipe left | Reveal actions | Smart Animate, 200ms, ease-out |
| Infinite scroll | On scroll end | Load more skeleton | Auto-trigger, 500ms delay |

### Step 4.3: Animation Specifications

**From `tokens.md` animation section — use these exact values:**

| Animation | Duration | Easing | Properties |
|-----------|----------|--------|------------|
| Hover | 150ms | ease | background-color, border-color, transform |
| Focus | 150ms | ease | box-shadow, border-color |
| Active/Press | 100ms | ease | transform (scale) |
| Enter (modal, drawer, toast) | 250ms | ease-out | opacity, transform |
| Exit (modal, drawer, toast) | 200ms | ease-in | opacity, transform |
| Page transition | 350ms | ease-in-out | opacity, transform |
| Expand/collapse | 250ms | ease | height, opacity |
| Skeleton shimmer | 1.5s | linear | background-position (infinite) |
| Success check | 400ms | cubic-bezier(0.34,1.56,0.64,1) | stroke-dashoffset |
| Error shake | 300ms | spring | transform (translateX) |
| Loading spinner | 1s | linear | rotation (infinite) |
| Card hover | 150ms | ease | transform (scale), box-shadow |
| Parallax | scroll-linked | linear | transform (translateY) |

**Smart Animate Properties to match:**
- Opacity
- Position (x, y)
- Scale
- Rotation
- Size (width, height)
- Corner radius
- Fill color
- Stroke color
- Effects (shadows, blurs)

### Step 4.4: Micro-interactions

**Define these for every interactive element:**

**Button States:**
```
Default → Hover: background darkens, 150ms
Hover → Active: scale 0.98, 100ms
Active → Default: scale 1.0, 150ms
Disabled: opacity 0.5, no transitions
Loading: spinner appears, text fades, maintain dimensions
```

**Input States:**
```
Default → Focus: border → focus color, shadow-focus appears, 150ms
Focus → Filled: shadow-focus remains while focused
Filled → Error: border → error color, shake animation, 300ms
Error → Focus: border → focus color, remove shake
```

**Card States:**
```
Default → Hover: scale 1.02, shadow SM → MD, 150ms
Hover → Press: scale 0.98, 100ms
Press → Default: scale 1.0, shadow MD → SM, 150ms
```

**Toast Lifecycle:**
```
Trigger → Appear: slide from bottom/right, 300ms ease-out
Appear → Persist: visible for 3 seconds (or user action)
Persist → Dismiss: slide out, 200ms ease-in
```

### Step 4.5: Prototype Testing

**Test checklist (complete for every flow):**

- [ ] Can a user complete the journey start to finish without getting stuck?
- [ ] Are all back/cancel actions wired?
- [ ] Do error states have clear recovery paths?
- [ ] Are loading states realistic (not instant)?
- [ ] Do mobile gestures work (swipe, pull, pinch where applicable)?
- [ ] Are all dropdowns, modals, and drawers closable?
- [ ] Is the tab order logical for keyboard navigation?
- [ ] Do all buttons have visible hover and active states?

**Stakeholder Review Session:**
- Schedule 2-hour session with PM, Frontend Lead, and QA
- Share prototype link with commenting enabled
- Record session for design team reference
- Collect all feedback in a single Figma comment thread per journey

### Step 4.6: Weekly Design Review Gate

**Phase 4 Exit Checklist (PM + Frontend Lead sign off):**

- [ ] All 11 prototype flows are complete and testable
- [ ] Every interactive element has a defined trigger and action
- [ ] All animations use values from `tokens.md`
- [ ] Mobile and desktop prototypes are both functional
- [ ] Stakeholder review completed with feedback addressed
- [ ] No dead ends or broken connections
- [ ] Keyboard navigation path is defined for accessibility

---

## Phase 5: Developer Handoff (Week 10)

**Goal:** Prepare all assets, specifications, and documentation needed for engineers to build the design system in code. This is the bridge between design and development.

**Exit Criteria:**
- All design tokens exported as CSS variables, JSON, and Tailwind config
- All components have developer specs with measurements, colors, and spacing
- All frames have redline annotations
- Asset export is complete (icons, illustrations, images)
- Handoff documentation is reviewed and signed off by Frontend Lead

### Step 5.1: Token Export

**Export `design-tokens.json` from Figma:**

Using Tokens Studio plugin:
1. Open Tokens Studio
2. Click `Export` → `Single file` → `JSON`
3. Save as `design-tokens.json`
4. Verify the file contains:
   - All color primitives
   - All semantic aliases
   - All typography values
   - All spacing values
   - All sizing values
   - All border radius values
   - All shadow values
   - All animation values
   - All breakpoint values

**Transform to CSS Variables:**

The Design Engineer should run the token transformer (or manually create):

```css
/* design-tokens.css */
:root {
  /* Colors - Primitive */
  --color-primary-50: #E6F2E6;
  --color-primary-100: #C2E0C2;
  /* ... all primary neutrals ... */
  --color-primary-900: #001A00;

  /* Colors - Semantic */
  --color-action-primary-default: var(--color-primary-500);
  --color-action-primary-hover: var(--color-primary-600);
  --color-action-primary-active: var(--color-primary-700);
  /* ... all semantic colors ... */

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-display: 'Space Grotesk', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --text-display-01: 600 4rem/1.1 'Space Grotesk', sans-serif;
  --text-display-02: 600 3rem/1.15 'Space Grotesk', sans-serif;
  /* ... all text styles ... */

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  /* ... all spacing ... */

  /* Sizing */
  --size-icon-sm: 16px;
  /* ... all sizing ... */

  /* Border Radius */
  --radius-sm: 4px;
  /* ... all radius ... */

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  /* ... all shadows ... */

  /* Animation */
  --duration-fast: 150ms;
  /* ... all durations and easings ... */

  /* Breakpoints */
  --breakpoint-mobile: 640px;
  /* ... all breakpoints ... */
}
```

**Transform to Tailwind Config:**

```javascript
// tailwind.config.js additions
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--color-primary-50)',
          /* ... */
          900: 'var(--color-primary-900)',
        },
        /* ... all color scales ... */
        action: {
          primary: {
            DEFAULT: 'var(--color-action-primary-default)',
            hover: 'var(--color-action-primary-hover)',
            /* ... */
          },
        },
        /* ... all semantic colors ... */
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        'display-01': ['4rem', { lineHeight: '1.1', letterSpacing: '-1px', fontWeight: '600' }],
        /* ... all text styles ... */
      },
      spacing: {
        /* ... map all space tokens ... */
      },
      borderRadius: {
        /* ... map all radius tokens ... */
      },
      boxShadow: {
        /* ... map all shadow tokens ... */
      },
      transitionDuration: {
        /* ... map all duration tokens ... */
      },
      transitionTimingFunction: {
        /* ... map all easing tokens ... */
      },
    },
  },
};
```

### Step 5.2: Component Specs

**For each of the 35 components, create a spec sheet:**

```
Component: Button
File: 02 — Primitives

Structure:
- Auto Layout: hug contents, horizontal
- Gap: var(--space-2)
- Padding: var(--space-5) horizontal, var(--space-3) vertical (Regular size)

Variants:
| Type | Size | State | Background | Text Color | Border | Shadow |
|------|------|-------|-----------|-----------|--------|--------|
| Primary | Regular | Default | --color-action-primary-default | --color-action-primary-text | none | none |
| Primary | Regular | Hover | --color-action-primary-hover | --color-action-primary-text | none | none |
| Primary | Regular | Active | --color-action-primary-active | --color-action-primary-text | none | none |
| Primary | Regular | Disabled | --color-action-primary-default | --color-action-primary-text | none | none | opacity: 0.5 |
| Secondary | Regular | Default | transparent | --color-action-primary-default | 1px solid --color-action-primary-default | none |
| ... etc for all combinations ... |

Typography:
- Large: Button/Large (16px, 500, letter-spacing 0.5px)
- Regular: Button/Regular (14px, 500, letter-spacing 0.5px)
- Small: Button/Small (12px, 500, letter-spacing 0.5px)

Iconography:
- Leading/Trailing icon: 20px (Regular), 24px (Large), 16px (Small)
- Icon Only: icon fills button area with padding

Accessibility:
- Role: button
- Focus: visible focus ring (--shadow-focus)
- Disabled: aria-disabled="true", not focusable
- Loading: aria-busy="true", maintain dimensions

Tokens Used:
- --color-action-primary-*
- --color-action-secondary-*
- --color-action-destructive-*
- --space-2, --space-3, --space-4, --space-5, --space-6
- --radius-md, --radius-lg
- --shadow-focus
- --duration-fast, --easing-ease
```

**Create spec sheets for all 35 components.** Use the same format.

### Step 5.3: Frame Redlines

**For every frame, add a redline layer:**

1. Create a new layer called `Redlines` on each frame
2. Use red lines (1px, `#FF0000`) to show:
   - Spacing between elements (label with pixel/rem value)
   - Component dimensions
   - Alignment relationships
3. Use red text annotations for:
   - Font size and weight
   - Color variable names
   - Spacing token names
4. Hide redlines for stakeholder presentations
5. Show redlines for developer review

**Example redline annotation:**
```
[Red line with label] "32px / space-8"
[Red text near heading] "H2 / Inter 600 / 32px / --color-text-default"
[Red line between buttons] "16px / space-4"
```

### Step 5.4: Asset Export

**Export all assets in these formats:**

| Asset Type | Format | Size | Naming |
|-----------|--------|------|--------|
| Icons | SVG | 24x24 | `icon-[name].svg` |
| Illustrations | SVG preferred, PNG 2x fallback | Original | `illustration-[name].svg` |
| Logos | SVG | Original | `logo-[variant].svg` |
| Avatars | PNG 2x | 96x96, 192x192 | `avatar-placeholder.png` |
| Social icons | SVG | 24x24 | `social-[platform].svg` |

**Export process:**
1. Select all icon components in `02 — Primitives`
2. Right-click → `Export` → SVG
3. Organize in folder structure:
   ```
   assets/
   ├── icons/
   ├── illustrations/
   ├── logos/
   └── social/
   ```
4. Run through SVGO optimization for icons
5. Verify all exports are clean (no extra groups, proper viewBox)

### Step 5.5: Handoff Documentation

**Create a handoff document (Notion or Confluence) with:**

1. **Project Overview**
   - Design system name and version
   - Team contacts
   - Figma file links

2. **Token Reference**
   - Link to `design-tokens.json`
   - Link to `design-tokens.css`
   - Link to Tailwind config
   - Visual token gallery with copyable values

3. **Component Index**
   - Table of all 35 components with:
     - Component name
     - Figma page location
     - Spec sheet link
     - Code component status (Not Started / In Progress / Complete)
     - Storybook link (when available)

4. **Frame Index**
   - Table of all journeys with:
     - Journey name
     - Number of frames
     - Figma page location
     - Prototype link
     - Implementation status

5. **Asset Inventory**
   - List of all exported assets
   - Location in codebase
   - Usage notes

6. **Known Issues & Decisions**
   - List of open questions
   - Link to Decision Log
   - Deviations from original spec with rationale

### Step 5.6: Handoff Review Meeting

**Schedule 2-hour meeting with:**
- Lead Designer (presents)
- Design Engineer (answers token questions)
- Frontend Lead (asks implementation questions)
- QA Engineer (asks about states and edge cases)

**Agenda:**
1. Token walkthrough (20 min)
2. Component demos (40 min)
3. Frame walkthrough of 2–3 key journeys (30 min)
4. Prototype demonstration (20 min)
5. Q&A and issue capture (10 min)

**Output:**
- Meeting notes with action items
- Sign-off from Frontend Lead
- List of implementation blockers (if any)

### Step 5.7: Weekly Design Review Gate

**Phase 5 Exit Checklist (Frontend Lead signs off):**

- [ ] `design-tokens.json` exported and validated
- [ ] CSS variables file created and reviewed
- [ ] Tailwind config updated with all tokens
- [ ] All 35 components have spec sheets
- [ ] Redline annotations exist on all frames
- [ ] All assets exported and optimized
- [ ] Handoff documentation is complete and accessible
- [ ] Handoff review meeting completed with no blockers
- [ ] Frontend Lead has signed off on build feasibility


# Journey: Search Recovery

**Status:** New canonical document  
**Last updated:** 2026-04-19  
**Scope:** Complete search experience including zero-results recovery, filter refinement, and query assistance  
**Actors:** User (client), System  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Frame-by-Frame Analysis](#2-frame-by-frame-analysis)
3. [Search State Machine](#3-search-state-machine)
4. [Business Rules](#4-business-rules)
5. [Deep Review & Recommendations](#5-deep-review--recommendations)
6. [Implementation Plan](#6-implementation-plan)

---

## 1. Executive Summary

Search is the primary discovery mechanism for users. While the search engine (`search_public_professionals_pgtrgm`) and filter pipeline are robust, the **recovery experience when no results are found is minimal** — just a generic empty state with "Limpar filtros." There is no guidance, no adjacent suggestions, no waitlist, and no query assistance.

**Critical insight:**
> A user who searches and finds nothing is a user about to leave. The current empty state is a dead end. Every zero-result query is a signal — either the user needs help refining, or the marketplace has a supply gap.

---

## 2. Frame-by-Frame Analysis

### PHASE 1: SEARCH INPUT

---

#### Frame 1.1: Search Query Bar

**Where:** `components/search/SearchQueryBar.tsx`  
**Current State:** Text input with placeholder "Nome, especialidade ou palavra-chave". Debounced blur-triggered search. "Atualizando resultados..." spinner.

**Frame-by-frame:**
```
[SearchQueryBar]
    ├── Label: "Buscar profissionais"
    ├── Input with Search icon
    ├── Placeholder: "Nome, especialidade ou palavra-chave"
    ├── onBlur → applies query, resets page to 1
    └── Spinner text below: "Atualizando resultados..."
```

**Problems identified:**
1. **No query suggestions** — User types blind; no autocomplete or trending queries
2. **No search history** — Returning user must retype common queries
3. **No query validation** — Single-character queries are allowed (always return nothing useful)
4. **Blur-triggered is aggressive** — User tabbing through the page accidentally triggers search

**Recommended Frame 1.1 (Target):**
```
[SearchQueryBar — Enhanced]
    ├── Label: "Buscar profissionais"
    ├── Input with Search icon
    ├── Placeholder: "Nome, especialidade ou palavra-chave"
    ├── [NEW] Autocomplete dropdown:
    │   ├── "Buscas populares"
    │   │   ├── "Psicologia online"
    │   │   ├── "Nutricionista esportivo"
    │   │   └── "Coach de carreira"
    │   ├── "Buscas recentes" (if logged in)
    │   └── "Sugestões" based on typed prefix
    ├── [NEW] Minimum query length: 2 characters
    ├── [NEW] Submit on Enter (not blur)
    └── [NEW] Clear button (X) when text present
```

---

#### Frame 1.2: Filter Bar — Desktop

**Where:** `components/search/DesktopFiltersAutoApply.tsx`  
**Current State:** 2-row grid of selects: Categoria, Subcategoria, Especialidade, Price slider, Horário, Idioma, Ordenar. Auto-applies on change.

**Frame-by-frame:**
```
[DesktopFiltersAutoApply — 12-column grid]
    ├── Categoria select (col-span-2)
    ├── Subcategoria select (col-span-2, disabled until categoria)
    ├── Especialidade select (col-span-2, disabled until subcategoria)
    ├── PriceRangeSlider (col-span-2)
    ├── Horário select (col-span-1)
    ├── Idioma select (col-span-1)
    └── Ordenar select (col-span-2)
```

**Problems identified:**
1. **No active filter chips** — User cannot see at a glance which filters are applied without scrolling up
2. **No filter count badge** — "Refinar" button on mobile shows dot, but desktop shows nothing
3. **Price slider max is arbitrary** — Capped at $50 USD equivalent; may not reflect actual market
4. **Cascading dependency is rigid** — Must pick category → subcategory → specialty in order
5. **No "near me" or location radius** — `localizacao` param exists but no UI for it

**Recommended Frame 1.2 (Target):**
```
[DesktopFilters — Enhanced]
    ├── Same grid layout
    ├── [NEW] Active filter chips row above results:
    │   ├── "Categoria: Psicologia [×]"
    │   ├── "Preço: R$ 50-200 [×]"
    │   └── "Limpar todos"
    ├── [NEW] Filter count badge on sticky header
    ├── [NEW] Location input: "Onde?" (country/city, optional)
    ├── [NEW] "Mais filtros" collapsible:
    │   ├── Experience: [1-3 anos] [3-5] [5-10] [10+]
    │   ├── Rating: [4★+] [4.5★+] [5★]
    │   └── First booking free/discount toggle
    └── [NEW] "Salvar busca" for logged-in users
```

---

#### Frame 1.3: Mobile Filters Drawer

**Where:** `components/search/MobileFiltersDrawer.tsx`  
**Current State:** Slide-out drawer from right (88% width). Same filters as desktop, stacked vertically. "Limpar filtros" link at bottom.

**Frame-by-frame:**
```
[MobileFiltersDrawer]
    ├── Trigger: "Refinar" button with dot if filters active
    ├── Slide-out drawer (right, 88% width)
    ├── Stacked selects: Categoria, Subcategoria, Especialidade, Price, Horário, Idioma, Ordenar
    ├── "Limpar filtros" link
    └── "Atualização automática" indicator
```

**Problems identified:**
1. **No "Apply" button** — Changes apply immediately, drawer stays open (user may not realize)
2. **Drawer is wide** — 88% feels claustrophobic; 75% is standard
3. **No results preview in drawer** — User must close to see if filters helped
4. **No filter summary in drawer header** — "3 filters active" would help

**Recommended Frame 1.3 (Target):**
```
[MobileFiltersDrawer — Enhanced]
    ├── Trigger: "Refinar (3)" with count
    ├── Slide-out drawer (right, 75% width)
    ├── Header: "Refinar (3 ativos) [×]"
    ├── Stacked filters
    ├── [NEW] Live results count: "142 profissionais encontrados"
    ├── [NEW] [Aplicar e ver resultados] primary button
    └── [NEW] [Limpar tudo] secondary button
```

---

### PHASE 2: RESULTS DISPLAY

---

#### Frame 2.1: Results List — Card Layout

**Where:** `app/buscar/page.tsx` — paged professionals grid  
**Current State:** 2-column grid (xl), card per professional with cover photo, avatar, name, specialty, tags, price, rating, CTA.

**Frame-by-frame:**
```
[Search Results — Cards]
    ├── Result count: "X profissionais disponíveis"
    ├── Active filter pills (category, subcategory, specialty only)
    ├── Grid: 1 col (mobile) → 2 cols (xl)
    ├── Card:
    │   ├── Cover photo (if any)
    │   ├── Avatar + Name + Specialty
    │   ├── ExpandableTags (max 3)
    │   ├── Price in user currency
    │   ├── Rating + reviews count
    │   └── [Ver perfil] / [Agendar] CTAs
    └── Pagination: page numbers + Previous/Next
```

**Problems identified:**
1. **No availability indicator on card** — User clicks "Agendar" only to find no slots
2. **No "verified" or "popular" badges** — Trust signals are buried
3. **No comparison mode** — Cannot select multiple pros to compare side-by-side
4. **No "saved" or "favorite" from search** — Must enter profile to favorite
5. **No quick-book** — Always redirects to profile; no inline slot picker

**Recommended Frame 2.1 (Target):**
```
[Search Results — Enhanced Cards]
    ├── Result count + sort dropdown (sticky on scroll)
    ├── Active filter chips with remove
    ├── Grid: 1 col → 2 cols → 3 cols (on large screens)
    ├── Card:
    │   ├── Cover photo
    │   ├── Avatar + Name
    │   ├── Badges: [Verificado] [Popular] [Novo] [Top Rated]
    │   ├── Specialty + tags
    │   ├── [NEW] Next availability: "Próximo: Seg, 10:00" or "Sem vagas"
    │   ├── Price + duration
    │   ├── Rating (★ 4.8) + reviews + bookings
    │   ├── [NEW] ♡ Favorite (toggle inline)
    │   └── CTAs: [Ver perfil] [Agendar]
    └── Pagination OR infinite scroll
```

---

#### Frame 2.2: Empty State — Zero Results

**Where:** `app/buscar/page.tsx` — conditional render  
**Current State:**
```
<div className="rounded-2xl border border-neutral-200 bg-white px-6 py-12 text-center">
  <p className="mb-1 text-base font-semibold text-neutral-900">Nenhum profissional encontrado</p>
  <p className="mx-auto max-w-md text-sm text-neutral-500">
    Ajuste categoria, subcategoria, especialidade ou faixa de preço para ver mais resultados.
  </p>
  {hasActiveFilters ? <Link href="...">Limpar filtros</Link> : null}
</div>
```

**Frame-by-frame (detailed):**
```
[Empty State — Current]
    ├── Heading: "Nenhum profissional encontrado"
    ├── Subtext: "Ajuste categoria, subcategoria, especialidade ou faixa de preço"
    └── [Limpar filtros] button (only if hasActiveFilters)
```

**Problems identified:**
1. **Dead end** — No paths forward except "clear everything"
2. **No breakdown of WHY zero** — Which filter is the blocker?
3. **No adjacent suggestions** — "We don't have X, but we have Y"
4. **No waitlist** — "Tell me when someone becomes available"
5. **No query assistance** — "Did you mean...?"
6. **No visual interest** — Plain text on white; no illustration

**Recommended Frame 2.2 (Target):**
```
[Empty State — Enhanced Recovery]
    
    Visual: Friendly illustration of empty search
    ├── Heading: "Nenhum profissional encontrado"
    ├── [NEW] Filter impact analysis:
    │   ├── "Com seus filtros atuais: 0 resultados"
    │   ├── "Sem categoria 'Psicologia': 12 resultados"
    │   ├── "Sem preço máximo R$ 100: 8 resultados"
    │   └── "Sem idioma 'Inglês': 45 resultados"
    │   └── [Remover filtro mais restritivo]
    │
    ├── [NEW] Adjacent categories:
    │   ├── "Não encontrou psicólogos? Talvez você precise de:"
    │   ├── [Coach] [Terapeuta] [Conselheiro]
    │   └── Each shows count: "Coach (8 disponíveis)"
    │
    ├── [NEW] Relaxed search:
    │   ├── "Mostrando resultados mais amplos:"
    │   └── 3-5 cards from broader category
    │
    ├── [NEW] Waitlist capture:
    │   ├── "Avise-me quando houver [Psicólogos em São Paulo]"
    │   └── [Cadastrar interesse] → stores in waitlist table
    │
    ├── [NEW] Query assistance:
    │   ├── "Você quis dizer: [Psicologia] em vez de [Psicologa]?"
    │   └── "Tente: [Psicoterapia online]"
    │
    └── Fallback: [Limpar todos os filtros]
```

---

#### Frame 2.3: Low Results (1-3)

**Where:** `app/buscar/page.tsx`  
**Current State:** Same layout, just fewer cards. No special treatment.

**Recommended Frame 2.3 (Target):**
```
[Low Results State]
    ├── "Poucos profissionais para seus critérios (3)"
    ├── [NEW] "Simplificar filtros para ver mais"
    ├── Cards displayed normally
    └── [NEW] Below cards: "Profissionais similares que também podem ajudar"
        └── 3 cards from parent category
```

---

### PHASE 3: QUERY ASSISTANCE

---

#### Frame 3.1: Did-You-Mean

**Where:** New component  
**Current State:** Does not exist.

**Recommended Frame 3.1 (Target):**
```
[Did-You-Mean Banner]
    ├── Trigger: fuzzy match on taxonomy synonyms
    ├── Display: "Você quis dizer: [Psicoterapia]?"
    └── Action: [Sim, mostrar] → redirects with corrected query
    
    Synonym mapping:
    ├── "psicologa" → "psicologia"
    ├── "nutri" → "nutricionista"
    ├── "personal" → "personal trainer"
    └── "advogado" → "direito"
```

---

#### Frame 3.2: Trending & Popular Searches

**Where:** Below search bar (when no text entered)  
**Current State:** "Sugestões iniciais variadas para te ajudar a começar." text only.

**Recommended Frame 3.2 (Target):**
```
[Trending Searches]
    ├── "Buscas populares esta semana"
    ├── Pill buttons: [Psicologia] [Nutrição] [Coach] [Yoga] [Direito]
    └── Each pill navigates to /buscar?categoria=[slug]
    
    [Trending Professionals]
    ├── "Profissionais em alta"
    └── 3-5 mini cards of top-rated pros
```

---

### PHASE 4: WAITLIST & SUPPLY SIGNALING

---

#### Frame 4.1: Waitlist Capture

**Where:** Empty state  
**Current State:** Does not exist.

**Recommended Frame 4.1 (Target):**
```
[Waitlist Form]
    ├── Heading: "Não encontrou o que procura?"
    ├── "Avise-me quando houver profissionais em [Category] em [Location]"
    ├── Email input (pre-filled if logged in)
    ├── [Cadastrar interesse]
    └── "Você receberá um email quando novos profissionais entrarem."
    
    Backend:
    ├── Stores: user_id, query_params, email, created_at
    ├── Cron: daily check for new pros matching waitlist criteria
    └── Notification: "Novo profissional em [Category]! Veja agora."
```

---

#### Frame 4.2: Supply Gap Analytics (Internal)

**Where:** Admin dashboard  
**Current State:** Does not exist.

**Recommended Frame 4.2 (Target):**
```
[Admin: Search Analytics]
    ├── "Zero-result queries (7 dias)"
    ├── Table: query | filters | count | location | category
    ├── "Top supply gaps:"
    │   ├── 1. "Psicologia + São Paulo + < R$ 50" — 45 queries
    │   ├── 2. "Nutricionista + Inglês" — 32 queries
    │   └── 3. "Advogado tributário" — 28 queries
    └── Action: [Recruit pros for this category]
```

---

## 3. Search State Machine

```
initial ──[user types]──→ typing
    │
    ├──[ Enter / submit ]──→ searching ──[results > 0]──→ results_displayed
    │                              │
    │                              ├──[results = 0, hasActiveFilters]──→ zero_results_filtered
    │                              └──[results = 0, no filters]──→ zero_results_bare
    │
    └──[user clears]──→ initial

zero_results_filtered ──[remove filter]──→ searching
    │
    ├──[clear all]──→ initial
    └──[waitlist signup]──→ waitlisted

results_displayed ──[user refines]──→ searching
    │
    ├──[user clicks pro]──→ profile_navigation
    └──[user paginates]──→ searching
```

---

## 4. Business Rules

### Minimum Query Requirements

| Rule | Value | Rationale |
|------|-------|-----------|
| Min query length | 2 chars | Prevents accidental single-char searches |
| Max query length | 100 chars | Prevents abuse |
| Debounce delay | 300ms | Balance responsiveness vs. server load |

### Empty State Priorities

When zero results, suggest in this order:
1. Remove most restrictive filter (highest impact)
2. Adjacent categories (same parent taxonomy)
3. Broader query (remove specialty, keep category)
4. Waitlist capture
5. Clear all

### Waitlist Rules

| Trigger | Max waitlists per user | Expiry |
|---------|------------------------|--------|
| Zero results with category filter | 10 active | 90 days |
| Notification | 1 per matching pro per week | — |
| Unsubscribe | Anytime via link | — |

---

## 5. Deep Review & Recommendations

### Critical Issues

#### C1: Empty State Is a Dead End
**Severity:** Critical  
**Impact:** Users bounce immediately; conversion loss  
**Fix:** Build enhanced empty state with filter impact analysis, adjacent categories, and waitlist.

#### C2: No Query Suggestions or Autocomplete
**Severity:** Critical  
**Impact:** Users type inefficient queries; misspelling = zero results  
**Fix:** Add autocomplete with taxonomy-backed suggestions + trending searches.

#### C3: No "Why Zero" Breakdown
**Severity:** High  
**Impact:** User guesses which filter to remove; often removes wrong one  
**Fix:** Show per-filter impact count: "Without price filter: 8 results".

### High Priority

#### H1: No Availability Preview on Cards
**Severity:** High  
**Impact:** Users click into profiles with no available slots  
**Fix:** Show "Next available" or "No slots" on each card.

#### H2: No Favorite from Search
**Severity:** Medium  
**Impact:** Lower engagement; users forget interesting pros  
**Fix:** Add heart toggle on cards (logged-in only).

#### H3: No Search History
**Severity:** Medium  
**Impact:** Returning users repeat effort  
**Fix:** Store last 10 searches per user; show in autocomplete.

### Medium Priority

#### M1: Mobile Drawer UX
**Severity:** Medium  
**Impact:** Mobile users struggle with filter discoverability  
**Fix:** Reduce drawer width, add apply button, show live count.

#### M2: No Saved Searches
**Severity:** Low  
**Impact:** Power users cannot monitor supply  
**Fix:** "Save search" for logged-in users with new-result alerts.

---

## 6. Implementation Plan

### Phase 1: Empty State Hardening (Week 1)

| Task | File | Effort |
|------|------|--------|
| Enhanced empty state component | `components/search/SearchEmptyState.tsx` | 2 days |
| Filter impact analysis | `lib/search/filter-impact.ts` | 1 day |
| Adjacent category suggestions | `lib/taxonomy/adjacent-categories.ts` | 1 day |
| Waitlist form + API | `lib/actions/waitlist.ts` + `app/api/waitlist/route.ts` | 1 day |

### Phase 2: Query Assistance (Week 1-2)

| Task | File | Effort |
|------|------|--------|
| Autocomplete component | `components/search/SearchAutocomplete.tsx` | 2 days |
| Taxonomy synonym mapping | `lib/taxonomy/synonyms.ts` | 1 day |
| Trending searches | `lib/search/trending.ts` | 1 day |
| Search history (logged-in) | `lib/actions/search-history.ts` | 1 day |

### Phase 3: Card Enhancement (Week 2)

| Task | File | Effort |
|------|------|--------|
| Next availability on cards | `lib/search/next-availability.ts` | 1 day |
| Inline favorite toggle | `components/search/SearchResultCard.tsx` | 1 day |
| Badges system | `components/search/ProBadges.tsx` | 1 day |

### Phase 4: Mobile Filter UX (Week 2-3)

| Task | File | Effort |
|------|------|--------|
| Redesigned mobile drawer | `components/search/MobileFiltersDrawer.tsx` | 2 days |
| Live results count in drawer | `lib/search/live-count.ts` | 1 day |

### Phase 5: Internal Analytics (Week 3)

| Task | File | Effort |
|------|------|--------|
| Zero-result query logging | `lib/search/analytics.ts` | 1 day |
| Admin supply gap dashboard | `app/(app)/admin/search-analytics/page.tsx` | 2 days |

---

## Related Documents

- `docs/product/journeys/search-booking.md` — Parent search journey
- `docs/product/journeys/global-context-propagation.md` — Currency/location in search
- `lib/search-config.ts` — Search configuration constants


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.

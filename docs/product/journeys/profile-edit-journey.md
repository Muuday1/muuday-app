# Journey: Profile Edit

**Status:** New canonical document  
**Last updated:** 2026-04-19  
**Scope:** User profile editing and professional public profile editing  
**Actors:** User, Professional, System, Admin (review)  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Frame-by-Frame Analysis](#2-frame-by-frame-analysis)
3. [Profile State Model](#3-profile-state-model)
4. [Business Rules](#4-business-rules)
5. [Deep Review & Recommendations](#5-deep-review--recommendations)
6. [Implementation Plan](#6-implementation-plan)

---

## 1. Executive Summary

Profile editing covers two distinct flows: **user profile** (`/editar-perfil`) for personal settings (name, country, timezone, currency) and **professional profile** (`/editar-perfil-profissional`) for public-facing service information (bio, category, price, credentials). The professional profile edit is particularly critical because **changes trigger administrative re-review**, which can temporarily remove the pro from search.

**Critical insight:**
> Professional profile editing is high-stakes: a pro fixing a typo in their bio can accidentally trigger a 24-48h re-review that makes them invisible. The current UI warns about this but doesn't explain what triggers re-review vs. what doesn't.

---

## 2. Frame-by-Frame Analysis

### PHASE 1: USER PROFILE EDIT

---

#### Frame 1.1: User Edit Profile Form

**Where:** `app/(app)/editar-perfil/page.tsx` + `EditProfileForm.tsx`  
**Current State:** Simple form: full name, country, timezone, currency.

**Frame-by-frame:**
```
[/editar-perfil]
    ├── Back link: "Voltar ao perfil"
    ├── Header: "Editar Perfil"
    ├── Form:
    │   ├── Nome completo (text)
    │   ├── País (select) → auto-sets timezone + currency
    │   ├── Fuso horário (select)
    │   └── Moeda (select)
    └── [Salvar alterações]
```

**Problems identified:**
1. **No avatar upload** — User cannot change profile photo
2. **No phone number** — Cannot add contact number
3. **No language preference** — UI language not editable
4. **No account deletion** — GDPR/CCPA requirement missing
5. **Country change warning** — If user changes country, no warning about implications

**Recommended Frame 1.1 (Target):**
```
[/editar-perfil — Enhanced]
    ├── Header: "Editar Perfil"
    ├── Avatar section (NEW):
    │   ├── Current avatar or placeholder
    │   └── [Alterar foto]
    ├── Personal info:
    │   ├── Nome completo
    │   └── Telefone (optional)
    ├── Location & Time:
    │   ├── País
    │   ├── Fuso horário
    │   └── Horário local atual: "14:32 (São Paulo)"
    ├── Preferences:
    │   ├── Moeda
    │   └── Idioma da interface (NEW)
    ├── [Salvar alterações]
    └── [NEW] Danger zone:
        └── [Excluir minha conta] → confirmation modal
```

---

### PHASE 2: PROFESSIONAL PROFILE EDIT

---

#### Frame 2.1: Professional Edit Profile Form

**Where:** `app/(app)/editar-perfil-profissional/page.tsx` + `ProfessionalProfileEditForm.tsx`  
**Current State:** Category selector, bio, tags, languages, video intro (tier-gated), social links (tier-gated), credentials, pricing.

**Frame-by-frame (detailed):**
```
[/editar-perfil-profissional]
    ├── Back link: "Voltar ao perfil"
    ├── Header: "Editar perfil profissional" + tier badge
    ├── Category selector (grid of emoji + name)
    ├── Sobre você: bio textarea (min 20 chars, max 5000)
    ├── Foco de atuação: tags input (comma-separated)
    ├── Idiomas: toggle pills (6 options)
    ├── Diferenciais públicos (tier-gated):
    │   ├── Vídeo de apresentação URL
    │   └── Links sociais (1 per line)
    ├── Credenciais: textarea (URLs, 1 per line)
    ├── Formato da sessão:
    │   ├── Preço (BRL)
    │   └── Duração: [30m] [45m] [50m] [60m] [90m]
    ├── Warning banner: "Ao salvar, seu perfil volta para revisão administrativa"
    └── [Salvar alterações]
    
    [Success state]
    ├── "Perfil atualizado com sucesso. Redirecionando..."
    └── Auto-redirect to /perfil after 1.4s
```

**Problems identified:**
1. **No live preview** — Pro cannot see how profile looks while editing
2. **No "what triggers re-review" breakdown** — Warning is vague; which fields trigger admin review?
3. **No auto-save** — One accidental refresh loses all changes
4. **No SEO/meta editing** — Cannot customize what search engines see
5. **No subcategory/specialty editing** — Only main category is editable
6. **Credentials are just URLs** — No file upload, no validation status
7. **Cover photo editing missing** — Loaded in initialData but no UI to change it
8. **No WhatsApp number editing** — Field exists but not in form
9. **Price is BRL-only** — No multi-currency pricing

**Recommended Frame 2.1 (Target):**
```
[/editar-perfil-profissional — Enhanced]
    
    Header:
    ├── "Editar perfil profissional"
    ├── Tier badge
    └── [NEW] Live preview toggle: [Editar] [Preview]
    
    When Preview mode ON:
    ├── Split screen: edit form (left) + public profile preview (right)
    └── Preview updates in real-time as fields change
    
    Edit form sections:
    
    Section 1: Identidade Visual
    ├── [NEW] Cover photo upload
    │   ├── Current cover preview
    │   └── [Alterar capa] → upload + crop
    ├── [NEW] Avatar upload
    │   └── [Alterar foto] → upload + crop
    └── [NEW] Vídeo de apresentação:
        └── Upload or URL (depending on tier)
    
    Section 2: Sobre
    ├── Bio textarea
    ├── [NEW] Subcategoria select (dependent on category)
    ├── [NEW] Especialidades select (dependent on subcategory)
    └── Tags input with autocomplete from taxonomy
    
    Section 3: Serviços (NEW — Multi-Service)
    ├── Service 1: "Sessão Inicial"
    │   ├── Nome do serviço
    │   ├── Descrição (textarea)
    │   ├── Duração: [30m] [45m] [50m] [60m] [90m]
    │   ├── Preço (BRL)
    │   ├── Permitir recorrente: [ ] toggle
    │   ├── Ativo: [✓] toggle
    │   └── [Remover serviço]
    ├── Service 2: "Acompanhamento"
    │   ├── (same fields)
    │   └── [Remover serviço]
    ├── [+ Adicionar serviço]
    │   └── (disabled if at tier limit)
    └── Re-order handle (⋮⋮) per service
    
    Section 4: Contato
    
    Section 4: Contato
    ├── WhatsApp
    ├── [NEW] Email de contato público (optional)
    └── Links sociais (1 per line)
    
    Section 5: Credenciais
    ├── Upload de documentos (PDF/IMG)
    │   └── Status: [Em análise] [Aprovado] [Rejeitado]
    └── [NEW] CRP/CRM/OAB number (with validation)
    
    Section 6: SEO
    ├── [NEW] Título do perfil (meta title)
    ├── [NEW] Descrição para busca (meta description)
    └── [NEW] Palavras-chave
    
    Warning banner (contextual):
    ├── "Alterações em: [Categoria, Preço, Credenciais] → Revisão obrigatória"
    ├── "Alterações em: [Bio, Links] → Publicação imediata"
    └── [Salvar alterações]
```

---

#### Frame 2.2: Re-Review Status

**Where:** After saving professional profile edits  
**Current State:** Success toast then redirect. No status tracking.

**Recommended Frame 2.2 (Target):**
```
[Post-Edit Status]
    ├── "Alterações salvas!"
    ├── If re-review triggered:
    │   ├── "Seu perfil está em revisão administrativa."
    │   ├── "Tempo estimado: 24-48h"
    │   ├── Status tracker: [Enviado] → [Em análise] → [Aprovado]
    │   └── "Você receberá uma notificação quando for aprovado."
    ├── If immediate publish:
    │   └── "Alterações publicadas!"
    └── CTAs: [Ver perfil público] [Voltar ao dashboard]
```

---

## 3. Profile State Model

### Professional Profile Edit → Review Trigger

| Field Changed | Triggers Re-Review | Reason |
|---------------|-------------------|--------|
| Category | Yes | Taxonomy validation |
| Subcategory | Yes | Taxonomy validation |
| Bio | No | Content change only |
| Price | Yes | Pricing compliance |
| Duration | No | Operational change |
| Credentials | Yes | Verification required |
| Cover photo | No | Visual change |
| Video intro | No | Content change |
| Social links | No | External links |
| Tags | No | Search keywords |

---

## 4. Business Rules

### User Profile

| Field | Required | Editable |
|-------|----------|----------|
| Full name | Yes | Yes |
| Country | Yes | Yes (with warning) |
| Timezone | Yes | Yes |
| Currency | Yes | Yes |
| Avatar | No | Yes |
| Phone | No | Yes |

### Professional Profile

| Field | Required | Editable | Triggers Review |
|-------|----------|----------|-----------------|
| Category | Yes | Yes | Yes |
| Bio | Yes (min 20) | Yes | No |
| Tags | No | Yes | No |
| Languages | Yes (min 1) | Yes | No |
| Price | Yes (>0) | Yes | Yes |
| Duration | Yes | Yes | No |
| Services (multi) | Yes | Yes | Yes (if price changes) |
| Credentials | No | Yes | Yes |
| Cover photo | No | Yes | No |
| Video intro | Tier-gated | Yes | No |

---

## 5. Deep Review & Recommendations

### Critical Issues

#### C1: No Live Preview
**Severity:** Critical  
**Impact:** Pros publish changes without seeing result  
**Fix:** Split-view editor with real-time preview.

#### C2: Re-Review Trigger Is Opaque
**Severity:** Critical  
**Impact:** Pros accidentally trigger review, lose visibility  
**Fix:** Explicit per-field labels: "🔄 Requer revisão" vs "⚡ Publicação imediata".

#### C3: No Auto-Save
**Severity:** High  
**Impact:** Lost work on accidental refresh  
**Fix:** Auto-save drafts to localStorage or DB every 30s.

### High Priority

#### H1: Missing Subcategory/Specialty Edit
**Severity:** High  
**Impact:** Cannot refine service offering  
**Fix:** Cascading category → subcategory → specialty selector.

#### H2: No File Upload for Credentials
**Severity:** High  
**Impact:** Credential URLs can break or be invalid  
**Fix:** Direct file upload with scan/validation.

#### H3: No Cover Photo Editor
**Severity:** Medium  
**Impact:** Visual identity cannot be updated  
**Fix:** Add cover photo upload/crop to edit form.

---

## 6. Implementation Plan

### Phase 1: Live Preview (Week 1)

| Task | File | Effort |
|------|------|--------|
| Split-view editor layout | `app/(app)/editar-perfil-profissional/page.tsx` | 2 days |
| Live preview component | `components/professional/ProfileLivePreview.tsx` | 2 days |

### Phase 2: Smart Save & Review Warnings (Week 1)

| Task | File | Effort |
|------|------|--------|
| Per-field review trigger labels | `components/professional/ProfessionalProfileEditForm.tsx` | 1 day |
| Auto-save draft | `lib/professional/draft-autosave.ts` | 2 days |

### Phase 3: Enhanced Fields (Week 2)

| Task | File | Effort |
|------|------|--------|
| Subcategory/specialty cascade | `components/professional/ProfessionalProfileEditForm.tsx` | 2 days |
| Cover photo upload | `components/professional/CoverPhotoUploader.tsx` | 1 day |
| Credential file upload | `components/professional/CredentialUploader.tsx` | 2 days |

### Phase 4: Multi-Service Editor (Week 3)

| Task | File | Effort |
|------|------|--------|
| Service list editor | `components/professional/ServiceEditor.tsx` | 2 days |
| Service add/remove with tier limits | `components/professional/ServiceEditor.tsx` | 1 day |
| Service re-ordering | `components/professional/ServiceReorderList.tsx` | 1 day |
| Service validation in save action | `lib/actions/professional.ts` | 1 day |

### Phase 5: User Profile Enhancement (Week 3)

| Task | File | Effort |
|------|------|--------|
| Avatar upload | `components/profile/AvatarUploader.tsx` | 1 day |
| Account deletion flow | `app/api/account/delete/route.ts` | 2 days |

---

## Related Documents

- `docs/product/journeys/professional-onboarding.md` — Onboarding profile creation
- `docs/product/journeys/search-booking.md` — Profile public display
- `docs/product/journeys/professional-workspace-journey.md` — Dashboard quick action

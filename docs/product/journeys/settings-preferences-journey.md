# Journey: Settings & Preferences

**Status:** New canonical document  
**Last updated:** 2026-04-19  
**Scope:** User and professional account settings, notification preferences, security, and regional preferences  
**Actors:** User, Professional, System  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Frame-by-Frame Analysis](#2-frame-by-frame-analysis)
3. [Settings State Model](#3-settings-state-model)
4. [Business Rules](#4-business-rules)
5. [Deep Review & Recommendations](#5-deep-review--recommendations)
6. [Implementation Plan](#6-implementation-plan)

---

## 1. Executive Summary

Settings (`/configuracoes`) is the account management hub. **Today it is professional-only** — non-professional users are redirected to `/perfil`. The settings page has four sections: Professional Workspace Summary, Region Settings, Notification Settings, and Security Settings. It is functional but minimal, with no advanced preferences and a confusing redirect for users.

**Critical insight:**
> Settings is the "boring but essential" page that becomes a support ticket magnet when broken. Today, regular users cannot access settings at all, and professionals have limited notification controls. This creates friction for both personas.

---

## 2. Frame-by-Frame Analysis

### PHASE 1: SETTINGS ENTRY

---

#### Frame 1.1: Settings Page — Professional

**Where:** `app/(app)/configuracoes/page.tsx` + `ProfessionalSettingsWorkspace.tsx`  
**Current State:** Header + ProfessionalWorkspaceSection + RegionSettings + NotificationSettings + SecuritySettings + danger zone.

**Frame-by-frame:**
```
[/configuracoes — Professional]
    ├── Header: "Configurações do negócio"
    ├── ProfessionalWorkspaceSection:
    │   ├── Summary cards (status, tier, pending confirmations, etc.)
    │   └── Onboarding evaluation (if applicable)
    ├── RegionSettings:
    │   ├── Fuso horário select
    │   └── Moeda select
    ├── NotificationSettings:
    │   ├── Toggle: Novos agendamentos
    │   ├── Toggle: Lembretes de sessão
    │   ├── Toggle: Cancelamentos
    │   ├── Toggle: Avaliações
    │   ├── Toggle: Pagamentos
    │   ├── Toggle: Atualizações da plataforma
    │   └── Toggle: Marketing
    ├── SecuritySettings:
    │   ├── [Alterar senha] → /recuperar-senha
    │   ├── [Visibilidade do perfil] (TODO)
    │   └── [Sair da conta]
    └── Danger zone: [Sair da conta] button
```

**Problems identified:**
1. **User redirect is confusing** — `/configuracoes` redirects non-pros to `/perfil`; no explanation
2. **No notification channels** — Cannot choose email vs push vs in-app per type
3. **No notification frequency** — Cannot choose immediate vs digest
4. **Region settings lack context** — Changing timezone shows no impact preview
5. **Security is minimal** — No 2FA, no session management, no login history
6. **No data export** — GDPR right to data portability not supported
7. **No dark mode** — Accessibility/UX preference missing

---

#### Frame 1.2: Settings Page — User (Currently Redirected)

**Where:** `app/(app)/configuracoes/page.tsx`  
**Current State:** Redirects to `/perfil` if role !== 'profissional'.

**Recommended Frame 1.2 (Target):**
```
[/configuracoes — User]
    ├── Header: "Configurações"
    ├── Account:
    │   ├── Nome completo
    │   ├── Email
    │   └── [Alterar senha]
    ├── Regional:
    │   ├── País
    │   ├── Fuso horário
    │   └── Moeda
    ├── Notifications:
    │   ├── Toggle: Novos agendamentos
    │   ├── Toggle: Lembretes de sessão
    │   ├── Toggle: Cancelamentos
    │   ├── Toggle: Avaliações
    │   └── Toggle: Marketing
    ├── Privacy:
    │   ├── [Baixar meus dados] (GDPR)
    │   └── [Excluir minha conta]
    └── [Sair da conta]
```

---

### PHASE 2: NOTIFICATION PREFERENCES

---

#### Frame 2.1: Notification Settings

**Where:** `components/settings/notification-settings.tsx`  
**Current State:** Simple toggles per notification type.

**Frame-by-frame:**
```
[NotificationSettings]
    ├── Toggle: Novos agendamentos
    ├── Toggle: Lembretes de sessão
    ├── Toggle: Cancelamentos
    ├── Toggle: Avaliações
    ├── Toggle: Pagamentos
    ├── Toggle: Atualizações da plataforma
    └── Toggle: Marketing
```

**Problems identified:**
1. **No channel selection** — All notifications go through default channel
2. **No granular control** — "Novos agendamentos" is too broad
3. **No quiet hours** — Cannot set Do Not Disturb
4. **No frequency** — Cannot choose daily digest vs immediate
5. **No preview** — Toggle doesn't show example of what notification looks like

**Recommended Frame 2.1 (Target):**
```
[NotificationSettings — Enhanced]
    ├── Channel preferences (per type):
    │   ├── Type: Novos agendamentos
    │   │   ├── [✓] In-app    [✓] Email    [ ] Push
    │   │   └── Frequency: [Imediato ▼] / Diário / Semanal
    │   ├── Type: Lembretes de sessão
    │   │   ├── [✓] In-app    [✓] Email    [✓] Push
    │   │   └── Frequency: [Imediato ▼]
    │   └── ... (same pattern for all types)
    ├── Quiet hours (NEW):
    │   ├── [✓] Ativar horário de descanso
    │   ├── Das: [22:00]
    │   └── Até: [08:00]
    └── [Salvar preferências]
```

---

### PHASE 3: SECURITY SETTINGS

---

#### Frame 3.1: Security Section

**Where:** `components/settings/security-settings.tsx`  
**Current State:** Change password, visibility (TODO), sign out.

**Recommended Frame 3.1 (Target):**
```
[SecuritySettings — Enhanced]
    ├── Authentication:
    │   ├── [Alterar senha]
    │   └── [NEW] Autenticação de dois fatores (2FA):
    │       └── Status: [Desativado] → [Ativar]
    ├── Sessions (NEW):
    │   ├── "Você está logado em:"
    │   ├── Device 1: Chrome / Windows — São Paulo — Agora [Encerrar]
    │   └── Device 2: Safari / iOS — São Paulo — 2 dias atrás [Encerrar]
    ├── Login History (NEW):
    │   ├── [Ver histórico de acesso]
    │   └── Table: Data | IP | Dispositivo | Sucesso/Falha
    └── [Sair de todas as sessões]
```

---

### PHASE 4: DATA & PRIVACY

---

#### Frame 4.1: Data Export & Deletion

**Where:** New section  
**Current State:** Does not exist.

**Recommended Frame 4.1 (Target):**
```
[Data & Privacy]
    ├── Exportar dados (GDPR/CCPA):
    │   ├── "Baixe uma cópia dos seus dados"
    │   ├── Formato: [JSON ▼] [CSV]
    │   └── [Solicitar exportação] → email sent when ready
    ├── Excluir conta:
    │   ├── Warning: "Esta ação é irreversível..."
    │   ├── [Entendo, quero excluir]
    │   └── Confirmation: type email to confirm
    └── Política de privacidade link
```

---

## 3. Settings State Model

### Notification Preference Schema

```typescript
type NotificationChannel = 'in_app' | 'email' | 'push'
type NotificationFrequency = 'immediate' | 'daily_digest' | 'weekly_digest'

type NotificationPreferences = {
  new_bookings: { channels: NotificationChannel[]; frequency: NotificationFrequency }
  session_reminders: { channels: NotificationChannel[]; frequency: NotificationFrequency }
  cancellations: { channels: NotificationChannel[]; frequency: NotificationFrequency }
  reviews: { channels: NotificationChannel[]; frequency: NotificationFrequency }
  payments: { channels: NotificationChannel[]; frequency: NotificationFrequency }
  platform_updates: { channels: NotificationChannel[]; frequency: NotificationFrequency }
  marketing: { channels: NotificationChannel[]; frequency: NotificationFrequency }
}
```

---

## 4. Business Rules

### Notification Defaults

| Type | Default Channels | Default Frequency | Can Disable |
|------|-----------------|-------------------|-------------|
| New bookings | In-app, Email | Immediate | No (pro) |
| Session reminders | In-app, Email, Push | Immediate | No |
| Cancellations | In-app, Email | Immediate | No |
| Reviews | In-app | Immediate | Yes (pro) |
| Payments | In-app, Email | Immediate | No |
| Platform updates | Email | Weekly digest | Yes |
| Marketing | Email | Weekly digest | Yes |

### Quiet Hours

| Setting | Default | Max Range |
|---------|---------|-----------|
| Start | 22:00 | 00:00-23:00 |
| End | 08:00 | 01:00-23:59 |
| Effect | Push notifications batched; emails delayed | — |

---

## 5. Deep Review & Recommendations

### Critical Issues

#### C1: Non-Professional Users Cannot Access Settings
**Severity:** Critical  
**Impact:** Users cannot manage notifications, change password, or export data  
**Fix:** Build user-facing settings page; remove redirect.

#### C2: No Notification Channel Control
**Severity:** High  
**Impact:** Notification fatigue; users disable all or leave  
**Fix:** Per-type channel selection (in-app/email/push).

#### C3: No Data Export or Account Deletion
**Severity:** High  
**Impact:** GDPR/CCPA non-compliance; legal risk  
**Fix:** Add data export and account deletion flows.

### High Priority

#### H1: No Quiet Hours
**Severity:** Medium  
**Impact:** Pros disturbed at night by booking notifications  
**Fix:** Add Do Not Disturb with configurable hours.

#### H2: No Session Management
**Severity:** Medium  
**Impact:** Cannot revoke access from lost/stolen devices  
**Fix:** Active sessions list with revoke.

#### H3: No 2FA
**Severity:** Medium  
**Impact:** Account security relies on password only  
**Fix:** Add TOTP-based 2FA.

---

## 6. Implementation Plan

### Phase 1: User Settings Page (Week 1)

| Task | File | Effort |
|------|------|--------|
| User settings page | `app/(app)/configuracoes/page.tsx` | 2 days |
| Remove pro-only redirect | `app/(app)/configuracoes/page.tsx` | 1 hour |
| User settings form | `components/settings/UserSettingsForm.tsx` | 1 day |

### Phase 2: Notification Preferences (Week 1-2)

| Task | File | Effort |
|------|------|--------|
| Enhanced notification settings | `components/settings/NotificationSettings.tsx` | 2 days |
| Channel + frequency schema | `lib/notifications/preferences.ts` | 1 day |
| Quiet hours | `components/settings/QuietHours.tsx` | 1 day |

### Phase 3: Security (Week 2)

| Task | File | Effort |
|------|------|--------|
| Session management | `components/settings/SessionManager.tsx` | 2 days |
| Login history | `lib/auth/login-history.ts` | 1 day |
| 2FA setup | `components/settings/TwoFactorSetup.tsx` | 3 days |

### Phase 4: Data & Privacy (Week 3)

| Task | File | Effort |
|------|------|--------|
| Data export | `app/api/export-data/route.ts` | 2 days |
| Account deletion | `app/api/account/delete/route.ts` | 2 days |

---

## Related Documents

- `docs/product/journeys/global-context-propagation.md` — Timezone/currency settings
- `docs/product/journeys/notification-inbox-lifecycle.md` — Notification dispatch
- `docs/product/journeys/profile-edit-journey.md` — Profile editing

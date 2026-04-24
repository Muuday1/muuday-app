# Wise Design System Refactor — Status: COMPLETO ✅

> **Date**: 2026-04-19  
> **Status**: Todas as páginas logadas e landing pages refatoradas  
> **Branch**: Mergeado para `main` (commits `30695e3`–`4020d6d`)

---

## Resumo do que foi Implementado

| Aspecto | Antes | Depois (Wise) |
|---------|-------|---------------|
| **Font body** | Plus Jakarta Sans | Inter |
| **Font display** | Bricolage Grotesque | Space Grotesk |
| **Primary color** | `#1a8a50` (escuro) | `#9FE870` (brand green vibrante) |
| **Button radius** | `rounded-full` (pill) | `rounded-md` (8px) |
| **Card shadow** | `shadow-sm/md/xl` presente | `shadow-none` + border only |
| **Card radius** | `rounded-2xl` (20px), `rounded-xl` (16px) | `rounded-lg` (12px) |
| **Page bg** | `#f4f8f5` | `#f6f4ef` (warm neutral) |
| **Text primary** | `neutral-*` palette | `slate-*` palette |
| **Badge radius** | `rounded-full` | `rounded-md` (8px) |
| **Input radius** | `rounded-xl` (16px) | `rounded-md` (8px) |

---

## Páginas Refatoradas

### Landing Pages (públicas)
- ✅ `/` — Landing page completa com hero, stats, features, categorias, FAQ, CTA
- ✅ `/registrar-profissional` — Landing de conversão para profissionais
- ✅ `/sobre` — Página institucional com mapa animado, missão/visão
- ✅ `/ajuda` — Help center com collections e artigos
- ✅ `/blog` — Blog com 10 artigos
- ✅ `/guias` — 28 guias com search, categorias, feedback
- ✅ `/politica-de-cookies` — Consent banner redesenhado
- ✅ `/privacidade`, `/termos-de-uso` — Páginas legais

### Páginas Logadas (`app/(app)/`)
- ✅ `/dashboard` — Dashboard profissional com cards flat
- ✅ `/agenda` — Agenda com cards flat, badges `rounded-md`
- ✅ `/agendar/[id]` — Agendamento com header sticky
- ✅ `/avaliar/[bookingId]` — Avaliação com `AppCard`
- ✅ `/perfil` — Perfil com banner gradiente e info grid
- ✅ `/mensagens` — Chat/mensagens
- ✅ `/notificacoes` — Notificações in-app
- ✅ `/disputas` — Sistema de disputas
- ✅ `/prontuario` — Prontuário do cliente
- ✅ `/servicos` — Gerenciamento de serviços
- ✅ `/financeiro` — Financeiro
- ✅ `/favoritos` — Favoritos
- ✅ `/configuracoes` — Configurações
- ✅ `/planos` — Planos
- ✅ `/admin` — Painel administrativo
- ✅ Todas as sub-rotas de admin, revisão, taxonomia

---

## UI Primitives Criados

| Componente | Localização | Props principais |
|-----------|-------------|------------------|
| `AppCard` | `components/ui/AppCard.tsx` | `padding`, `hover`, `onClick` |
| `AppCardHeader` | `components/ui/AppCard.tsx` | `title`, `subtitle`, `action`, `icon` |
| `AppButton` | `components/ui/AppButton.tsx` | `variant`, `size`, `loading` |
| `AppBadge` | `components/ui/AppBadge.tsx` | `variant`, `size` |
| `AppInput` | `components/ui/AppInput.tsx` | `label`, `error`, `icon` |
| `AppEmptyState` | `components/ui/AppEmptyState.tsx` | `icon`, `title`, `description`, `action` |
| `AppShell` | `components/ui/AppShell.tsx` | `PageHeader`, `PageContainer` |

---

## Padrões Consolidados

### Card Pattern (inline ou `AppCard`)
```tsx
<div className="bg-white rounded-lg border border-slate-200/80 p-6">
  {/* content */}
</div>
```

### Button Pattern
```tsx
// Primary CTA
<button className="bg-[#9FE870] hover:bg-[#8ed85f] text-slate-900 font-semibold px-5 py-2.5 rounded-md">

// Secondary
<button className="bg-slate-900 text-white hover:bg-slate-800 font-semibold px-5 py-2.5 rounded-md">

// Outline
<button className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-md">
```

### Navigation Active State
```tsx
'bg-[#9FE870]/8 text-[#3d6b1f]' // active
'text-slate-600 hover:text-slate-900 hover:bg-slate-50/70' // inactive
```

---

## Decisões de Design Tomadas

1. **Brand green `#9FE870`** — usado APENAS para CTAs primários e estados ativos de navegação. Não usado em backgrounds de cards ou texto estático.
2. **Texto sobre verde** — `text-slate-900` (escuro) para contraste adequado.
3. **Sem sombras em cards** — exceto `hover:shadow-sm` em rows interativos (agenda, financeiro, mensagens).
4. **Page background `#f6f4ef`** — warm neutral, diferente do pure white dos cards.
5. **`slate-*` substituiu `neutral-*`** — padronização completa da paleta cinza.

---

## Arquivos-chave Alterados

- `app/(app)/layout.tsx` — Shell com sidebar, mobile nav, profile
- `app/(app)/*/page.tsx` — 34+ rotas padronizadas
- `components/layout/SidebarNav.tsx` — Navegação com estados ativos
- `components/layout/MobileNav.tsx` — Bottom nav mobile
- `components/layout/NotificationBell.tsx` — Badge de notificações
- `tailwind.config.ts` — Fontes e cores atualizadas
- `app/globals.css` — Estilos base

---

## Próximos Passos (Opcionais)

1. **Modais/Dialogs** — Ainda usam estilos antigos em alguns componentes (`rounded-2xl`, `shadow-xl`). Padronizar para `rounded-lg`, `shadow-none` + border.
2. **Landing Page Richness** — Stakeholder solicitou mais imagens, animações, motion (ver `LANDING-WISE-GAP-LIST.md`).
3. **Forms** — Padronizar todos os inputs para usar `AppInput`.
4. **Tabelas** — Criar `AppTable` primitive para listagens (agenda, financeiro, admin).


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.

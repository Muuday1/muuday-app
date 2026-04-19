# AI Agent Instructions — Muuday Implementation

**For:** Kimi Code CLI (or any AI coding agent)  
**Context:** Next.js 14 App Router + Supabase + Stripe + Agora + Inngest  
**Constraint:** Read AGENTS.md before any code change. No shortcuts.

---

## 🛑 STOP — Read Before Coding

Every time you start a new task:

1. **Read `AGENTS.md`** in project root for security, CI, and Vercel best practices
2. **Read `IMPLEMENTATION-ROADMAP.md`** to know which phase/task you're on
3. **Read the referenced journey document** for frame-by-frame UX specs
4. **Check if the file you're editing has an `AGENTS.md`** in its directory tree

---

## 🏗️ Architecture Rules (Non-Negotiable)

### Runtimes
- **Page components:** Use `async` Server Components by default
- **Interactive elements:** Extract to `'use client'` components
- **API routes:** Use Node.js runtime (`export const runtime = 'nodejs'`)
- **Edge cases:** Only use Edge runtime if explicitly required

### Database
- **Never** use `createAdminClient()` as fallback in user-facing code
- **Always** use RLS policies as the single source of truth
- **Server actions:** Validate auth at entry, use `createServerClient()`
- **Migrations:** If you add tables/columns, document them in the journey doc

### Security
- Env vars are validated in `lib/config/env.ts` (loaded via `instrumentation.ts`)
- CSP nonces are set in `middleware.ts` — don't add `'unsafe-inline'` to `script-src`
- Auth cookies must have `secure`, `sameSite: 'lax'`, `httpOnly`
- Rate limiting uses Upstash Redis + in-memory fallback
- CSRF validation via `lib/http/csrf.ts` for all API routes

### State Management
- **URL state** for shareable filter/sort state (use `useSearchParams`)
- **Server state** via Supabase (no local cache unless justified)
- **Form state** via React state + server actions (no form libraries unless complex)
- **Global UI state** (toasts, modals) via React context (keep minimal)

---

## 🎨 UX Implementation Rules

### Frame-by-Frame Fidelity
When a journey doc describes a frame like this:
```
[Empty State — Enhanced]
├── Heading: "Nenhum profissional encontrado"
├── [NEW] Filter impact analysis:
│   └── "Com seus filtros atuais: 0 resultados"
```

You MUST:
1. Implement the heading exactly as specified
2. Add the `[NEW]` element (filter impact analysis)
3. Match the described layout and hierarchy
4. Use existing design tokens (colors, spacing, typography)

### Design Tokens (From Codebase)
```
Colors:
- Brand: brand-500 (#primary), brand-50-900 scale
- Neutral: neutral-50-950 scale
- Semantic: red-500 (error), amber-500 (warning), green-500 (success)

Spacing:
- Page padding: p-6 md:p-8
- Card padding: p-4 md:p-5
- Section gap: space-y-6 or gap-4
- Border radius: rounded-2xl (cards), rounded-xl (buttons), rounded-full (pills)

Typography:
- Display: font-display (headings)
- Body: default sans
- Sizes: text-xs (labels), text-sm (body), text-base (emphasis), text-2xl+ (headings)
```

### Responsive Breakpoints
```
Mobile first:
- Default: mobile layout
- sm: 640px
- md: 768px (tablet)
- lg: 1024px (desktop)
- xl: 1280px (wide)
```

---

## 🧪 Testing Rules

### Before Marking Any Task Complete

1. **Type check:** `npm run typecheck` (or `npx tsc --noEmit`)
2. **Lint:** `npm run lint`
3. **Unit tests:** `npm test` (if project has them)
4. **Manual verification:** Open the page/component in browser and verify the frame
5. **Update docs:** Mark task ✅ in `IMPLEMENTATION-ROADMAP.md`

### New Components
- If you create a new component, add a basic test if the project has testing infrastructure
- At minimum, verify it renders without errors

### Server Actions
- Always test both success and error paths
- Verify auth guards reject unauthorized access
- Check that RLS policies are respected

---

## 📝 Documentation Rules

### When You Complete a Task

1. In `IMPLEMENTATION-ROADMAP.md`:
   ```markdown
   #### AUTH-01: Public Booking Intent Handoff ⭐ P0
   - **Status:** ✅ COMPLETE (2026-04-20)
   - **Acceptance:**
     - [x] Desktop: AuthOverlay modal opens
     - [x] Mobile: Same modal
     - [x] After login: returns to profile
   ```

2. In the journey document (e.g., `search-booking.md`), add at top:
   ```markdown
   **Implementation Status:** ✅ Phase 1 complete (AUTH-01, AUTH-02)
   **Last implemented:** 2026-04-20
   ```

### When You Discover a Gap

If the journey doc doesn't cover something you encounter:
1. Add a NOTE section to the journey doc explaining the gap
2. Update `IMPLEMENTATION-ROADMAP.md` with a new task if needed
3. Do NOT silently work around it

---

## 🚀 Workflow for Each Task

```
Step 1: READ
├── IMPLEMENTATION-ROADMAP.md (find your task)
├── Journey document (frame-by-frame specs)
├── Existing code (understand current state)
└── AGENTS.md (security constraints)

Step 2: PLAN
├── Identify files to create/modify
├── Check for dependencies on other tasks
├── Estimate if task is too big (split if > 3 files)
└── Write a 3-bullet plan before coding

Step 3: IMPLEMENT
├── Make changes
├── Follow architecture rules above
├── Match frame-by-frame specs exactly
└── Add error handling

Step 4: VERIFY
├── Type check
├── Lint
├── Manual browser test
└── Check responsive behavior

Step 5: DOCUMENT
├── Mark task ✅ in roadmap
├── Update journey doc status
├── Add implementation notes if needed
└── Commit with descriptive message
```

---

## ⚠️ Common Pitfalls (Avoid These)

| Pitfall | Why It's Bad | How to Avoid |
|---------|-------------|--------------|
| Using `any` type | Breaks type safety | Define interfaces; use `unknown` if unsure |
| Inline styles | Breaks CSP | Use Tailwind classes or CSS variables |
| `console.log` in production | Leaks data | Use `console.error` only; remove debug logs |
| Hardcoded strings | No i18n support | Use constants or translation keys |
| Ignoring loading states | Poor UX | Always handle `loading`, `error`, `empty` states |
| Mutating props | React anti-pattern | Copy arrays/objects before modifying |
| Skipping auth checks | Security hole | Validate auth in every server action/API route |
| Not handling Supabase errors | Silent failures | Check `error` object; show user-friendly message |
| Forgetting responsive design | Mobile broken | Test at 375px, 768px, 1024px |
| Not updating docs | Future agents lost | Update roadmap after EVERY task |

---

## 🔗 Quick Reference Links

| Need to... | Read this |
|------------|-----------|
| Know what to implement next | `IMPLEMENTATION-ROADMAP.md` |
| Understand UX specs for a flow | `docs/product/journeys/[journey-name].md` |
| Know security rules | `AGENTS.md` (project root) |
| Understand auth patterns | `lib/auth/` directory |
| Understand booking state machine | `lib/booking/state-machine.ts` |
| Understand rate limiting | `lib/security/rate-limit.ts` |
| Check API conventions | `app/api/` routes |
| Find component patterns | `components/ui/` and `components/[domain]/` |

---

## 📞 When You're Stuck

1. Re-read the journey document's Frame-by-Frame section
2. Check if there's an existing component that does something similar
3. Look at `docs/spec/source-of-truth/` for technical architecture
4. If still stuck, add a TODO comment and move to next task
5. Never guess on security-related code — ask or skip

---

## ✅ Pre-Flight Checklist (Before Any Session)

- [ ] Read this file (AI-AGENT-INSTRUCTIONS.md)
- [ ] Read AGENTS.md
- [ ] Read IMPLEMENTATION-ROADMAP.md
- [ ] Run `npm run build` to confirm baseline is green
- [ ] Check git status: `git status` (commit or stash changes)
- [ ] Identify which phase/task you're starting

## ✅ Post-Flight Checklist (After Any Session)

- [ ] All modified files saved
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Manual test of changed pages completed
- [ ] IMPLEMENTATION-ROADMAP.md updated with progress
- [ ] Journey documents updated with implementation status
- [ ] Commit message references Change ID (e.g., "AUTH-01: Add auth modal on booking intent")

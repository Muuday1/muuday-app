path = 'docs/product/design-system/review/IMPLEMENTATION-PLAYBOOK.md'

part10 = """

---

## Risk Register

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|----|------|-----------|--------|------------|-------|
| R01 | Tokens Studio plugin sync fails | Medium | High | Maintain manual token backup JSON; export weekly | Design Eng |
| R02 | Inter font rendering differs from Figma | Medium | Medium | Test on Windows, macOS, Linux early; adjust line-height if needed | Frontend Lead |
| R03 | Component scope creep (too many variants) | High | High | Strictly limit to variants defined in `components.md`; new variants require PM approval | Lead Designer |
| R04 | Migration breaks existing pages | High | High | Run visual regression on every PR; keep old components in `legacy/` folder during transition | Frontend Lead |
| R05 | Accessibility audit fails late | Medium | High | Run axe-core on every Storybook story; weekly a11y review | QA Engineer |
| R06 | Illustrations not delivered on time | Medium | Medium | Use Lucide icons + colored backgrounds as placeholders; swap illustrations when ready | Lead Designer |
| R07 | Stakeholder changes design direction mid-implementation | Low | High | Lock Phase 3 frames after review; changes require formal decision log entry | Product Manager |
| R08 | Mobile frames do not match developer expectations | Medium | Medium | Include mobile-first CSS notes in handoff; pair program first 3 mobile frames | Design Eng |
| R09 | Performance degradation from new font loading | Low | Medium | Use `next/font` subsetting; preload only weights 400, 500, 600, 700 | Frontend Lead |
| R10 | Team member leaves during project | Low | High | Document every decision in this playbook; cross-train on Figma file structure | Product Manager |

---

## Decision Log

| ID | Date | Decision | Context | Impact | Decided By |
|----|------|----------|---------|--------|------------|
| D01 | 2026-04-19 | Use Inter + Space Grotesk (replaces Plus Jakarta Sans) | Better legibility at small sizes, reduced bundle size | Typography migration required | Design Lead + Frontend Lead |
| D02 | 2026-04-19 | 8px radius default (replaces 999px pill buttons) | Wise-inspired flat design; consistent with cards/inputs | All buttons and inputs updated | Design Lead |
| D03 | 2026-04-19 | Cards are flat (no shadow) | Reduces cognitive load; shadows reserved for floating elements | All card components updated | Design Lead |
| D04 | 2026-04-19 | Use OKLCH for color documentation, Hex for implementation | OKLCH is perceptually uniform; Hex is widely supported | Tokens document both; code uses Hex | Design Eng |
| D05 | 2026-04-19 | 8pt grid system | Predictable rhythm, aligns with Tailwind defaults | All spacing follows 4px base unit | Design Lead |
| D06 | 2026-04-19 | Mobile-first responsive approach | Base styles target mobile; breakpoints add complexity | CSS written mobile-first | Frontend Lead |
| D07 | 2026-04-19 | Lucide React as sole icon library | Consistent stroke weight, open-source, actively maintained | Remove any other icon dependencies | Frontend Lead |
| D08 | 2026-04-19 | Shadows use neutral-900 base at low opacity | Warmer, more natural depth than pure black | All shadow tokens updated | Design Lead |
| D09 | 2026-04-19 | `prefers-reduced-motion` disables non-essential animations | Accessibility and inclusion | All animations wrapped in media query | Frontend Lead |
| D10 | 2026-04-19 | No admin fallbacks in user-facing code | Security requirement from AGENTS.md | `createAdminClient()` never used as fallback | Security Lead |

---

## Communication Plan

**Daily Standup (15 min)**
- **Time:** 9:00 AM BRT
- **Attendees:** Lead Designer, Design Eng, Frontend Lead, QA Engineer
- **Format:** What did you finish? What are you working on? Any blockers?
- **Escalation:** Blockers > 4 hours old -> Product Manager

**Weekly Design Review (60 min)**
- **Time:** Friday 2:00 PM BRT
- **Attendees:** All team + PM
- **Format:** Walk through Figma frames. Stark audit results. Dev Mode readiness check.
- **Output:** Signed-off frames, new tickets for fixes

**Weekly Dev Sync (30 min)**
- **Time:** Wednesday 10:00 AM BRT
- **Attendees:** Design Eng, Frontend Lead, QA Engineer
- **Format:** Component implementation status. Token sync issues. Performance concerns.
- **Output:** Updated Storybook links, bug tickets

**Bi-weekly Stakeholder Update (30 min)**
- **Time:** Every other Tuesday 3:00 PM BRT
- **Attendees:** PM, Lead Designer, Frontend Lead, Engineering Manager
- **Format:** Migration progress %. Risk register review. Budget/timeline check.
- **Output:** Status report email

**Slack Channels**
- `#design-system` — Daily chatter, token questions, quick reviews
- `#design-system-alerts` — CI failures, Stark audit failures, security scans
- `#design-system-releases` — Version announcements only

**Ticket Flow**
1. Designer creates Figma comment -> converts to Linear ticket
2. Dev picks up ticket -> branches from `main`
3. PR opened -> visual regression + a11y checks run
4. Designer reviews deploy preview -> approves or requests changes
5. QA verifies on staging -> signs off
6. Merge to `main` -> auto-deploy to production

---

## Quality Gates

**Gate 0: Preparation Complete (Before Week 1)**
- [ ] Figma team created with correct permissions
- [ ] All plugins installed and configured
- [ ] Fonts installed and verified
- [ ] Asset inventory complete with assignments
- [ ] Team roles documented and communicated

**Gate 1: Tokens Ready (End of Week 1)**
- [ ] All color variables exist in Figma
- [ ] All typography styles exist in Figma
- [ ] All spacing/radius/shadow variables exist in Figma
- [ ] Grid styles verified at all breakpoints
- [ ] Stark audit passes WCAG 2.1 AA
- [ ] `design-tokens.json` exported and in repo

**Gate 2: Components Ready (End of Week 3)**
- [ ] All 35 components exist in Figma
- [ ] All variants match `components.md`
- [ ] Auto-layout behaves correctly on resize
- [ ] No hard-coded values — only tokens
- [ ] Stark contrast check passes on all states
- [ ] Dev Mode annotations complete

**Gate 3: Frames Ready (End of Week 8)**
- [ ] All 13 journey frames exist at Desktop and Mobile
- [ ] All frames use correct grid styles
- [ ] All components are from the library (no one-offs)
- [ ] Internal design review completed
- [ ] PM sign-off on user validation points

**Gate 4: Prototype Ready (End of Week 9)**
- [ ] All frame-to-frame connections exist
- [ ] Transition specs documented
- [ ] Micro-interactions annotated
- [ ] Responsive preview tested
- [ ] 3 non-team users complete core flows without assistance

**Gate 5: Handoff Complete (End of Week 10)**
- [ ] Dev Mode specs reviewed by Frontend Lead
- [ ] Token-to-code mapping document complete
- [ ] Component-to-React mapping complete
- [ ] All assets exported and in repo
- [ ] Frontend Lead signs off on feasibility

**Gate 6: P0 Components Implemented (End of Week 11)**
- [ ] Button, Input, Card, Header, Select, Textarea, Checkbox, Radio implemented
- [ ] Storybook stories for all P0 components
- [ ] axe-core passes on all P0 stories
- [ ] Visual regression baseline established

**Gate 7: All Components Implemented (End of Week 12)**
- [ ] All P1 components implemented
- [ ] All components in Storybook with docs
- [ ] Accessibility audit passes
- [ ] Performance budget met (bundle size < 150KB for components)

**Gate 8: Migration Complete (End of Week 14)**
- [ ] All 13 journeys have at least one frame migrated
- [ ] Visual regression tests pass
- [ ] Accessibility audit passes WCAG 2.1 AA
- [ ] Lighthouse score >= 90 on all migrated frames
- [ ] Cross-browser test passes (Chrome, Safari, Firefox, Edge)

**Gate 9: Launch Ready (End of Week 15)**
- [ ] A/B tests configured
- [ ] Analytics events firing
- [ ] Feedback collection active
- [ ] Rollback plan tested
- [ ] Incident response runbook updated

---

## Rollback Plan

**Trigger Conditions**
- Conversion rate drops > 10% for 48 hours after launch
- Accessibility audit fails on production
- Critical bug affecting > 5% of users
- Performance regression: Lighthouse < 70

**Rollback Steps**

1. **Immediate (0-15 min)**
   - Execute `vercel --prod` deployment of last known good commit
   - Post in `#incidents` Slack channel
   - Notify Product Manager and Engineering Manager

2. **Short-term (15 min - 2 hours)**
   - Frontend Lead investigates root cause
   - QA Engineer verifies rollback restored functionality
   - Design Lead assesses if design system is the cause
   - PM communicates to users if needed (status page, in-app banner)

3. **Medium-term (2-24 hours)**
   - Write incident post-mortem
   - Update Risk Register with new findings
   - Fix critical issues in isolated branch
   - Run full QA suite on fix branch

4. **Long-term (1-7 days)**
   - Re-schedule launch with fixes
   - Update Implementation Playbook if process gaps found
   - Conduct team retrospective

**Rollback Checklist**
- [ ] Last known good commit SHA identified and tagged
- [ ] Database migrations are backward-compatible (if any)
- [ ] Feature flags available to disable new components
- [ ] Monitoring alerts configured for conversion, errors, performance
- [ ] On-call rotation knows rollback procedure

**Feature Flag Strategy**
Use `posthog` or `launchdarkly` to wrap new design system components:

```typescript
// Example: Feature flag wrapper
import { useFeatureFlag } from 'posthog-js/react';

export function NewButton(props) {
  const enabled = useFeatureFlag('design-system-v1');
  return enabled ? <ButtonV1 {...props} /> : <ButtonLegacy {...props} />;
}
```

This allows instant rollback without redeployment by flipping the flag.

---

## Appendix A: Frame Count Summary

| Journey | Frames | Desktop | Mobile | Total Frames |
|---------|--------|---------|--------|--------------|
| User Onboarding | 3 | 3 | 3 | 6 |
| Settings & Preferences | 2 | 2 | 2 | 4 |
| Profile Edit | 2 | 2 | 2 | 4 |
| Trust & Safety | 3 | 3 | 3 | 6 |
| Admin Operations | 3 | 3 | 3 | 6 |
| Payments & Billing | 3 | 3 | 3 | 6 |
| Professional Workspace | 4 | 4 | 4 | 8 |
| Professional Onboarding | 4 | 4 | 4 | 8 |
| Search & Booking | 8 | 8 | 8 | 16 |
| Request Booking | 5 | 5 | 5 | 10 |
| Recurring Booking | 4 | 4 | 4 | 8 |
| Session Lifecycle | 3 | 3 | 3 | 6 |
| Video Session | 3 | 3 | 3 | 6 |
| **Total** | **47** | **47** | **47** | **94** |

## Appendix B: Component Count Summary

| Category | Components | Variants (approx) |
|----------|-----------|-------------------|
| Primitives | 10 | 434 |
| Composites | 10 | 42 |
| Layout | 6 | 12 |
| Patterns | 9 | 24 |
| **Total** | **35** | **512+** |

## Appendix C: Weekly Timeline At-a-Glance

| Week | Phase | Key Deliverable | Sign-off Required |
|------|-------|-----------------|-------------------|
| 0 | Preparation | Environment ready, assets assigned | PM |
| 1 | Figma Foundation | All tokens as variables | Lead Designer |
| 2 | Component Library (Primitives) | 10 primitives built | Lead Designer |
| 3 | Component Library (Rest) | 25 composites/layout/patterns built | Lead Designer |
| 4 | Frame Construction | Journeys 1-3 built | Lead Designer + PM |
| 5 | Frame Construction | Journeys 4-6 built | Lead Designer + PM |
| 6 | Frame Construction | Journeys 7-8 built | Lead Designer + PM |
| 7 | Frame Construction | Journeys 9-10 built | Lead Designer + PM |
| 8 | Frame Construction | Journeys 11-13 built | Lead Designer + PM |
| 9 | Prototyping | Interactive prototype complete | PM |
| 10 | Developer Handoff | Dev Mode + assets + mapping docs | Frontend Lead |
| 11 | Code Implementation | P0 tokens + P0 components | Frontend Lead |
| 12 | Code Implementation | P1 components complete | Frontend Lead + QA |
| 13 | Code Implementation | Frames 1-6 migrated | Frontend Lead + QA |
| 14 | Code Implementation | Frames 7-13 migrated | Frontend Lead + QA |
| 15 | Launch & Iterate | A/B test #1 live | PM |

---

*Document generated for Muuday Design System. For token values and Figma variables, see `tokens.md` and `components.md`.*
*Last updated: 2026-04-19*
"""

with open(path, 'a', encoding='utf-8') as f:
    f.write(part10)

print("Part 10 done - document complete")

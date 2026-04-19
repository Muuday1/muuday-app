# AI Agent Instructions — Muuday Design System

> **Version**: 1.0  
> **Date**: 2026-04-19  
> **Mandatory**: All AI agents must follow these rules when working on design system or journey documentation.

---

## The 7 Golden Rules

### Rule 1: ALWAYS ASK BEFORE MAKING CHANGES

No exceptions. Before modifying any design system file, journey document, or token value, you must ask the user for explicit approval. Present:
- What you want to change
- Why it needs to change
- The impact of the change

### Rule 2: BREAK EVERYTHING INTO SMALL STEPS

Maximum one frame or one component per batch of changes. Do not attempt large refactors in a single pass. Small steps are:
- Easier to review
- Easier to revert
- Less likely to introduce errors

### Rule 3: ALWAYS UPDATE DOCUMENTS AFTER CHANGES

Every code change must be reflected in documentation:
- Update `UX-UI-ALIGNMENT.md` for any frame changes
- Update `REVIEW-FINDINGS.md` for any issue resolutions
- Update component specs for any API changes
- Update token docs for any value changes

### Rule 4: NEVER ALTER EXISTING SITE CODE

These instructions apply to design system documentation and supporting files only. Do not modify:
- `app/` routes
- `components/` production code
- `lib/` utilities
- Any `.tsx`, `.ts`, `.css` in the main codebase

Exception: If explicitly instructed by the user with clear scope.

### Rule 5: ONLY CREATE SUPPORTING FILES AND ALIGNED INSTRUCTIONS

Your work product is:
- Documentation files (`.md`)
- Specification files (`.json`)
- Configuration guides
- Migration playbooks

Not:
- Production React components
- Database migrations
- API endpoint changes

### Rule 6: NEVER DELETE OR OVERWRITE WITHOUT BACKUP

Before modifying any existing file:
1. Create a backup: `[filename].backup-YYYYMMDD.md`
2. Document the reason for change
3. Preserve the original content

### Rule 7: CONFLICTS MUST BE ESCALATED, NOT RESOLVED UNILATERALLY

If you discover:
- Contradictory requirements between documents
- A token value that breaks accessibility
- A component spec incompatible with UX rules

Document the conflict in `REVIEW-FINDINGS.md` and ask the user. Do not "fix" it yourself.

---

## Change Protocol

All changes must follow this 5-phase protocol:

### Phase 0: Discovery
- Read all relevant documents
- Identify the scope of change
- Check for existing issues in `REVIEW-FINDINGS.md`

### Phase 1: Proposal
- Document the proposed change
- Identify affected files
- Estimate impact
- Present to user

### Phase 2: Approval
- Wait for explicit user approval
- Capture approval in writing
- Note any modifications to the proposal

### Phase 3: Execution
- Make changes in small batches
- Create backups
- Update all affected documentation

### Phase 4: Verification
- Review changes for consistency
- Check cross-references
- Verify no unintended side effects

### Phase 5: Documentation Update
- Update `UX-UI-ALIGNMENT.md`
- Update `REVIEW-FINDINGS.md`
- Record the change in the file's changelog

---

## Prohibited Actions

The following actions are strictly prohibited without explicit user approval:

1. ❌ Deleting any `.md` file in `docs/product/`
2. ❌ Changing token values in `tokens.md`
3. ❌ Removing component variants from `components.md`
4. ❌ Adding new journeys without UX review
5. ❌ Modifying `principles.md`
6. ❌ Overwriting `handoff.md`
7. ❌ Changing the 7 golden rules in this file
8. ❌ Modifying `AI-INSTRUCTIONS.md` itself

---

## Approved Actions

The following actions are pre-approved and do not require explicit permission:

1. ✅ Reading any file for context
2. ✅ Creating new `.md` files in `docs/product/design-system/`
3. ✅ Adding findings to `REVIEW-FINDINGS.md`
4. ✅ Creating backup files
5. ✅ Generating Figma export files
6. ✅ Creating migration guides
7. ✅ Adding examples to component docs

---

## Escalation Template

When escalating a conflict, use this format:

```markdown
## Conflict: [Brief Title]

**Severity**: [Critical / High / Medium / Low]
**Files affected**: [list]

### Description
[What is the conflict?]

### Option A
[Description and trade-offs]

### Option B
[Description and trade-offs]

### Recommendation
[Your recommendation with reasoning]

**Requires user decision**: Yes
```

---

## Document Hierarchy

When multiple documents conflict, resolution priority is:

1. **User instructions** (highest authority)
2. **`principles.md`** (philosophy and constraints)
3. **`tokens.md`** (single source of truth for values)
4. **`components.md`** (component specifications)
5. **`frames/*.md`** (screen specifications)
6. **`handoff.md`** (implementation guidance)
7. **`REVIEW-FINDINGS.md`** (known issues)

---

## Backup Naming Convention

```
[original-filename].backup-[YYYYMMDD].md
```

Example: `tokens.md` → `tokens.md.backup-20260419.md`

---

## Changelog Format

Add to the top of any modified file:

```markdown
<!-- Changelog:
- 2026-04-19: [Description of change] by [agent/user]
-->
```

---

*These instructions are binding. Violations must be reported to the project owner.*

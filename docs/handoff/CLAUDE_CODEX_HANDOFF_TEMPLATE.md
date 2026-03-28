# Claude + Codex Handoff Template

Use this workflow for every feature cycle.

## Golden Rule

- Only one tool edits code at a time.
- If Claude is editing, Codex is read-only.
- If Codex is editing, Claude is read-only.

## Phase 1: Claude (Plan Only)

Claude output must include:

1. Scope (`what is included`, `what is excluded`)
2. Acceptance Criteria (`done when...`)
3. Edge Cases
4. UX/content decisions
5. File impact guess (which files likely change)

Copy/paste prompt for Claude:

```md
You are in planning mode only.
Do not write code.

Feature:
[DESCRIBE FEATURE]

Return:
1) Scope (in/out)
2) Acceptance criteria
3) Edge cases
4) UX/copy decisions
5) Expected files to change
```

## Handoff Gate (Before Codex Starts)

Run one of these:

- Commit plan notes file if changed, or
- Stash Claude edits, or
- Confirm no files were changed by Claude

## Phase 2: Codex (Build + Verify + Implement)

Codex responsibilities:

1. Implement spec
2. Run verification
3. Suggest improvements
4. Commit in small logical batches

Copy/paste prompt for Codex:

```md
Implement this approved spec exactly.
Do full checks without destructive changes.
Then suggest improvements and create logical commits.

Rules:
- Do not edit unrelated files
- Keep commits atomic
- Show what is still uncommitted at the end

Spec:
[PASTE CLAUDE SPEC]
```

## Verification Gate (Required Before Push)

Run:

```powershell
npm.cmd run build
```

Optional (after ESLint is configured):

```powershell
npm.cmd run lint
```

Manual smoke checks:

1. Changed routes/pages load
2. Auth flow works for touched screens
3. API routes touched return expected status

## Commit Style

Use one scope per commit:

- `feat(auth): add social login buttons`
- `fix(waitlist): handle resend failure without blocking`
- `chore(layout): add route layout wrappers`

## Never Commit (Local-only)

- `.claude/launch.json`
- `tsconfig.tsbuildinfo`
- `.env.local`
- `.env`

## Cycle Log Template

```md
## Cycle [DATE/TIME]

### Claude Plan Summary
- Scope:
- Acceptance criteria:
- Edge cases:

### Codex Execution Summary
- Implemented:
- Checks run:
- Improvements suggested:

### Commits
1.
2.

### Remaining Uncommitted
- 
```


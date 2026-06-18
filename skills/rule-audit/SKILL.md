---
name: rule-audit
description: >
  Hybrid rule-compliance gate for code changes. Two phases:
  (1) PRE-WRITE — load project + global rules, generate TodoWrite checklist,
  use as constraints during writing. Mandatory for new files or changes
  touching 3+ files.
  (2) POST-WRITE — lightweight emergent-issue scan only. Catches file size,
  accidental `any`, console.log, hardcoded values. Does NOT silently rewrite
  working code — large violations escalate to user.
  Skip both phases for trivial edits (typos, comments, format-only, import
  reorder, test description fix).
  Rule sources: project `CLAUDE.md`, `.claude/rules.md`, `.claude/architecture.md`,
  `.claude/review.md` + global `~/.claude/CLAUDE.md`, `~/.claude/rules/common/*.md`,
  `~/.claude/rules/typescript/*.md`, etc.
---

# Rule Audit Skill — Hybrid Model

**Trigger:** Before any code write (Phase 0) AND before completion claim (Phase 2). Not optional for non-trivial edits.

## Why hybrid

Pre-write alone drifts during long sessions and misses emergent issues.
Post-write alone causes rework + regression risk.

Hybrid keeps the cheapest correctness signal at each stage:
- Pre-write → rules as constraints (no rework, no regression-from-rework)
- Post-write → lightweight scan (catches drift without silent refactor)

## Trivial-edit escape clause

**Phase 0 may be skipped when the change is ALL of:**
- Single file
- ≤ 5 lines changed
- One of: typo fix, comment edit, format/whitespace, import reorder, test
  description, rename via tool-assisted refactor (no logic change)

**Phase 2 has no trivial-edit escape.** Always run. ~30s is cheap insurance
against cumulative drift across many small iterative edits.

---

## Phase 0 — Pre-write (BEFORE first Edit/Write)

### Step 0.1 — Locate rule sources

```bash
# Project-local (closest to repo root)
find . -maxdepth 4 -type f \( \
  -path "*/CLAUDE.md" -o \
  -path "*/.claude/rules.md" -o \
  -path "*/.claude/architecture.md" -o \
  -path "*/.claude/review.md" -o \
  -path "*/.claude/context.md" \
\) 2>/dev/null

# Global
ls ~/.claude/CLAUDE.md \
   ~/.claude/rules/common/*.md \
   ~/.claude/rules/typescript/*.md \
   ~/.claude/rules/python/*.md 2>/dev/null
```

Read the files that match the file types in scope. Do NOT skim — re-read; memory drifts.

### Step 0.2 — Generate TodoWrite checklist

Create one todo per applicable rule category, scoped to the file types being changed.

**Every file:**
- [ ] Within file-size cap (~200 lines component / file, ~800 max)
- [ ] No `console.log` (warn/error per project precedent)
- [ ] No hardcoded secrets, URLs, magic strings
- [ ] Functions <50 lines
- [ ] Nesting ≤ 4 levels
- [ ] Guard clauses at top, no `else` after `return`
- [ ] No mutation; spread/return new objects

**TypeScript / React files (add):**
- [ ] Exported APIs have explicit return + parameter types
- [ ] No `any` (use `unknown`)
- [ ] NO `interface`/`type` declared inside a `.tsx`/`.ts` component file — props AND non-props (e.g. `EmptyStateProps`, union types like `type Tab = "a" | "b"`) live in `types/`. Fix = MOVE out, not reorder.
- [ ] NO custom `use*` hook defined inline in a component/page file — extract to its own file under `hooks/`
- [ ] No `React.FC`
- [ ] No inline `{…}` / `[…]` in JSX (hoist to module const)
- [ ] No premature `useCallback` / `useMemo` (profiler-justified only)
- [ ] Event handlers prefixed `handle*`
- [ ] Boolean props prefixed `is*` / `has*` / `can*`
- [ ] Default export pattern: `const X = …; export default X`
- [ ] Layer order respected (page → component → hook → API)
- [ ] **Prefer Tailwind over inline CSS.** Style with Tailwind utility classes (design tokens) — NOT `style={{}}` and NOT MUI `sx={{}}`. Anything expressible as a Tailwind class belongs in `className`. `sx`/`style` only when Tailwind genuinely can't (e.g. targeting a MUI runtime pseudo-class like `& .Mui-selected`, dynamic computed values) — and then HOIST the object to a module const (`FOO_SX`), never an inline `sx={{}}`/`style={{}}` in JSX (inline = unstable reference + bypasses tokens).
- [ ] Tailwind tokens, not arbitrary `[12px]` / `[#fff]` (use the scale + design tokens)
- [ ] Hardcoded copy used 2+ places → `constants/`
- [ ] File order: exported component → subcomponents → helpers → static → types

**Python files (add):**
- [ ] PEP 8 compliance
- [ ] Type hints on public APIs
- [ ] Pydantic at boundaries
- [ ] No bare `except:`

**Test files (add):**
- [ ] AAA pattern (Arrange / Act / Assert)
- [ ] Mock only at boundaries (HTTP / DB / browser)
- [ ] Tests behavior, not implementation
- [ ] 80%+ branch coverage (100% for auth / payment)

### Step 0.3 — Architect upfront

Before first `Write`, decide:
- Where do ALL types live (props + non-props)? → `types/` file path, never inline in `.tsx`
- Where do custom `use*` hooks live? → own file under `hooks/`, never inline in a component/page
- What is the file-size budget?
- What layer does this belong to?
- What gets extracted as a subcomponent / helper?
- What gets hoisted to module constants?

Write these decisions into the checklist as concrete todos with target paths.

### Step 0.4 — Write following the checklist

Each `Edit` / `Write` is gated by the relevant todo. No deferral of structural choices.

---

## Phase 1 — Verify (after writing, before claim)

```bash
npx eslint <changed files>     # or project's lint command
npx tsc --noEmit               # scoped to changed files
<project test command>         # scoped to relevant tests
```

All three must pass before Phase 2.

---

## Phase 2 — Post-write lightweight scan

**Purpose:** catch emergent issues the pre-write checklist could not predict.
**Not a refactor pass.** ~30 seconds. **Always runs** — no trivial-edit escape.

### Step 2.0 — Scope = ALL uncommitted session work

Scope the audit to ALL uncommitted changes since last commit, not just the
last turn's diff. Catches cumulative drift across many small edits.

```bash
# Cumulative session diff (working tree + staged, vs last commit)
git diff HEAD
git diff --staged
git status --porcelain   # untracked files
```

If user has committed mid-session, the gate fires at commit-time, so a
fresh Phase 2 from last commit forward still covers everything written
since the last audit point.

### Step 2.1 — Quick stats

```bash
# Apply to every file in the cumulative session diff, NOT just last turn
CHANGED=$(git diff HEAD --name-only; git diff --staged --name-only; git ls-files --others --exclude-standard)
echo "$CHANGED" | sort -u | xargs -I{} wc -l {}    # file size drift
echo "$CHANGED" | sort -u | xargs -I{} grep -nHE '\bany\b|console\.log|\[[0-9]+px\]|"https?://' {} 2>/dev/null
# Inline types/hooks in component files (.tsx) — must live in types/ and hooks/, not inline
echo "$CHANGED" | grep -E '\.tsx$' | grep -vE '\.test\.|/types/|/hooks/' | xargs -I{} grep -nHE '^(export )?(interface |type [A-Za-z]+ =)|^(export )?(function|const) use[A-Z]' {} 2>/dev/null
# Inline CSS — prefer Tailwind. Flag inline sx={{ / style={{ in JSX (hoist to a module const, or convert to className)
echo "$CHANGED" | grep -E '\.tsx$' | grep -vE '\.test\.' | xargs -I{} grep -nHE 'sx=\{\{|style=\{\{' {} 2>/dev/null
```

### Step 2.2 — Emergent-issue checklist

For each changed file:
- [ ] Final line count vs Phase 0 budget — exceeded?
- [ ] Any `any` slipped in?
- [ ] Any `console.log`?
- [ ] Hardcoded pixels / hex / URLs introduced?
- [ ] Magic strings now repeated 2+ times?
- [ ] Functions that grew past 50 lines?
- [ ] Inline `interface`/`type` in a `.tsx` (props or not)? → move to `types/`
- [ ] Inline custom `use*` hook in a component/page? → extract to `hooks/`
- [ ] Inline CSS (`style={{}}` / `sx={{}}`) introduced? → prefer Tailwind `className`; if `sx`/`style` is unavoidable, hoist the object to a module const (`FOO_SX`)
- [ ] Pre-write todos all closed?

### Step 2.3 — Decide severity

| Severity | Examples | Action |
|---|---|---|
| **CRITICAL** | Hardcoded secret, security flaw, data loss | Fix immediately, re-verify |
| **HIGH** | `any`, missing return type on export, broken layer | Fix immediately |
| **MEDIUM** | File 10% over budget, magic string, premature memo, inline `sx`/`style` (use Tailwind, or hoist `sx` to const) | **Surface to user**, do NOT silently rewrite |
| **LOW** | Cosmetic, comment style, minor naming | Log only, no action |

### Step 2.4 — Hard rule: no silent refactor

Post-write does NOT silently rewrite working code. If MEDIUM or larger violation appears:

1. Stop
2. Report to user: violation + proposed fix + estimated impact
3. Get user consent before rewriting

This prevents rework-induced regression — the failure mode that motivated this skill in the first place.

---

## Phase 3 — Subagent boundary (conditional)

**Trigger:** any time the main thread dispatches a subagent (Task tool /
Agent tool / cavecrew-builder / general-purpose agent) that produces or
modifies code.

Subagents run in their own sessions. The main thread does not see the
subagent's internal Phase 0 / Phase 2 invocations. So before accepting
subagent-produced code as "done":

1. **Re-run Phase 2 on the main thread** against the subagent's output
   diff. Same scope rules apply (cumulative session diff).
2. **Do not trust subagent's "audit passed" claim** — subagent's audit
   was in its own context, against its own checklist. Main thread must
   verify against the project's actual rule set.
3. **If subagent output introduces MEDIUM+ violations**, apply the
   no-silent-refactor rule: surface to user, do not silently rewrite the
   subagent's code.

When NOT to run Phase 3:
- Subagent was read-only (research, locator, reviewer) — no code produced
- Subagent output was rejected and never merged into the working tree

---

## Anti-patterns to refuse

- "Lint passes, ship it" — lint ≠ rule compliance
- "Sister files do it" — pre-existing debt isn't license for new debt
- "Quick inline `sx`/`style`" — NO. Prefer Tailwind `className`; reach for `sx`/`style` only when Tailwind can't express it, and then hoist to a module const — never inline in JSX
- "I'll fix it in a follow-up" — fix now or document deferral explicitly
- "Memory tells me the rules" — re-read; rules evolve, memory drifts
- "Phase 2 found a violation, let me silently refactor" — STOP, ask first
- "Trivial edit, skip Phase 0" — only if the trivial-edit escape clause strictly applies
- "Trivial edit, skip Phase 2" — NO. Phase 2 always runs; cumulative drift across small edits is the failure mode it exists to catch
- "Subagent already audited, trust it" — NO. Main thread re-runs Phase 2 on subagent-produced code (Phase 3)
- "Phase 2 only on this turn's diff" — NO. Scope is cumulative since last commit

## Red flags that mean STOP and run this skill

| Thought | Phase to run |
|---|---|
| "About to write a new file" | Phase 0 |
| "About to refactor existing code" | Phase 0 |
| "Tests pass, claiming done" | Phase 2 |
| "Lint is clean" | Phase 2 |
| "Sibling file has X, I'll follow that" | Phase 0 (sibling may violate too) |
| "Small diff, should be fine" | Phase 2 (cheap) |
| "User asked for a quick fix" | Trivial-edit clause check |

## Output format

When Phase 2 completes, report as a table:

| File | Severity | Rule | Line | Action |
|------|----------|------|------|--------|
| ... | CRITICAL/HIGH/MEDIUM/LOW | rule name | n | fixed / surfaced / logged |

End with: "Rule audit pass — Phase 0 checklist closed: [N/M]. Phase 2 violations: [N fixed, M surfaced, L logged]."

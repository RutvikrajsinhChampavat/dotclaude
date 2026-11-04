---
name: rule-audit
description: >-
  Use when code must be checked against project and global CLAUDE.md/rules: before the first Edit/Write of a new file, 3+ file change or refactor; after writing any code, before claiming done; on a code-producing subagent's diff; first in a PR review. Pre-write skippable only for trivial edits.
---

# Rule Audit Skill — Hybrid Model

**Trigger:** Before any code write (Phase 0) AND before completion claim (Phase 2). Not optional for non-trivial edits.

## Why hybrid

Pre-write alone drifts during long sessions and misses emergent issues.
Post-write alone causes rework + regression risk.

Hybrid keeps the cheapest correctness signal at each stage:
- Pre-write → rules as constraints (no rework, no regression-from-rework)
- Post-write → scan of the lines this branch ADDS that fixes every finding, then re-verifies green

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
   ~/.claude/rules/**/*.md \
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
- [ ] Docstrings/comment blocks ≤2 lines (push detail out, state the WHY not the WHAT) — applies to `/** */`, `"""` docstrings, and consecutive `//`/`#` comment runs alike. **New docstrings/comments everywhere; EXISTING ones only in repos where you own that cleanup** — in any other repo leave a pre-existing docstring or comment verbatim (length, wording, constant comments), even in a touched file; update one only when your change made it false (global CLAUDE.md, "Short docstrings")
- [ ] No ticket/plan-label references (`ABC-123`, `M2b`, `C1`, `S2`, …) inside code, comments, or docstrings — including test files. State the behavior/reason directly; a reader with no tracker access must still understand it
- [ ] NO comment or docstring on a constant declaration OR any of its members (new code; elsewhere leave existing ones) — constants carry ZERO comments, same rule as types. Name the constant/field so it explains itself; DELETE the comment, never relocate it. Applies to `const` declarations, enum-like objects, and every entry inside them, in every file (`constants/` included).

**TypeScript / React files (add):**
- [ ] Exported APIs have explicit return + parameter types
- [ ] No `any` (use `unknown`)
- [ ] NO `interface`/`type` declared inside a `.tsx`/`.ts` component file — props AND non-props (e.g. `EmptyStateProps`, union types like `type Tab = "a" | "b"`) live in `types/`. Fix = MOVE out, not reorder.
- [ ] NO comment or docstring on a type/interface declaration OR any of its members — types carry ZERO comments. Name the type/field so it explains itself; DELETE the comment, never relocate it. Applies to `type` and `interface` blocks and every property inside them, in every file (`types/` included).
- [ ] NO custom `use*` hook defined inline in a component/page file — extract to its own file under `hooks/`
- [ ] No `React.FC`
- [ ] No inline `{…}` / `[…]` in JSX (hoist to module const)
- [ ] No premature `useCallback` / `useMemo` (profiler-justified only)
- [ ] Event handlers prefixed `handle*`
- [ ] Boolean props prefixed `is*` / `has*` / `can*`
- [ ] Default export pattern: `const X = …; export default X`
- [ ] Props destructured in the function BODY, not the signature — `const C = (props: P) => { const { a, b } = props; … }`, NEVER `const C = ({ a, b }: P) => …` (MERN convention)
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

### Step 2.0 — Scope = lines THIS BRANCH adds + lines THIS SESSION changed, excluding test files

**Audit only the changes we made — never pre-existing code** (user instruction
2026-10-14, replaces the old whole-file rule). The range is the whole branch,
not the last turn or the last commit: every line added since the merge-base with
the default branch, committed or not (commits + staged + unstaged + untracked).
On the default branch itself the merge-base is HEAD, so it degrades to the
uncommitted work. A line you MODIFIED counts as added (it shows as `+`).

**Plus every line this session changed**, even ones the branch diff can't see
(committed straight to `main`, pushed, or on another branch). The PreToolUse hook
`~/.claude/hooks/audit-session-mark.sh` (matcher `Edit|Write|NotebookEdit`)
snapshots each repo's full working tree as a git tree the first time the session
edits it, into `~/.claude/state/audit-base/<session id>/`. Pass the session id
(last path component of the scratchpad dir) as `AUDIT_SESSION`; the helper diffs
that snapshot against now and unions it with the branch lines. No snapshot (hook
not registered, or the session only edited via Bash) → it warns on stderr and
falls back to branch lines; say so in the report.

A violation on a line the branch did not add is NOT a finding: don't fix it,
don't list it, even inside a touched file. Fixing it is the scope creep that
makes the diff unreviewable. File-level rules apply only when the branch caused
the breach — a file is "over budget" only if it is new, or the branch grew it
past the cap; a function is "over 50 lines" only if it contains added lines.

```bash
# Every in-scope line as path:line:text (branch lines alone match `git diff --numstat <merge-base>`)
AUDIT_SESSION=<session id> ~/.claude/skills/rule-audit/added-lines.sh <repo>            # base = merge-base(HEAD, origin/HEAD)
AUDIT_SESSION=<session id> ~/.claude/skills/rule-audit/added-lines.sh <repo> <base-ref> # explicit base, e.g. a stacked PR's parent
```

**Test files (`*.test.ts(x)`, `*.spec.ts(x)`, `__tests__/`) are excluded from
the scan** — mocks, fixtures, and casts make production-code rules (file-size
budget, `any`, inline types, props-in-signature, simplification) inapplicable
there. Exception: the ticket/plan-label-ref check still covers test files —
see Step 2.1, that check runs on the full unfiltered set on purpose.

### Step 2.1 — Quick stats (added lines only)

Every grep runs on the ADDED stream, never on whole files. A stream line is
`path:line:text`, so patterns anchored at `^` must anchor after the prefix
(`^[^:]+:[0-9]+:` = "start of the source line").

```bash
REPO=/abs/path/to/<service>
export AUDIT_SESSION=   # <- this session's id (scratchpad dir's last path component)
ADDED=$(~/.claude/skills/rule-audit/added-lines.sh "$REPO")
# Everything below except the ticket-ref check runs on non-test files only
ADDED_NON_TEST=$(printf '%s\n' "$ADDED" | grep -vE '^[^:]*(\.(test|spec)\.[jt]sx?|/__tests__/[^:]*):')
TSX=$(printf '%s\n' "$ADDED_NON_TEST" | grep -E '^[^:]+\.tsx:')
P='^[^:]+:[0-9]+:'

printf '%s\n' "$ADDED_NON_TEST" | grep -E '\bany\b|console\.log|\[[0-9]+px\]|"https?://'
# Inline types/hooks in component files (.tsx) — must live in types/ and hooks/, not inline
printf '%s\n' "$TSX" | grep -vE '^[^:]*/(types|hooks)/' | grep -E "$P(export )?(interface |type [A-Za-z]+ =)|$P(export )?(function|const) use[A-Z]"
# Inline CSS — prefer Tailwind. Flag inline sx={{ / style={{ in JSX
printf '%s\n' "$TSX" | grep -E 'sx=\{\{|style=\{\{'
# Props destructured in the SIGNATURE — MERN convention wants it in the body
printf '%s\n' "$TSX" | grep -E "$P(export )?(const [A-Z][A-Za-z]* = |function [A-Z][A-Za-z]*)\(\{"
# Ticket/plan-label refs — FULL added set on purpose; test files are NOT exempt from this one check
printf '%s\n' "$ADDED" | grep -E "$P.*(\b[A-Z]{2,5}-[0-9]+\b|\b[BCMS][0-9](-gate)?\b)"
# Runs of 3+ consecutive ADDED comment lines in one file — candidates; read each hit to confirm
printf '%s\n' "$ADDED_NON_TEST" | awk -F: '{ t = substr($0, length($1) + length($2) + 3) }
  t ~ /^[[:space:]]*(\/\/|#|\*|\/\*\*)/ && $1 == f && $2 == n + 1 { c++; n = $2; next }
  { if (c >= 3) print f ":" n " run of " c " comment lines"; f = $1; n = $2; c = (t ~ /^[[:space:]]*(\/\/|#|\*|\/\*\*)/) }
  END { if (c >= 3) print f ":" n " run of " c " comment lines" }'
# Tailwind classes with an EXACT canonical form (IntelliSense suggestCanonicalClasses). Run from
# the repo root; needs tailwindcss >= 4.1. Pass the CSS entry if it is not src/app/globals.css.
printf '%s\n' "$ADDED_NON_TEST" | (cd "$REPO" && node ~/.claude/skills/rule-audit/canonical-classes.cjs)
# File size — only files the branch created or grew, and only when now over the cap
BASE=$(git -C "$REPO" merge-base HEAD "$(git -C "$REPO" symbolic-ref --short refs/remotes/origin/HEAD)")
printf '%s\n' "$ADDED_NON_TEST" | cut -d: -f1 | sort -u | while IFS= read -r f; do
  now=$(wc -l < "$REPO/$f"); was=$(git -C "$REPO" show "$BASE:$f" 2>/dev/null | wc -l)
  [ "$now" -gt "$was" ] && echo "$f $was -> $now"; done
```

### Step 2.2 — Emergent-issue checklist

For each changed file, judged on the lines the branch added (Step 2.0):
- [ ] Final line count vs Phase 0 budget — exceeded BY THIS BRANCH (new file, or grown past the cap)?
- [ ] Any `any` slipped in?
- [ ] Any `console.log`?
- [ ] Hardcoded pixels / hex / URLs introduced?
- [ ] Magic strings now repeated 2+ times?
- [ ] Functions with added lines that are now past 50 lines?
- [ ] Inline `interface`/`type` in a `.tsx` (props or not)? → move to `types/`
- [ ] Inline custom `use*` hook in a component/page? → extract to `hooks/`
- [ ] Inline CSS (`style={{}}` / `sx={{}}`) introduced? → prefer Tailwind `className`; if `sx`/`style` is unavoidable, hoist the object to a module const (`FOO_SX`)
- [ ] Props destructured in the signature (`({ a, b }: P) =>`)? → move to the body (`(props: P) => { const { a, b } = props; }`)
- [ ] Any docstring/comment block over 2 lines? → trim, push the WHY into the ≤2-line form. A docstring or comment that already existed is NOT a finding, in any repo — only added ones
- [ ] Any ticket/plan-label ref (`ABC-123`, `M2b`, `S2`, …) in code/comments/docstrings, incl. tests? → rewrite to state the behavior directly
- [ ] Any Tailwind class `canonical-classes.cjs` reports (`-m-[4px]` → `m-[-4px]`, `h-[1.5rem]` → `h-6`,
      `ease-[cubic-bezier(0.4,0,0.2,1)]` → `ease-in-out`, `!text-sm` → `text-sm!`)? → rewrite to the
      canonical form. The checker passes NO `rem` option on purpose: px values (`gap-[10px]`) are NOT
      rewritten to the rem scale (`gap-2.5`), because that changes the rendered size whenever the
      app's root font is not 16px (e.g. a fluid `clamp(13px … 17px)` root). Only exact rewrites count.
- [ ] Pre-write todos all closed?

### Step 2.3 — Fix every finding

Every violation ON AN ADDED LINE gets FIXED in the same pass — regardless of
severity, and regardless of whether you or a concurrent session on this branch
wrote it. There is no surface-and-wait tier. Lines the branch did not add are
out of scope (Step 2.0), so they are neither fixed nor reported. Severity only
ORDERS the work; it never gates whether a finding is fixed.
The ONE bound: if the fix would REWRITE working logic (not a mechanical,
behaviour-preserving change), it gates on consent first — see Step 2.5.

| Severity | Examples | Action |
|---|---|---|
| **CRITICAL** | Hardcoded secret, security flaw, data loss | Fix first, re-verify |
| **HIGH** | `any`, missing return type on export, broken layer | Fix |
| **MEDIUM** | File over budget, magic string, premature memo, inline `sx`/`style`, inline type in `.tsx`, props-in-signature, comment on a type/constant | Fix |
| **LOW** | Cosmetic, comment style, naming | Fix |

### Step 2.4 — Verify after fixing (the regression backstop)

Fixing everything is NOT reckless-rewrite: after applying fixes, re-run Phase 1
(lint + tsc + the affected tests). A fix is not done until green — that green
gate is the regression protection the old surface-first rule used to provide.
Only if a finding genuinely cannot be made green within the branch's own lines do you
stop and surface THAT specific finding with why.

### Step 2.5 — Rewriting working code still gates on consent (DO NOT REMOVE)

Auto-fixing a violation is NOT license to silently refactor working code. A
MECHANICAL, behaviour-preserving fix (delete a type or constant comment, move a type to
`types/`, strip `console.log`, add a return type, tool-rename, hoist a magic
string) proceeds under Step 2.3. But when fixing a finding would REWRITE working
logic — restructure it, extract a component, change behaviour, or edit well
beyond the flagged line — do NOT do it silently:

1. Stop
2. Report to user: violation + proposed fix + estimated impact
3. Get user consent before rewriting

This is the "no silent refactor" guard. It is kept deliberately — never remove
these three steps. It bounds Step 2.3's "fix everything" to fixes that are safe
and mechanical; anything that is a genuine rewrite of working code waits for the
user's go.

---

## Phase 3 — Subagent boundary (conditional)

**Trigger:** any time the main thread dispatches a subagent (Task tool /
Agent tool / cavecrew-builder / general-purpose agent) that produces or
modifies code.

Subagents run in their own sessions. The main thread does not see the
subagent's internal Phase 0 / Phase 2 invocations. So before accepting
subagent-produced code as "done":

1. **Re-run Phase 2 on the main thread** against the subagent's output
   diff. Same scope rules apply (lines the branch adds, Step 2.0).
2. **Do not trust subagent's "audit passed" claim** — subagent's audit
   was in its own context, against its own checklist. Main thread must
   verify against the project's actual rule set.
3. **Fix any violations in subagent output** the same way — every finding, any
   severity, then re-verify green (Step 2.3/2.4). Subagent authorship is not an
   exemption.

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
- "This violation is pre-existing, I'll fix it while I'm here" — NO. Pre-existing lines are out of scope (Step 2.0); fixing them bloats the PR
- "Another session on this branch wrote that line" — irrelevant; it is the branch's added line, fix it
- "This is only MEDIUM/LOW, I'll just surface it" — NO. Every finding gets fixed; re-verify green after
- "Fixing this finding means rewriting the working logic, I'll just do it" — NO. Mechanical fixes proceed; a genuine REWRITE of working code stops for consent (Step 2.5: Stop → Report → Get consent). Never remove those three steps.
- "Trivial edit, skip Phase 0" — only if the trivial-edit escape clause strictly applies
- "Trivial edit, skip Phase 2" — NO. Phase 2 always runs; cumulative drift across small edits is the failure mode it exists to catch
- "Subagent already audited, trust it" — NO. Main thread re-runs Phase 2 on subagent-produced code (Phase 3)
- "Phase 2 only on this turn's diff" — NO. Scope is every line the branch adds since the merge-base, plus every line the session changed

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
| ... | CRITICAL/HIGH/MEDIUM/LOW | rule name | n | fixed (or: surfaced — could not be made green, with why) |

End with: "Rule audit pass — Phase 0 checklist closed: [N/M]. Phase 2 violations: [N fixed, M surfaced-unfixable]."

---

_Moved verbatim from global CLAUDE.md 2026-08-27 (context-cost reduction). The Gate A/B/C names and the consent bound remain in CLAUDE.md; this is the full mechanism._

## Code-change gates (hybrid pre-write + post-write)

Two mandatory gates around any code change, plus a conditional third for subagent output.
Skipping any gate is forbidden — lint passing ≠ rules followed.

**Sole carve-out — DESIGN-MOCK / throwaway code is exempt from ALL THREE gates**, and from
TDD, `simplify`, `rule-audit`, lint/tsc, and every coding-style rule. It is a disposable prop
for a decision, deleted after the pick; production discipline there burns the budget that
should go into the design. Exemption ends at the mock — implementing the CHOSEN option in the
real component owes the full gate set. Details in `ui-options-first`, "Mock code is exempt".

### Gate A — Pre-write (BEFORE first Edit / Write)

Mandatory for: new files, changes touching 3+ files, any refactor. Skippable only for
single-file ≤5-line trivial edits (typo / comment / format / import reorder / test
description / tool-assisted rename).

1. **Invoke `rule-audit` — Phase 0.** Loads project rules (`CLAUDE.md`, `.claude/rules.md`,
   `.claude/architecture.md`, `.claude/review.md`) AND global (`~/.claude/CLAUDE.md`,
   `~/.claude/rules/**`), emits a TodoWrite checklist scoped to the change's file types, and
   captures upfront decisions: file paths, size budgets, layer, type placement, extraction plan.
2. **Write following the checklist** — no deferral of structural choices.

### Gate B — Post-write (BEFORE completion claim)

Always runs. No trivial-edit escape — cumulative drift across small edits is what this catches.

1. **Lint + tsc**, scoped to changed files.
2. **Tests**, scoped to changed files.
3. **`simplify`** on changed files — reuse, simplification, efficiency, altitude. Runs BEFORE
   rule-audit so Phase 2 scans the cleaned diff.
   **CONDITIONAL — the ONE exception to "always runs" above.** Evaluate **PER REPO, never
   summed**: NON-TEST files changed in that repo **since that repo's last `/simplify` in THIS
   session** (no run yet → since its last commit). Run `simplify` on a repo only when its own
   count is **>10 (11+)**; a repo at 10 or under is SKIPPED entirely — not deferred — even
   when a sibling repo crosses. Do not invoke it per turn or per edit-batch. An explicit
   `/simplify` request overrides the threshold at any count. Steps 1, 2, 4 and 5 stay
   unconditional.

   **Counting mechanic — session mark file, never an in-head tally.** The mark lives in the
   session scratchpad, so it is session-scoped by construction and survives compaction; its
   absence is the correct "no run yet" baseline. Run per repo (the monorepo root is not a
   repo). **`SCRATCHPAD` is NOT an env var** — paste this session's scratchpad path from the
   environment preamble into the first line; if it expands empty the mark lands at `/` , never
   exists, and the counter silently never resets (simplify re-fires every turn — the exact bug
   this gate removes), so the `:?` guard below must stay.

   ```bash
   export SCRATCHPAD=   # <- this session's scratchpad dir, from the environment preamble
   : "${SCRATCHPAD:?set SCRATCHPAD to this session's scratchpad dir (environment preamble)}"
   REPO=/abs/path/to/<service>; MARK="$SCRATCHPAD/simplify-mark-$(basename "$REPO")"
   LIST=$( { git -C "$REPO" diff HEAD --name-only
             git -C "$REPO" diff --staged --name-only
             git -C "$REPO" ls-files --others --exclude-standard
           } | sort -u | grep -vE '\.(test|spec)\.[jt]sx?$|/__tests__/' )
   [ -f "$MARK" ] && LIST=$(printf '%s\n' "$LIST" \
     | while IFS= read -r f; do [ "$REPO/$f" -nt "$MARK" ] && printf '%s\n' "$f"; done)
   N=$(printf '%s\n' "$LIST" | grep -c .)
   [ "$N" -gt 10 ] && echo "RUN simplify on $REPO ($N)" || echo "SKIP $REPO ($N)"
   ```

   **After a `simplify` run on that repo, `touch "$MARK"` — that is what restarts its count
   at zero.** Skipping the touch makes the next turn re-count the same files and re-fire.
   The non-test filter is the same expression Step 2.1 uses; do not fork it.
4. **`rule-audit` — Phase 2** (scan + FIX). Scope is the lines this BRANCH adds since its
   merge-base with the default branch (commits + staged + unstaged + untracked), plus every
   line this session changed (hook snapshot, `AUDIT_SESSION`), via `added-lines.sh` — never
   pre-existing code in a touched file. Catches accidental `any`,
   `console.log`, hardcoded pixels/URLs, magic strings, comments on types/constants, and
   file-size growth the branch caused.
   **Standing rule:** FIX every finding on an added line regardless of severity — no
   surface-and-wait tier — then re-run lint+tsc+tests; green is the regression backstop.
   Surface a finding ONLY when it genuinely cannot be made green within the branch's lines.
   **The one bound (DO NOT REMOVE) — rewrites still gate on consent:** a MECHANICAL,
   behaviour-preserving fix (delete a type comment, move a type to `types/`, strip
   `console.log`, add a return type, tool-rename, hoist a magic string) proceeds. But a fix
   that would REWRITE working logic (restructure, extract, change behaviour, edit well beyond
   the flagged line) still runs: 1. Stop  2. Report violation + proposed fix + estimated
   impact  3. Get consent before rewriting. (rule-audit SKILL Step 2.5.)
   Both (3) and (4) **exclude test files** (`*.test.ts(x)`, `*.spec.ts(x)`, `__tests__/`) —
   filter them out before scanning. Phase 0's test-authoring checklist is unaffected.
5. **Demonstrate correctness** — tests, logs, screenshots if UI. Mocked-green is not proof for
   live-infra changes; see `# Verification & deploy`.

### Gate C — Subagent boundary (conditional)

Fires when the main thread dispatches a code-producing subagent. Skip if it was read-only.

1. Re-run `rule-audit` Phase 2 on the main thread against the subagent's diff.
2. **Don't trust the subagent's "audit passed"** — that ran in its own context against its own
   checklist. The main thread verifies against the project's real rule set.
3. Fix every violation on the subagent's added lines (any severity), then re-verify green
   — same standing rule as Gate B step 4.

Ask: "Would a staff engineer approve this?"


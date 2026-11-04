---
name: plan-authoring
description: >-
  Use when writing or presenting an implementation plan, entering or leaving plan mode, calling ExitPlanMode, handing a plan to a weaker model to execute, shaping a bug or feature JIRA ticket, writing the post-PR session summary, or working several JIRA tickets in parallel worktrees.
---

## Plan mode — when to press Shift+Tab

Press Shift+Tab BEFORE typing your task, not after.

Enter plan mode for:

- Changes touching 3+ files
- Unfamiliar codebase area
- Architectural decisions

Do NOT enter plan mode for:

- Single-file bug fixes
- Obvious test failures
- Styling changes
- Tasks you've done before here

Keep plan mode sessions short — 2–3 turns maximum. Once the plan is
clear, exit plan mode immediately and implement with Sonnet.
Do NOT continue multi-turn Opus conversations inside plan mode.

## Planning — scope

Applies to every plan I see, however it arrives: plan mode, `ExitPlanMode`, or a
written plan doc.

- **NEVER over-engineer a plan.** Over-engineering is extra SOLUTION surface, not
  extra detail — the inlined code, anchors, and test scaffolding that
  `## Plan authoring & handoff` demands are required and are never what gets cut.
  Cut these instead: abstractions no third repetition forced, flags / config /
  toggles nobody asked for, a new layer or endpoint when an existing one serves,
  generalising for a second caller that does not exist (YAGNI), migration or
  rollback machinery for a reversible change, and phases that exist to look
  thorough. Present the lazy-but-correct plan and let me ask for more.
- **No line-count cap on plans.** Rejected twice; do not re-propose one. Length is
  not the control — the bullet above is.
- **Smallest change that satisfies the requirement.** No opportunistic refactors,
  no "while we're here".
- **Never add a parallel API endpoint.** Before proposing ANY new endpoint, search
  for an existing one that already returns the data and say which one you found. A
  new `/agents/owners` when a tenant users API already exists is a failure, not a
  convenience — same incident that produced the naming rule under `## Design laws`.
- **Ask before widening scope** past the literal request — single-select vs
  multi-select, FE vs BE placement, extra states. Anything you think belongs in
  scope but I did not ask for goes in a `Deferred` section. Do not build it.

## Plan authoring & handoff (MANDATORY)

Plans are authored by the stronger model, implemented by a weaker one. Write every
plan so the weaker model executes it IDENTICALLY to how the stronger one would —
inline the exact before/after code, exact `file:line` anchors, exact test
scaffolding + run commands, and all context. No "figure it out" gaps, no
re-exploration required.

Scope constraints live in `## Planning` above and apply to every plan presented
here.

- **Plan-hardening gate (MUST, every plan):** before a plan is presented for
  approval — plan mode, `ExitPlanMode`, or a written plan doc — run BOTH:
  1. `grill-me` — interview me until scope, assumptions, and open decisions are
     settled. Its unresolved-decisions list must be empty or explicitly deferred
     by me.
  2. `junior-to-senior` — adversarial senior review of the drafted plan; fold its
     findings back in and present the REWRITTEN plan, not the draft.
  Order matters: grill first (settle intent), senior-review second (harden the
  artifact). Applies to bugfix plans, feature plans, and refactor plans alike.
  No skip for "small" or "obvious" plans; if a plan is truly one step, it isn't
  a plan — just do it. State in the plan that both ran.
- **JIRA gate (Step 0):** for EVERY plan, ASK whether a new JIRA ticket is needed.
  If yes, ticket creation is **Step 0** — create it FIRST, then STOP and wait for
  me to cut a branch from that ticket and tell you to proceed. Do NOT start
  implementation before the branch exists.
- **A ticket's Acceptance Criteria list is not the full locked scope.** The
  `grill-me` interview that precedes ticket creation can lock in commitments (a
  test-support ask, an explicitly-deferred item) that deliberately don't become
  formal ACs. When resuming a ticket after a context gap, re-check the interview
  transcript (or ask) for locked decisions beyond the AC checklist before
  treating something as still-open — a compacted summary's paraphrase of "the
  ACs" is not the whole agreement.
- **Ad-hoc single-ticket plans omit commit/branch/PR steps by default.** Deliverable
  is verified working-tree code; git ops are separate, explicitly-requested actions
  (2026-08-12: rejected a plan for including them, asked to skip). Does NOT
  apply to `## Autonomous multi-ticket pipeline`, whose per-ticket flow already ends
  in a pushed branch by design.
- **Every ticket created is assigned to me** — pass `assignee` (my accountId, from
  `atlassianUserInfo`) in the SAME `createJiraIssue` call, any path (MCP direct or
  `create-jira-ticket`). 2026-10-30: a ticket was created unassigned via direct MCP call.
- **Bug-ticket shape:** the description carries **Steps to Reproduce + Expected
  Behaviour + Actual Behaviour only**. The RCA — root cause per symptom,
  `file:line` anchors, fix shape — goes in a **comment**, and needs no separate
  permission. Reporter-observed contrast ("a local upload shows neither
  symptom") is description, not RCA. No process notes anywhere on the ticket.
  Feature tickets keep story/Background/AC/Out-of-Scope.
- **Session summary after PR (structured):** once the work is done and the PR is
  up, give a STRUCTURED summary, not just a flat list.
  - **Bugfix:** **Problem** (the symptom) → **RCA** (root cause + evidence with
    `file:line`, and the layer it actually lived in) → **RCA fix** (what changed
    and why that layer) → **What shipped**.
  - **Feature:** what shipped + why this design (vs the alternatives considered).
  - **Always:** call out the important actions / decisions made — for EACH, state
    WHY it was chosen and HOW it affects things (behaviour change, blast radius,
    follow-ups). Keep it scannable.


## Autonomous multi-ticket pipeline

When I hand you several JIRA tickets to work in parallel: one git worktree per
ticket (`superpowers:using-git-worktrees`), each ticket through the same sequence.
ONE approval gate per ticket — plus the `grill-me` interview that precedes it and
the terminal PR stop that follows it. Neither of those counts as an interruption;
nothing else interrupts me.

**Per ticket:** fetch → evidence-based RCA (`## Reproduce-first protocol`) →
`grill-me` interview → plan → [GATE] → implement → full suite green → push branch
→ STOP.

- **Let the `grill-me` interview run back and forth.** Do NOT batch its questions
  into one list to save round-trips — a real multi-turn interview per ticket is
  what I want. The plan-hardening gate applies here unchanged; `junior-to-senior`
  runs after the interview, with no contact from me.
- **Never resolve an open decision by guessing so the plan looks finished.** An
  explicitly uncertain plan beats a confident wrong one — ask the question, or mark
  it deferred per the plan-hardening gate. A tidy plan built on an invented
  assumption is the expensive failure.
- **The JIRA Step-0 branch gate does NOT fire here.** The tickets already exist, so
  the plan gate replaces it — do not deadlock waiting for me to cut a branch.
- **Approving a plan does NOT authorize a commit, push, or PR.** `# Gated actions`
  still holds in full: implement, run the suite, push the working branch, draft the
  PR body and the ticket's RCA comment in chat — then WAIT for my explicit go. A
  plan that grants itself commit/PR rights is precisely the blanket authorization
  that rule forbids.
- **Every plan states FE-vs-BE placement and justifies it.** Wrong-layer work is
  the expensive rework, not wrong code.
- **Commit per task-group inside each worktree.** A long implementer agent that
  stalls loses everything uncommitted.

**Consolidated report at the end**, per ticket: branch pushed · tests added with
red→green proof · drafted PR body · drafted RCA comment · every decision you were
uncertain about. Any new CLAUDE.md gotcha appears in that report as a DRAFT line
routed per `# Self-improvement loop` (universal → global, codebase-specific →
project) — never written unsupervised.

## Workflow (multi-agent) resume

`resumeFromRunId` cache is SAME-SESSION only — a workflow killed by quota or
session-end loses its cache; a next-session resume re-runs everything from
scratch. Durable checkpoint = the on-disk artifacts the agents wrote + an
explicit skip-list in the script, NOT the resume cache. Workflow subagents
inherit the session model (fable session → fable agents). Org monthly-spend
limit ≠ personal weekly cap — different gates; a monthly-spend death is not a
weekly-cap problem.

---

## Subagent strategy & exploration discipline

_Moved verbatim from global CLAUDE.md 2026-08-27 (context-cost reduction). These are mechanics; the gates stay in CLAUDE.md._

## Subagent strategy

Use subagents liberally to keep the main context clean. Offload research, exploration, and
parallel analysis. One task per subagent. Never ask Claude to "look through the codebase" in
the main thread — scope every exploration to a specific file or directory via subagent.

**A background agent without `isolation: "worktree"` shares the SAME git working directory as
the main thread.** Any git command that mutates checkout state (`git checkout <ref>`, not
`git show`/`git diff`) can leave HEAD detached or the tree dirty under you — confirmed twice
in one session, once right after a conflict had been resolved and pushed clean. Before
trusting local git state after dispatching agents into a repo they don't own exclusively,
re-run `git branch --show-current` + `git status --porcelain`. Prefer `isolation: "worktree"`
for any agent whose prompt might lead it to inspect a different ref in a repo with a live dev
server bind-mounted to that checkout.

**A quiet subagent is not a stuck subagent.** An output file that hasn't grown in a few seconds
proves nothing — an agent mid-web-fetch writes nothing for minutes and is working fine. I nearly
`TaskStop`ped a 20-minute research job on a 6-second byte delta; it completed on its own moments
later with the best findings of the session. Prefer waiting for the completion notification; if
you must judge liveness, use a window matched to the work (minutes for network-bound research,
not seconds), and never kill on a short no-growth check alone. Also never `Read`/tail a
local_agent's `.output` file to check progress — it's the full JSONL transcript and it will
blow up your context.

## Exploration discipline

Before a broad exploration — a multi-agent fan-out, or a multi-step diff-fetch / rule-load
loop — state a one-line plan (what you'll look at, roughly how wide) and surface findings
incrementally so I can redirect early. Don't narrate a long orientation with no output. Quick
scoped lookups (a single `@`-referenced file, one grep) are exempt — just do them.

**Grep `~/.claude/plans/*.md` before starting a fresh RCA or exploration.** Prior plans carry
already-verified `file:line` anchors for this monorepo and often root-cause the symptom
outright — cheaper than a subagent fan-out, and they name the traps. Re-verify the anchors
against the current branch (they go stale), but start from them.

**Don't fan out on "what exists / what's wired up" questions.** If a single authoritative
registration point answers it — a router mount list, a nav constant, a DI container, a route
table, a compose file — read THAT. A wide fan-out is more expensive and less conclusive, and
a large one can exhaust the weekly cap and return nothing (2026-08-03: 13 agents, 1.45M
subagent tokens, zero results; the solo pass that replaced it was better grounded because one
read of the API's router-registration list settled what a directory crawl could not).

## Research inputs to a plan

The gate is in CLAUDE.md, `## Planning & plan authoring`: no unverified figure reaches a plan.
This is how research feeds one without poisoning it.

**A plan's numbers are load-bearing in a way its prose is not.** Scope, sequencing, build-vs-buy,
and "is this worth doing at all" key off the research section. A wrong sentence gets argued with;
a wrong number gets budgeted against. One fabricated figure silently re-plans the feature.

**Neither hardening gate catches a bad input.** `grill-me` stresses DECISIONS and
`junior-to-senior` stresses ALTITUDE AND DESIGN. Both assume the figures are real. An invented
number passes through untouched and comes out the far side looking hardened, because it now sits
in a plan that survived two adversarial reviews. Verify inputs BEFORE the hardening sequence, not
after — the sequence launders what it does not check.

**Before presenting, run the research section separately from the design section.** For every
figure: re-derive it from source, attach its provenance tag (`verification-evidence`, "Provenance
per number"), or downgrade it to `not measured` with the command that would settle it and one line
on what changes if it comes back different. A plan is allowed to say "not measured"; it is not
allowed to say a number it cannot source.

**A subagent's research is unverified by construction.** Gate C already covers a subagent's diff;
the same applies to its FINDINGS. Re-derive any figure a research subagent reports before it
enters the plan — its confident summary is not evidence, and its provenance is invisible to you
unless you ask for the command.

**Flag the sensitivity, not just the value.** When a plan's shape would change if a figure moved,
say so inline ("at 2× this number we shard instead; at 0.5× we do nothing"). That converts an
uncertain input from a hidden risk into a stated decision boundary, and it survives the figure
turning out wrong later.


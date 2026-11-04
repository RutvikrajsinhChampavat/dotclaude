---
name: verification-evidence
description: >-
  Use when a mocked-green test needs live-infra proof (Postgres constraints, LLM, Temporal, SSE), claiming done/fixed/passing, deciding what to rebuild/redeploy after a backend or agent-bundle change, confirming a bug, citing figures, trusting a recalled file/flag, or a login blocks the browser.
---


## Live-stack verification beats mocks

A green mocked unit test is NOT proof when behaviour depends on live infra. When a change
touches LLM output, DB constraints (PK/unique/FK), managed prompts, Temporal lifecycle, or SSE
framing, verify against the REAL stack before claiming done:

- DB constraint / upsert / collision logic → real Postgres (`docker compose exec`), not a
  `MagicMock` db — mocks hide PK/unique violations.
- LLM / classifier / intent behaviour → a live LLM probe (`docker cp` + real-LLM exec, or the
  live gateway), not a stubbed caller.
- Never claim a visual/animation works as if I saw it — say "wired; confirm at <url>".

State the evidence (command + observed result) when you claim done.

## Trust recalled memory, but verify

A recalled memory is a snapshot of a past truth, not current state. If one names a file, flag,
function, route, or column, confirm it still exists before recommending or acting on it —
renames, dropped columns, and moved flags silently invalidate old notes.

**Episodic search missing a session ≠ the session didn't happen.** Its index lags (this
project's stopped ~5 weeks behind), so a resumed cross-day session finds nothing. Fall back to
`<project>/.remember/` — `now.md` plus `today-<date>.done.md`. Those are SUMMARIES, not
transcripts: they record what shipped, never the corrections — do not author rules from them.
Prefer a plain-string query over a concept array; the array does strict AND and returns empty
on near-misses.

## Enumerate rebuild / redeploy targets

Code edited ≠ change live. After any backend or agent-bundle change, state exactly what must
be rebuilt / republished / redeployed — which container (`./build.sh <svc>` /
`--force-recreate`), which bundle, both tarballs, any token re-source. On version bumps, check
for orphaned old containers polling the same queue (a past split-brain incident).

## Evidence standard — one soft signal ≠ proof

Don't label a bug 'confirmed'/'proved' from a single pollutable signal (counting strings in
rendered output, a screenshot) plus a plausible mechanism — that pairing is how a false
positive earns a confident label. Demand an ORTHOGONAL hard signal the surface can't fake: an
HTTP status, a DB value, or the render INPUT. For "is X rendered / duplicated / present" in a
React app, read component state via fiber (`el.__reactFiber$…` → walk `.return` →
`memoizedProps`), NOT DOM text — sidebars/recents/lists echo content and inflate text counts.
Measure the thing the bug is DEFINED on, sampled across the actual failure window.

**Prove a new test can fail.** After writing a test for logic you just wrote, break that logic
deliberately (flip a condition, drop a param), confirm the test FAILS, then revert. A green
test never seen red may assert nothing wired to the code.

**Read the test count before calling a run green.** The count line (pytest `N passed`, vitest
`Tests  N passed`) must show N > 0 and match the tests you meant to run. A `-k`/`-t` filter or path
that matches nothing, `--passWithNoTests`, and a collection error all finish with zero failures.
Pytest exits 5 when it collected nothing and 2 on a collection error or interrupt. **In a mutation
loop, a mutant is killed only when the run collected N > 0 tests and at least one FAILED** (pytest
exit 1). Exit 5, exit 2, or a broken-syntax mutant marks it INVALID: fix and re-run it, never count
it. Keep one control mutant that must survive, so you can see the loop is not killing everything.

**A suspiciously identical response across unrelated targets needs a control probe.** Three
domains returning byte-identical output is more likely one interceptor faking all three than
three coincidences. Probe a target known to be inert and one guaranteed to fail: if the inert
one returns its own real 404 and the impossible one gives a DNS error, the signal is real; if
the inert one ALSO returns the payload, something in the path is fabricating it.

**A performance claim needs a measured number, not call-count arithmetic.** "More operations
per frame" isn't evidence of real cost — wrap the function in `performance.now()` (N samples,
real browser) before reporting perf as fact. (2026-08-10: flagged a canvas loader as costlier
without measuring; measured cost was <1% of frame budget.)

## Provenance per number — mechanics

The gate is in CLAUDE.md, `# Verification & deploy`. This is how to run it.

**Tag at write time, in the table.** One column, five values:

| Tag | Means | Must also carry |
|---|---|---|
| `measured` | read from a log, run, or query | the run id / command that produced it |
| `derived` | arithmetic over measured values | the arithmetic, inline |
| `published rate` | a vendor's list price or spec | the source, linked |
| `estimated` | a judgement call | what it is sensitive to |
| `not measured` | unknown | the command that would settle it |

A blanket disclaimer at the top does not discharge this. Reformat the table before dropping a
tag — a guess in the same bolding and decimal places as a measurement reads as measured.

**The failure that forces this (2026-09-30, a pipeline cost analysis).** A first draft shipped
20 wrong figures because every gap got the most plausible value instead of a measurement or a
hole. Five distinct mechanisms, all worth recognising:

1. **Gap-filling for a complete-looking artifact.** `~70% mocked`, `42 runs`, `6 bundles`,
   `keep 13 videos` — none derived from anything; "13" had no origin at all. A document with no
   holes reads authoritative, which is exactly what makes the invented cells dangerous.
2. **One signal plus a plausible story, labelled confirmed.** Two "worst incident" findings were
   fabricated causes. See the Evidence standard above.
3. **n=1 reported as a system property.** A ceiling, an idle %, and a flake split all came from
   one run. Eight runs cost one command; the single sample sat near the fast end of a 148–230 min
   spread, so the ceiling came out ~20% optimistic.
4. **Unit drift.** Seconds-per-EXECUTION (divided by a count that included retries) was then
   multiplied against a future TEST count that would generate its own retries. Retries divided
   out, never multiplied back.
5. **Answering from the file you opened, not the one that governs.** A k8s footprint was read off
   one tenant overlay; the deployment comes from `globals` + `envs/<env>` + tenant merged. Resolve
   the merge or label the figure with the layer you actually read.

**Count with a command, never by eye.** Tallies read off scrolled output were wrong every time
they were tried. `--json … -q` and `wc -l`, not mental addition over a printed list.

**`gh` duration claims: read `run_attempt` FIRST.** `gh run view <id> --json jobs` returns the
LATEST attempt's jobs while the run's `createdAt` is attempt 1, so subtracting them invents a
queue delay that never happened. Both fabricated incidents above came from this one mistake.

```bash
gh api repos/<owner>/<repo>/actions/runs/<id> --jq '.run_attempt, .run_started_at, .created_at'
gh api repos/<owner>/<repo>/actions/runs/<id>/attempts/<n>/jobs --jq '.jobs[]|"\(.name) \(.started_at)"'
```

Use `run_started_at`, never `created_at`, for anything that will be called a duration.

**A verification pass must be adversarial toward its OWN output.** Round 1 of that audit
introduced fresh errors: a bad proxy (count call sites) was swapped for another bad proxy (does a
`beforeEach` exist) instead of reading the hook bodies. Re-check by a DIFFERENT method than the
one that produced the number, or the pass just relocates the error.

## Local verification — browser

Do NOT drive a browser to check a UI change live — hand that check to the user (the gate lives in
CLAUDE.md, `# Verification & deploy`). Screenshot and click loops cost orders of magnitude more
context than the verdict is worth. Text-only programmatic reads — `read_page`, `javascript_tool`
fiber reads, `read_console_messages`, `read_network_requests` — stay allowed and are still
required wherever the Evidence standard names them.

- Hand off with the exact URL, the exact steps, and what to look for. A bare "can you check it?"
  makes the user reconstruct the test and is how this decays.
- Do NOT attempt a login: typing a password into a form is blocked at the harness level no
  matter what this file says, so an auth loop burns the session and still fails.
- If evidence needs auth and no authenticated session exists, say so in ONE line, then fall back
  — live DB query, unit/integration test, React fiber instrumentation, or server logs. Don't
  re-litigate the login.
- Never add credentials to this file. (Local-stack logins already in a project `CLAUDE.md`
  stay where they are.)
- The durable fix is environmental: a seeded session cookie, a Playwright `storageState` file,
  or a dev-mode auth-bypass flag.

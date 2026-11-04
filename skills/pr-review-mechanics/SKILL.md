---
name: pr-review-mechanics
description: >-
  Use when reviewing any GitHub PR ("review this PR", /review, gh pr diff, a *-reviewer agent): drafting or posting inline file:line comments, a Request Changes/Approve verdict, re-reviewing after a force-push or resolved threads, a cross-repo paired PR; also when writing a PR body.
---

# PR review

When reviewing any PR (via `/review`, `gh pr diff`, direct diff inspection,
or any `*-reviewer` agent):

0. **PR-review skill gate (MUST, every GitHub PR review):** invoke `review`
   (diff/context gathering) AND `code-review:code-review` (its analysis
   engine: eligibility check, CLAUDE.md file discovery, PR summary, the
   5-parallel-agent audit — CLAUDE.md compliance / shallow bug scan / git-blame
   history / prior-PR-comment precedent / in-code-comment compliance —
   then Haiku confidence-scoring, filter <80).
   - **If a session-level directive forbids subagents, the gate DEGRADES, it
     does not vanish:** run `rule-audit` Phase 2 on the main thread, verify
     solo (fresh diff · red/green · an orthogonal hard signal), and state in
     chat which gates ran and which were skipped and why. Never drop the gate
     silently.
   - **`code-review:code-review`'s own step 8 (auto-post a top-level `###
     Code review` summary comment) NEVER RUNS.** It collides with two
     absolute rules below: point 9 (inline-only, no summary body, ever) and
     point 10 (never post without approval of the TEXT). Route its
     score-≥80 survivors through points 9-10 instead — draft as inline
     per-file:line comments, wait for explicit approval, post individually.
   - Reconciled 2026-08-05 after the skill's native posting shape was read
     and found to collide; do not re-propose adopting step 8 as-authored.
1. **Invoke `rule-audit` skill — Phase 2 mode FIRST.** It loads the
   authoritative project + global rule checklist scoped to the file types
   in the diff. Do not roll your own rule discovery.
2. Read the diff with the checklist in hand. Always work from a FRESH diff
   against the current PR head (`gh pr diff <n>` re-fetched this turn) —
   never reuse a stale diff from earlier, or you'll review already-fixed code.
   Also pull the linked JIRA ticket and map each acceptance criterion to the
   code that satisfies it; an unmet AC is a finding, same as a bug.
   - **Don't take the PR description as ground truth for what the code
     does.** It's the author's narrative of intent, written by the same
     person who may have missed the bug — treat every claim in it ("fixes
     a race", "adds validation") as a hypothesis to verify against the
     actual diff, never as evidence a finding is or isn't real. Fine to
     quote it when describing what the PR is FOR; never as the basis for
     a correctness judgment.
   - **Correctness bugs are the primary job; style/convention is
     secondary.** Spend the first pass hunting actual defects (wrong
     logic, race conditions, missing null checks, broken contracts, untested
     failure paths) before running the rule-audit convention scan. When
     posting, correctness findings always outrank and outnumber convention
     ones in what actually reaches GitHub — a diff with 2 real bugs and 5
     comment-placement nits should not read as a wall of style nitpicks
     with the bugs buried in it.
3. Flag every violation explicitly with the broken rule's name (e.g.
   "violates no-any rule", "props type belongs in `types/` folder, not
   inline", "premature `useCallback` — patterns.md: profiler-justified only").
4. Call out missing tests against the project's coverage requirement.
5. Label every finding with ONE of four labels, decided AFTER point 6's
   reachability call (impact × likelihood, not impact alone):
   - `blocking:` — must be fixed before merge. Security hole, data loss, or a
     bug reachable on normal use. Any `blocking:` → Request Changes.
   - `suggestion:` — worth fixing, does not block. Real bug behind an
     unlikely-edge precondition, maintainability, a missing test.
   - `nit:` — optional polish. Style, naming, comment wording.
   - `question:` — you are not sure it is a defect, or have not verified it.
     Ask, don't assert ("does this handle `TIMED_OUT`?").
   Blocking is binary: there is no "should fix" middle tier. Impact (security
   vs bug) goes in the reason sentence, not the label. Each posted comment
   carries its label as its lead word (point 9), nowhere else.
6. **Classify every finding by prod-likelihood, not severity alone.** Alongside
   severity, tag how reachable the failure actually is in production, and split
   findings into two buckets: **reachable** (deterministic, or normal user
   behavior — fires with no contrived conditions) and **unlikely-edge** (needs a
   sub-second click race, a total infra outage like Redis down, an unguessable
   id that no API surfaces, physically-implausible user speed, or an attacker
   precondition nothing exposes). ALWAYS still report the unlikely-edge findings
   — never silently drop them — but mark each `report-but-defer` and name the
   concrete precondition that won't occur, so I decide whether to fix/post now.
   Do NOT inflate an edge case's severity from its worst-case impact when its
   trigger is near-unreachable — state impact and trigger-likelihood as separate
   axes (a real bug behind a 1-second race is a `suggestion:`, not `blocking:`;
   a CERTAIN cosmetic slip is still a `nit:`, never dropped). This classification is not chat-only — the reachable/report-but-defer
   call goes in the posted comment itself too (point 9), not just the chat triage.
7. **Give a UI reproduction for every `blocking:` / `suggestion:` finding when one is
   possible.** Lead the finding with numbered, manual-QA repro steps the user can
   run in the live app — exact clicks/inputs (DevTools Network/Console where
   needed), then **Observed** vs **Expected** — plus a single `file:line` pointer
   for the dev.
   - If the issue has **no UI manifestation** (review/tooling, build, code-style,
     comment rot, type design), just state "**Not UI-reproducible**" and describe
     the issue plainly with the `file:line`. Do NOT paste code excerpts or
     grep/command output — describe, don't dump.
   - If you can't actually trigger it and aren't sure it's real, label it
     `question:` and phrase it as one.
   - `nit:` may give the `file:line` only.
8. **No silent rewrites.** Reviewer agents report findings; they do not
   patch the PR. Author owns the fix.
9. **Inline PR comments = issue + fix, with reproduction WHEN available.**
   When asked to add PR review comments (posted inline on the diff), every
   comment carries the **issue** and the concrete **fix**, always. Add a
   **reproduction** only when concrete steps exist to trigger it (in the
   live app, or a condition that's actually reachable today) — omit it
   entirely otherwise, don't pad with an `N/A`/`Not reproducible`
   placeholder line. (Reconciled 2026-09-28: dropped the earlier "never
   omit, write `Not reproducible — <reason>`" rule per explicit correction
   — placeholder lines on style/convention findings read as noise, not
   signal.)
   - **Comments must read like a real developer wrote them, not an AI
     review tool.** No bolded `**Issue:**` / `**Repro:**` / `**Fix:**`
     field labels — a template is the single biggest tell. Write it as
     plain prose the way a teammate would type a quick comment on your
     diff: say what's wrong in a sentence or two, work in how to trigger
     it only if there's something concrete to say, then say what you'd
     do about it — no headers, no form. The issue → repro (if any) → fix
     CONTENT ordering above still applies; only the literal bolded
     template is banned. Run the `fuck-slop` skill's register check
     (target: terse GitHub PR review comment) on the draft before
     presenting it for approval — it catches the AI tells a template
     doesn't fix on its own (uniform cadence, hedged phrasing, "not X,
     it's Y" framing). (2026-09-28: a past PR drafts used a bolded
     3-field template throughout — flagged as reading like AI output.)
   - **Label AND production-reachability both go IN the comment text, and
     only there.** Open every inline comment with its point-5 label —
     `blocking:`, `suggestion:`, `nit:` or `question:` — lowercase, the way a
     teammate writes it. No review body is ever
     posted (see inline-only, below), so the comment is the only place the
     author can read how blocking it is — and the only place they can read
     whether it actually fires in production. Immediately after the label, in the same sentence or the next, state the point-6 classification
     in plain prose: **reachable** (normal user behavior, no contrived
     condition — say so plainly, e.g. "this is the default sync-run path, no
     special permission needed") or **report-but-defer** (name the concrete
     precondition that won't occur in practice — a sub-second race, an infra
     outage, an attacker precondition nothing exposes). If reachability rests
     on a code-reading argument rather than something you actually ran or
     measured, say that too — don't let "reachable" read as "verified
     end-to-end" when it means "this code path executes on normal input and I
     haven't measured the runtime effect." E.g. "blocking: reachable on every
     sync-run completion for any user with insights access — confirmed by
     reading the code, not by reproducing the stall live; worth the author
     confirming against the backend before merge."
     In chat, the point-6 confidence SCORE and the fix-now/defer/skip DECISION
     stay chat-only — those are my recommendation to you, not a fact about the
     code. The reachable/report-but-defer CLASSIFICATION is different: the
     author needs it to judge the finding, so it ships in the comment, not
     just chat. Keep it plain prose: not bolded, not bracketed (`[blocking]`,
     `[reachable]`), no `Severity:`/`Reachability:` field or emoji, never
     restated later in the sentence — that would be the field-label template
     the bullet above bans. Label from impact and certainty, not worst case,
     so an unlikely-edge finding is a `suggestion:`, not `blocking:`.
     (2026-10-14: switched from Critical/High/Medium/Low — the old scale had
     MEDIUM stricter than HIGH, and authors had to translate severity into a
     merge decision themselves.)
     (2026-09-30, a past PR: drafts carried no severity, so the author
     couldn't tell a fix-before-merge item from a nit. 2026-10-01, a past PR:
     reachability was triaged correctly but only surfaced in chat — the
     comment as drafted would have left the author unable to tell a
     confirmed-reachable finding from a defer-worthy edge case.)
   - **NEVER cite a private/gitignored rule file by name in a comment that
     gets posted externally** — `CLAUDE.md`, any `.claude/*.md`
     (`architecture.md`, `rules.md`, `review.md`, `context.md`), or any
     personal global rule file. These are local-only (often gitignored and
     not shared with team or CI) — a PR reviewer or
     the author has no access to them and can't verify the citation, and
     naming them leaks that a private AI-review rule-file setup exists.
     State the convention/reasoning directly instead ("usually laid out
     component-first, helpers after — for scannability") — never "violates
     X.md's rule". Applies to every posted comment, not just this point.
     (Caught 2026-09-28 on a past PR: two posted comments named
     `architecture.md` / "this repo's CLAUDE.md" verbatim.)
   - **Point 7's repro steps ride in the posted comment too, not only in the chat
     draft, and only for findings reachable from the UI.** For a `blocking:` /
     `suggestion:` finding a user can trigger in the live app, end the comment with
     `To reproduce:` and a short numbered list (URL, clicks, inputs), then what
     you'd expect versus what happens. Test-gap, code-shape and convention findings
     get NO repro block, not even a command or a mutation recipe: put their evidence
     in the prose ("I deleted the line and all four tests still pass"). Not run
     live? Write "I'd expect", never an observation you didn't make; reproduced it in a
     browser (see "Browser reproduction")? Write what you saw and that it was the PR's
     code. A bare `To reproduce:` line with a numbered list is not the banned bolded template.
     `nit:` may skip it. Adding steps to an already-posted comment is an edit: same
     approval gate as posting (point 10), PATCH via the `jq` + `--input -` form
     below. (2026-09-30, a past PR: five comments went out with one "to see it"
     sentence between them and the user asked for the steps; my first redraft also
     gave the two test-gap comments a mutation-plus-vitest recipe and the user
     narrowed it to UI-reachable findings only.)
   - **Code inside a `suggestion` block must itself pass the rule-audit**
     (no inline logic/handler in a `.tsx`, no `any`, tokens not hex) — the
     author one-click-applies it, so it is authored code. A compliant fix
     that needs a 2nd edit (extract a `handle*`/helper) is a DESCRIBED fix,
     not a `suggestion`. "The file already does X" ≠ license for new debt.
   - **Post INLINE comments ONLY — never a review-summary/overview body.** A
     posted review carries just the per-line comments; do NOT attach a
     top-level review body (verdict, approvable/LGTM, contract-check summary,
     scope heads-up, "clean change"). This is absolute — no top-level/summary
     comment gets posted, ever, even if it'd seem useful; surface any
     non-inline info in chat instead, never as a posted PR comment.
     **Via `gh api` directly:** use the single-comment endpoint per comment —
     `gh api repos/<owner>/<repo>/pulls/<n>/comments -f body=… -f commit_id=<head-sha> -f path=<file> -F line=<n> -f side=RIGHT`
     — each call becomes its own standalone mini-review with no body field.
     Do NOT use `POST /pulls/<n>/reviews` (the batch endpoint) for this: it
     requires a top-level `body` even for `event=COMMENT`, which is exactly
     the summary this rule forbids.
     **`-f body=@file` silently posts the literal string `@path`, not the
     file's content, on `gh` 2.98.0 — no error, no warning.** Confirmed
     2026-09-24 on a past PR: 7 comments posted with `@/tmp/.../c1.md`
     etc. as the visible body; caught only because the user read the actual
     GitHub page. **Always read back at least one posted comment's `.body`**
     before reporting comments as posted — a 200/created response is not
     proof the body is right.
     **If a draft body is in a file, build the FULL JSON payload with `jq`
     and pipe it via `--input -`** — do not mix `--input` with `-f`/`-F`:
     when both are given, `gh` silently drops the `-f`/`-F` fields and uses
     only the `--input` JSON, so a stray `-f path=…` alongside `--input`
     doesn't error, it just gets ignored (confirmed 2026-09-24: a one-off
     PATCH sanity-check with `-f path=foo --input -` silently overwrote a
     real comment's body with the check's dummy JSON, not path=foo — see
     the "gated actions" note below). Put every field the request needs
     into the one `jq` object:
     `jq -n --rawfile body <file> --arg sha <head-sha> --arg path <file> --arg side RIGHT --argjson line <n> '{body:$body, commit_id:$sha, path:$path, line:$line, side:$side}' | gh api --method POST repos/<o>/<r>/pulls/<n>/comments --input -`
     — Fixing an already-posted comment (PATCH only accepts `body`):
     `jq -n --rawfile body <file> '{body:$body}' | gh api --method PATCH repos/<o>/<r>/pulls/comments/<id> --input -`.
     **Never PATCH a real comment id to sanity-check a command shape** —
     even a "just testing the mechanics" call against a live id overwrites
     its body immediately (no dry-run flag exists). Verify request shape
     against `gh api -X GET .../comments/<id>` (read-only) or reason from
     `gh api --help`/docs instead. A PATCH/DELETE against an already-posted
     comment is covered by the same approval gate as posting it in the
     first place (point 10) — an "I'm just verifying the syntax" PATCH is
     still an edit and still needs that gate, which the 2026-09-24 incident
     skipped.
   - **Right before the first POST, confirm the head has not moved.**
     `gh pr view <n> -R <o>/<r> --json headRefOid -q .headRefOid` must equal the SHA you reviewed,
     which is the `commit_id` you are about to send. If it differs, post nothing: re-fetch the diff,
     re-check every draft's line against the new head, and show any changed draft for approval
     again (point 10). Line numbers computed on an old head land on the wrong code.
   - **A draft whose line is outside the diff stays in chat.** GitHub rejects an inline comment
     whose `line` is not inside a diff hunk with a 422 ("pull_request_review_thread.line must be
     part of the diff", or "Line could not be resolved"). Pre-check each draft: its line must
     fall inside a `@@ +start,count @@` range for that file in `gh pr diff <n>`. One that doesn't
     goes in chat, labelled out-of-diff. Re-anchoring it to a nearby in-diff line, posting it
     with `subject_type=file`, or posting it as a top-level comment all route around inline-only.
   - **Same rule violation at more than 4 locations → ONE consolidated inline
     comment, not one per site.** Post it anchored at the first occurrence:
     issue once, fix once, then a `file:line` list of every other site. Below
     the threshold (≤4 locations) keep posting one inline comment per site —
     small enough to track individually, and each reads in place. Above it,
     N near-identical threads is GitHub-conversation clutter, not signal.
     (Triggered 2026-09-10: an 8-location comment-on-const violation went out
     as 8 separate near-identical inline comments on a past PR.)
   - **Exception — a review VERDICT (`Request Changes` / `Approve`) is a
     different action from posting comments and does need the batch
     endpoint.** `REQUEST_CHANGES`/`APPROVE` only exist on `POST
     /pulls/<n>/reviews`, and GitHub hard-requires a `body` for both — there is
     no way to set the verdict without one. When asked for that verdict (not
     just comments), use that endpoint with `event=REQUEST_CHANGES` (or
     `APPROVE`), a ONE-LINE pointer body (`"Requesting changes — see inline
     comments."`), and an empty `comments` array if per-line comments were
     already posted standalone (avoids duplicating them). The one-line body is
     a required protocol field, not a findings recap — never expand it into a
     summary. Default posting mode stays inline-only per above; only switch to
     this when a verdict is explicitly requested.
10. **Never POST a PR reply/comment without my explicit approval of the reply
   TEXT.** Draft replies inline, show them, wait for the go, then post. "Do
   the same" / "handle the comments" authorizes verifying + drafting, NOT
   posting; same gate for editing or deleting a posted comment.

11. **Triage review comments received on MY code the SAME way I author a
   review — before addressing them.** Verifying a comment is *factually
   accurate* is NOT enough and does NOT make it must-fix. Run every incoming
   comment through the point-6 prod-likelihood triage: reachable vs
   unlikely-edge, severity × trigger-likelihood. An accurate finding whose
   trigger is an unlikely-edge (infra outage like Redis down, sub-second race,
   attacker precondition nothing exposes) is **report-but-defer** — surface the
   triage and let me decide (fix now / follow-up ticket / skip) BEFORE writing
   code. Do not silently implement a fix (esp. a contract change or new path on
   a feature PR) for an accurate-but-low-prod-likelihood comment. Trivial
   zero-risk fixes (a doc/comment clarification) can just be done.

   **First, check the comment isn't STALE** — a comment posted before a
   force-push/rebase critiques code that no longer exists. Confirm the cited
   code is still on HEAD: `gh api repos/<o>/<r>/pulls/<n>/comments --jq
   '.[]|{path,line,commit_id,original_line}'` — a `line:null` / `commit_id:null`
   row is GitHub-flagged OUTDATED. Assess against the CURRENT head, not the
   comment's original line; a superseded implementation can moot the finding.

12. **Review ONLY the PR asked for; reference PRs are context, not review
   subjects.** When given a target PR plus "reference PRs", use the references
   solely to verify the TARGET's contracts hold (does the FE read a field the
   BE reference PR actually sends; do endpoint shapes align) — never audit a
   reference PR's code quality / perf / security. Flag a reference PR in one
   line ONLY if it breaks the target's contract; otherwise stay silent on it.
   **Before tracing any contract, confirm the reference PR actually relates to
   the same ticket/feature** — map it against the JIRA ticket first. An
   unrelated reference PR (wrong link pasted, or just another open PR by the
   same author) gets a one-line flag, not a contract trace.

13. **Confirm the exact file count BEFORE analyzing.** State how many files the
   fresh diff touches (`gh pr diff <n> --name-only | wc -l`, run with `-R` or a
   `cd` in the same invocation) and list them. A miscounted scope silently drops
   files from the review and the miss never surfaces.

14. **On re-review, re-read the code behind every previously-posted thread.** A
   `resolved` status means someone clicked a button, not that the code changed.
   Fetch a fresh diff and verify each fix at its `file:line`; explicitly call out
   any thread marked resolved whose code is unchanged.

15. **A finding deferred to a companion PR is not closed until you verify that PR
   AND the merge order.** Read the companion's diff for the claimed mechanism (not
   just its description), check its CI, and confirm it carries a regression test.
   Then state the sequencing explicitly: a consumer PR merging before its producer
   ships the exact bug you flagged. For agent-bundle fixes also confirm the
   artifact was republished — a merged bundle commit with no version bump means a
   running container can serve pre-fix code under an identical version string.

16. **Every review and re-review ends with a merge verdict in chat.** Last section of
   the chat report, never posted unless I ask (point 9's verdict exception covers the
   posting shape). Three values only:
   - `Approve` — no `blocking:` finding open AND every eslint and test check is
     `success` on the exact head SHA you reviewed.
   - `Request changes` — any open `blocking:` finding, or an eslint/test check the PR
     itself broke (new lint error or failing test in files it touches, or red on this
     branch and green on `main`).
   - `Hold` — the code is fine but CI can't vouch for it yet: a check is pending/queued,
     `cancelled` (the tests never ran, so there is no green evidence), or red on `main`
     too. Name the check and what would flip it to `Approve`.
   CI mechanics (match the run's `head_sha` to the reviewed SHA, `cancelled` shows as
   `fail` in `gh pr checks`, read job step conclusions, compare against recent `main`
   runs) live in your project's change-control notes, if it has them. Pull the
   checks with `gh pr view <n> -R <o>/<r> --json headRefOid,statusCheckRollup` and filter
   to eslint/lint and test jobs. Non-lint/test checks (trivy, semgrep) that are red on
   `main` and every recent PR are reported but don't move the verdict; one that is red
   only on this PR does. Re-check CI on the latest head right before giving the verdict —
   a re-review that started on a running pipeline must not inherit an earlier green.
   (2026-11-03, a past PR: two review passes ended with findings and no verdict, and
   the re-review closed while CI on the new head was still running.)

This applies equally to local `code-reviewer`, `typescript-reviewer`,
`python-reviewer`, and `database-reviewer` agent invocations — they all
load the same rule-audit checklist as their first step.

## When to use

- Reviewing any PR: "review this PR", `/review`, `gh pr diff`, direct diff inspection, or a `*-reviewer` agent.
- Drafting or posting inline `file:line` comments, or giving a Request Changes / Approve verdict.
- Re-reviewing after a force-push or after threads were marked resolved; verifying a finding deferred to a companion PR.
- A PR with a paired contract PR in a sibling repo (parallel cross-repo fan-out).
- Authoring a PR body.
- The non-negotiable gates live in CLAUDE.md (`# PR review`); this skill is the how.

## Parallel review fan-out (cross-repo PRs)

Default shape when a PR has a paired contract PR in a sibling repo. This
PARALLELISES the numbered rules above across agents — it does not restate them.
Every agent loads the same rule-audit checklist and reports against those points.

Dispatch four agents concurrently, each blind to the others:

- **A — contract conformance.** Trace every producer field in the reference PR to
  its consumer in the target. Bounded by point 12: the reference repo is CONTEXT,
  never a review subject — no quality, perf, or security audit of it. A
  reference-repo defect is reportable in one line ONLY if it breaks the target's
  contract.
- **B** — rule audit (point 1). **C** — behavior in the diff with no test (point 4).
  **D** — JIRA acceptance-criteria traceability (point 2).

Then, as lead, BEFORE I see anything:

1. **Try to DISPROVE every finding** by reading the code around it. Drop whatever
   turns out to be intended behavior. An agent reading a diff in isolation cannot
   distinguish a defect from a deliberate design choice, and that false positive is
   what costs me a review round. This pass IS Gate C's main-thread verification —
   do not also run a separate one.
2. Merge, dedupe, rank survivors by severity × prod-likelihood (point 6), each with
   a `file:line` anchor.
3. Present as DRAFT inline comments in chat. Point 10 governs posting — nothing
   reaches GitHub until I approve the comment TEXT.

## Executed evidence (when reading can't settle it)

Reading shows what the code says; a probe shows what it does. Worth it for any behavior or
test-gap finding (a past PR: a scratch worktree settled three findings the agents could
only argue).

- **Scratch worktree, never the user's checkout.** `git worktree add --detach <scratchpad>/wt <sha>`,
  `ln -s "$REPO/node_modules" <wt>/node_modules`, then run the PR's own test files first: green
  means the author's claim holds locally. Probes go in NEW files inside the worktree; edit PR files
  only for mutants and undo with `git checkout -- <file>` inside the worktree. Cleanup:
  `unlink <wt>/node_modules`, `git worktree remove --force <wt>`, `git worktree list`, and confirm
  the real `node_modules` still has its entries.
- **Every probe gets a control** (the case that must NOT trigger) and a runtime-shaped fixture. A
  fake that omits what the runtime always supplies (`items: undefined` on a `DataTransfer`) only
  exercises the fallback branch; add one real-shaped case.
- **Mutate the PR's own new tests.** One mutant per run: delete the key line, hoist it above an
  early return, drop a guard. Confirm each applied (`git diff --stat`), run the test file un-piped.
  A mutant that stays green IS the finding; state it in the comment's prose, since a test gap gets no
  repro block (point 9).
- **A reading-only scorer can't see runtime.** A `code-review:code-review` scorer under 80 on a
  finding backed by an executed probe or mutation stays in the drafts: state the scorer's number
  and why it stays. Under 80 with reading-only evidence goes to the defer list, draft kept ready
  to promote.
- **Read the step conclusions before blaming the diff for a red check** (the repo's change-control
  skill has the `gh api` call). A cancelled test step means the new tests never ran in CI; say so,
  and run them yourself as above.
- **Telling agents to read via refs:** hand them the braced form `"${B}:path"`; a bare `$B:path`
  errors in zsh even when quoted.

## Browser reproduction (PR review only)

Granted 2026-09-30: for a UI-reachable finding you may reproduce the scenario in a browser instead
of writing "I'd expect". This lifts the global "never drive a browser" MUST for PR review only.

- **Login wall = stop.** A redirect to Keycloak or a login page, or a 401, ends the attempt: one
  line naming the gated URL, ask me to sign in or unblock it, then wait. Never type credentials
  (the harness blocks it anyway), never retry, never route around. If the local app redirects the in-app browser to an
  identity-provider login, say up front that it will stop there and ask for the session.
- **The page must run the PR's code.** The dev server on `:3000` runs whatever branch its own
  checkout is on, not the PR, and that checkout need not be the repo you are reviewing. Check the
  served branch: the server's checkout HEAD must equal the PR's
  `headRefOid`. Then grep that checkout for a symbol the PR adds before trusting anything. Another port needs me to register it:
  an identity provider typically rejects an unregistered `redirect_uri` with HTTP 400, and the
  API's CORS list may only allow the default port. Ask me to register
  `http://localhost:<port>/*` as a redirect URI and web origin plus the extra CORS
  origin, or to put the PR on `:3000` myself; then run a scratch worktree of the PR sha there
  (untested: a symlinked `node_modules` can break Turbopack, try `next dev --webpack`). Never
  switch the user's checkout or stop their dev server yourself. Anything seen on other code is a
  premise check, not a reproduction.
- **Text first, bounded.** `read_page`, `javascript_tool` (`document.activeElement`, a logged
  `clipboardData.types`) and console reads before any screenshot; a screenshot only when layout is
  the finding. Budget about 10 browser calls, then report what was tried and keep "I'd expect".
- **Read-only interaction.** The PR's own scenario on test data; nothing destructive, nothing
  that changes account state or submits real data.
- **Clipboard and paste findings.** These tools cannot put a file on the OS clipboard. On
  2026-09-30 (Chromium 152 pane, `visibilityState: hidden`) `computer key` ⌘V fired no paste event
  in a focused search field and ⌘A selected nothing; one run, cause unconfirmed (hidden pane, or
  injected keys bypassing macOS menu key-equivalents). Treat a paste as unstageable until a
  positive control shows otherwise. What you can observe is focus and DOM state
  (`document.activeElement` after a real click). If you try anyway, run that control first (paste
  into a text input, expect one logged event), log `types` only, never `getData` (it is the user's
  real clipboard), and have the capture-phase logger call `preventDefault()` and
  `stopImmediatePropagation()` so the app under test never handles the paste. No event on the
  control means tool limit, not evidence. Remove the logger and untick anything you ticked
  afterwards. A native context menu ("Copy image") is untried; a CDP screenshot normally omits
  native menus. List the clipboard shapes you could not stage.
- **Report both outcomes.** Reproduced: the posted repro says what you saw and that it was the
  PR's code. Blocked or not reproduced: keep "I'd expect ... I haven't clicked through it" and say
  in chat why (login wall, wrong code served, tool limits). A premise seen on other code (focus
  after a click on a grid the PR does not touch) may go in the comment as exactly that, beside the
  unchanged "I haven't pasted a file" line.

## PR body hygiene (authoring)

- Never put MY environment limits in a PR body — "can't run live /
  Keycloak", "verified via tests not manual QA". Those are my sandbox
  constraints, not the PR's; the human author can run it.
- Never put scope self-doubt in a PR body — "these 2 commits are
  tangential". Decide scope BEFORE opening (split or keep); don't ship
  the doubt as a caveat.
- `gh` CLI cannot attach screenshots — images are drag-dropped into the
  web UI by the author. Leave a Screenshots placeholder; don't fake it.
- Before drafting a PR body, diff the FULL branch against base
  (`git log --format=%s origin/<base>..HEAD`, `git diff --stat`), not just the
  current task's files — a long-lived feature branch often carries prior
  unrelated commits. Title/scope the PR for what's actually in the diff, and
  disclose in Additional Notes exactly what you personally verified this
  session vs. inherited from earlier commits.

---

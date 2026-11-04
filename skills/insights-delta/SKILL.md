---
name: insights-delta
description: >-
  Use after every /insights run, when the turn carries the /insights command message and its
  report URL. Scopes the analysis to sessions since the previous /insights run, splits them into
  dev, PR-review and Claude-setup buckets with dev as the headline, compares each window with
  the window before it (better / worse / shift per metric, n always shown), adds a
  "Since the Last Run" section to the generated HTML report, prints a short chat summary,
  de-duplicates the report's suggested CLAUDE.md additions against existing rules, and saves a
  per-run snapshot so the next run has a quality baseline.
---

# insights-delta

The gate lives in the global CLAUDE.md routing table. This file is the how.

`/insights` keeps no history: each run overwrites `report.html`, and `facets/` holds only the
newest sample. Snapshots in `~/.claude/usage-data/history/` are the only memory between runs, so
step 7 is not optional.

## Gate scan (before step 1)

No step posts, sends, commits or deletes. Step 4 edits the timestamped report and overwrites
`report.html`; both are backed up first. The snapshot write is exclusive-create and never
overwrites.

## Steps

1. **Link reply first.** Print the command's link block exactly as it asks, then keep going in
   the same turn. The CLAUDE.md row overrides the command's "nothing else" line.
2. **Compute.** Every figure below comes from this JSON (`measured`) or shown arithmetic
   (`derived`), never from eyeballing:
   ```bash
   python3 -I ~/.claude/skills/insights-delta/insights_delta.py > "<scratchpad>/insights-delta.json"
   ```
   `--run-ts` defaults to the newest `/insights` command in any transcript, which is this run.
   The baseline is the newest history snapshot, else the previous `/insights` command found in
   transcripts, else none (`window.source` says which). Exit must be 0. Exit 2 means the
   newest command on disk already has a snapshot, so this run's command was not found: pass
   `--run-ts` with this run's command timestamp, never fall back to the old window.
3. **Read the JSON:** `window`, `previous_window`, `coverage`, `bucket_counts`,
   `comparison` (the **dev** bucket, one row per metric with `verdict`, `n_previous`,
   `n_current`), `review_comparison` (compact review rows), `previous_buckets_available`, and
   `flags` (`credential_exposure` over every session, `concentration` over dev only).
   `current.categories` maps each session id to its bucket, for auditing a call.
4. **Edit the report.** Target `report-<ts>.html` from the command message, with targeted
   `Edit` calls only:
   - Back up first: `cp report-<ts>.html report-<ts>.orig.html` (skip if `.orig` exists).
   - Grep every anchor below before editing; the generated template can change between runs.
     No `#cc-theme-overrides` block means no theme toggle, so skip the dark overrides.
   - Add the CSS from [CSS](#css) before the first `</style>`, and the dark overrides before
     the `</style>` that closes `#cc-theme-overrides`.
   - Insert the "Since the Last Run" section right before `<h2 id="section-work">`, a
     `Since Last Run` nav link first in `.nav-toc`, a first glance line in `.glance-sections`,
     and a coverage note right after the friction section intro.
   - Section order: credential flags, coverage note, bucket counts line (dev · review · setup ·
     unclassified, previous vs since), **Dev table** (metric · previous · since · verdict ·
     n prev/cur), dev concentration line, Review compact table, non-signals. State that the
     generated sections above and below still blend dev and review sessions.
   - Verify: parse with `html.parser` for unclosed or mismatched tags, diff the heading set
     against the backup, list every removed line and confirm each was intended. Then
     `cp report-<ts>.html report.html`.
5. **De-duplicate suggested CLAUDE.md additions.** For each `cmd-N` item, grep its key phrases
   in `~/.claude/CLAUDE.md`, `~/.claude/skills/*/SKILL.md` and the project `.claude/skills/`.
   - Prefix each `cmd-why` with `<span class="cmd-status">Duplicate, unchecked.</span>`,
     `Partly covered.` or `Mostly covered.`, naming where the rule already lives.
   - Full duplicate: remove `checked` so Copy All skips it.
   - Partial: cut `data-text` and the `<code>` down to the new bullets only.
   - Mechanics route to the owning skill, not CLAUDE.md.
   - Any bullet that contradicts an existing MUST (example: "post one general PR comment"
     against PR gate 4, inline only) gets rewritten to comply, and the annotation says so.
6. **De-slop** the inserted prose with `fuck-slop`, one grep per pattern, plus a control hit.
7. **Snapshot**, only after the report exists:
   ```bash
   python3 -I ~/.claude/skills/insights-delta/insights_delta.py --write-snapshot --report-path "<report-<ts>.html>"
   ```
   Exit 1 with `snapshot_error` means this run is already saved; leave it alone.
8. **Chat summary**, at most 8 lines under the link, dev first: window and bucket counts, the
   dev `better` rows, the dev `worse` rows, the largest dev shifts, one review line, why
   quality rows are `n/a` (if they are), credential flags, dev concentration, and the anchor
   `#section-since`.

## Buckets

`transcripts.py` classifies each session from its transcript plus `subagents/*.jsonl`:

1. Any product edit (Edit / Write / MultiEdit / NotebookEdit outside `/.claude/`, `/tmp/` and
   `/scratchpad/`, and not a `CLAUDE.md`) makes it **dev**, even after a review skill.
2. Otherwise a review skill or slash command (`review`, `code-review`, `pr-review-mechanics`,
   `caveman-review`) makes it **review**.
3. Otherwise edits only under `/.claude/` or to a `CLAUDE.md` make it **setup**.
4. Anything else is **dev**: root-cause work without a fix, tickets, design briefs, Q&A.
5. No transcript on disk (30-day cleanup) makes it **unclassified**, never dev.

Known miss: a review that edits files in a repro worktree outside `/tmp/` reads as dev. When a
`categories` entry looks wrong, name it in the chat summary instead of guessing.

## Reading the output

- **Direction is fixed in the script.** Lower is better: rejected tool calls per session,
  failed commands per Bash call, interruptions per session, friction and bad signals per
  faceted session. Higher is better: achieved share. Everything else is `shift`; never call a
  shift improved or degraded.
- **No threshold.** Every change gets a verdict, and n for both windows sits next to it. If
  either side has n < 10, say so in the same line.
- **`n/a` on quality rows** means the previous window had no facets. Snapshots fix this from
  the second run on. `previous_buckets_available: false` means the baseline snapshot predates
  buckets (schema 1), so every dev and review row is `n/a`; say that once.
- **Coverage line is mandatory:** facet n and the facet date range (`current.facets.first` to
  `last`) against the window, plus `coverage.sessions_with_meta` of `transcripts_started`.
  The generated narrative sections only describe the facet range.
- **Concentration:** when `top_share` > 0.33, name the cluster from `top_sessions` summaries
  and say what the friction looks like without it.
- **Credential flags** go first in the section and the chat, every run, whatever the trend.
  Recommend rotation and never print the secret.
- **Non-signals, never compared:** commits (they wait for your ask), lines added (include
  Markdown), language counts (blind to diffs read through Bash).
- **Windows are cut by session start time, and a snapshot is frozen when it is written.** Work
  done after a run, inside the session that made it, lands in neither window. Say so when that
  session was long.

## Files

- `insights_delta.py` (windows, comparison, snapshots) and `transcripts.py` (record reading,
  bucket rules): stdlib only, run on the system Python 3.9, with or without `-I`. A full run
  takes about 13 seconds because it reads every transcript in both windows.
- Tests, from this directory: `python3 -m pytest tests -q -p no:cacheprovider -o addopts=""`.
- Snapshots: `~/.claude/usage-data/history/<run_ts>.json`, schema 2, keys `run_ts`,
  `window_start`, `report_path`, `summary` (window totals plus `buckets` and `categories`).

## CSS

Main stylesheet:

```css
.since-section { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px; }
.since-section h3 { font-size: 14px; font-weight: 600; color: #0f172a; margin: 20px 0 8px 0; }
.since-section h3:first-child { margin-top: 0; }
.since-section p, .since-section li { font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 8px; }
.since-section ul { margin: 0 0 0 20px; }
.since-table-wrap { overflow-x: auto; margin: 8px 0 12px 0; }
.since-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.since-table th, .since-table td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
.since-table th { font-size: 11px; font-weight: 600; color: #64748b; }
.since-table td { color: #334155; font-variant-numeric: tabular-nums; }
.since-table .prov { font-size: 11px; color: #64748b; font-family: monospace; }
.coverage-note { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px 16px; margin: 12px 0 16px 0; font-size: 13px; color: #78350f; line-height: 1.6; }
.cmd-status { font-weight: 600; color: #b45309; }
```

Inside `#cc-theme-overrides`:

```css
[data-theme="dark"] .since-section { background: #1e293b; border-color: #334155; }
[data-theme="dark"] .since-section h3 { color: #f1f5f9; }
[data-theme="dark"] .since-section p, [data-theme="dark"] .since-section li, [data-theme="dark"] .since-table td { color: #cbd5e1; }
[data-theme="dark"] .since-table th, [data-theme="dark"] .since-table .prov { color: #94a3b8; }
[data-theme="dark"] .since-table th, [data-theme="dark"] .since-table td { border-color: #334155; }
[data-theme="dark"] .coverage-note { background: #3a2e0a; border-color: #a16207; color: #fde68a; }
[data-theme="dark"] .cmd-status { color: #fbbf24; }
```

The credential card reuses the report's own `.friction-category` classes.

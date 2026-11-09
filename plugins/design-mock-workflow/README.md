# design-mock-workflow

A Claude Code plugin for UI changes. Claude shows you distinct, interactive design options
before it edits any UI code. Each option is built on your real components and real data, and
graded /100 against a fixed rubric. You pick one, and Claude implements that.

## What's inside

| Skill | Fires when |
|---|---|
| `ui-options-first` | Any visual change: colour, layout, component, icon, spacing, animation. Holds the 7-step flow, the rubric, fidelity tiers, runnable checks and fixture rules. |
| `design-brief-authoring` | The options will come from a tool with no codebase access (Claude Design, a design agent, a contractor). Writes a verified, design-first brief, reuses what `ui-options-first` already recorded in `design-mocks/`, and checks it before sending with the bundled `scripts/check-brief.mjs` (Node, no dependencies). The plugin's `PostToolUse` hook runs that check on every write to a `*-brief.md` and hands findings back to Claude. |

| Agent | Does |
|---|---|
| `ui-grader` | The independent grader. A principal product designer and design director persona with the rubric, calibration and output format built in. Three grade each finalist and the median is the grade; heroes get one per track. None sees the author's scores. |

| Command | Does |
|---|---|
| `/design-mock <what to change>` | Starts the flow on demand. Use it when the skill didn't fire on its own, or to be explicit. Shows as `/design-mock-workflow:design-mock` if another `/design-mock` exists. |

## The flow in one screen

0. Read `design-mocks/REFERENCES.md`, the project's sourced notes on how comparable products solve this. On first run Claude researches the domain and creates it; without web access it writes entries marked `inferred`.
1. Generate directions (with `ui-ux-pro-max` and `interface-kit` if installed).
   Then art direction: screenshot 6 to 10 benchmark screens into a reference board, measure them (type sizes, row height, colour ratio, depth), and give every direction a numeric art direction with one bold move and the reference it borrows from.
2. Paper-sketch each direction and grade its structure before building (the look waits for pixels). Every round has at least 3 **Simple** options (conventional, cheap to ship) and 3 **Creative** ones (new layout or interaction, richer visuals). Then map how prominent each section should be from how often it's used, what it's worth, how urgent it is and how deep it goes.
3. Build each surviving sketch as a cheap **hero frame**: a still on the real route with real components and real data, populated state, desktop. Every agent works from a platform kit (the product's own layout, the classes it actually uses, colour and type by role, its copy), so options look like they already ship in the product. Builders screenshot their own hero to fix its looks, and clear two checks: no clipped text, and no colour, radius, font or class the product doesn't use. You see all the heroes with their grades and pick the finalists. Finalists are then built in depth: every designed loading, empty and error state, every screen size, motion on a budget, and a toolbar from the bundled harness kit (state switcher, hierarchy overlay, compare, Play, rationale and feedback pins, size frames, blur and greyscale tests).
4. Put runnable checks in the mock: contrast in both themes, icon subset, geometry, paint, visibility, motion budget, craft details (concentric radii, tabular numbers, every control state, no layout shift).
   Then the craft loop: a bundled script screenshots every option to files, each screenshot goes beside the reference it borrows from, and the top three gaps get fixed, looks first. One round for heroes, three or more for finalists.
5. Three independent graders score every finalist beside the reference board; the median is the grade. Heroes get one grader per track, started as soon as that track is captured. Accessibility and checks are pass/fail gates, so points come from looks and UX. Finalists must clear 90. The grading panel ships inside the mock.
6. Wait for the pick. Feedback comes as pinned notes copied straight out of the mock. The pick and its reason go into a taste log that steers future rounds. A pick like "A's header with C's list" gets a fast remix round of 2 to 3 hybrids.
7. Extract an implementation spec from the chosen mock, build to it, then screenshot the real build against the mock and fix every difference before deleting the mock.

**Rubric:** Aesthetic quality 30 · Point of view 10 · UX clarity 20 · Hierarchy fit 15 · Density 10 ·
Domain fit 10 · Implementation cost 5. Threshold 90. Any dimension under 60% of its weight fails the
option outright. Gates (pass/fail): accessibility, the runnable checks, token-only fidelity.

## Install

From the public marketplace, in Claude Code:

```
/plugin marketplace add RutvikrajsinhChampavat/dotclaude
/plugin install design-mock-workflow@dotclaude
```

Without plugins, copy `skills/ui-options-first/` (and `skills/design-brief-authoring/` if you
want it) into `~/.claude/skills/`.

Once installed, the skills are listed as `design-mock-workflow:ui-options-first` and
`design-mock-workflow:design-brief-authoring`.

**Not showing up?** Plugins load when a session starts. After installing, start a new session,
then type `/design-mock` to check. If it's missing, run `/plugin`
and confirm `design-mock-workflow` is installed and enabled for this project's scope.

### Recommended companions (third-party, installed separately)

- **ui-ux-pro-max** (MIT): `github.com/nextlevelbuilder/ui-ux-pro-max-skill`. Option generation and asset submodules.
- **interface-kit**: `github.com/JuliusBrussee/skills` (`skills/interface-kit`). Implementation standard for type, motion, a11y and radii.

Without them the workflow still runs on its own rubric and checks. Claude says so once and carries on.

## Make the gate strict (optional)

The skill fires on UI work through its description. To make Claude treat it as a hard rule,
paste this into your project or user `CLAUDE.md`:

```markdown
# UI changes: options first (MUST)
For ANY visual/UI change, do not edit app code first. Invoke the
`design-mock-workflow:ui-options-first` skill:
show genuinely distinct, interactive options built on real components and real data, grade
each /100 (threshold 90, per-dimension floors), recommend one, and WAIT for my pick. Then
implement with design tokens and delete the mock.
```

## Files it creates in your repo

- `design-mocks/REFERENCES.md`: research notes, reused across tasks. Commit it so teammates share it.
- `design-mocks/DECISIONS.md`: the taste log, one line per pick. Commit it.
- `design-mocks/<surface>-spec.md`: the implementation spec for the chosen option.
- `design-mocks/GRADER-CONTEXT.md`: a one-page project brief (product, users, design system, house rules) the grader reads every run. Written once, kept up to date by the skill.
- `design-mocks/fixtures/<surface>.json`: redacted captured responses. Git-ignored.
- `design-mocks/<surface>-art-direction.md`: the measured spec and each option's art direction.
- `design-mocks/PLATFORM-KIT.md`: the product learned once (page layout from live pages, class usage census, colour and type by role, copy, traps). Refreshed when theme files change. Commit it.
- `design-mocks/class-census.json`: how often the product uses each styling class and each component variant/colour combo, from the bundled `scripts/class-census.mjs`. Mocks default to what the product uses most, even when that fails a check; the failure goes to you as a platform follow-up.
- `design-mocks/refs/platform/`: screenshots of the product's own live pages, the base layer every option is compared against. Git-ignored.
- `design-mocks/refs/<surface>/`: the reference board (screenshots of other products). Git-ignored.
- `design-mocks/shots/<surface>/`: captured mock screenshots per craft round. Git-ignored.
- `design-mocks/*.html` mock pages and throwaway routes, deleted after the pick. Git-ignored.

Suggested `.gitignore` lines (the skill checks the fixtures entry before it writes one):

```
design-mocks/fixtures/
design-mocks/refs/
design-mocks/shots/
design-mocks/*.html
```

**Screenshots** come from the bundled `scripts/capture.mjs`, which needs Node 22+ and Chrome, Edge
or Chromium. Captures run in a headless browser, so no window
opens and nothing takes focus. When the app needs a sign-in, the script asks you to run its
`signin` command and sign in once per round; it copies that sign-in's local cookies and never
types credentials. Each run opens and closes its own headless tab, so parallel builders can
capture at once.

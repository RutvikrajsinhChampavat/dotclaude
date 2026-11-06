---
name: ui-options-first
description: >-
  Use when making ANY visual or UI change (colors, layout, components, icons, spacing, animation, styling) before editing app code; building options-first mocks or options to pick from (UI variants, banners, brand assets, slides, design directions); settling UI in a plan; implementing the pick.
---

# UI change workflow: options first

**The gate.** For ANY visual or UI change, do NOT edit app code first. Show the user genuinely
distinct options in a UI they can see and interact with, grade each one /100, recommend one, and
wait for them to pick. Only then implement. This applies to small, "obvious" changes too: a
single button, a spacing tweak, a colour. The user chooses, not you.

The deliverable is **design work**, not an annotated spec. A mock whose bulk is explanatory
tables, or whose options are one component repositioned N ways, is a failure however accurate
its annotations are. It gives no signal about how the thing will feel, so choosing from it is
choosing blind.

**Reference files: load each at the step that names it, not up front:**

| File | Holds | Load at |
|---|---|---|
| `references/research-and-brief.md` | REFERENCES.md shape, GRADER-CONTEXT.md template and update rules, DECISIONS.md taste log | Step 0, Step 6 |
| `references/rubric.md` | The /100 rubric, hard floors | Step 2, Step 5 |
| `references/build.md` | Fidelity tiers, captured data fixtures, route hygiene, live animations, mock-code exemption | Step 3 |
| `references/states-and-chrome.md` | Designed states, mock toolbar (incl. feedback pins), motion budget | Step 3 |
| `references/checks-and-craft.md` | Runnable checks, craft pass | Steps 4, 4b |
| `references/handoff.md` | Implementation spec and fidelity check | Step 7 |

A cross-reference by section title ("States are designed", "Mock chrome", "Motion budget",
"Captured data fixtures", "Mock code is exempt") lives in the file above that holds it.

## When to use

- ANY visual or UI change: colors, layout, components, icons, spacing, animation, styling.
- Generating options for someone to pick from: UI variants, banners, brand assets, slides, design directions.
- A plan that includes a visual change, and implementing the option that was picked.
- Skip only for genuinely non-visual work.

---

## Step 0: Consult the design references file

Before drawing anything, read three project files in `design-mocks/`. **Read `references/research-and-brief.md` now** for their shapes and rules; create any that are missing without asking.

- `REFERENCES.md`: sourced research on how comparable products solve this, with the implementation technique, plus a `[NEW]` Differentiators section.
- `GRADER-CONTEXT.md`: the one-page project brief (product, users, design system, house rules, quality bar). The workflow's memory; the grader reads it every run.
- `DECISIONS.md`: the taste log: one line per past round (surface, winner, track, reason). Use it to weight which directions get explored more.

## Step 1: Invoke the design skill pair, in order

If installed: `ui-ux-pro-max` first (option generation; route to its asset submodule:
`banner-design`, `brand`, `design`, `design-system`, `slides`, `ui-styling`), then
`interface-kit` (implementation standard: typography, motion, a11y, radii, tokens).

`ui-styling` is shadcn/Radix-oriented. On a non-shadcn project (MUI, Chakra, native), take its
accessibility and spacing discipline and skip its component/token patterns.

If either skill is not installed, say so in one line and continue with this skill's rubric and
checks alone. If a domain search returns 0 results, say so and name what you fell back on.
Never present an empty search as data.

## Step 2: Paper-sketch every direction, then GRADE BEFORE BUILDING

Write each candidate as two or three lines: the affordance, the interaction, the cost, plus one
line on its loading, empty and error treatment (see "States are designed", `references/states-and-chrome.md`). Add two more lines:

- **Benchmark.** The product that does this pattern best, and the one thing this option copies
  from it or beats it on ("beats Linear's issue list on scan speed: status reads before title").
  Name a real product, never "best practice". The grading panel shows this line per option.
- **Signature moment** (Creative only). The one interaction a user would remember and describe
  to someone else ("the path lights stage by stage as the mode changes"). No signature moment
  means it is not a Creative option yet.

Score them all against the rubric (`references/rubric.md`) **while they are still prose**.

- Cut or rework anything under 90 now. Building a fully interactive option and then finding it
  scores 62 is pure waste.
- Directions must be genuinely different *approaches*. Ten shades of one idea is one option.
- Keep the survivor count honest: six strong directions beat twelve where four are filler.

### The option set: at least 3 Simple and 3 Creative

Every round delivers two tracks, at least three built options each, labelled on the option tab
and in the grading panel:

- **Simple.** The conventional answer done very well. Existing components and patterns, few new
  parts, low implementation cost, shippable this sprint. Users already know how it works.
- **Creative.** The fancy answer. A new layout, interaction or visual idea: signature motion,
  rich data display, direct manipulation, a layout the product doesn't have yet. Still built on
  the real tokens and components. Still has to work on real data and pass the hard floors.

Rules:
- **Distinct inside each track.** Three Simple options that differ only in spacing are one
  option. Same for Creative.
- **Creative is not Simple plus animation.** If you can turn the motion off and get one of the
  Simple options back, it belongs in Simple. A Creative option changes structure or interaction.
- **Both tracks clear 90.** Creative options will score lower on Implementation cost, so they
  have to earn it back on UX clarity, Hierarchy fit and Visual craft. A track short of three
  survivors gets reworked or replaced inside that track. Never backfill one track from the other.
- **Sketch more than you build.** Paper-sketch 4 to 5 per track in this step and build the best 3.
- **User-named families still count.** Tag each named family Simple or Creative, then top up
  each track to three.
- **The user's count wins.** If they ask for a specific number ("just two options"), deliver
  that and say which track each one is.

Step 6 recommends one overall and names the best of the other track as the alternative.

**Cover every family the user named. Research informs HOW, never WHETHER.** If the ask is
"show me three approaches: in the node, in a panel, in a card", deliver all three, even when the
research says one is unconventional. Evidence about tradeoffs belongs in the SCORE and the
caption, never in a silent decision to drop the option. The user asked to see the options so
THEY could weigh them; pre-deciding hands back a conclusion instead of a choice.

Build the unconventional family **as well as it can be built**: find the technique that makes
it viable (a zoom-based level-of-detail threshold for in-node content, a screen-fixed attachment
for a floating card) and let the grade argue the tradeoff on the built artifact. A low score the
user can see beats a missing option they were promised.

Self-check before delivering: if the user asked for N families and most options collapse into
one of them, you have not delivered N families.

Record the pre-build scores. Re-score after building (Step 5) and report both. The delta is the
useful signal about what the build revealed.

## Step 2b: Prominence map. Decide how loud each section is before styling it

Attention is a fixed budget: making one section louder takes it from every other. So before any
styling, rank every section of the surface on four axes:

| Axis | Scale | Source |
|---|---|---|
| **Frequency** | every visit · daily · weekly · rare · once | usage data if it exists, else the captured fixtures and the user's own words. Tag `estimated` |
| **Value** | what using it earns or saves the user | the task the surface exists for |
| **Urgency** | needs action now? | state in the data (errors, pending approvals, expiring items) |
| **Depth** | glance · scan · work (how much lives inside) | the fixture: field count, list length, interaction needed |

Derive one tier per section:

- **Primary.** ONE per view. Top-left or centre of the reading path, the most size and
  contrast, closest to the entry point. Frequent AND valuable.
- **Secondary.** Visible at rest, compact, quieter type and colour.
- **Tertiary.** Behind disclosure: tab, drawer, overflow menu, hover/focus reveal. Rare or low
  value.
- **Contextual.** Absent until its state applies (empty, error, first-run, selection).

Rules that bind the tiers:

- **Urgency overrides frequency.** A rare destructive confirm, an error, a pending approval
  jumps to primary while its state is live, then drops back.
- **Depth sets the disclosure level, not the tier.** Glance: inline. Scan: expandable row or
  popover. Work: its own panel or route. A primary section can still be a glance.
- **Frequency sets proximity.** The more often it's used, the fewer clicks and the less travel
  from where the user lands.
- **Prominence is state-dependent.** First-run vs steady state, empty vs full, and role (admin
  vs end user) can reorder tiers. Show it per state, not once.
- **Never override a decided design.** Exact Figma, an imported spec, or a placement the user
  named wins; the map then only feeds the score.

The map is NOT a confirmation stop. It ships inside the mock as the hierarchy overlay (see "Mock
chrome") and in the grading panel, so the user challenges the ranking while looking at it. Every
`estimated` frequency is labelled as estimated there, never shown as measured.

Two options that rank sections differently ARE genuinely distinct directions: a valid family to
offer, not a variant of one.

## Step 3: Build the mock. Fidelity tiers, highest available wins

Build at the highest fidelity available, on REAL captured data. **Read `references/build.md` now**: fidelity tiers (real route > real compiled CSS > static HTML on real tokens), captured-fixture rules, throwaway-route hygiene, live animation delivery, and why mock code is exempt from code-quality gates (minimum code never means minimum design).

Every option designs its own states and ships the mock toolbar, with motion set by the prominence map: **read `references/states-and-chrome.md`** before building the first option.

## Step 4: Every mock carries runnable checks, not claimed ones

Every mock carries runnable checks as fixtures in the mock, never numbers asserted in prose: contrast (both themes), icon subset, geometry, paint, runtime smoke, motion budget, craft details. **Read `references/checks-and-craft.md` now** for each check's mechanics.

## Step 4b: Craft pass. Look, critique, fix

Before grading: screenshot every option (populated + weakest state, both themes), critique it as a design director against its benchmark and fix the top three issues, rewrite the microcopy, record interaction-pattern decisions, then run a task test and a 5-second test. Mechanics in `references/checks-and-craft.md`.

## Step 5: Re-score, show the grades, then deliver

Re-score every built option. Anything under 90, or breaching a hard floor, is reworked or
replaced **before** the user sees it. Ship the grading panel inside the mock so the user can
challenge the judgement while looking at the design. The panel includes each option's
prominence map (section, tier, the four axis values, and which are `estimated`).

**Independent grader.** Self-grading inflates. After you score, dispatch the `ui-grader` agent
(its persona, rubric, calibration and output format are built in, so don't repeat them). Pass
only: the path to `design-mocks/GRADER-CONTEXT.md`, the prominence map, the screenshot paths
from Step 4b, each option's code path and its track (Simple or Creative). Never pass your own
scores. If the agent isn't available, use a fresh general subagent whose prompt opens by
casting it as a principal product designer and expert UI/UX grader for this product, then
gives the same inputs plus the rubric. Show both grades in the panel. Where the two
totals differ by 10 or more, or either breaches a hard floor, show the grader's reasons next to
yours and rework before delivering. The option's grade is the lower of the two. Add the grader's **Context gaps** line to `GRADER-CONTEXT.md` before the next round.

Confirm it actually rendered before handing off. Report what you verified visually versus
programmatically. Never describe a frame you did not see.

## Step 6: Wait for the pick

Recommend one, and name the best option from the other track (Simple or Creative) as the
alternative. The user decides. Do not start implementing on the strength of your own
recommendation.

When the user picks, append one line to `design-mocks/DECISIONS.md` (shape in
`references/research-and-brief.md`): the surface, the winner, its track, and the user's reason
in their words. If the reason generalises, also add it to `GRADER-CONTEXT.md`.

Feedback arrives best as pasted **feedback pins** (see "Mock chrome"): each carries option,
state, theme and element, so act on it without asking which one they meant.

## Step 6b: Remix round

When the pick is a combination ("A's header with C's list"), don't restart. Build 2 to 3 hybrids in
the SAME mock: same frame, states, fixtures and toolbar, each labelled with its parts
("A header + C list"). For each:

- Re-check the seams: the prominence map still has one primary, spacing and type scale match
  across the join, motion from both parents stays inside the budget.
- Re-run only the Step 4 checks on changed parts, the Step 4b critique and task test, and the
  independent grader. Skip new research and sketching.
- Hybrids must clear 90 like any option. If a combination can't (two primaries fighting), say
  so with the grade and offer the closest hybrid that can.

Then back to Step 6 for the pick.

## Step 7: Implement the chosen option

Real component, design tokens (never hardcoded hex), and your project's full lint, type-check,
test and review gates green. Some build configs ignore type errors (Next.js
`ignoreBuildErrors`), so a green build proves nothing: run the type checker on the touched files
yourself.

Before writing code, **read `references/handoff.md`**: extract the implementation spec from
the chosen mock, build to it, then run the fidelity check (real build screenshotted against the
mock, same states and themes, differences listed and fixed). The pick is the mock the user
saw; the shipped version must not quietly drift from it. Delete the mock and any throwaway
route only after the fidelity check passes.

---

## Alignment fixes: move the element the user named

"Bring X to Y's line" names X as the thing that moves. Don't move Y instead, even when it gives
identical alignment.

---

## In plans: settle the UI up front

When a plan includes ANY visual change, run this flow while building the plan and write the
chosen variant into it, with the tokens, spacing and component it maps to. A plan with "TBD,
will show options later" isn't ready to approve. During execution, the implementer builds the
recorded choice; no second options round.

---

## Figma and other decided sources: data is truth, screenshots only compare

Take exact values (colours, spacing, sizes, radii, tokens) from Figma DATA (variable defs,
design context), never by eyeballing a screenshot. Use the screenshot only to compare the result.
Codegen is lossy (a gradient stroke flattens to a solid border); when screenshot and generated
code disagree, trust the variable values and the screenshot's appearance.

Same for any already-decided external design (an imported design file, a mockup with exact
specs): skip option generation and implement directly.

---

## Options generated outside this session

To brief an external design tool (Claude Design, a design agent, a contractor), use the
`design-brief-authoring` skill. Options that come back re-enter this skill at **Step 2** and are
graded against the rubric (`references/rubric.md`), exactly like options you drew yourself.

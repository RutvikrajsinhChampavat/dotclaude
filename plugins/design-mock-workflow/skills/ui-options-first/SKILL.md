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

**Platform match comes first, checks second.** Every option matches the platform before it
satisfies any check, grade or rubric line: the product's own components and variants, colours,
logo treatment, type, spacing and page shell, as the product ships them. When a check fails on
something that matches the platform, the platform stays and the failure goes to the user as a
platform follow-up. Never drop platform match to pass a check, raise a score or clear 90. An
option that does fails Fidelity, whatever its total.

**Reference files: load each at the step that names it, not up front:**

| File | Holds | Load at |
|---|---|---|
| `references/research-and-brief.md` | REFERENCES.md shape, GRADER-CONTEXT.md template and update rules, DECISIONS.md taste log | Step 0, Step 6 |
| `references/art-direction.md` | Reference board, measured spec, per-option art direction | Step 1b, Step 4b, Step 5 |
| `references/rubric.md` | Gates, the /100 rubric, hard floors, what each stage scores, median of three graders | Step 2, Step 5 |
| `references/build.md` | Platform kit (layout, usage census, colour and type by role, traps), the Claude Design canvas build, captured data fixtures, live animations, builder contract, mock-code exemption | Step 1b, Step 3 |
| `references/states-and-chrome.md` | Designed states, the board's chrome bar (incl. feedback pins), motion budget, screen sizes | Step 3 |
| `references/checks-and-craft.md` | Runnable checks, the comparative craft loop | Steps 4, 4b |
| `references/handoff.md` | Implementation spec and fidelity check | Step 7 |

**Mocks live on a Claude Design canvas only.** Never a mock route, page, component or harness
file in the live project. Bundled and still used: `scripts/capture.mjs refs` (reference-board
screenshots, the live product page included; needs Node 22+ and Chrome, Edge or Chromium) and
`scripts/class-census.mjs` (`census`: how often the product uses each styling class and each
component variant/colour combo, for the platform kit; `check`: which classes and combos on a board
the product never or rarely uses). Retired with the route build, shipped only
for older rounds: `assets/mock-harness/MockHarness.jsx`, `capture.mjs mock|sheet|signin` and
`scripts/firefox-capture.mjs`. If this account lists no Design artifact type, say so and ask the
user how to proceed; never fall back to a route in the app.

A cross-reference by section title ("States are designed", "Mock chrome", "Motion budget",
"Captured data fixtures", "Mock code is exempt") lives in the file above that holds it.

## When to use

- ANY visual or UI change: colors, layout, components, icons, spacing, animation, styling.
- Generating options for someone to pick from: UI variants, banners, brand assets, slides, design directions.
- A plan that includes a visual change, and implementing the option that was picked.
- Skip only for genuinely non-visual work.

## Pick the mode first

| Mode | When | What changes |
|---|---|---|
| **Quick** | The change stays inside one component or is a tweak: spacing, copy, colour, an icon, one control | 2 to 3 options of any track. Reuse the existing reference board (none yet: 2 to 3 screenshots of the current screen plus 1 to 2 references). Art direction of 5 lines or fewer per option. No hero stage: build each option straight to the states the change touches. One grader, one craft round. |
| **Full** | A new surface, a page or section redesign, a new interaction pattern | Every step below. |

Both modes keep the gates: options genuinely distinct, real components and captured data,
sketches graded before building, every option graded /100 against threshold 90 before the user
sees it. Say which mode and why in one line before Step 0; the user can switch it.

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

On a project with its own design system, take from `ui-ux-pro-max` its UX guidelines, motion
presets, chart types and style vocabulary (words for the bold move in Step 1b). Skip its palettes
and font pairings: colour and type come from the project's tokens.

If either skill is not installed, say so in one line and continue with this skill's rubric and
checks alone. If a domain search returns 0 results, say so and name what you fell back on.
Never present an empty search as data.

## Step 1b: Art direction. Decide the look from pictures, in numbers

**Read `references/art-direction.md` now.** Build the reference board
(`design-mocks/refs/<surface>/`, 6 to 10 images captured with `scripts/capture.mjs refs` or
dropped in by the user), Read every image, and extract the measured spec. Each direction
sketched in Step 2 then carries an art direction block: type voice, composition and focal point,
colour ratio, surfaces, rhythm, motion signature, one bold move, and the reference file it
borrows from. All of it goes in `design-mocks/<surface>-art-direction.md`. Without a board, ask
the user for screenshots; never design the look from product names alone.

**Platform first.** The mock must look like it already ships in this product. Before the art
director starts, make sure `design-mocks/PLATFORM-KIT.md` exists and is current ("Platform kit" in
`references/build.md`): the product's own page layout, the classes it actually uses and how often,
colour and type by role, its copy, its traps. One agent writes it in parallel with the board when
it's missing; every later round reuses it. Kit values beat reference values: references supply
composition and finish ideas, never a radius, colour, type size or page shell the product already
defines. A deviation is allowed only as an option's named bold move, built from existing tokens.
What the product ships most is the default, even when it fails a check: a contrast failure on the
product's own primary button, or brand logos that cost colour-restraint points, go to the user as
a platform follow-up (see "Platform match comes first" above). Never route around them with a
variant the product rarely uses.

**Reuse before you capture.** An existing board and spec for this surface (or one in the same
domain) is reused as is; capture only what is missing. `design-mocks/refs/SOURCES.md` lists which
sources capture cleanly and which hit cookie walls or tours, so nobody retries a known failure. A
subagent that only captures may run on a cheaper model; art direction, builders and graders stay
on the strongest one.

**Who writes the directions.** On a surface whose board, spec and kit already exist, write each
option's direction block yourself, beside its Step 2 sketch, in ONE Write of the art-direction
file, then dispatch the builders at once. An art-director agent runs only when the board or spec
has to be built (the first round on a surface), and that setup sits outside the 20-minute round.

## Step 2: Paper-sketch every direction, then GRADE BEFORE BUILDING

Write each candidate as two or three lines: the affordance, the interaction, the cost, plus one
line on its loading, empty and error treatment (see "States are designed", `references/states-and-chrome.md`). Add two more lines:

- **Benchmark.** The product that does this pattern best, and the one thing this option copies
  from it or beats it on ("beats Linear's issue list on scan speed: status reads before title").
  Name a real product, never "best practice". The grading panel shows this line per option.
- **Screen sizes.** How the option adapts from phone to wide desktop: what reflows, what
  collapses behind disclosure, what the primary becomes on a phone. An option that only works at
  one width is not done. See "Screen sizes" in `references/states-and-chrome.md`.
- **Signature moment** (Creative only). The one interaction a user would remember and describe
  to someone else ("the path lights stage by stage as the mode changes"). No signature moment
  means it is not a Creative option yet.

- **Art direction.** The Step 1b block for this direction. Two directions with the same block
  are one direction.

Score them all against the rubric (`references/rubric.md`) **while they are still prose**. Prose
can't show the look, so a sketch is scored on the five non-visual dimensions (60 points);
Aesthetic quality and Point of view read "pending".

- Cut or rework any sketch under 54 of 60 now. Building an option and then finding its structure
  fails is pure waste.
- Directions must be genuinely different *approaches*. Ten shades of one idea is one option.
- Keep the survivor count honest: six strong directions beat twelve where four are filler.

### The option set: at least 3 Simple and 3 Creative

Every round builds two tracks, at least three hero frames each (Step 3a), labelled on the option
tab and in the grading panel:

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
- **Finalists in both tracks aim for 90**, with one fix loop to get there (Step 4b). A track short of three sketches at 54 or more gets
  reworked or replaced inside that track. Never backfill one track from the other.
- **Sketch only what you'll build.** Three per track (quick mode: the 2 to 3 options), each sketch
  at most six lines plus its art direction block. Replace a sketch only when it scores under 54.
- **User-named families still count.** Tag each named family Simple or Creative, then top up
  each track to three.
- **The user's count wins.** If they ask for a specific number ("just two options"), deliver
  that and say which track each one is.

The user picks the finalists from the heroes (Step 3a). Step 6 recommends one finalist overall
and names the best of the other track as the alternative.

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

Record the sketch scores. Re-score after building (Step 5) and report both. The delta is the
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

## Step 3: Build. Wide and cheap first, then deep

Build on a Claude Design canvas, on the product's design system and REAL captured data. **Read `references/build.md` now**: the canvas build (design system mounted, one board per option, the Design type's silent-failure rules), captured-fixture rules, live animation delivery, the builder contract, and why mock code is exempt from code-quality gates (minimum code never means minimum design). Never build any part of a mock in the live project. Hand every builder `design-mocks/PLATFORM-KIT.md`. No new colour, radius, font, type size or styling class the product never uses, and no invented label for a concept the product already names: the kit says what exists.

### Step 3a: Hero frames, then the user picks finalists

Build every sketch that survived Step 2 as a **hero**: one board on the round's canvas, mounted
design-system components and real captured data, the populated state at Desktop in the product's
default theme, with the art direction applied in full and its transitions wired: hover and press
on every control, enter, exit, expand and collapse for anything it reveals, reduced motion
honoured. A Creative hero also wires its signature moment as a Replay control. Other states,
sizes and the full chrome bar wait for Step 3b.

**Budget: 20 minutes from "run a round" to heroes on screen**, on a surface whose kit, board and
fixture exist (measured 2026-11-07, six heroes with the round-4 directions reused: builders 3.7 to
4.9 min each in parallel, one grader per track 8.7 to 8.9 min; 14.3 min from dispatch to the last
grade, 19.3 min from the user's message, on the retired route build. Canvas rounds are not
measured yet. Writing new directions is not inside that number either).

- Before dispatch, scaffold the canvas: create it, install the design system, send
  `project/canvas.json` with every board listed, and one stub board per option
  (`references/build.md`, "Builder contract"). Builders then edit and send only their own board.
- Dispatch one builder per hero the moment the direction file is written, each with the **hero
  builder contract** (`references/build.md`, "Builder contract"). The contract is the whole
  prompt: its inputs, its three steps, its `<CHECK>` command and its 10-minute cap.
- Each builder sends its board and hands back its token pairs and motion lines. You then compute
  the contrast table from the design-system tokens (`references/build.md`, after the contract).
- Grade per track: dispatch one grader for a track the moment that track's last hero lands, with
  the lean inputs (Step 5). Scores share one scale inside a track, where the user picks. The
  graders are now the long pole. If a round runs over, give each hero its own grader: up to three
  times the grader tokens (each re-reads the shared inputs) and no shared scale inside the track; the time saved is not measured.

**Stop and show the heroes.** Give the user the canvas link and every hero's grade, gates
pending, labelled "hero, not final". Heroes are shown at whatever they score; a finalist is shown below 90
only flagged, after its one fix loop or when the round had no time left for it. Recommend the best
Simple and the best Creative as finalists, and keep a finalist for every family the user named.
The user picks the finalists (any count); wait for the pick. A rejection here costs a hero, not a
finished option set.

### Step 3b: Finalists, in depth

Each finalist gets the full build: every designed state (each request's loading and failure
included), every screen-size preset at real size, motion set by the prominence map, and the
chrome bar, all on the option's one board. **Read `references/states-and-chrome.md`** first.

**Budget: 20 minutes from the pick to graded finalists on screen** (measured 2026-11-07, n=1:
16.4 min for one finalist, a 10.5-minute build plus three graders in parallel).

- Before dispatch, add every state to each finalist board's state select, so each builder edits
  only its own board.
- Dispatch one builder per finalist with the **finalist builder contract** (`references/build.md`):
  the hero's grader fixes, the states, all six size presets and a 12-minute cap.
- The moment a builder lands, dispatch its three graders with the lean finalist inputs (Step 5).
  Never start graders before the build is done: they read the board source, and would grade a
  file the builder has since replaced.

## Step 4: Every mock carries runnable checks, not claimed ones

Every finalist carries runnable checks, never numbers asserted in prose: contrast in both themes computed from the design-system tokens the board uses, the motion lines from its source, and a checks panel on the board (clipped text, sideways scroll, touch targets) that runs live when the user opens it. Nobody renders the canvas unless the user asks, so what needs pixels is judged from the source and labelled that way. **Read `references/checks-and-craft.md` now** for each check's mechanics.

Checks measure the platform-matched design; they never redesign it. A failure on an element that
matches the platform is reported as inherited and left as the platform has it.

## Step 4b: Craft loop. Compare with the reference, fix, repeat

The canvas is never rendered or screenshotted unless the user asks, so look rounds work from the
board source beside the reference image its art direction borrows from and a live platform page,
plus any screenshot the user shares (ask for one when a look question can't be settled from the
source). Fix the top three gaps. An
option that reads as a different product is the first gap. Every fix moves the option toward the
platform, never away from it.

- Heroes: one look pass inside the build (Step 3a).
- Finalists: one look pass inside the build, plus **one fix loop** after grading, only if it still
  ends inside the 20-minute round: resume the same builder (SendMessage) with the graders' top
  fixes, re-send, re-grade. A finalist still under 90 after it, or with no time left for it, is
  shown with its grades and its failing gates named first.
- Quick-mode options: one round.

Then microcopy, interaction patterns, a task test and a 5-second test. Mechanics in
`references/checks-and-craft.md`.

## Step 5: Grade with three independent graders, then deliver

Self-grading inflates, so the grade comes from graders who never see yours. Score each option
yourself first, then dispatch fresh `ui-grader` agents (persona, rubric, calibration and output
format are built in): **one per track** for heroes, **three in parallel per finalist**, one over
the set for quick mode. Never pass your own scores.

Pass the **lean inputs**, and only these:

- `design-mocks/GRADER-CONTEXT.md` and `design-mocks/PLATFORM-KIT.md`;
- each option's art-direction block, and the prominence map;
- the ONE reference that option borrowed from, and ONE live page from `design-mocks/refs/platform/`;
- each option's board source (its local copy under the round's `<root>`), the design system's
  README and `tokens.json`, and the captured fixture;
- the contrast table you computed from the tokens, and each builder's motion lines;
- any screenshot the user shared of the canvas (none: say the grade is from source, and the
  grader marks every pixel-only judgement "from source");
- each option's track (Simple or Creative), and whether it is a hero.

Not the whole reference board and not every platform page: graders given those read 28 to 31
files, and image reads are most of a grader's time (measured 2026-11-07).

If the agent isn't available, use fresh general subagents whose prompts open by casting each as a
principal product designer and design director for this product, with the same inputs plus
`references/rubric.md`.

**A finalist's grade is the median of the three totals**; a gate or floor failure counts when two
of three report it. Show all three grades, the median and your own score in the grading panel,
with the grader reasons for any dimension under 80%. A spread of 10 or more means the rubric reads
two ways for that option: read the three reasons before reworking. Add the graders' **Context
gaps** lines to `GRADER-CONTEXT.md` before the next round.

A finalist under 90, or failing a gate or a hard floor, gets the one fix loop of Step 4b if it fits
the round. Without time for it, or still under 90 after it, show it with the grades and say so
first. Ship the grading panel on the canvas (a sticky note or the index board) so the user can
challenge the judgement while looking at the design. The panel includes each option's prominence
map (section to tier, with the four axis values and which are `estimated`).

Report what was judged from source, what was computed from tokens and what came from a screenshot
the user shared; never describe a frame you did not see.

## Step 6: Wait for the pick

Recommend one finalist, and name the best finalist from the other track (Simple or Creative) as
the alternative. The user decides. Do not start implementing on the strength of your own
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
- Re-run only the Step 4 checks on changed parts, the Step 4b loop and task test, and the three
  graders. Skip new research, sketching and heroes.
- Hybrids are held to the finalist rule (Step 5): aim for 90, one fix loop, then shown flagged. If a combination can't (two primaries fighting), say
  so with the grade and offer the closest hybrid that can.

Then back to Step 6 for the pick.

## Step 7: Implement the chosen option

Real component, design tokens (never hardcoded hex), and your project's full lint, type-check,
test and review gates green. Some build configs ignore type errors (Next.js
`ignoreBuildErrors`), so a green build proves nothing: run the type checker on the touched files
yourself.

Before writing code, **read `references/handoff.md`**: extract the implementation spec from
the chosen mock, transitions included, build to it, then run the fidelity check (the user
compares the real build with the canvas in the same states and themes while you check the code
against the spec, every mock transition confirmed wired with its reduced-motion fallback,
differences listed and fixed). The pick is the mock the user
saw; the shipped version must not quietly drift from it. The canvas stays after the fidelity
check; delete it only when the user asks.

---

## Alignment fixes: move the element the user named

"Bring X to Y's line" names X as the thing that moves. Don't move Y instead, even when it gives
identical alignment. Move the instruction's grammatical subject, even when another element is
easier to adjust.

---

## In plans: settle the UI up front

When a plan includes ANY visual change, run this flow while building the plan and write the
chosen variant into it, with the tokens, spacing and component it maps to. A plan with "TBD,
will show options later" isn't ready to approve. During execution, the implementer builds the
recorded choice; no second options round. If a plan surfaces a UI change nobody anticipated,
pause and run the flow for it before finalizing.

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

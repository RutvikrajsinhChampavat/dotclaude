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

## When to use

- ANY visual or UI change: colors, layout, components, icons, spacing, animation, styling.
- Generating options for someone to pick from: UI variants, banners, brand assets, slides, design directions.
- A plan that includes a visual change, and implementing the option that was picked.
- Skip only for genuinely non-visual work.

---

## Step 0: Consult the design references file

Before drawing anything, read the project's `design-mocks/REFERENCES.md`. It holds distilled,
source-cited patterns from products solving the same problem, plus current product-UI trends
for the relevant domain.

**If the file doesn't exist, create it now.** Don't stop or ask; a missing file is the normal
first run. Research the domain with a subagent and write the findings in this shape:

```markdown
# Design references: <product / domain>
Last refreshed: <YYYY-MM-DD>

## <Problem area, e.g. "Run history list">
- **<Product>: <pattern>** (verified, <source URL>). Technique: <API / threshold / data structure>.
- **<Product>: <pattern>** (inferred). Technique: <best guess, say what would confirm it>.

## Differentiators
- [NEW] <idea>. Closest competitor feature: <name>. Why we can build it: <infra we run>.
  Why it matters more here: <reason>.
```

Add one section per problem area as tasks touch new surfaces; never rewrite sections you
didn't research this time.

**If web research is unavailable** (no search or fetch tool, or offline), say so in one line,
write entries from what you know tagged `inferred` with no URL, and continue. Don't block the
mock on research, and don't present inferred entries as verified.

- Every entry is marked **verified** (with source URL) or **inferred**. Never anchor a design
  decision on an inferred entry without saying so out loud.
- Refresh when stale (roughly quarterly, or when the domain shifts). Don't re-research from
  scratch every task. That is what the file is for.
- Research it with a subagent, and tell that agent to flag what it could NOT verify rather
  than inferring. A confident guess is worse than a gap in a durable file.
- Capture the **implementation technique, not just the appearance**: the API, the threshold,
  the measured number, the data structure. "A render guard fires above ~0.3MB", "that toolbar
  component is screen-fixed by contract", "collapse depth takes an integer, not a boolean".
  Anyone can copy a look from a screenshot; only the mechanism tells you what it costs to ship
  and where it breaks.
- Carry a **Differentiators** section: what you could do that NONE of the researched products
  do. Each entry names the closest competitor feature, so "nobody does this" stays checkable;
  says why this team specifically can build it (infrastructure it already runs); and says why it
  matters more in this domain than in theirs. Tag these `[NEW]`. They are proposals, not
  findings, and never get mixed in with sourced entries. Copying the field's conventions buys
  parity; this section is the only part that buys an edge.

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

Write each candidate as two or three lines: the affordance, the interaction, the cost. Score
them all against the rubric below **while they are still prose**.

- Cut or rework anything under 90 now. Building a fully interactive option and then finding it
  scores 62 is pure waste.
- Directions must be genuinely different *approaches*. Ten shades of one idea is one option.
- Keep the survivor count honest: six strong directions beat twelve where four are filler.

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

## Step 3: Build the mock. Fidelity tiers, highest available wins

**Tier 1: real interactive route in the app (DEFAULT when the project has a buildable
stack).** A throwaway route rendering the REAL component library, REAL theme overrides, real
tokens, real fonts, and where relevant the real canvas/graph library. Fully interactive: every
affordance works, and anything whose tradeoff depends on interaction (pan, zoom, resize, drag)
must be operable so the user judges it directly.

Why this is the default: **tokens colour the paint but do not reproduce a component library's
chrome.** Hand-matching a library's chip radius, button padding, icon ligatures and elevation
from token values alone reads as "looks nothing like the real UI" even when every colour is
right. The gap is chrome, shape and iconography, not colour. Stock CDN components are *worse*
than hand-tokens, because a themed library looks nothing like its unthemed default.

**Tier 2: real compiled CSS + rendered-markup dump (when no route is possible).** Pull the real
utility CSS from the build output (Next.js example: `find .next -iname '*.css'`; verify it
contains the classes you need, since a stale chunk silently omits recent arbitrary-value
classes). Render the real primitives once in a throwaway test (Testing Library / Storybook)
under the real theme provider and dump `container.innerHTML` + `document.head.innerHTML`. Delete
the test after. CSS-in-JS libraries (MUI/Emotion, styled-components) often bake per-theme colours
into different generated class names, so a light/dark toggle means re-rendering under the other
theme and swapping class strings, not flipping a CSS variable.

**Tier 3: static HTML with hand-written CSS aliasing real tokens (last resort).** Copy the token
file verbatim, alias onto it, invent zero hex. Do NOT borrow utility classes from a compiled
stylesheet for anything new: that file contains only utilities the real source uses, so an
invented arbitrary value silently no-ops.

Whatever the tier: inline assets (tokens, icon fonts as base64) so the artifact is portable and
opens without a build.

**Feed it REAL data, never invented fixtures.** Capture an actual API response or DB row for the
shape the mock renders. Field names, nesting depth, null-ness, array length, value length and
optionality are all *design* constraints, and a made-up object gets each of them wrong in a way
that only surfaces during implementation, when the real field is `invoice_number` not `id`,
arrives 40 chars long, and is sometimes null. See "Captured data fixtures" below.

Mock code is throwaway and exempt from code-quality ceremony (see "Mock code is exempt"). Write
it fast and loose; spend the effort on the design.

## Step 4: Every mock carries runnable checks, not claimed ones

Fixtures in the mock, not assertions in prose. A number you assert is not a number you measured.

1. **Contrast.** Walk every text/background pair, compute the ratio in BOTH themes, render
   failures visibly in the grading panel. This catches a hairline drawn in a token that equals
   the surface it crosses.
   Trap: `getComputedStyle().color` returns `oklch(...)` verbatim for oklch tokens. A check that
   regex-pulls three numbers reads `0.5 0.1377 84.01` as RGB and reports a confident fake ratio.
   Detect `oklch(` and convert (oklch → oklab → linear sRGB), or paint the colour to a 1×1 canvas
   and read the pixel back.
2. **Icon subset.** Probe every icon name used against the shipped font. A self-hosted *subset*
   fails silently: the ligature doesn't resolve and the raw name paints as text at icon size.
   Lint and type checks don't catch it.
3. **Geometry.** Where a mock draws connectors, tethers, or anything positioned against another
   element, measure the real rects and assert endpoints land on real anchors. Never eyeball
   coordinates.
4. **Paint.** Assert every decorated element actually painted (computed `background-image` /
   `background-color` not empty). A multi-layer `background` with a bare colour in a NON-final
   layer is invalid, and the browser drops the WHOLE declaration silently. Wrap solid colours as
   `linear-gradient(c, c)` when layering.
5. **Visibility.** `[hidden]` loses to a class-level `display: flex`, so a collapsed section
   renders expanded at rest with no error. Add `[hidden] { display: none !important }`.
6. **Runtime smoke when you can't see the render.** A 200 from the route proves it compiled, not
   that it runs. Render the page once in a throwaway jsdom test (stub canvas and
   `Element.animate`), drive the core interaction, then delete the test.

## Step 5: Re-score, show the grades, then deliver

Re-score every built option. Anything under 90, or breaching a hard floor, is reworked or
replaced **before** the user sees it. Ship the grading panel inside the mock so the user can
challenge the judgement while looking at the design.

Confirm it actually rendered before handing off. Report what you verified visually versus
programmatically. Never describe a frame you did not see.

## Step 6: Wait for the pick

Recommend one. The user decides. Do not start implementing on the strength of your own
recommendation.

## Step 7: Implement the chosen option

Real component, design tokens (never hardcoded hex), and your project's full lint, type-check,
test and review gates green. Some build configs ignore type errors (Next.js
`ignoreBuildErrors`), so a green build proves nothing: run the type checker on the touched files
yourself. Delete the mock and any throwaway route afterwards.

---

## Mock code is exempt from code-quality ceremony

Mock code is a **disposable prop for a decision**, not software. It's deleted once an option is
picked. Production discipline applied to it burns the budget that should go into the design.

**Write the MINIMUM code that produces the design.** Skip, for mock code only:

- **Types.** No interfaces, aliases, props types, generics, annotations, casts.
- **Tests.** No TDD, no coverage.
- **Your project's review/audit/lint/type-check steps** on mock files.
- **Coding-style rules:** file and function length, nesting, DRY, immutability, guard clauses,
  magic strings, constants placement, inline styles, raw HTML, hardcoded pixels.
- **Defensive code.** No null guards or error handling the design doesn't call for. The fixture
  data is yours; make it well-formed.
- **Abstraction.** No helpers, config objects, or shared components across options unless
  writing it twice is genuinely longer.

**"Minimum code" NEVER means minimum design.** The mock must still be modern, slick, compact and
score ≥90. If you're cutting a hover state, a needed empty state, a transition, or a real
interaction to "keep it minimal", you're cutting the wrong thing.

**Motion is default, not on request.** Every surface that appears, disappears, expands, or
changes selection animates in the first build (enter/exit, expand/collapse, selection feedback,
hover reveals), with `prefers-reduced-motion` honoured. When a column or well animates
width/height, give its content a fixed inner size so it doesn't reflow mid-animation.

**Carve-out:** code the mock's SUBJECT depends on isn't ceremony. A stable node-types identity
in a graph library, or memoization when the thing being evaluated IS render performance, stays.
Say why in a comment.

**Still applies, because these protect the deliverable, not the code:**

- **No invented colour.** Token-only is a fidelity requirement. Hand-picked hex lies about what
  the thing will look like.
- **The runnable checks** from Step 4.
- **No secrets** in mock code, ever.
- **Route hygiene:** never commit it, delete it after the pick.

**The exemption ends at the mock.** Step 7 carries full production discipline. If mock code is
ever promoted into the app rather than rewritten, it owes every gate retroactively.

---

## The rubric: 100 points, threshold 90

| Dimension | Weight | What earns it |
|---|---|---|
| **UX clarity** | 25 | A non-technical user understands it with no tooltip. Primary action obvious. Progressive disclosure in the right order: summary before payload, never a raw dump. |
| **Visual craft** | 20 | Layered elevation over borders. 4px spacing rhythm. Concentric radii. Type hierarchy carrying meaning. Restrained colour: status as accent, never fill. Monospace only for data. |
| **Density** | 15 | Compact without crowding. Costs little at rest. No dead space, no cramming. |
| **Accessibility** | 15 | Measured contrast ≥4.5:1 in both themes. Keyboard reachable. Adequate hit targets. Reduced motion honoured. Never colour alone to convey state. |
| **Domain fit** | 15 | Behaves correctly in its real container: under zoom/pan for a canvas, resize for a panel, long content for a list. No occlusion, no reflow of neighbours. |
| **Implementation cost** | 10 | Reuses existing components. Few new surfaces. Performs on realistic data volume. |

**Hard floor: any dimension below 60% of its weight fails the option outright, regardless of
total.** A beautiful option with failing contrast doesn't pass on points. Weighted totals
otherwise hide exactly the failures that matter most.

State each score with a one-line justification. A rubric without reasons is decoration.

---

## Captured data fixtures

Applies to **every** payload the mock renders. If it shows a list, a detail view, an error and an
empty state, capture the real response behind each. One fixture per surface, reused across future
mocks of the same screens:

```
design-mocks/fixtures/<surface>.json
```

Each file records (header comment or sibling `.md`) **where it came from** (exact endpoint or
query), **when**, and **what was redacted**.

**Redact before saving, always.** Strip secrets absolutely: tokens, keys, auth headers,
connection strings. Reduce PII (names, emails, tenant identifiers) to stand-ins. Keep the SHAPE
exact: same keys, nesting, types, comparable string lengths and array sizes.

**Check the fixtures directory is git-ignored before persisting anything:** `git check-ignore -v
design-mocks/fixtures/`. If it isn't, add `design-mocks/fixtures/` to `.gitignore` first. A
tracked fixtures directory turns this practice into a data leak. Ignore mock pages too
(`design-mocks/*.html`). Keep `design-mocks/REFERENCES.md` tracked: it holds only public
research, and committing it means teammates reuse it instead of re-researching.

**Never silently substitute invention.** If the real response can't be captured (no auth, service
down, feature never run), say so in the handoff and label the fixture as approximated.

Prefer the *awkward* real case over the tidy one: the long value, the deep nesting, the null, the
empty array, the 40-item list. Those break layouts; a tidy hand-written fixture hides them.

### Interrogate the capture before designing

1. **Which keys are always present, and which appear only after an event?** A key that exists
   only post-run means absence is a NORMAL state, not an error.
2. **Are the human-facing strings actually human?** Snake_case, slugs and UUIDs where you assumed
   prose change every label in the design.
3. **Do values collide across records?** Duplicate names make any list or picker keyed on them
   unusable.
4. **What's the DOMINANT shape by frequency?** Design for the mode, not the prettiest record.
5. **How many representations does "nothing" have?** `null`, `[]`, `""` and an absent key are
   four states and often all occur in one dataset.
6. **Are there UI hints in the data?** A `widget`, `display` or `format` attribute should drive
   the renderer instead of inferring from type.
7. **What are the extremes?** Longest string, deepest nesting, largest array, smallest non-empty
   case. These set clamping, wrapping, virtualization and truncation.
8. **Who else writes this data?** If several services write the same record with no version
   check, last-write-wins is a design constraint.

Write the answers into the fixture file next to the capture.

---

## Throwaway-route hygiene (Tier 1)

A mock route lives in the app source tree, which isn't git-ignored the way mock pages and
fixtures under `design-mocks/` are.

- **Never commit it.** Check `git status` before any commit while a mock route exists.
- **Delete it** once the option is picked and built.
- Framework traps: Next.js App Router treats `_`-prefixed folders under `app/` as private, so the
  route 404s with no build error. Check your framework's equivalent.
- Confirm the route renders **without authentication** before building on it. If middleware
  redirects unauthenticated traffic, drop to Tier 2 rather than fighting the auth gate.

---

## Animations: hand over a live loop, never static frames

Embedded previews and screenshots can freeze animation (some IDE preview panes pause
`requestAnimationFrame` while hidden). Verify the animation is WIRED (keyframes present, computed
`animationName` / `animationDuration` on the element), give the user the served URL to watch it,
and say "animation wired; confirm motion at the URL" rather than claiming it animates.

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
graded against the rubric above, exactly like options you drew yourself.

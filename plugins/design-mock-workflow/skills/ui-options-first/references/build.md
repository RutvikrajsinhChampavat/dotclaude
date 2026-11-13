# Building the mock

Loaded at Step 3 of `ui-options-first`.

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

**Tier 1 mocks start from the harness kit** (`assets/mock-harness/MockHarness.jsx`, see "Mock
chrome"): heroes and finalists alike, so the capture script can drive every option from the first
build. Heroes use it with one state; finalists add the rest.

**Feed it REAL data, never invented fixtures.** Capture an actual API response or DB row for the
shape the mock renders. Field names, nesting depth, null-ness, array length, value length and
optionality are all *design* constraints, and a made-up object gets each of them wrong in a way
that only surfaces during implementation, when the real field is `invoice_number` not `id`,
arrives 40 chars long, and is sometimes null. See "Captured data fixtures" below.

Mock code is throwaway and exempt from code-quality ceremony (see "Mock code is exempt"). Write
it fast and loose; spend the effort on the design.

## Platform kit: learn the platform once, hand it to every agent

Two failures share one cause. Mocks that look invented (a token used in a role the product never
gives it, a radius nobody else uses) and mocks that don't sit in the product (a different page
shell, different surfaces) both come from agents re-deriving the platform each round and filling
the gaps with taste. It is also slow: in one measured round, half to four-fifths of every
builder's tool calls were shell reads of the same theme, token and typography files. Write
`design-mocks/PLATFORM-KIT.md` once per project, at most two pages. The art director, every
builder and every grader read it.

1. **Layout.** Capture 2 to 3 live pages at Desktop into `design-mocks/refs/platform/` (signed-in
   pages through the running capture browser) and read the computed styles of their landmarks:
   the page shell (title component and size, where page actions sit and which button variant they
   use, content padding, max width), section spacing, the surface recipe (background, border,
   radius, shadow), the list-row recipe (height, divider, hover), how status is shown (chip, dot,
   icon or text), the empty state. Numbers, not adjectives.
2. **Usage census.** Run `node <skill>/scripts/class-census.mjs census --src <source dir> --exclude
   <mock routes> --out design-mocks/class-census.json` and paste its per-family table and its
   component table (each component's variant/colour combos with count and share; MUI components
   out of the box, extend `MUI_DEFAULT_PROPS` in the script for another library). Under them,
   name the role of each top class: page surface, card surface, title text, body text, secondary
   text, divider, focus ring.
3. **Colour by role.** The token per role, with the text/surface pairs that pass 4.5:1 in each
   theme. Status colours name where the product uses them (an icon, a chip, a line of text) and
   where it doesn't.
4. **Type.** Each typography component, its rendered size at Desktop, and the role it plays on the
   live pages.
5. **Controls.** The button and chip variant for each role (page action, row action, secondary),
   read off the live pages and the census component table: the product's majority combo for the
   role is the default, written with its count. Measure its label contrast in both themes. When
   the shipped default fails, it stays the default and the ratio goes under Traps as an inherited
   failure, to raise as a platform follow-up. A rarely used variant that passes may be listed as an
   alternative with its count, never as the rule.
6. **Copy.** The product's existing labels for statuses and actions, and where they live in code.
   The same concept keeps the same word.
7. **Data, harness, example.** Fixture helper signatures; the `options` entry shape and the
   `data-tier` / `data-axes` / `data-why` / `play` contract; the path of one finished option file.
8. **Traps.** One line per trap measured in this product (a wrapper whose line height equals its
   font size clips descenders under `overflow:hidden`; a token equal to the surface it sits on).
9. **Allowed extras.** Colours, radii and fonts that live pages render but the mock page's own
   shell doesn't show (a component library default, say). They go into the harness `allow` prop.

**Shipped beats passing.** Every kit default is what the product uses most, counted: the census
tables, or a code search with the count written beside it. When the shipped pattern fails a check
(contrast on the product's own primary button, colour restraint against full-colour brand logos),
the failure is the platform's. Report it as a follow-up and let graders flag it, not fail it. Never
fix it inside one mock by swapping in a variant the product rarely uses: that page then looks like
a different product, and the user's first question will be why it doesn't follow the platform.

Head the file with the git hash (or mtime) of the theme and token files and the census date;
refresh the kit when they change. Builders Read the kit first and open source only for what it
doesn't cover, listing those lookups in their hand-back; add them to the kit yourself (parallel
builders appending to one file lose each other's lines).

**Text never clips.** Truncation is for user content of unknown length only (a file name, a
title someone typed), with the full text reachable on hover or focus; never on headings, buttons,
labels or numbers. The harness reports any text cut by its own box or a clipping ancestor, so a
label that fits by a pixel fails before anyone sees it.

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
width/height, give its content a fixed inner size so it doesn't reflow mid-animation. How MUCH
motion each surface gets is set by "Motion budget" below: default-on never means everything
flourishes.

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

## Throwaway-route hygiene (Tier 1)

A mock route lives in the app source tree, which isn't git-ignored the way mock pages and
fixtures under `design-mocks/` are.

- **Never commit it.** Check `git status` before any commit while a mock route exists.
- **Delete it** once the option is picked and built.
- Framework traps: Next.js App Router treats `_`-prefixed folders under `app/` as private, so the
  route 404s with no build error. Check your framework's equivalent.
- Confirm the route renders **without authentication** before building on it. If middleware
  redirects unauthenticated traffic, drop to Tier 2 rather than fighting the auth gate.

## Animations: hand over a live loop, never static frames

Embedded previews and screenshots can freeze animation (some IDE preview panes pause
`requestAnimationFrame` while hidden). Verify the animation is WIRED (keyframes present, computed
`animationName` / `animationDuration` on the element), give the user the served URL to watch it,
and say "animation wired; confirm motion at the URL" rather than claiming it animates.

Heroes are captured as still frames but never built static. Every transition the default above
asks for ships in the hero's one Write: hover and press on every control, enter, exit, expand and
collapse for anything it reveals, each 500 ms or less, reduced motion honoured. A Creative hero's
signature moment is its one play. Ambient loops and per-state choreography arrive with the
finalist build.


## Builder contract: the whole prompt for a hero or finalist builder

Builders are fast when the prompt holds everything and the steps are fixed: a contract builder
took 16 turns and 6.7 min for a hero, where open-ended builders took 47 to 79 turns and 18 to 28
min, mostly re-reading theme and token files (measured 2026-11-06/07; six contract builders in
parallel then took 3.7 to 4.9 min each). Fill the `<...>` slots and send the template as the
entire prompt.

**Before dispatch, scaffold the route yourself.** Parallel builders must never share a file, and
the route must compile before any of them lands. Copy the harness; write `page.tsx` registering
every option and state, with each Creative option's `play` imported from its own file
(`import C1, { play as c1Play } from "./c1"`, then `play: (p) => c1Play(p)`); and write one stub
per option at `<route>/<id>.tsx`: the import block every option needs (fixture, typography
wrappers, page header), `export const play = async () => {};`, and a default export that renders
the page header from the fixture. Without the stubs, `page.tsx` imports files that don't exist yet
and the route fails to compile under every early capture. Each stub is also its builder's pattern
file. For finalists the route exists: register the new states in `page.tsx` before dispatch.

**Hero builder.**

```
You build ONE hero frame: option <ID> (<name>, <track>) of the <surface> round. Budget: 10 minutes
wall clock. Run `date +%s` now and before each step; at 10 minutes, run step 4 with what you have.

Design mock (throwaway code): no types, tests, lint or tsc. Root: <repo root>. Open only these:
- design-mocks/GRADER-CONTEXT.md: the rules you are graded against; every "Assume ..." line binds you.
- design-mocks/PLATFORM-KIT.md: kit values and traps beat everything, checks and grades included (touch floors are px when the root font is fluid).
- Platform first: when a check fails on something the kit says the product ships (its button variant, colour role, logo treatment), keep it and hand it back as inherited. Never change a platform element to pass a check.
- Your sketch and art direction: "### <ID>" in design-mocks/<surface>-art-direction.md.
- Your stub, <route>/<id>.tsx: its imports, fixture call and page header are your pattern.

1. Replace <route>/<id>.tsx in ONE Write: the populated state, Desktop, the product's default
   theme, the art direction in full, and its transitions: hover and press on every control,
   enter, exit, expand and collapse for anything it reveals, every tween 500 ms or less, reduced
   motion honoured. Keep `export const play` (page.tsx imports it). Creative: the signature
   moment goes in that `play`. Mark every element the fixture cannot feed with
   `data-needs="API: <field>"`, and every new token, variant or shared component with
   `data-needs="System: <change>"`.
2. Run: <CHECK>
3. Read the populated PNG beside design-mocks/refs/<surface>/<borrowed ref> and
   design-mocks/refs/platform/<page>. Fix the top three look gaps and every failed check your option
   introduced in ONE pass; inherited platform failures stay.
4. Run <CHECK> again. Hand back the failed checks left, one line per fix, and both `date +%s`.

Never: write your own probe or capture scripts; run lint, tsc or tests; open theme or token source
the kit already summarises; edit any file but yours; run `capture.mjs signin`. Capture exit 2 means
a sign-in is needed: stop and say so.
```

**Finalist builder.** The same header, inputs and "Never" list, a 12-minute budget, and these
steps:

```
Grader fixes to apply: <the hero graders' top fixes>.
1. In ONE edit pass on <id>.tsx: the fixes; the designed states <states>, each request's loading
   and failure included, in the option's own visual language; every size preset; motion per the direction, every tween 500 ms or less, reduced
   motion honoured. Keep the signature moment and its data attributes working.
2. Run: <MATRIX>; <SHEET>
3. LOOK PASS, never skipped: Read states.png, sizes.png and the full-size populated frame beside
   the borrowed reference. Fix the top three look gaps and every failed check your option
   introduced in ONE pass; inherited platform failures stay.
4. Run step 2 again. Hand back the failed checks left (by frame), one line per fix, both `date +%s`.
```

**The commands.** `$C` is `<skill>/scripts/capture.mjs`, `$O` the option's shots folder, `$F` its
file.

- `<CHECK>`: `node $C mock --url <mock url> --options <ID> --states populated --sizes 1440x900
  --filters none,blur,grey --checks --out $O && node <skill>/scripts/class-census.mjs check
  --census design-mocks/class-census.json "$F"; grep -nE
  "duration:[[:space:]]*(0?\.(5[1-9]|[6-9])|[1-9])" "$F" || echo "motion: no tween over 500 ms";
  grep -qE "transition|<motion\.|animate=|@keyframes" "$F" || echo "motion: FAIL, no transitions wired"`
  (the last line proves only that some motion exists; coverage is the look pass's job)
- `<MATRIX>`: `node $C mock --url <mock url> --options <ID> --states <states> --themes light,dark
  --sizes 390x844,834x1194,1280x800,1440x900,1920x1080,2560x1440 --filters none,grey,blur --checks
  --out $O`, then the census and motion lines from `<CHECK>`.
- `<SHEET>`: `node $C sheet --out $O --themes light --sizes 1440x900 --cols 3 --to $O/states.png;
  node $C sheet --out $O --states populated,<weakest> --cols 4 --to $O/sizes.png`

Every unfiltered frame in `$O/manifest.json` carries `checks`, its failed check lines (`[]` means
all passed).

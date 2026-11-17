# Building the mock

Loaded at Step 3 of `ui-options-first`.

## Step 3: Build the mock. On a Claude Design canvas, the only place mocks live

**Mocks are built on a Claude Design canvas only.** Never build a mock inside the live project:
no mock route, page, component, harness file or fixture import in any app repo. The old tiers
(throwaway route, compiled-CSS dump, static HTML) and the route harness are retired. A legacy mock
route from an older round is deleted after its pick and never copied.

**The canvas.** One Design artifact per round: publish with the Design type's `type_url` and a
`title` naming the surface and round ("<Surface> · <change> · r1"), then follow the type's own
instructions (the create result carries them) for every file and call. What this skill adds:

- **Platform match comes from the product's design system artifact.** Use the one the Design
  System listing marks default, install it as the type's instructions say, and MOUNT its real
  components through the bundle global its README names, never look-alikes. Tokens, radii, type
  and fonts come from its `tokens.json` and README. A component the system doesn't ship is built
  from its tokens and named in the option's notes as a gap.
- **The design system lags the product: check the drift before the scaffold.** It is a snapshot
  synced from code (`source.exportedAt` in its `project/design-system.json`), and the product's
  theme keeps moving. Run `git log origin/main --since=<exportedAt> -- src/theme src/app/globals.css`
  in the product repo and skip the commits the project's platform kit lists as already ported.
  A remaining commit that changes a component the boards mount gets ported into the system's
  `components/bundle.js` (or `bundle.css`) first, verified, published, and added to that list;
  the canvas then installs the new version. One you don't port is named on the board as known
  drift. (2026-11-17: the busy Button showed its label under the loader on canvas boards, which
  the user had reported many times; the product fixed it on 2026-11-16, the bundle dated from
  2026-09-17.)
- **Why real components and not hand-matched tokens:** tokens colour the paint but don't
  reproduce a component library's chrome. Hand-matching a chip radius, button padding, icon
  ligatures and elevation from token values reads as "looks nothing like the real UI" even when
  every colour is right.
- **One board per option** (`<ID>.dc.html`, plus `Main.dc.html` as the entry: the round's index
  board with each option's name, track and one line). Each option board is `is_interactive:
  true`, and a PAGE board is `expand: "fill"`. Its states, widths and theme live in a chrome bar
  ON that board ("On a design-tool canvas" in `references/states-and-chrome.md`), never as one
  board per state or width.
- **Data:** the captured fixture (below) goes into the board as data returned from
  `renderVals()`, or as an uploaded `.json` asset it fetches, with its shape unchanged. Label any
  approximated key on the board's notes line.
- **Rules that fail silently** (from the type, measured on past boards): no `<iframe>`, so size
  presets are a frame at the preset's real width with the page's `@media` rules rewritten as
  `@container` rules; no global keydown handlers, so every toolbar key in "Mock chrome" becomes a
  chrome-bar control; no network except a Google Fonts link and uploaded assets; `{{hole}}` is a
  lookup into `renderVals()`, never an expression; board px are rem × the product's root font size
  at the board width (a fluid root is not 16px).
- **Sending:** write ONE board, send it, then the next; never two Writes in a row. Send only the
  files you changed. Parallel builders each send only their own board file to the same canvas
  `url`; only you send `project/canvas.json`.
- **Verification on a canvas:** the type forbids reading a board back, rendering it or
  screenshotting it unless the user asks. So the runnable checks are (1) contrast computed from
  the design-system tokens the board actually uses (a local script over `tokens.json`, numbers
  tagged derived), and (2) a checks panel on the board that runs live when the user opens it.
  Screenshots exist only when the user shares them or asks for a capture.

**Feed it REAL data, never invented fixtures.** Capture an actual API response or DB row for the
shape the mock renders. An invented payload makes the mock lie about its own subject the way
invented hex does. Field names, nesting depth, null-ness, array length, value length and
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
2. **Usage census.** Run `node <skill>/scripts/class-census.mjs census --src <source dir>
   --out design-mocks/class-census.json` and paste its per-family table and its
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
7. **Data, board, example.** How the fixture enters a board (`renderVals()` keys or the uploaded
   `.json` asset); the chrome-bar controls and the `data-tier` / `data-axes` / `data-why` /
   `data-needs` marks; the path of one finished board.
8. **Traps.** One line per trap measured in this product (a wrapper whose line height equals its
   font size clips descenders under `overflow:hidden`; a token equal to the surface it sits on).
9. **Allowed extras.** Colours, radii and fonts that live pages render but the mock page's own
   shell doesn't show (a component library default, say). They go into the allow list of the
   board's checks panel.

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
labels or numbers. The board's checks panel reports any text cut by its own box or a clipping
ancestor, so a
label that fits by a pixel fails before anyone sees it.

## Mock code is exempt from code-quality ceremony

Mock code is a **disposable prop for a decision**, not software. It lives on the canvas, never
in the product, and is never maintained after the pick. Production discipline applied to it burns
the budget that should go into the design.

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
score ≥90: a thin, ugly mock fails as hard as a bloated one. If you're cutting a hover state, a needed empty state, a transition, or a real
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
- **Nothing in the app repo:** no mock file lands in any app repo (see "Nothing in the app repo").

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
design-mocks/fixtures/ design-mocks/canvas/`. If either isn't, add it to `.gitignore` first: the
boards' local copies embed the fixture. A tracked fixtures directory turns this practice into a
data leak. Ignore mock pages too
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

## Nothing in the app repo

The canvas holds every mock file. Locally, `design-mocks/fixtures/` and `design-mocks/canvas/`
(both git-ignored; the boards' copies carry fixture data) hold the captures and the boards' local
copies. Before a round ends, `git status` in each app repo the round touched must
show no mock file. A legacy mock route found from an older round gets deleted after its pick, not
reused.

## Animations: hand over a live loop, never static frames

You never watch a board play (the Design type forbids rendering it unless the user asks), so
confirm the animation is WIRED in the board source (keyframes or transitions present, durations,
the reduced-motion branch), give the user the canvas link to watch it, and say "animation wired;
confirm motion on the canvas" rather than claiming it animates.

Heroes are never built static. Every transition the default above
asks for ships in the hero's one Write: hover and press on every control, enter, exit, expand and
collapse for anything it reveals, each 500 ms or less, reduced motion honoured. A Creative hero's
signature moment plays from its Replay control. Ambient loops and per-state choreography arrive with the
finalist build.


## Builder contract: the whole prompt for a hero or finalist builder

Builders are fast when the prompt holds everything and the steps are fixed: a contract builder
took 16 turns and 6.7 min for a hero, where open-ended builders took 47 to 79 turns and 18 to 28
min, mostly re-reading theme and token files (measured 2026-11-06/07, on the retired route
build; canvas builds are not measured yet). Fill the `<...>` slots and send the template as the
entire prompt.

**Before dispatch, scaffold the canvas yourself.** Parallel builders must never share a file.
Create the round's canvas, install the design system, and send `project/canvas.json` with one
`boards` entry and `order` slot per option plus `Main.dc.html`. Then send one stub board per
option at `project/<ID>.dc.html`: the type's skeleton, the design-system mount, the captured
fixture in `renderVals()`, the page header and the chrome bar. Each stub is its builder's pattern
file, kept locally under the round's `<root>` in `design-mocks/canvas/<surface>-<round>/`. For
finalists the boards exist: add the new states to each board's state select before dispatch.

**Hero builder.**

```
You build ONE hero board: option <ID> (<name>, <track>) of the <surface> round, on the Claude
Design canvas <canvas url>. Budget: 10 minutes wall clock. Run `date +%s` now and before each
step; at 10 minutes, run step 3 with what you have.

Design mock (throwaway code): no types, tests, lint or tsc, and no file in any app repo.
Open only these:
- design-mocks/GRADER-CONTEXT.md: the rules you are graded against; every "Assume ..." line binds you.
- design-mocks/PLATFORM-KIT.md: kit values and traps beat everything, checks and grades included (touch floors are px when the root font is fluid).
- The design system's README and tokens.json, already copied under <root>/project/ds/<folder>/.
- Platform first: when a check fails on something the kit says the product ships (its button variant, colour role, logo treatment), keep it and hand it back as inherited. Never change a platform element to pass a check.
- Your sketch and art direction: "### <ID>" in design-mocks/<surface>-art-direction.md.
- Your stub, <root>/project/<ID>.dc.html: its mount, fixture and page header are your pattern.

1. Replace <root>/project/<ID>.dc.html in ONE Write: the populated state, Desktop, the
   product's default theme, the art direction in full, mounted design-system components, and its
   transitions: hover and press on every control, enter, exit, expand and collapse for anything
   it reveals, every tween 500 ms or less, reduced motion honoured. Creative: the signature
   moment plays from a Replay control in the chrome bar. Mark every element the fixture cannot
   feed with `data-needs="API: <field>"`, and every new token, variant or shared component with
   `data-needs="System: <change>"`.
2. Send ONLY that file to <canvas url> with the Artifact tool (`root` = <root>, `file_path` =
   the board). Never send project/canvas.json. A refusal names a file to re-read: re-read it,
   redo the edit, send once more.
3. Run <CHECK>. Replace or justify every census line your option introduced, then hand back:
   the text/surface token pairs your board uses, the census and motion lines left, one line per
   design decision, and both `date +%s`.

Never: open, render or screenshot the canvas; write probe scripts; run lint, tsc or tests; open
theme or token source the kit already summarises; edit any file but your board.
```

**Finalist builder.** The same header, inputs and "Never" list, a 12-minute budget, and these
steps:

```
Grader fixes to apply: <the hero graders' top fixes>.
1. In ONE edit pass on <ID>.dc.html: the fixes; the designed states <states>, each request's
   loading and failure included, in the option's own visual language, reached from the chrome
   bar's state select; every size preset as a frame at real width; motion per the direction,
   every tween 500 ms or less, reduced motion honoured. Keep the signature moment working.
2. Send only that file, as in the hero contract.
3. Run <CHECK>. Replace or justify every census line your option introduced, then hand back the
   token pairs, the census and motion lines left and one line per fix, both `date +%s`.
```

**The command.** `$F` is the board file.

- `<CHECK>`: `node <skill>/scripts/class-census.mjs check --census design-mocks/class-census.json
  "$F"; grep -nE "duration:[[:space:]]*(0?\.(5[1-9]|[6-9])|[1-9])|[0-9]{3,}ms" "$F" | grep -vE
  "\b(500|[1-4][0-9]{2})ms" || echo "motion: no tween over 500 ms"; grep -qE
  "transition|@keyframes|animation" "$F" || echo "motion: FAIL, no transitions wired"; grep -qE
  "prefers-reduced-motion" "$F" || echo "motion: FAIL, no reduced-motion branch"` (the census
  line exits 3 on a class or component combo the product never or rarely uses, Step 4 check 1b;
  the motion lines prove only that motion is wired, and coverage is the grader's job)

**After the builders land, you run the contrast check:** for every text/surface pair the builders
reported, compute the ratio from the design system's `tokens.json` in both themes (a short local
script; every number tagged derived). That table is the round's measured contrast gate. Clipped
text, sideways scroll and touch targets can't be measured without rendering: the board's checks
panel runs them live for the user, and graders judge them from the source.

## Claude Design canvas gotchas

- Canvas publish conflict ("published content is not what you last saw"): someone edited on the canvas. Read the live file, diff it against your base, merge their change into your copy, then publish. Never force.
- Keep the board source and check scripts in `design-mocks/`, not the session scratchpad. A new session gets a new scratchpad, and publishing refuses a `root` outside the working directory or the current scratchpad.
- Floating UI on a board: panels and the frame are `overflow:hidden`. Render tooltips `position:fixed` on `document.body`, and flip popovers by measuring the clipping ancestor.
- Every markup fix may have two copies (phone/tablet tree and desktop tree). Assert the expected match count on each replacement.

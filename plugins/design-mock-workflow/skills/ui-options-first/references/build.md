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

**Feed it REAL data, never invented fixtures.** Capture an actual API response or DB row for the
shape the mock renders. Field names, nesting depth, null-ness, array length, value length and
optionality are all *design* constraints, and a made-up object gets each of them wrong in a way
that only surfaces during implementation, when the real field is `invoice_number` not `id`,
arrives 40 chars long, and is sometimes null. See "Captured data fixtures" below.

Mock code is throwaway and exempt from code-quality ceremony (see "Mock code is exempt"). Write
it fast and loose; spend the effort on the design.

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

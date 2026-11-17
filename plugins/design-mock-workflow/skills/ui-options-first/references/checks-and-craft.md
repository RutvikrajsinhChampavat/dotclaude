# Runnable checks and the craft loop

Loaded at Steps 4 and 4b of `ui-options-first`.

## Step 4: Every mock carries runnable checks, not claimed ones

Fixtures in the mock, not assertions in prose. A number you assert is not a number you measured.

**On a Claude Design canvas (the only place mocks live), checks run in two places.** Contrast
is computed from the design-system tokens the board uses, by a local script, in both themes, and
every number is tagged derived. Everything below that needs a render (clipped text, sideways
scroll, touch targets, geometry, paint, computed motion) runs in a checks panel on the board, in
the board's own `DCLogic`, when the user opens it. You never render the canvas yourself unless the
user asks; a check you could not run is reported as "not run: needs the user's render".

Platform match outranks every check below. A check that fails on an element matching the
platform (the product's own button variant, colour role, logo treatment or spacing) is an
inherited failure: leave the element as the platform has it, and list the failure for the user as
a platform follow-up. Only failures the option itself introduced get fixed in the mock.

1. **Contrast.** Walk every text/background pair, compute the ratio in BOTH themes, render
   failures visibly in the grading panel. This catches a hairline drawn in a token that equals
   the surface it crosses.
   Trap: `getComputedStyle().color` returns `oklch(...)` verbatim for oklch tokens. A check that
   regex-pulls three numbers reads `0.5 0.1377 84.01` as RGB and reports a confident fake ratio.
   Detect `oklch(` and convert (oklch → oklab → linear sRGB), or paint the colour to a 1×1 canvas
   and read the pixel back.
1a. **Clipped text.** The board's checks panel walks every text node and reports any cut by its own box or a
   clipping ancestor (more than 1px on either axis), plus ellipsis or line-clamp truncation unless
   a `title` carries the full text; headings, buttons and numbers may never truncate. Scroll areas,
   `aria-hidden` and `[data-clip-ok]` (a rolling counter, say) are exempt. Target: 0.
1b. **Platform fidelity.** The checks panel lists every colour (RGB; token tints pass), radius (pills
   pass) and font family in the option that is neither a token nor already rendered by the
   product's own UI on the page or in the kit's "Allowed extras". Then
   `scripts/class-census.mjs check` lists every styling class the product's source never uses
   (filter classes such as `grayscale` included) and every component variant/colour combo the
   product never uses, or uses on under 5% of that component and fewer than 10 times (`--share`
   changes the cut; explicit defaults count as omitted; a routine role like outlined error passes). The checks-panel line only proves a value exists in the product; the
   census proves the product uses it that way. Targets: the checks-panel line clean, and each
   never-used class and off-pattern combo replaced or justified as the option's named bold move
   (exit 3 until then).
2. **Icon subset.** Probe every icon name used against the shipped font. A self-hosted *subset*
   fails silently: the ligature doesn't resolve and the raw name paints as text at icon size.
   Lint and type checks don't catch it. A new icon needs adding to the subset and the generator
   re-run.
3. **Geometry.** Where a mock draws connectors, tethers, or anything positioned against another
   element, measure the real rects and assert endpoints land on real anchors. Never eyeball
   coordinates.
4. **Paint.** Assert every decorated element actually painted (computed `background-image` /
   `background-color` not empty). A multi-layer `background` with a bare colour in a NON-final
   layer (`linear-gradient(...), var(--surface) padding-box, ...`) is invalid, and the browser
   drops the WHOLE declaration silently: no fill, no ring, nothing in lint or the console. Wrap
   solid colours as `linear-gradient(c, c)` when layering.
5. **Visibility.** `[hidden]` loses to a class-level `display: flex`, so a collapsed section
   renders expanded at rest with no error. Add `[hidden] { display: none !important }`.
6. **Runtime smoke when you can't see the render.** You never render the canvas, so a board whose
   script throws is invisible to you. Keep each board's `DCLogic` to state toggles and derived
   values; when a board's logic does more (a flow that plays end to end, a timer), ask the user to
   open it once and paste the checks panel before grading.
7. **Motion.** List every animated element with its computed `transition-duration` /
   `animation-duration` (or its JS animation config) and its prominence tier. Flag any duration
   outside its tier's budget (see "Motion budget") and any element that still moves with
   `prefers-reduced-motion: reduce` emulated.
8. **Craft.** The last-10% details, checked from computed styles and rects, failures listed in
   the grading panel:
   - nested corners are concentric: inner radius = outer radius minus padding (within 1px);
   - every column of figures uses `font-variant-numeric: tabular-nums`;
   - headings use `text-wrap: balance`, body paragraphs `text-wrap: pretty`;
   - every interactive control has distinct hover, focus-visible, active and disabled styles
     (diff the computed styles across forced states; identical means missing);
   - scroll containers with overflow show an edge fade or shadow;
   - icons beside text sit on the same optical line (icon box centre within 1px of the text
     x-height centre);
   - raised surfaces use layered shadows (two or more layers), not one flat shadow or a border alone;
   - no layout shift when loading resolves: record the rects of stable landmarks in the loading
     and populated states; any landmark that moves is a failure.
9. **Screen sizes.** At every preset, in each option's populated and overflow states: page
   `scrollWidth` ≤ the frame width (no horizontal scroll); no text element clipped
   (`scrollWidth > clientWidth` on an element without an ellipsis); touch presets have every
   interactive element at least 44 × 44px; the Step 2b primary's rect starts above the fold on
   Phone; **the content fills the width**: the page's children reach within 48px of the stage's
   padded edges on both sides, so a centred `max-w-*` cap that leaves empty side bars fails at the
   wide presets. Failures listed per preset in the grading panel.
   - Run it from the board's checks panel. A board can't hold an iframe, so the panel measures
     the size frames already on the board (each preset at its real width, see "Screen sizes" in
     `references/states-and-chrome.md`) in the All sizes view.
   - **Set the option and state through the chrome bar before each measurement, and record which
     option and sections rendered.** Identical numbers across different options are the tell.
   - Prove the check can fail: put a width cap back for one run and confirm it goes red at the
     wide presets.
   - Before the first board is shown, diff the mock's outer container against the live page's own
     (padding, `max-w`, centring). A cap the live page doesn't have is a bug, not a style choice.

## Step 4b: Craft loop. Compare, fix, repeat

A mock nobody has looked at is not finished, and one look is not a craft pass. Heroes get one look
pass inside their build; finalists get one inside their build plus one fix loop after grading, when
it fits the 20-minute round (Step 4b in SKILL.md); quick-mode options get one round.

**Craft checks graders miss when they read source.** Run these in every look pass, then the
project's own craft values (the house rules in `design-mocks/GRADER-CONTEXT.md` and the traps in
`design-mocks/PLATFORM-KIT.md`) the same way:
- **Reuse before you hand-roll.** Search the product for the shipped component first (a drop
  zone, an alert, a review card on a sibling page) and copy it as it ships. Icons too: an action
  the product already has keeps the product's icon, so search its icon constants before picking
  a new one.
- **One focus ring per control.** A composite input uses `:focus-within` on its wrapper and
  `outline: 0` on the inner field. No native resize handle; auto-grow instead.
- **Icon on the first line.** An icon beside text that wraps, or beside a title plus a subline
  (menu items, list rows, alerts, cards), sits on the title line, never centred across the block.
  Top-align the row and give the icon a box exactly one title line tall, centring the glyph in it.
  A tile icon taller than the line is centred on the title line, not on the block. User rule,
  re-stated 2026-11-17 after a two-line menu item shipped with its icon centred.
- **Underline the label only.** A link's underline covers its text, never the icon glyph.
- **Expanding reveals itself.** Opening a panel scrolls it into view (`block: 'nearest'`).
- **Expanding keeps the text's style.** A clamped preview and its opened text use the same
  typography role, size and colour; opening only removes the clamp. A step up in size or to a
  darker colour reads as bold. An inline editor matches that size too, so clicking in to edit
  doesn't shift the text.
- **Every reveal can be undone.** An optional field or panel opened by a link has a way back: a
  close in the field, or it hides itself when left empty.
- **A control inside a field gets its own slot.** Use the component library's adornment or slot,
  never an element absolutely positioned over the input; compact, top-aligned on a multiline
  field, so text wraps before it. Check with one long unbroken line.
- **A busy button shows only its loader.** Centred spinner, label hidden, width kept; never
  spinner plus label.
- **Leave a floating-label field's input font alone.** Resizing it pushes the label off-centre.
- **Error states are compact.** An alert with a title, the message and its actions, not a tall
  card.

1. **Pixels come from the user.** The Design type forbids reading a board back, rendering or
   screenshotting it unless the user asks, so the look pass reads each board's source. When a
   look question can't be settled from source (a crowded row at phone width, a contrast-adjacent
   tint), ask the user for a screenshot of that board at that state and width, or ask whether you
   may capture it. Never judge sizes from an embedded browser pane's own size: it is often
   narrower than any real screen, so wide-screen bugs never show there. A craft pass on no pixels
   is labelled "from source" for every pixel-only judgement.
2. **Compare against the reference and the platform, side by side.** For each option, Read its
   board source (and the user's screenshot when there is one), the `Borrowed from` file its art direction names (`references/art-direction.md`)
   and a live platform page from `refs/platform/`, all at the same width. First gap to check: does
   it read as this product (page shell, surfaces, radii, colour roles, type roles), or as the
   reference product? Then write the gaps as measured deltas against the spec table, looks first:
   - composition: what the eye lands on, what isolates it, what is boxed that should be grouped by
     space;
   - type: role sizes and weights, title:body ratio, how many sizes are on screen;
   - colour: accent count per view, and status shown as fills where the reference uses dots or text;
   - surface: depth recipe, radii, borders where the reference uses steps or shadow;
   - finish: the reference's 2 to 3 details and whether this option has them.

   Frame the critique as "the design lead at <benchmark> reviewing this beside their own screen"
   (with a design-critique skill if one is installed).
3. **Squint and greyscale.** Only with a screenshot the user shared: blur it and greyscale it
   (a local image script); the Step 2b primary must be the first mass, and the hierarchy must
   hold with colour removed. Without one, judge mass and value order from the source's sizes,
   weights and token lightness, and label it "from source". Either failing is a gap for this
   round.
4. **Fix the top three gaps, looks before hygiene.** Composition, type, colour and surface come
   before copy and markup tweaks; a round that only fixes spacing nits while the focal point is
   still missing has not done its job. No fix trades platform match for a check or a point: a gap
   whose only fix is to leave the platform is reported, not fixed. Re-send the board, and keep
   the previous local copy as `<ID>.r<n>.dc.html` so the grading panel can show before and after.
   Log each round in one line: the gaps found, the fixes, and the delta still left against the
   reference.
5. **Stop rule (finalists).** The build's look pass, then at most one fix loop after grading, and
   only inside the 20-minute round. Whatever is still short is reported with the grades, never
   fixed silently past the budget.
6. **Microcopy.** Review every label, button, empty state and error message (with a UX-copy
   skill if one is installed). Buttons name the action ("Use documents only", not "Confirm").
   Errors say what happened and what to do. Empty states say why it's empty and offer the next
   step.
7. **Interaction patterns.** For each option, decide and record in the panel: an undo toast
   instead of a confirm dialog for reversible actions; an optimistic update where the write
   rarely fails; inline edit instead of a modal for single fields; keyboard shortcuts on
   daily-use surfaces; a command palette entry if the product has one. A "no" needs a
   one-line reason.
8. **Task test.** Give each option one real task the user has on this screen ("find the failing
   source and fix it"). Walk it in Play mode and record the step count per option in the panel.
   Then a **5-second test** on the populated screenshot: what does the eye land on first? It must
   be the Step 2b primary. If it isn't, Hierarchy fit loses points.

Steps 2 to 8 run on finalists and quick-mode options; heroes get steps 1 to 4, once, from their builder.

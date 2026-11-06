# Runnable checks and the craft pass

Loaded at Steps 4 and 4b of `ui-options-first`.

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
   Phone. Failures listed per preset in the grading panel.

## Step 4b: Craft pass. Look, critique, fix

A mock nobody has looked at is not finished. Before grading:

1. **Look.** Screenshot every option in the populated state and its weakest state, in both
   themes, at Desktop; then the populated state at Phone and Wide (one theme is enough there). Screenshots only: no click loops, no logging in. If your rules forbid driving a
   browser, or the route sits behind a login, use the runtime smoke render instead and say the
   craft pass ran blind.
2. **Critique as a design director.** Review each screenshot as "what would the design lead at
   the benchmark product change?" (with a design-critique skill if one is installed). Fix the
   top three issues per option, re-screenshot, and keep the before/after pair for the panel.
3. **Microcopy.** Review every label, button, empty state and error message (with a UX-copy
   skill if one is installed). Buttons name the action ("Use documents only", not "Confirm").
   Errors say what happened and what to do. Empty states say why it's empty and offer the next
   step.
4. **Interaction patterns.** For each option, decide and record in the panel: an undo toast
   instead of a confirm dialog for reversible actions; an optimistic update where the write
   rarely fails; inline edit instead of a modal for single fields; keyboard shortcuts on
   daily-use surfaces; a command palette entry if the product has one. A "no" needs a
   one-line reason.
5. **Task test.** Give each option one real task the user has on this screen ("find the failing
   source and fix it"). Walk it in Play mode and record the step count per option in the panel.
   Then a **5-second test**: what does the eye land on first? It must be the Step 2b primary.
   If it isn't, Hierarchy fit loses points.

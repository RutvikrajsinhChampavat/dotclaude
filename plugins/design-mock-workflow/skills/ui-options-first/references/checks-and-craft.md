# Runnable checks and the craft loop

Loaded at Steps 4 and 4b of `ui-options-first`.

## Step 4: Every mock carries runnable checks, not claimed ones

Fixtures in the mock, not assertions in prose. A number you assert is not a number you measured.

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
1a. **Clipped text.** The harness walks every text node and reports any cut by its own box or a
   clipping ancestor (more than 1px on either axis), plus ellipsis or line-clamp truncation unless
   a `title` carries the full text; headings, buttons and numbers may never truncate. Scroll areas,
   `aria-hidden` and `[data-clip-ok]` (a rolling counter, say) are exempt. Target: 0.
1b. **Platform fidelity.** The harness lists every colour (RGB; token tints pass), radius (pills
   pass) and font family in the option that is neither a token nor already rendered by the
   product's own UI on the page or in the kit's "Allowed extras". Then
   `scripts/class-census.mjs check` lists every styling class the product's source never uses
   (filter classes such as `grayscale` included) and every component variant/colour combo the
   product never uses, or uses on under 5% of that component and fewer than 10 times (`--share`
   changes the cut; explicit defaults count as omitted; a routine role like outlined error passes). The harness line only proves a value exists in the product; the
   census proves the product uses it that way. Targets: the harness line clean, and each
   never-used class and off-pattern combo replaced or justified as the option's named bold move
   (exit 3 until then).
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
   `Element.animate`), drive the core interaction, then delete the test. Heroes skip it: the
   builder's own capture of the real render is their smoke test.
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
   - Run it from the checks button: load each preset in an off-screen iframe
     (`position:fixed; left:-40000px; visibility:hidden` still lays out) at its real width ×
     height, measure, remove.
   - **Push the option and state into each probe; never trust its URL.** An auth redirect can
     drop the query string, and then every probe silently renders the default option. Wait until
     the frame reports the option you asked for before measuring, and record which sections it
     rendered. Identical numbers across different options are the tell.
   - Prove the check can fail: put a width cap back for one run and confirm it goes red at the
     wide presets.
   - Before the first screenshot, diff the mock's outer container against the live page's own
     (padding, `max-w`, centring). A cap the live page doesn't have is a bug, not a style choice.

## Step 4b: Craft loop. Capture, compare, fix, repeat

A mock nobody has looked at is not finished, and one look is not a craft pass. Heroes get one look
pass inside their build; finalists get one inside their build plus one fix loop after grading, when
it fits the 20-minute round (Step 4b in SKILL.md); quick-mode options get one round.

1. **Capture to files.** The graders read files, so every screenshot is a PNG on disk:

   ```bash
   node <skill>/scripts/capture.mjs mock --url <mock URL> \
     --options <ids> --states populated,<weakest> --themes light,dark \
     --sizes 1440x900,390x844,1920x1080,2560x1440 --filters none,blur,grey \
     --out design-mocks/shots/<surface>/round-<n>
   ```

   - Heroes: `--states populated --sizes 1440x900 --themes <product default> --filters none,blur,grey`.
   - Captures run in a headless browser that starts on its own (port 9223): no window opens and
     nothing takes focus. Before each run the script copies the local-host sign-in cookies from
     the browser the user signs in with (port 9222). Exit 2 means the app wants a sign-in: ask the
     user to run `node <skill>/scripts/capture.mjs signin --url <app origin>/` and sign in once,
     then re-run. Agents never run `signin` and never type credentials. When the round ends, ask
     the user to close the sign-in browser and stop the headless one
     (`pkill -f design-mock-capture-headless`): any local process can drive a browser while its
     debug port is open.
   - The script sets each option, state and theme through `window.__mock.set()` (the harness kit
     provides it) and saves a frame only after `window.__mock.current()` reports exactly what it
     asked for. A mismatch is listed under `errors` and exits 3; it never becomes a screenshot of
     the wrong option. Read the manifest, then Read every image you will critique.
   - The viewport is emulated at the exact size, so media queries and a fluid root font respond.
     Never judge from an embedded browser pane's own size: it is often narrower than any real
     screen, so wide-screen bugs never show.
   - **Your screen.** The mock can report each browser's window size to a throwaway route; add the
     user's real size to `--sizes`.
   - **Real engine (optional).** When the user's browser is Firefox-based (Firefox, Zen), also
     capture there with `scripts/firefox-capture.mjs` over WebDriver BiDi.

   Screenshots only: no click loops, never a login typed by you. If your rules forbid driving a
   browser or no capture works, ask the user for screenshots. A craft pass on no pixels is not a
   craft pass; say so if it happens.
2. **Compare against the reference and the platform, side by side.** For each option, Read its
   screenshot, the `Borrowed from` file its art direction names (`references/art-direction.md`)
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
3. **Squint and greyscale.** Read the `-blur` shot: the Step 2b primary must be the first mass you
   see. Read the `-grey` shot: the hierarchy must hold with colour removed. Either failing is a
   gap for this round.
4. **Fix the top three gaps, looks before hygiene.** Composition, type, colour and surface come
   before copy and markup tweaks; a round that only fixes spacing nits while the focal point is
   still missing has not done its job. No fix trades platform match for a check or a point: a gap
   whose only fix is to leave the platform is reported, not fixed. Re-capture into the next
   `round-<n>` folder and keep each
   before/after pair for the grading panel. Log each round in one line: the gaps found, the fixes,
   and the delta still left against the reference.
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

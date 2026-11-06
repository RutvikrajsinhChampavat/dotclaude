# States, mock chrome and motion

Loaded at Step 3 of `ui-options-first`, before building the first option.

## States are designed, not defaulted

Loading, empty and error are part of every option's design, not a shared fallback bolted on
after the pick. Each option designs its own, in the same visual language as its populated state,
and the state switcher (see "Mock chrome") shows all of them. A state that falls back to a
generic component (centred spinner, icon + "No data", red "Something went wrong") counts as
NOT designed.

**Loading**

- Skeleton shaped like THAT option's content: same row heights, line lengths, tile sizes. Two
  options with different layouts get different skeletons.
- Show what is already known (headers, labels, cached values) and skeleton only the unknown.
  Never blank the whole surface for one slow field.
- Hold the skeleton back ~300ms so a fast load doesn't flash; cross-fade to content with zero
  layout shift.
- Actions in flight (save, retry) show progress on the control itself and keep its size.

**Empty** comes in kinds, and each reads differently:

- **First run** (nothing has ever existed): say what will appear here and why it matters, plus
  ONE primary action that fills it. This is the one state allowed a little delight.
- **Filtered to nothing**: name the filter or query and offer to clear it. Never the first-run copy.
- **Cleared / all done** (inbox zero, nothing needs attention): a calm confirmation, no call to
  action.
- **Not available** (permission, plan, feature off): say who can grant it, never a dead end.

**Error** comes in kinds too:

- **Load failed**: what failed in plain words, keep anything that did load, a retry next to it.
- **Partial**: one source or section failed. Degrade that section only and say which; the rest
  stays usable.
- **Action failed** (save, switch, delete): inline beside the control that triggered it, the
  user's input preserved, the exact next step. Never only a toast.
- **No access** (403): a lock state that names the role needed and who grants it, distinct from
  load failure.

Every error message answers: what happened, whether anything was lost, what to do now.

**Data and grading**

- Capture the real error responses too (status code + body shape) into the fixtures, the same
  as the happy path. A designed error built on an invented payload names the wrong cause.
- Each state gets its own prominence map: in an error state the error is primary; in first-run
  the filling action is.
- Grade every option in every state, and report the WEAKEST state's score next to the populated
  one. An option that is beautiful when full and generic when empty has not passed.

## Mock chrome: what every mock ships with

A floating, collapsible toolbar outside the stage (never inside the design being judged). It
makes the mock answer "what does this feel like in every situation" without the user asking.

**Default, every mock, first build:**

1. **State switcher.** Empty · loading · populated · error · overflow · first-run, each driven
   by a real captured fixture (overflow = the longest or largest real case). Loading renders
   **skeletons shaped like the real content** (same row heights, line lengths, avatar slots),
   never a centred spinner; the skeleton-to-content swap cross-fades with no layout shift.
2. **Hierarchy overlay.** A toggle (`H`) that tints each section by its Step 2b tier and labels
   it `primary / secondary / tertiary / contextual` with its axis values; `estimated` ones say
   so. Re-tints per state, since prominence is state-dependent.
3. **Compare mode.** Keys `1` `2` `3`… swap options inside the SAME frame and state, keeping
   scroll and selection, so differences read as a flip rather than a scroll. A short cross-fade
   (~200ms) between options; instant under reduced motion.
4. **Play + rationale hotspots.** `▶ Play` auto-runs the primary flow (scripted clicks with a
   visible cursor, 1–2s per step, stoppable), so the motion choreography is seen without
   clicking through. `?` reveals numbered pins on the stage; each opens a one-line rationale.
   This is where reasoning lives, so the stage stays clean.

5. **Feedback pins.** A toggle (`F`), then click anywhere on the stage to drop a numbered pin
   and type a note. Each pin records option id, state, theme, viewport and the element under
   the click (its text, role and nearest labelled ancestor). A **Copy feedback** button copies
   all pins as a compact list the user pastes into chat; pins persist per option in
   localStorage until cleared. Replaces "screenshot plus describe which dropdown".

**Optional, when the surface calls for it:** persona/role switcher (when frequency differs by
role), viewport presets (mobile / tablet / desktop frames) and a density toggle, a ⌘K command
palette and shortcuts (only on surfaces a power user hits daily).

Toolbar keys must not collide with keys the design itself handles; list them in the toolbar.

## Motion budget: where motion goes, and how much

Motion has a job or it doesn't ship. Four jobs: **continuity** (where did it come from / go),
**feedback** (press, success, failure), **attention** (look here, now), **data change** (a value
moved, a list reordered). Decoration is not a job.

Budget by prominence tier (Step 2b):

| Tier | Allowed | Not allowed |
|---|---|---|
| Primary | all four jobs; one attention cue on entry or on urgent state | looping attention after the user engaged |
| Secondary | feedback, continuity, data change | attention |
| Tertiary | reveal continuity only (drawer, menu, hover reveal) | everything else |
| Contextual | enter/exit continuity; attention only if urgent | lingering motion after dismissal |

**Frequency caps duration.** An action the user repeats many times a day (row select, tab
switch, toggle) stays ≤150ms or is instant. A 300ms flourish seen 50 times a day becomes
friction. One-time moments (first load, success of a big task) may run longer.

Timing defaults (use the project's own motion tokens when it has them):

- Micro (press, hover, toggle): 120–180ms. Panels, drawers, popovers: 200–300ms. Route or large
  surface: 300–400ms. Nothing over 500ms except a deliberate one-time moment.
- Enter = ease-out, exit = ease-in and ~20% shorter than enter. Drag, resize, throw = spring.
- Stagger lists 30–50ms per item, cap at ~6 items, then the rest appear together.
- Animate `transform` and `opacity`; animate size only on containers with a fixed inner size.

Techniques that earn their place:

- **Shared-element transitions** for list → detail and card → panel, so the user tracks the
  object instead of re-finding it.
- **FLIP / layout animation** for reorder, filter and insert: rows slide, never jump.
- **Count-up / number tween** for KPI and total changes (primary/secondary only).
- **Drawn checkmark or brief tint** for success; **short shake or tint** for failure. Feedback,
  then still.
- **Press scale** (~0.97) and hover lift (elevation, not size) on interactive cards.
- **Optimistic update** with a settle animation, so the action feels instant.

Reduced motion: replace movement with opacity or nothing, and keep the state change itself. The
Step 4 motion check covers both the budget and this path.

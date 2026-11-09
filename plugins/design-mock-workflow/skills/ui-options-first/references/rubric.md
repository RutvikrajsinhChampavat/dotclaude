# The rubric

Loaded at Step 2 (sketch grades) and Step 5 (hero and finalist grades) of `ui-options-first`. The
`ui-grader` agent carries its own copy (`agents/ui-grader.md` in this plugin); change one, change both.

**Precedence: platform match first, then gates, then points.** Grade the option as the platform
ships it. A gate failure that comes from the platform itself is flagged, not failed; a departure
from the platform made to pass a gate or earn points fails Fidelity.

## Gates: pass or fail, never points

Any failed gate fails the option, whatever its total. Gates are not where a rework earns points.

- **Accessibility**: text contrast ≥4.5:1 (3:1 for large text) and non-text contrast ≥3:1 in both
  themes, measured by the Step 4 checks; keyboard reachable with visible focus; touch targets
  ≥44px on phone and tablet; reduced motion honoured; colour never the only signal. An inherited
  failure (the same component, variant and token failing on the live product, recorded in the
  platform kit) is flagged as a platform follow-up, not failed.
- **Hygiene**: the Step 4 runnable checks are green, clipped text 0 included.
- **Fidelity**: the platform-fidelity line clean (every colour, radius and font is a token or
  already in the product); every styling class the product never uses, and every component
  variant/colour combo the census check flags as never or rarely used, replaced or justified as
  the option's named bold move; a shipped pattern swapped for a rare one to pass a check fails this
  gate; the product's page shell, surfaces and colour roles kept unless the option's
  bold move names the change; the real component library; the product's own labels for concepts
  it already names; real captured data (or data labelled as approximated).

## Points: 100, threshold 90

| Dimension | Weight | What earns it |
|---|---|---|
| **Aesthetic quality** | 30 | Judged beside the reference board, at the same width. Composition: one clear focal point, a visible grid and alignment, space that groups and isolates. Typography: real size and weight contrast between roles, a steady rhythm. Colour: restraint, accent as a signal; restraint never means stripping colour the product itself shows (brand logos, its primary buttons). Surfaces: depth and finish on a par with the references. The small details that signal finish. Two questions: would this screen sit inside the benchmark product without looking worse, and does it sit beside this product's own pages (`refs/platform/`) without looking foreign? |
| **Point of view** | 10 | The art direction's bold move reads in the first second and holds in every state. Recognisable with the logo removed; not the existing page rearranged. Creative options land their signature moment; Simple options earn it through finish. |
| **UX clarity** | 20 | A non-technical user understands it with no tooltip. Primary action obvious. Progressive disclosure in the right order: summary before payload, never a raw dump. Low task-test step count. Copy names actions and explains errors. |
| **Hierarchy fit** | 15 | Prominence matches the Step 2b map: one primary per view, frequent and valuable sections nearest the entry point, rare ones disclosed, urgent states promoted while live. In the blur shot the primary is still the first mass; in the greyscale shot the hierarchy holds. Motion follows tier. Every state keeps a sane ranking. |
| **Density** | 10 | Compact without crowding. Costs little at rest. No dead space, no cramming. |
| **Domain fit** | 10 | Behaves correctly in its real container: under zoom and pan for a canvas, resize for a panel, long content for a list. No occlusion, no reflow of neighbours. Works at every screen-size preset, phone to wide. |
| **Implementation cost** | 5 | Cost in proportion to what it buys: new parts are fine when they buy the look or the task. Performs on realistic data volume. |

**Hard floor: any dimension below 60% of its weight fails the option outright, regardless of
total.** For Aesthetic quality, 60% is the competent template look: correct, tidy, forgettable.

## When each part is graded

| Stage | Graded on | What is scored |
|---|---|---|
| Sketch (Step 2) | Prose plus the art direction block | UX clarity, Hierarchy fit, Density, Domain fit, Implementation cost: 60 points; a sketch needs ≥54 to be built. Aesthetic quality and Point of view need pixels, so they read "pending". |
| Hero (Step 3a) | Populated state, Desktop, one theme, a still frame; one grader per track | All seven dimensions, state- and size-dependent ones marked "(hero)". A Creative hero's signature moment is judged from its one play and its code; no other interaction is scored yet. Gates that need both themes or every size are "pending". |
| Quick-mode option | The states the change touches; one grader | Everything that applies to those states, all gates. |
| Finalist (Step 3b) | Every state, size and theme | Everything, all gates. The weakest state's score is reported next to the populated one. |

## Who grades

Finalists: three fresh `ui-grader` instances, independently and in parallel. **The option's grade
is the median of the three totals**, and a floor breach counts when two of the three report it.
Heroes: one grader run per track, dispatched as soon as that track's last hero is captured.
Quick-mode options: one run over the set. Either way its total is the grade. Your own
score is shown next to it for the delta, but never gates delivery: self-grades run high. A spread
of 10 or more between graders means the rubric reads two ways for that option: read all three
reasons before reworking.

State each score with a one-line justification. A rubric filled in without reasons is decoration.

# The brief — what it is, in order

Twelve sections. The order is the point: the bar lands before the constraints, and the constraints
land before the artboard list. Cut a section only when the fact table proves it empty.

Slots marked **REQUIRED** are what a brief is missing when designs come back wrong.

---

## 1. What this is

One paragraph. What the product does, what this surface is inside it, what the surface's job is,
and what is one click away from it. Written for someone who has never seen the product.

## 2. The design bar

The first thing the tool weights. Four or five short paragraphs, each a named quality with a
concrete reading, not an adjective list. End with: the engineering detail below keeps the interface
correct and licenses nothing ugly.

Cover: what to subtract · what motion has to carry · restraint (surfaces, one accent) · density for
how long people sit with it · and how self-evident the controls must be.

**REQUIRED: who actually uses this.** Non-expert audiences cannot decode an icon-only control;
expert tools drown in labels. Name the audience and let it decide. "No instructional copy" and
"assume expertise" are different instructions — say which one you mean.

## 3. Scope

Bulleted: design this, also design that, out of scope. Then the fixed constraints — the dimensions,
anchors or containers that cannot move. Name any element that repeats elsewhere, so the model that
comes back works in both places.

**REQUIRED: the screen widths.** Every width the surface must work at, the one it is judged at,
and what happens below the smallest. Take them from `GRADER-CONTEXT.md`'s Screens section when it
exists. Otherwise list Phone 390, Tablet 834, Laptop 1280, Desktop 1440, Wide 1920 and Ultra-wide
2560, and drop only the ones the product does not support. A brief with no widths gets designs at
one width; a brief that stops at 1440 gets layouts that stretch on a monitor.

**REQUIRED: what the extra width is for.** At 1920 and above, say what the space holds: a readable
measure for text (about 65 to 80 characters a line), more real information side by side, or a
deliberate margin. A form or table stretched edge to edge does not meet the brief. A surface of
fixed width (a side panel, a dialog) says so, and the widths apply to the page around it.

## 4. The starting point

Two shapes, depending on whether the thing exists.

**Redesigning or extending something that ships.** Describe the current composition in one
paragraph, in plain nouns, in reading order. Then the problems, numbered, one bold lead each. A
problem states what goes wrong and for whom. It does not prescribe the fix — a brief saying "use
tabs" gets tabs, and nothing better.

**A feature with no UI yet.** There is no current composition, so this section carries the job to
be done instead: what someone is trying to accomplish, what they have in hand when they arrive,
what counts as finished, and how often they do it. Then the surfaces it has to sit beside, since a
new screen inherits its neighbours' conventions whether or not anyone decided that. Replace the
problem list with the failure modes you expect — the states this will be in most of the time, and
the one that will be most common on day one, which for anything new is empty.

## 5. The data

**REQUIRED, and the one most often skipped.** Paste the verbatim field list for one row, card or
item. Then:

**REQUIRED: what the surface does NOT have**, and where that data lives instead. Step counts, error
text, cost, display names, per-status counts, grouped filters — name the absent ones explicitly.

**REQUIRED: the refresh behaviour.** Whether anything updates on its own, and what triggers a
refetch.

**REQUIRED: every closed set, verbatim.** Statuses, reason codes, types, as the producer defines
them, each with its meaning in the user's words. The designer will name states; this is the list
they may name. A state outside it is labelled **needs API**.

Close with: anything needing data beyond this is allowed, but label it **needs API** and name the
field, so the cost is visible at decision time. Its sibling label, for build cost rather than data
cost, lives in §7.

## 6. What the actions mean

For every control on the surface, what it DOES, in the user's terms. Not the icon name.

**REQUIRED: the states that persist.** A control whose active state must survive with nothing
hovered forbids a pure hover-reveal treatment, and the designer will reach for hover-reveal unless
told.

Call out any metaphor that is already wrong. A designer who does not know it is wrong will preserve
it.

## 7. Constraints

Blocked controls and **REQUIRED: every reason one can be blocked**, since none are guessable.
Keyboard and touch parity. Live or updating rows. Empty, error and loading as distinct states.
Paging or virtualisation. Both themes.

**REQUIRED: the build envelope** — what the surface can DRAW, as distinct from §5's what it can
KNOW. Three buckets, and the designer needs all three:

- **Free** — the design system already expresses it.
- **Costs a change** — reachable, but it edits the system rather than the screen. Name what it
  edits: a theme variant, a token, a shared component used on other screens.
- **Cannot** — the renderer or the framework forbids it, with the reason. Fixed dimensions,
  clipped overflow, a type scale that does not interpolate, a transition the stack cannot express.

Write it as information, never as a veto. The reason to ask for options at all is to get something
better than what we would build by default, and a brief reading "do only what is free" hands back
the current design with new spacing. So the second and third buckets stay open: label such an idea
**needs system change**, name what it changes, and let the recommendation weigh that against what
it buys. Same bargain as `needs API` in §5.

## 8. Tokens

A table: value name, one column per theme the product ships, and what each is for. Resolved
literals only — never `oklch()`, never a `var()` or an alias pointing at another alias.

No design system in this project? Say so plainly and let the design propose a palette. That
changes the brief's job, not its size: a designer inventing colour still needs the type, the
platform and the contrast floor stated.

**REQUIRED: which colours cannot carry text**, with the measured ratios. Then typefaces and
weights, the type scale in px, radii, shadows, and the icon set the design must stay inside.

## 9. Comparables

Real products solving this problem, each with the specific mechanism to study. Ask which ideas were
taken and from where. Where the project has a fixed palette and type, forbid taking theirs.

## 10. Artboards

**REQUIRED: interactive, reached by clicking.** Enumerate states as things the reviewer performs —
hover, focus, open it, bind it, undo it, trigger the error, toggle the theme. Static frames only
for what interaction cannot reach.

Every artboard at every width in §3.

**REQUIRED: what the sample data must span.** Sample data that dodges the problem hides it. If the
problem is dates, the data spans days and weeks. If it is overflow, something overflows. The rows
themselves come from a script over real data (discovery step 4c), with the seed's quirks replaced
by the product's defaults.

Close by asking for two or three structurally different directions, a one-sentence thesis for each,
and a recommendation in prose. Spacing variants of one layout are one direction. Give no example
thesis: the tool treats an example as the answer.

**When earlier rounds explored this surface** (`DECISIONS.md` lists them): name each tried
direction in one line, as already explored, and ask for new ground. When your human partner asked
to extend one of them, name that one as the base instead.

## 11. Motion

Durations for state changes and for reveals, easing, what must never animate, and
`prefers-reduced-motion` — under which state still has to read from colour, shape and position
alone.

**REQUIRED: the job of every animation.** Each one does one of four jobs, named beside it:
continuity (where something came from or went), feedback (a press, a success, a failure),
attention (look here, now), or data change (a value moved, a list reordered). An animation with no
job is cut; decoration is not a job. What people read or scan, such as text, tables and list rows
at rest, stays still.

**The budget.** Repeated actions (select a row, switch a tab, toggle) take 150ms or less, or
nothing. Press and hover 120 to 180ms, panels and popovers 200 to 300ms, a whole surface 300 to
400ms, nothing over 500ms except a one-time moment. Enter eases out, exit eases in and runs about
a fifth shorter. A project with its own motion tokens states those instead.

**One signature moment per bold direction:** the interaction someone would describe to a colleague
afterwards, such as a path that lights stage by stage as the mode changes. A direction with none is
a safe direction; label it so.

Require the motion to be built, not described: every prototype ships working transitions, with
hover and press on every control and enter, exit, expand and collapse for anything it reveals,
plus a reduced-motion version. A prototype whose surfaces pop in and out with no transition, or
motion only named in a caption, does not meet the brief.

## 12. Before you start

Ask me questions first; it is cheaper than a redesign. Then: design only, no framework code, no
implementation notes.

---

## Worked opening

One filled example, from a web app with an existing design system. A mobile, desktop or
palette-less project fills the same slots with different substance.

> Relay is a visual workflow builder. People wire steps into a graph and execute it; each
> execution is a "run". The run history panel is a floating sheet anchored top-right of the
> canvas, just under 400px wide, full canvas height. Its list view is what you are redesigning.
>
> **The design bar.** This is the bar. The engineering detail in sections 4 through 8 exists to
> keep the interface correct. None of it licenses something ugly.
>
> **Minimal by subtraction.** Every element earns its pixels or goes. The panel currently spends
> roughly a quarter of its height on chrome before a single run is visible.

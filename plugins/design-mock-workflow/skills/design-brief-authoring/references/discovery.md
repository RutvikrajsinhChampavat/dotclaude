# Discovery — filling the fact table

Work top to bottom. Each step states **what it must answer**; the commands under it are a worked
example for one stack, not the step itself. Translate them to whatever step 0 found.

Steps that come back empty are still useful — "this project has no design tokens" and "this
feature has no code yet" are both facts the brief needs.

## 0. What is this project, and does the thing exist yet?

Two answers before anything else.

**The stack**, because every later command depends on it. What renders the UI, where styling
values live, how data reaches the screen, what the component library is.

```bash
ls; cat package.json pubspec.yaml Cargo.toml go.mod *.csproj 2>/dev/null | head -40
rg -l "tailwind|styled-components|\.scss|createTheme|ThemeData|SwiftUI|@Composable" --max-depth 3
```

**Does the surface exist?** Three cases, and they change which steps apply:

| Case | Steps that apply |
|---|---|
| Redesigning a surface that ships | all of them |
| Extending a surface that ships | all of them; scope the problem list to the part being changed |
| A feature with no UI yet | 2, 3, 4b, 5, 6 — and step 4 becomes "what will the API give us", answered from the endpoint or the spec, or marked as undecided |

For something new there is no "what is there now", so the brief's §4 carries the job to be done
and the surrounding surfaces it has to sit beside instead.

**Conventions are per-project, not universal.** A design-references file, a tokens doc, a
component gallery, a design-system package — some projects have them, most don't. Look, and note
what is absent rather than assuming the shape of the last project you worked in.

```bash
fd -i -d 3 "design|tokens|style.?guide|storybook|REFERENCES" -e md -e mdx 2>/dev/null | head
```

## 1. The real surface

The file someone names is often a composer that positions children and renders no pixels. Find the
files that actually draw, and which one owns each visual problem.

*Example, React:*
```bash
rg -l "className|sx=|styled" <dir> | head
rg "^import .* from" <named-file>
```

Skip for a feature that does not exist yet.

## 2. Design values, every theme

**Read the value NAMES off the surface's own files first**, then resolve only those. Sibling
surfaces routinely use different families whose names read as synonyms — in one codebase
`text-200` and `content-200` are different greys, `text-success` and `run-success` different
greens. Carrying a value over from a neighbouring screen is a silent error.

*Example, Tailwind + CSS custom properties:*
```bash
rg -o -- "(text|bg|border|content|icon|alert)-[a-z0-9-]+" <surface-files> | sort -u
rg -l "@theme|:root|--color-|createTheme" --type css --type ts | head
```

Adapt the first pattern to the project's own naming. A styled-components theme object, a Sass map,
a Swift `Color` extension, a Compose `ColorScheme`, a Figma variable export — same job, different
grep.

Every theme the product ships, not just the default one. A brief carrying one theme guarantees a
second round.

**Resolve every value to a literal.** A `var(...)`, an `oklch(...)`, a semantic alias pointing at
another alias, or a colour you did not read from a file is a defect once it reaches the brief,
because the brief tells the designer to use those values verbatim.

Converting `oklch()` to hex, which most design tools will not do:

```bash
node -e '
const f=(L,C,H)=>{const h=H*Math.PI/180,a=C*Math.cos(h),b=C*Math.sin(h);
const l=(L+0.3963377774*a+0.2158037573*b)**3,m=(L-0.1055613458*a-0.0638541728*b)**3,s=(L-0.0894841775*a-1.2914855480*b)**3;
const c=[4.0767416621*l-3.3077115913*m+0.2309699292*s,-1.2684380046*l+2.6097574011*m-0.3413193965*s,-0.0041960863*l-0.7034186147*m+1.7076147010*s];
return "#"+c.map(x=>{x=x<=0.0031308?12.92*x:1.055*Math.pow(Math.max(x,0),1/2.4)-0.055;
return Math.round(Math.min(1,Math.max(0,x))*255).toString(16).padStart(2,"0")}).join("")};
console.log(f(0.552,0.1766,142.5))'
```

Produce: a hex table, one row per value per theme, **each row carrying the `file:line` it came
from**. Provenance is per-row, not per-table — one "checked the stylesheet" tick lets half a
palette be wrong while looking verified.

No tokens at all? That is the finding. Say the project has no palette and the design may propose
one, which makes the brief's job different but not smaller.

## 3. Which colours cannot carry text

Measure every status and accent colour against the surface it sits on. Under 4.5:1 it is a mark,
stripe, fill or tint and never a label — say so in the brief, or a designer handed a palette will
set text in it.

Check the project's notes or your own memory first: a value that failed once is often recorded.

## 4. The data ceiling

The highest-value step and the easiest to skip. Find what reaches the screen, then write down what
the surface **cannot** show.

*Example, TypeScript + RTK Query:*
```bash
rg -n "interface .*Response|type .*Response" <types-file>
rg -n -A20 "<endpointName>:" <api-slice>
rg -n "pollingInterval|invalidatesTags" <api-slice> <hooks-dir>
```

Equivalents elsewhere: a REST handler's serializer, a GraphQL schema type, a gRPC message, a
Swift `Codable`, a SQL view. For a feature not built yet, the answer comes from the endpoint that
will serve it, or the spec — and if neither exists, the honest answer is "undecided", which the
brief states plainly so the designer knows the shape is still open.

Answer explicitly:
- Every field one row, card or item carries.
- Every field it does NOT have, and where that data lives instead — another call, or nowhere.
- Does it refresh on its own, and what triggers a refetch? Nothing that polls does not tick,
  however much a live row would flatter the design.
- Can a filter take more than one value? Are there per-status counts? Grouped filters and count
  badges are the two things designers reach for that an API usually cannot serve.

## 4b. What the build can actually render

Step 4 says what the surface can KNOW. This says what it can DRAW. They fail differently: a
missing field makes a design impossible, a rigid renderer makes it expensive, and a brief
conflating them either blocks good ideas or waves through unbuildable ones.

Sort each capability into three buckets and carry them into the brief:

- **Free** — the design system already expresses it.
- **Costs a change** — reachable, but it edits the system rather than the screen. Name what it
  edits.
- **Cannot** — the renderer, the framework or the platform forbids it. Name why.

**The renderer.** Is the surface drawn by something with its own layout rules — a graph library, a
virtualised list, a canvas, an editor, a native view system? Those carry constraints plain DOM or
plain views do not: fixed dimensions, clipped overflow, no auto-height, no z-order you choose.

**The component layer.** Which variants does the theme actually define? A variant it does NOT
define falls back to the library's stock appearance, which is how an off-brand control ships
looking deliberate — and a designer cannot see it coming.

**The type system.** If text sizes come from a fixed set of wrappers or named styles rather than
free values, list them and say they do not interpolate: a design calling for 13px is unbuildable
where the scale steps 12 to 14. Note any layout property those wrappers silently ignore.

**Blast radius.** Is the thing being redesigned used anywhere else? A row shared by two mounts
changes both; a themed primitive changes the product. Not a veto — the difference between a
contained change and a system change, which the designer should know they are proposing.

**Motion.** What the animation layer can and cannot tween, and whether reduced-motion is handled
globally or per component.

*Example greps, JS ecosystem:*
```bash
rg -n "reactflow|@xyflow|react-window|virtuoso|monaco|slate|pixi|three" package.json
rg -n "styleOverrides|variants:|filled[A-Z]|outlined[A-Z]" <theme-dir>
rg -ln "<ComponentName" src/
```

## 5. Type and iconography

Name the families, weights and sizes the product actually ships, and the icon set the design must
stay inside.

*Example, Next.js:*
```bash
rg -n "next/font|localFont|font-family|fontFamily|@font-face" <app-dir> | head
```

If icons are a subsetted font or a curated set, say so and name the budget — a glyph outside it
either pulls a huge fallback, renders as a box, or has to be drawn.

## 6. Comparables

Does this project keep a design-references file — distilled, source-cited patterns from products
solving the same problem? Some do; most do not. Step 0 will have found it.

**If it exists:** take entries marked verified. An inferred entry enters the brief labelled as
inferred, or not at all. Treat any claim it makes about your own product as stale until checked —
a note saying a field does not exist outlives the commit that added it.

**If it does not:** research fresh with a subagent, and tell that agent to flag what it could not
verify rather than filling gaps. A confident guess is worse than a stated gap. Then offer to start
such a file, rather than creating one uninvited in someone's repo.

Either way, each comparable in the brief needs the specific mechanism to study, not a product
name. "Study Linear" gives nothing.

**Write new findings back** where the project keeps them, before writing the brief — otherwise the
next brief pays for the same research. If nothing blocks it, do it; if something does, say so in
the handoff rather than dropping it silently.

## 7. States that exist

Empty, first-run empty, filtered-to-nothing, error, loading, partial, and every blocked or
disabled control. Blocked controls need their REASONS — unguessable from outside, and the designer
has to put them somewhere.

*Example, React:*
```bash
rg -n "isLoading|isError|length === 0|skeleton|EmptyState|Suspense" <dir>
```

For a feature not built yet, this is a design question rather than a discovery one: list the states
it will have and let the brief ask for them.

## 8. Before any of it — is the tree current?

Every step above reads a worktree to say what the product does NOW. A branch behind its remote
answers for code that shipped weeks ago. Fetch the repos the brief touches and compare before
reading, and say in the handoff if you proceeded on a diverged tree and why.

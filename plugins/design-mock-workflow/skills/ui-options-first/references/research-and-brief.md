# Research, project brief and taste log

Loaded at Step 0 of `ui-options-first`.

## Step 0: Consult the design references file

Before drawing anything, read the project's `design-mocks/REFERENCES.md`. It holds distilled,
source-cited patterns from products solving the same problem, plus current product-UI trends
for the relevant domain.

**If the file doesn't exist, create it now.** Don't stop or ask; a missing file is the normal
first run. Research the domain with a subagent and write the findings in this shape:

```markdown
# Design references: <product / domain>
Last refreshed: <YYYY-MM-DD>

## <Problem area, e.g. "Run history list">
- **<Product>: <pattern>** (verified, <source URL>). Technique: <API / threshold / data structure>.
- **<Product>: <pattern>** (inferred). Technique: <best guess, say what would confirm it>.

## Differentiators
- [NEW] <idea>. Closest competitor feature: <name>. Why we can build it: <infra we run>.
  Why it matters more here: <reason>.
```

Add one section per problem area as tasks touch new surfaces; never rewrite sections you
didn't research this time.

**If web research is unavailable** (no search or fetch tool, or offline), say so in one line,
write entries from what you know tagged `inferred` with no URL, and continue. Don't block the
mock on research, and don't present inferred entries as verified.

- Every entry is marked **verified** (with source URL) or **inferred**. Never anchor a design
  decision on an inferred entry without saying so out loud.
- Refresh when stale (roughly quarterly, or when the domain shifts). Don't re-research from
  scratch every task. That is what the file is for.
- Research it with a subagent, and tell that agent to flag what it could NOT verify rather
  than inferring. A confident guess is worse than a gap in a durable file.
- Capture the **implementation technique, not just the appearance**: the API, the threshold,
  the measured number, the data structure. "A render guard fires above ~0.3MB", "that toolbar
  component is screen-fixed by contract", "collapse depth takes an integer, not a boolean".
  Anyone can copy a look from a screenshot; only the mechanism tells you what it costs to ship
  and where it breaks.
- Carry a **Differentiators** section: what you could do that NONE of the researched products
  do. Each entry names the closest competitor feature, so "nobody does this" stays checkable;
  says why this team specifically can build it (infrastructure it already runs); and says why it
  matters more in this domain than in theirs. Tag these `[NEW]`. They are proposals, not
  findings, and never get mixed in with sourced entries. Copying the field's conventions buys
  parity; this section is the only part that buys an edge.

### The project brief: `design-mocks/GRADER-CONTEXT.md`

This file is how the workflow remembers the project between rounds. It stops every round, and
every grader run, from re-deriving what the product is and what the house rules are. Read it
before sketching; the `ui-grader` agent reads it before every grade.

**Missing? Write it now**, from the project's CLAUDE.md / README, design-system docs, token
files and the shared typography and button components. Don't ask; a missing file is the normal
first run. Keep it to one page, in this shape:

```markdown
# Grader context: <product> (<repo>)

## Product
<two sentences: what it is, what people do with it>

## Users
- **<role>**: <how often they visit, what they need at a glance, how technical they are>
(two to four roles; grade against the one who lands on the surface)

## Design system and house rules
- <stack, component library, token names, typography components>
- <rules that make an option wrong here: label case, tooltip policy, known contrast failures,
  layout shells and their widths, one-primary-action rule, banned patterns>

## Quality bar
<the two or three products this one should feel like, and why>
```

**Keep it current: this is the remembering part.** Update the file, in the same turn, when:
- the user rejects or corrects a design choice for a reason that will recur ("no tooltips on
  chevrons", "settings options must fit the 640px pane"), add it as a house rule;
- the user picks an option for a stated reason, add the reason to the quality bar if it
  generalises;
- the grader reports a context gap (see Step 5), add the missing fact;
- you discover a constraint the hard way (a token that fails contrast, a shell width), add it.

One line per rule, no dates or ticket numbers, no incident stories. Delete a rule the user
reverses. If a rule only applies to one surface, put it in that round's sketch-grades notes,
not here. Commit the file with the project's other design notes if the repo tracks
`design-mocks/`; otherwise it lives locally.

### The taste log: `design-mocks/DECISIONS.md`

One line per round, appended at Step 6 when the user picks:

```markdown
- <date> · <surface> · picked <option id> (<Simple|Creative>) · "<user's reason, their words>" · runners-up: <ids>
```

Read it at Step 0, before sketching. Look for patterns across rounds, not single entries:
which track wins on which kind of surface (settings, dashboards, editors), which reasons recur
("too busy", "loved the motion"), which benchmark products the user responds to. Use them to
decide where to sketch extra directions and what the Creative track should push. Never use the
log to drop a track: the 3 + 3 minimum still holds. A recurring reason that is really a rule
("never use modals for single fields") moves to `GRADER-CONTEXT.md` as a house rule.


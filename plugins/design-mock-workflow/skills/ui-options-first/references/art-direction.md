# Art direction

Loaded at Step 1b of `ui-options-first`, and again at Step 4b and Step 5. This is the step that
decides how the surface LOOKS, before any sketch. Every later step checks against what it writes,
so it writes numbers and file names, never adjectives.

Output: `design-mocks/<surface>-art-direction.md` with three parts: the board, the measured spec,
and one art direction per option. **Budget: the whole file ≤1,500 words** (spec table ≤8 rows,
each option's block ≤10 lines). Builders read all of it before writing code, so every extra
word costs time twice.

## 0. Reuse first

- `design-mocks/refs/<surface>/BOARD.md` exists → reuse the board and the spec; skip to §3. Add
  an image only for a gap the new round actually has.
- A board exists for a surface doing the same job (another list, monitor or settings pane) →
  reuse its benchmark and finish images, capture only the "Ours" shots for this surface.
- Before capturing anything new, read `design-mocks/refs/SOURCES.md`: one line per URL tried,
  `clean` or `blocked (<why>: cookie wall, tour, sign-in, video)`. Append every attempt you make.

## 1. Build the reference board

Folder: `design-mocks/refs/<surface>/`. It follows the repo's ignore rule for `design-mocks/`;
screenshots of other products are working references, never committed or shared.

Collect 6–10 images:

| Kind | How many | What it is |
|---|---|---|
| Benchmark | 3–5 | The equivalent screen in products named in `REFERENCES.md` and the quality bar: the same job (a run list, a sync monitor, a settings pane), product UI, not a marketing hero |
| Finish | 1–2 | A screen whose craft (type, depth, small details) is the bar, even from another domain |
| Ours | 1–2 | The product's best existing screen (what the design system really looks like at its best) and the current version of this surface, if one exists |

Sources, best first: screenshots the user drops in (real apps, signed in) → public docs, help and
changelog pages that show the product UI → public demo apps → marketing pages (only for type and
surface finish).

Capture public pages with the bundled script (headless, like every capture):

```bash
node <skill>/scripts/capture.mjs refs --list design-mocks/refs/<surface>/refs.txt --out design-mocks/refs/<surface> 
# refs.txt: one "<name> <url> [WxH]" per line; name files by what they show: vercel-deployments-list
```

Read every captured image. Drop any that landed on a sign-in wall, a cookie banner or a video
frame, and re-capture or replace it. Then write `refs/<surface>/BOARD.md`: one line per image with
the file, its source URL, and the ONE specific thing to take from it ("row anatomy: status dot,
title, muted meta, right-aligned time").

No capture tool and no user screenshots → ask the user for 3+ screenshots. Never continue on text
descriptions of a product's look: the board exists because words produce the average look.

## 2. Extract the measured spec

Read each benchmark image. Measure three values in pixels (title size, row height, accent count);
estimate the rest by eye. Every value is tagged `measured` or `estimated from <file>`; nothing
here is a guess without a file.

| Property | <ref A> | <ref B> | <ref C> | Ours today | Target |
|---|---|---|---|---|---|
| Title size / weight · title : body ratio | | | | | |
| Label and body / data sizes · distinct sizes on screen | | | | | |
| Row height · section gap · side padding at 1440 | | | | | |
| Rows visible above the fold at 1440 × 900 | | | | | |
| Surface : text : accent (rough %) · accent elements per view | | | | | |
| Depth recipe (borders, shadows, surface steps, radius) | | | | | |
| First thing the eye lands on, and what isolates it | | | | | |
| 2–3 finish details (tabular figures, a status dot, muted separators, a hover reveal) | | | | | |

"Ours today" comes from `PLATFORM-KIT.md`: the product's live pages and its usage census. Where the
product already defines a value (page shell, surface recipe, radius, type role, colour role, row
height), **Target is the product's value**, and the references only inform what the product
leaves open: composition, hierarchy, density, finish. Elsewhere "Target" must be reachable with
the project's own design system: take the nearest real token or typography component to the
reference value. Where the nearest one is far
off, write the gap under a `Ceilings` heading in the same file. Record it and move on; it does not
change the design system.

## 3. Write one art direction per option

At Step 2, each sketched direction gets this block before it is scored. Every value names a token
or typography component the product already uses for that role (per the kit's census) and the
reference file it came from. A token in a role the product never gives it (a status colour as a
fill, a border token as a background) counts as a new colour.

Write the board and spec first, then append each option's block (with its sketch and score) the
moment it is done, so that option's builder can start while you write the next. Never hold all
six for one final write.

```markdown
### <option id>: <name> (<Simple|Creative>)
- Type voice: <role → component, size/weight>, title:body <ratio> (ref <file>: <ratio>)
- Composition: <grid, alignment axis>; focal point <element>, isolated by <space | size | contrast>; left empty on purpose: <what>
- Colour: surface/text/accent ≈ <%>; accent only on <elements>, ≤ <n> per view; status as <dot | text>, never a fill
- Surfaces: <surface tokens per layer>; shadow <recipe>; radius <outer>/<inner>
- Rhythm: row <px>, section gap <px>, side padding <px at 1440> / <px at 390>
- Motion signature: <the one movement that characterises it>
- Bold move: <one deliberate decision a stock admin page would not make>
- Borrowed from: <ref file> → <the exact thing taken>
```

The bold move is where the look comes from: an oversized key figure, an asymmetric split, a single
hero element with everything else quiet, strong typographic contrast, the data itself as the
graphic. A Simple option's bold move can be finish rather than structure (a type rhythm tighter
than the references), but it still names one. A bold move rearranges the product's own parts; it
never swaps them for a reference product's look. If someone who uses this product every day would
read the screen as a different app, the move went too far.

Two options with the same art direction are one option, even when their layouts differ.

## 4. How later steps use it

- **Step 2**: each sketch carries its art direction block; the sketch grade does not score looks.
- **Step 3**: the build follows the block. Any deviation is written into the block with a reason.
- **Step 4b**: every critique round puts the option's screenshot beside its `Borrowed from` file
  and a live platform page (`refs/platform/`) at the same width, and names the gaps as deltas
  against the spec table.
- **Step 5**: the graders get the board folder, the platform pages and this file, and grade
  Aesthetic quality side by side against them.

# design-mock-workflow

A Claude Code plugin for UI changes. Claude shows you distinct, interactive design options
before it edits any UI code. Each option is built on your real components and real data, and
graded /100 against a fixed rubric. You pick one, and Claude implements that.

## What's inside

| Skill | Fires when |
|---|---|
| `ui-options-first` | Any visual change: colour, layout, component, icon, spacing, animation. Holds the 7-step flow, the rubric, fidelity tiers, runnable checks and fixture rules. |
| `design-brief-authoring` | The options will come from a tool with no codebase access (Claude Design, a design agent, a contractor). Writes a verified, design-first brief. |

## The flow in one screen

0. Read `design-mocks/REFERENCES.md`, the project's sourced notes on how comparable products solve this. On first run Claude researches the domain and creates it; without web access it writes entries marked `inferred`.
1. Generate directions (with `ui-ux-pro-max` and `interface-kit` if installed).
2. Paper-sketch each direction, grade it /100, and cut anything under 90 **before** building.
3. Build at the highest fidelity available: a throwaway route on the real component library, then real compiled CSS, then static HTML on real tokens. Feed it captured, redacted real data.
4. Put runnable checks in the mock: contrast in both themes, icon subset, geometry, paint, visibility.
5. Re-grade the built options, ship the grading panel inside the mock, and recommend one.
6. Wait for the pick.
7. Implement it with tokens and your normal gates, then delete the mock.

**Rubric:** UX clarity 25 · Visual craft 20 · Density 15 · Accessibility 15 · Domain fit 15 ·
Implementation cost 10. Threshold 90. Any dimension under 60% of its weight fails the option
outright.

## Install

From the public marketplace, in Claude Code:

```
/plugin marketplace add RutvikrajsinhChampavat/dotclaude
/plugin install design-mock-workflow@dotclaude
```

Without plugins, copy `skills/ui-options-first/` (and `skills/design-brief-authoring/` if you
want it) into `~/.claude/skills/`.

Once installed, the skills are listed as `design-mock-workflow:ui-options-first` and
`design-mock-workflow:design-brief-authoring`.

### Recommended companions (third-party, installed separately)

- **ui-ux-pro-max** (MIT): `github.com/nextlevelbuilder/ui-ux-pro-max-skill`. Option generation and asset submodules.
- **interface-kit**: `github.com/JuliusBrussee/skills` (`skills/interface-kit`). Implementation standard for type, motion, a11y and radii.

Without them the workflow still runs on its own rubric and checks. Claude says so once and carries on.

## Make the gate strict (optional)

The skill fires on UI work through its description. To make Claude treat it as a hard rule,
paste this into your project or user `CLAUDE.md`:

```markdown
# UI changes: options first (MUST)
For ANY visual/UI change, do not edit app code first. Invoke the
`design-mock-workflow:ui-options-first` skill:
show genuinely distinct, interactive options built on real components and real data, grade
each /100 (threshold 90, per-dimension floors), recommend one, and WAIT for my pick. Then
implement with design tokens and delete the mock.
```

## Files it creates in your repo

- `design-mocks/REFERENCES.md`: research notes, reused across tasks. Commit it so teammates share it.
- `design-mocks/fixtures/<surface>.json`: redacted captured responses. Git-ignored.
- `design-mocks/*.html` mock pages and throwaway routes, deleted after the pick. Git-ignored.

Suggested `.gitignore` lines (the skill checks the fixtures entry before it writes one):

```
design-mocks/fixtures/
design-mocks/*.html
```

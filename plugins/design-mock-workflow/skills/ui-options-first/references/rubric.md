# The rubric

Loaded at Step 2 (pre-build grades) and Step 5 (re-grade) of `ui-options-first`. The `ui-grader` agent carries its own copy; change one, change both.

## The rubric: 100 points, threshold 90

| Dimension | Weight | What earns it |
|---|---|---|
| **UX clarity** | 20 | A non-technical user understands it with no tooltip. Primary action obvious. Progressive disclosure in the right order: summary before payload, never a raw dump. Low task-test step count. Copy names actions and explains errors. |
| **Hierarchy fit** | 15 | Prominence matches the Step 2b map: one primary per view, frequent and valuable sections nearest the entry point, rare ones disclosed, urgent states promoted while live. Motion budget follows tier. Every state (empty, first-run, error, overflow) keeps a sane ranking. |
| **Visual craft** | 20 | Layered elevation over borders. 4px spacing rhythm. Concentric radii. Type hierarchy carrying meaning. Restrained colour: status as accent, never fill. Monospace only for data. Step 4 craft checks pass. Creative options land their signature moment. |
| **Density** | 10 | Compact without crowding. Costs little at rest. No dead space, no cramming. |
| **Accessibility** | 15 | Measured contrast ≥4.5:1 in both themes. Keyboard reachable. Adequate hit targets. Reduced motion honoured. Never colour alone to convey state. |
| **Domain fit** | 10 | Behaves correctly in its real container: under zoom/pan for a canvas, resize for a panel, long content for a list. No occlusion, no reflow of neighbours. |
| **Implementation cost** | 10 | Reuses existing components. Few new surfaces. Performs on realistic data volume. |

**Hard floor: any dimension below 60% of its weight fails the option outright, regardless of
total.** A beautiful option with failing contrast doesn't pass on points. Weighted totals
otherwise hide exactly the failures that matter most.

The `ui-grader` agent carries its own copy of this rubric (`agents/ui-grader.md`). Change one, change both.

State each score with a one-line justification. A rubric without reasons is decoration.

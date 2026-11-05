---
description: Start the options-first mock workflow for a UI change
argument-hint: <the screen or component to change, and what should change>
---

Run the options-first UI workflow for this change: $ARGUMENTS

Invoke the `design-mock-workflow:ui-options-first` skill now and follow it from step 0. Do not
edit app code before I pick an option.

If the arguments are empty, ask me which screen or component to change and what should change,
then start.

If the options will come from a tool with no codebase access (Claude Design, a design agent, a
contractor), invoke `design-mock-workflow:design-brief-authoring` instead.

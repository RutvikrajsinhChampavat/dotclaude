# Implementation handoff and fidelity check

Loaded at Step 7 of `ui-options-first`. The user picked a mock. This file makes sure they get
that mock, not an approximation of it.

## 1. Extract the spec from the chosen mock

Before writing app code, write `design-mocks/<surface>-spec.md` from the mock's code and
computed styles, not from memory:

- **Structure:** the component tree, mapped to real components (existing ones named; new ones
  marked NEW with a one-line reason).
- **Tokens:** every colour, spacing, radius, shadow and type style as the token or typography
  component the implementation will use. Any value with no token is a finding: add a token or
  change the value; never ship a raw hex or px to match the mock.
- **States:** each designed state (loading, each empty kind, each error kind, overflow,
  first-run) with what renders and which data condition triggers it.
- **Motion:** every transition: trigger, property, duration, easing, reduced-motion fallback.
- **Copy:** every string from the Step 4b microcopy pass, verbatim.
- **Interactions:** keyboard map, focus order, the interaction-pattern decisions from Step 4b.

The spec is the build checklist. Anything the implementation can't honour (an API field that
doesn't exist yet, a component that can't take a prop) goes back to the user before building
around it.

## 2. Build to the spec

Normal engineering gates apply in full: tokens only, tests, lint, types. The mock exemption
ends at the mock.

## 3. Fidelity check

When the implementation runs:

1. Screenshot the real build in the same states, themes and viewport as the mock's populated
   and weakest states (same screenshot rules as the Step 4b craft pass).
2. Compare each pair against the mock and the spec. List every difference: spacing, alignment,
   type, colour, missing state, motion timing, copy.
3. Re-run the mock's runnable checks (contrast, craft, motion) against the real page where they
   apply.
4. Fix each difference, or record it as an accepted deviation with the reason and the user's
   OK. A deviation the user didn't approve is a bug.

Report the result as a table: state · theme · differences found · fixed / accepted. Delete the
mock route and its fixtures only after this passes.

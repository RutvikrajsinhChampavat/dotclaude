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
- **Motion:** every transition in the mock, the basic ones (hover, press, enter, exit, expand,
  collapse) as well as the signature moment: trigger, element, property, duration, easing,
  reduced-motion fallback. Read them from the mock's code (motion props, CSS transitions); a
  screenshot can't show motion.
- **Copy:** every string from the Step 4b microcopy pass, verbatim.
- **Interactions:** keyboard map, focus order, the interaction-pattern decisions from Step 4b.

The spec is the build checklist. Anything the implementation can't honour (an API field that
doesn't exist yet, a component that can't take a prop) goes back to the user before building
around it.

## 2. Build to the spec

Normal engineering gates apply in full: tokens only, tests, lint, types. The mock exemption
ends at the mock.

Transitions are part of the build, not polish for later: implement every Motion row with the
project's own motion library and tokens, its reduced-motion fallback included.

## 3. Fidelity check

When the implementation runs:

1. Screenshot the real build in the same states, themes and screen sizes as the mock's
   populated and weakest states. The real page has no `window.__mock`, so capture it with
   `scripts/capture.mjs refs` (one line per state URL and size) through the same headless capture as
   Step 4b, which reuses the user's sign-in.
2. Compare each pair against the mock and the spec. List every difference: spacing, alignment,
   type, colour, missing state, motion timing, copy.
3. Re-run the mock's runnable checks (contrast, craft, motion) against the real page where they
   apply.
4. Check motion separately, because screenshots can't show it. For each Motion row, confirm the
   real element carries the same transition (its computed `transition-duration` or
   `animation-name`, or the motion props in code) and stops moving under emulated
   `prefers-reduced-motion: reduce`. A missing or slower transition is a difference like any
   other. Then give the user the URL and the steps that trigger each transition: motion is
   confirmed by watching it, never claimed from a still.
5. Fix each difference, or record it as an accepted deviation with the reason and the user's
   OK. A deviation the user didn't approve is a bug.

Report the result as a table: state · theme · differences found · fixed / accepted, plus one row
per Motion entry (wired, reduced-motion fallback, confirmed by the user). Delete the mock route
and its fixtures only after this passes.

---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---
# TypeScript/JavaScript Testing

> This file extends [common/testing.md](../common/testing.md) with TypeScript/JavaScript specific content.

## E2E Testing

Use **Playwright** as the E2E testing framework for critical user flows.

## Agent Support

- **e2e-runner** - Playwright E2E testing specialist

---
## Testing overrides — MERN stack

- Vitest + React Testing Library for frontend components and hooks
- Jest + Supertest for Express API route integration tests
- Tests co-located: `[file].test.ts` / `[file].test.tsx` next to source
- AAA pattern: Arrange → Act → Assert
- Test behaviour, not implementation details
- Mock only at external boundaries (HTTP calls, DB, browser APIs)
- 80%+ coverage required; 100% for auth and payment logic
- Never mock the DB in integration tests — use real DB + transaction rollback

## Vitest Gotchas

- **`vi.mock` hoisting:** Vitest hoists `vi.mock()` calls to the top of the file — they cannot be placed inside `describe` blocks or shared across test files. Extract only data fixtures to shared helpers, not `vi.mock` calls themselves.
- **Flat mock completeness:** Flat mocks (no `importOriginal`) throw "No X export is defined on the mock" if the component calls any hook not present in the mock — always include every exported hook the module provides.

## RTK Query Testing

- **Hook mock typing:** Partial mock objects for RTK Query hooks require `as unknown as ReturnType<typeof useXxxQuery>` — the full hook return type requires `refetch` which plain objects don't satisfy.

## Test Verification

- Before claiming tests pass, run the actual test command and read the full output
- If the user reports failing tests, do not contradict them — re-run and inspect
- After multi-file changes, run lint AND tests before declaring done

# Testing Requirements

## Minimum Test Coverage: 80%

Test Types (ALL required):
1. **Unit Tests** - Individual functions, utilities, components
2. **Integration Tests** - API endpoints, database operations
3. **E2E Tests** - Critical user flows (framework chosen per language)

## Test-Driven Development

MANDATORY workflow:
1. Write test first (RED)
2. Run test - it should FAIL
3. Write minimal implementation (GREEN)
4. Run test - it should PASS
5. Refactor (IMPROVE)
6. Verify coverage (80%+)

## Edge-case derivation (how to make tests FIND bugs)

Red-first means the code doesn't exist yet, so there are no branches to aim at. Derive edge cases
from the CONTRACT and the INPUT DOMAIN, not from the implementation. Walk every axis that applies:

| Axis | Cases to write |
|---|---|
| Cardinality | 0, 1, 2, many, max, max±1 |
| Emptiness | missing key vs `null`/`None` vs `""`/`[]`/`{}` — three distinct tests, not one |
| Size | empty, one, huge (pagination limit +1), string longer than the column |
| Shape | malformed payload, extra unknown field, wrong type, nested null |
| Equivalence classes | one test per class, not ten inside one class |
| Lifecycle / re-entry | stale state, double-submit, re-entry mid-flight, unmount or cancel mid-request |
| Ordering & races | out-of-order responses, concurrent writers, last-write-wins, retry after partial success |
| Dependency failure | throws, times out, returns a partial or empty response, returns a 4xx/5xx |
| Boundaries of authority | other tenant's id, missing claim, read-allowed-but-write-denied, disabled/soft-deleted row |
| Idempotency | run it twice — same result, no duplicate row, no double side effect |

Then one adversarial pass with no table: **"how would I break this in prod?"** Write whatever that
surfaces. The enumerated list is the floor, not the ceiling.

**Second pass, after the suite is green:** read the coverage report. Every uncovered branch is an
edge case nobody wrote. Add it red-first like any other. Coverage % is a smoke detector — 80% with
only happy paths is a worse suite than 60% that hunts.

**Input-domain boundaries on parse / validate / serialize code** → use the `property-based-testing`
skill instead of hand-picking values; generators find the boundary you didn't think of.

**Every edge test must be mutation-proofed** the same as any other — see "Prove a new test can
fail" in `~/.claude/CLAUDE.md`. An edge test that stays green when you break the edge asserts
nothing.

## Troubleshooting Test Failures

1. Use **tdd-guide** agent
2. Check test isolation
3. Verify mocks are correct
4. Fix implementation, not tests (unless tests are wrong)

## Agent Support

- **tdd-guide** - Use PROACTIVELY for new features, enforces write-tests-first

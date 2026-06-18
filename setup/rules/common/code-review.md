# Code Review Standards

## Purpose

Code review ensures quality, security, and maintainability before code is merged. This rule defines when and how to conduct code reviews.

## When to Review

**MANDATORY review triggers:**

- After writing or modifying code
- Before any commit to shared branches
- When security-sensitive code is changed (auth, payments, user data)
- When architectural changes are made
- Before merging pull requests

**Pre-Review Requirements:**

Before requesting review, ensure:

- All automated checks (CI/CD) are passing
- Merge conflicts are resolved
- Branch is up to date with target branch

## Review Checklist

Before marking code complete:

- [ ] Code is readable and well-named
- [ ] Functions are focused (<50 lines)
- [ ] Files are cohesive (<800 lines)
- [ ] No deep nesting (>4 levels)
- [ ] Errors are handled explicitly
- [ ] No hardcoded secrets or credentials
- [ ] No console.log or debug statements
- [ ] No duplication of existing shared code — grepped the repo before adding any new util/type/constant (DRY)
- [ ] Design principles upheld (DRY / KISS / SRP / SoC)
- [ ] Performance assessed at scale (no N+1, O(n²) on unbounded input, await-in-loop, render-path work, or uncleaned leaks)
- [ ] Tests exist for new functionality
- [ ] Test coverage meets 80% minimum

## Security Review Triggers

**STOP and use security-reviewer agent when:**

- Authentication or authorization code
- User input handling
- Database queries
- File system operations
- External API calls
- Cryptographic operations
- Payment or financial code

## Review Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| CRITICAL | Security vulnerability or data loss risk | **BLOCK** - Must fix before merge |
| HIGH | Bug or significant quality issue | **WARN** - Should fix before merge |
| MEDIUM | Maintainability concern | **INFO** - Consider fixing |
| LOW | Style or minor suggestion | **NOTE** - Optional |

## Agent Usage

Use these agents for code review:

| Agent | Purpose |
|-------|---------|
| **code-reviewer** | General code quality, patterns, best practices |
| **security-reviewer** | Security vulnerabilities, OWASP Top 10 |
| **typescript-reviewer** | TypeScript/JavaScript specific issues |
| **python-reviewer** | Python specific issues |
| **go-reviewer** | Go specific issues |
| **rust-reviewer** | Rust specific issues |

## Review Workflow

```
1. Run git diff to understand changes
2. Check security checklist first
3. Review code quality checklist
4. For each new function / util / hook / type / constant in the diff,
   grep the repo for an existing equivalent before accepting it (DRY)
5. Review the design-principle checklist (DRY / KISS / SRP / SoC)
6. Assess performance of the change (hot path + input size at scale)
7. Run relevant tests
8. Verify coverage >= 80%
9. Use appropriate agent for detailed review
```

## Common Issues to Catch

### Security

- Hardcoded credentials (API keys, passwords, tokens)
- SQL injection (string concatenation in queries)
- XSS vulnerabilities (unescaped user input)
- Path traversal (unsanitized file paths)
- CSRF protection missing
- Authentication bypasses

### Code Quality

- Large functions (>50 lines) - split into smaller
- Large files (>800 lines) - extract modules
- Deep nesting (>4 levels) - use early returns
- Missing error handling - handle explicitly
- Mutation patterns - prefer immutable operations
- Missing tests - add test coverage

### Design Principles (DRY, KISS, SRP, SoC)

Static diff-reading misses these because the code reads as well-formed.
Check them explicitly — most need repo-wide context the diff alone lacks:

- **DRY (operational, not aspirational):** before accepting ANY new
  function, util, hook, type, or constant, grep the repo for an existing
  equivalent (search `utils/`, `types/`, `constants/`, shared libs). A new
  helper that re-implements an existing shared one is a violation — flag it
  and point to the canonical version. Bare diff-reading cannot see this; it
  requires a search.
- **Reuse-first:** prefer the existing shared util over a local
  re-implementation even when the copy "works." Duplicates drift and diverge
  silently — e.g. a hand-rolled date/number formatter using an ambient
  (`undefined`) locale while the shared one pins `en-US`, giving
  environment-dependent output that passes on the author's machine and fails
  elsewhere.
- **KISS:** flag abstractions not forced by a third repetition; three
  explicit lines beat one clever indirection.
- **SRP / SoC:** one reason to change per unit; never mix layers (UI vs
  data-fetch vs transform). A name that needs "and" should be split.

Severity: duplicated/diverging logic of an existing shared util = **MEDIUM**
(fix before merge); a duplicate that introduces a latent runtime difference
(locale, timezone, precision, ordering) = **HIGH**.

### Performance

Check the cost of the change, not just its correctness. Reason about the
hot path and the input size at scale — the bug is usually fine on the
author's small test data and bad in production.

- **Data access:** N+1 queries (use JOINs/batching); missing pagination
  (add LIMIT); unbounded queries / `SELECT *` (add constraints + columns);
  missing caching of repeated expensive calls.
- **Algorithmic:** nested loops / O(n²)+ over unbounded input; work repeated
  inside a loop that could be hoisted; sort/search/filter recomputed every
  iteration instead of once.
- **Async:** `await` inside a loop for independent calls — batch with
  `Promise.all`; sequential requests that have no data dependency.
- **Frontend (where applicable):** expensive computation in the render path
  instead of memoized/derived once; unstable inline object/array/function
  props creating a new reference every render; large libraries imported
  wholesale (no tree-shaking / barrel re-export) and heavy components not
  lazy-loaded; long synchronous work blocking the main thread.
- **Memory / lifecycle:** leaks from intervals, listeners, subscriptions, or
  observers not cleaned up; growth that scales with session length.

Avoid premature optimization (KISS): don't demand `memo`/`useMemo`/caching
without a hot path or a profiler/measurement that justifies it. Flag the
real cost, not theoretical micro-tuning. Prefer the simplest correct code
until a measurement says otherwise.

Severity: a regression that scales with input/users (N+1, O(n²) on real
data, unbounded query, leak) = **HIGH**; a localized inefficiency on a cold
path = **LOW/MEDIUM**.

## Approval Criteria

- **Approve**: No CRITICAL or HIGH issues
- **Warning**: Only HIGH issues (merge with caution)
- **Block**: CRITICAL issues found

## Integration with Other Rules

This rule works with:

- [testing.md](testing.md) - Test coverage requirements
- [security.md](security.md) - Security checklist
- [git-workflow.md](git-workflow.md) - Commit standards
- [agents.md](agents.md) - Agent delegation

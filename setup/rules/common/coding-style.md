# Coding Style

## Immutability (CRITICAL)

ALWAYS create new objects, NEVER mutate existing ones:

```
// Pseudocode
WRONG:  modify(original, field, value) → changes original in-place
CORRECT: update(original, field, value) → returns new copy with change
```

Rationale: Immutable data prevents hidden side effects, makes debugging easier, and enables safe concurrency.

## File Organization

MANY SMALL FILES > FEW LARGE FILES:
- High cohesion, low coupling
- 200-400 lines typical, 800 max
- Extract utilities from large modules
- Organize by feature/domain, not by type

## Guard Clauses

Handle edge cases and error paths at the top of functions — never at the bottom:

- Return or throw early for invalid state
- No `else` after a `return` — it's dead visual weight
- Happy path is the last code path, not the first

```
// WRONG: nested happy path
fn() {
  if (valid) {
    if (exists) {
      doWork()
    }
  }
}

// CORRECT: guard clauses first
fn() {
  if (!valid) return
  if (!exists) return
  doWork()
}
```

## Avoid Magic Strings

Never repeat raw string literals — extract to named constants:

- Status codes, action IDs, route paths, event names → `constants/` file
- User-facing copy used in 2+ places → shared constant
- Reason: a typo in a magic string is a silent bug; a typo in a constant name is a compile error

## Error Handling

ALWAYS handle errors comprehensively:
- Handle errors explicitly at every level
- Use custom error types for domain errors — never throw generic `Error` when a named type is clearer
- Provide user-friendly error messages in UI-facing code
- Log detailed error context on the server side
- Never silently swallow errors

## Input Validation

ALWAYS validate at system boundaries:
- Validate all user input before processing
- Use schema-based validation where available
- Fail fast with clear error messages
- Never trust external data (API responses, user input, file content)

## Readability

Separate logical sections within function bodies with a single blank line:
- After guard clauses / early returns
- Between setup, loop setup, and loop body
- Between distinct side effects or state mutations

```
// WRONG: Dense wall of logic
fn() {
  setX(next)
  if (!next) { reset(); return }
  const ids = compute()
  setIds(ids)
  for (const item of items) {
    doWork(item)
  }
}

// CORRECT: Breathing room between phases
fn() {
  setX(next)

  if (!next) { reset(); return }

  const ids = compute()
  setIds(ids)

  for (const item of items) {
    doWork(item)
  }
}
```

## Code Quality Checklist

Before marking work complete:
- [ ] Code is readable and well-named
- [ ] Functions are small (<50 lines)
- [ ] Files are focused (<800 lines)
- [ ] No deep nesting (>4 levels)
- [ ] Proper error handling
- [ ] No hardcoded values (use constants or config)
- [ ] No mutation (immutable patterns used)
- [ ] Logical sections separated by blank lines

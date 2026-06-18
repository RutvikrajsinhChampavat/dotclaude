---
paths:
  - "**/*.py"
  - "**/*.pyi"
---
# Python Coding Style

> This file extends [common/coding-style.md](../common/coding-style.md) with Python specific content.

## Standards

- Follow **PEP 8** conventions
- Use **type annotations** on all function signatures

## Immutability

Prefer immutable data structures:

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class User:
    name: str
    email: str

from typing import NamedTuple

class Point(NamedTuple):
    x: float
    y: float
```

## Formatting

- **black** for code formatting
- **isort** for import sorting
- **ruff** for linting

## Reference

See skill: `python-patterns` for comprehensive Python idioms and patterns.

## Database Queries

Push filtering, sorting, aggregation, and joins into SQL — never into Python post-processing loops:

- Filter in `WHERE`, not in a list comprehension after fetching
- Sort in `ORDER BY`, not with `sorted()` on the result set
- Aggregate in `GROUP BY` / window functions, not with `sum()` loops over rows
- Reason: per-row Python work over query results is O(n) in application memory and kills performance at scale

---
## Python overrides

- Type hints on ALL function signatures — no bare `def f(x)` ever
- `def` for pure functions, `async def` for any I/O operation
- Pydantic models for all input/output validation — never raw dicts
- Files and directories: `lowercase_with_underscores`
- No classes unless truly needed — functional and declarative always
- Prefer named exports for routes and utility functions
- RORO pattern via TypedDict or Pydantic where applicable
- Follow ruff + mypy; treat type errors as build failures

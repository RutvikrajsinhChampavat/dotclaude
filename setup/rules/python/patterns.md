---
paths:
  - "**/*.py"
  - "**/*.pyi"
---
# Python Patterns

> This file extends [common/patterns.md](../common/patterns.md) with Python specific content.

## Protocol (Duck Typing)

```python
from typing import Protocol

class Repository(Protocol):
    def find_by_id(self, id: str) -> dict | None: ...
    def save(self, entity: dict) -> dict: ...
```

## Dataclasses as DTOs

```python
from dataclasses import dataclass

@dataclass
class CreateUserRequest:
    name: str
    email: str
    age: int | None = None
```

## Context Managers & Generators

- Use context managers (`with` statement) for resource management
- Use generators for lazy evaluation and memory-efficient iteration

## Reference

See skill: `python-patterns` for comprehensive patterns including decorators, concurrency, and package organization.

---
## FastAPI patterns

- Route handlers are thin — delegate immediately to service layer
- `HTTPException` for all expected/user-facing errors with clear detail messages
- Middleware for unexpected errors, logging, and monitoring
- Lifespan context managers over deprecated `@app.on_event`
- Dependency injection for auth, DB sessions, and services
- Pydantic `BaseModel` for ALL request/response bodies — no raw dicts in/out
- Never return ORM objects directly — always serialise via response schema
- All DB and external API calls must be `async`
- Cache frequently accessed, rarely-changing data (Redis or in-memory TTL)
- Use `HTTPException(status_code=409)` for conflicts, 422 for validation errors
- DB sessions via `Depends(get_db)`: yield an async session that commits on success and rolls back on exception — never manage transactions manually inside route handlers
- Exception handlers must log full error context server-side and return a sanitized message to the client — never expose stack traces, ORM errors, or internal state in API responses

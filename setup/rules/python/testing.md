---
paths:
  - "**/*.py"
  - "**/*.pyi"
---
# Python Testing

> This file extends [common/testing.md](../common/testing.md) with Python specific content.

## Framework

Use **pytest** as the testing framework.

## Coverage

```bash
pytest --cov=src --cov-report=term-missing
```

## Test Organization

Use `pytest.mark` for test categorization:

```python
import pytest

@pytest.mark.unit
def test_calculate_total():
    ...

@pytest.mark.integration
def test_database_connection():
    ...
```

## Reference

See skill: `python-testing` for detailed pytest patterns and fixtures.

---
## Python testing overrides

- pytest for all tests — no unittest
- Unit tests: pure service/utility logic only, no DB or HTTP
- Integration tests: real DB via pytest fixtures + transaction rollback
- `conftest.py` for all shared fixtures — no duplication across test files
- `pytest-asyncio` for async route and service tests
- Aim for 80%+ coverage; 100% for auth, payment, and data-mutation paths
- Mock only external HTTP calls — never mock the DB in integration tests

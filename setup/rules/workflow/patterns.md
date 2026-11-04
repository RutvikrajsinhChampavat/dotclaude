# Common Patterns

## Skeleton Projects

When implementing new functionality:
1. Search for battle-tested skeleton projects
2. Use parallel agents to evaluate options:
   - Security assessment
   - Extensibility analysis
   - Relevance scoring
   - Implementation planning
3. Clone best match as foundation
4. Iterate within proven structure

## Design Patterns

### Repository Pattern

Encapsulate data access behind a consistent interface:
- Define standard operations: findAll, findById, create, update, delete
- Concrete implementations handle storage details (database, API, file, etc.)
- Business logic depends on the abstract interface, not the storage mechanism
- Enables easy swapping of data sources and simplifies testing with mocks

## Previous-Value Sentinel Pattern

When tracking a "previous value" to detect change (a ref/state compared against
the current value each cycle), the initial sentinel must be a value OUTSIDE the
domain of real values — never reuse a real value (like `null` for "nothing
selected") as the "never yet initialized" marker. If the first real value can
equal the sentinel, that first change goes undetected with no error. Use a
distinct third state (e.g. `undefined` when `null` is a legitimate real value).

### API Response Format

Use a consistent envelope for all API responses:
- Include a success/status indicator
- Include the data payload (nullable on error)
- Include an error message field (nullable on success)
- Include metadata for paginated responses (total, page, limit)

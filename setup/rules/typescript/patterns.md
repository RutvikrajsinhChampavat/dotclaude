---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---
# TypeScript/JavaScript Patterns

> This file extends [common/patterns.md](../common/patterns.md) with TypeScript/JavaScript specific content.

## API Response Format

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    total: number
    page: number
    limit: number
  }
}
```

## Custom Hooks Pattern

```typescript
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}
```

## Repository Pattern

```typescript
interface Repository<T> {
  findAll(filters?: Filters): Promise<T[]>
  findById(id: string): Promise<T | null>
  create(data: CreateDto): Promise<T>
  update(id: string, data: UpdateDto): Promise<T>
  delete(id: string): Promise<void>
}
```

---
## React / Next.js patterns

- Mobile-first responsive design as default — design for smallest viewport, scale up with breakpoints
- Prefer RSC (React Server Components) — add `use client` only when needed
- Minimize `useEffect` and `setState`
- Wrap client components in `Suspense` with a meaningful fallback
- No inline object/array creation in JSX — causes unstable references
- `memo` / `useCallback` / `useMemo` only when profiler justifies it
- `nuqs` for all URL search param state
- Dynamic imports for heavy components
- Prefer MUI components over raw HTML elements
- Prefer static rendering / ISR over client-side fetching
- All interactive elements: `tabIndex`, `aria-label`, `onKeyDown`
- Event handlers prefixed with `handle`: `handleClick`, `handleKeyDown`

## Express / Node.js patterns

- Service layer for all business logic — no logic in route handlers
- Middleware for cross-cutting concerns (auth, logging, validation)
- Always handle async errors — use express-async-errors or try/catch wrapper
- Validate all inputs with Zod before they reach the service layer
- Never return raw Mongoose documents — transform to plain objects or DTOs
- Repository pattern: abstract DB calls behind a repository layer

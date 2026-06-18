---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---
# TypeScript/JavaScript Security

> This file extends [common/security.md](../common/security.md) with TypeScript/JavaScript specific content.

## Secret Management

```typescript
// NEVER: Hardcoded secrets
const apiKey = "sk-proj-xxxxx"

// ALWAYS: Environment variables
const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured')
}
```

## Agent Support

- Use **security-reviewer** skill for comprehensive security audits

---
## MERN-specific security rules

- Validate and sanitise all MongoDB query inputs — never pass raw user input to queries
- Use Mongoose schema-level validation as a second line of defence
- Always set `{ new: true, runValidators: true }` on findOneAndUpdate
- JWT secrets must come from env — never hardcode, never log
- Set httpOnly + secure + sameSite=strict on all auth cookies
- Rate-limit all auth endpoints: login, register, reset-password
- Never expose Mongoose error stack or field names in API error responses
- Use helmet.js on all Express apps

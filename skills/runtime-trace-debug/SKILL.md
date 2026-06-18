---
name: runtime-trace-debug
description: >
  Debug non-deterministic timing / state-accumulation / event-ordering bugs in a
  RUNNING app — frontend OR backend — by instrumenting suspect code with tagged
  runtime logs and reading the trace off something you can access directly, then
  fixing from evidence instead of static guessing. Backend/CLI/worker: read the
  service's own stdout/log file (docker compose logs, tail, journald). Browser
  app where you can't read the console (esp. HTTPS/proxied SPAs where a separate
  debug server is blocked by CORS/mixed-content): route logs through the app's
  OWN origin to a file you read. Use when a bug only shows in the live app,
  depends on timing / order / state built up across actions, and unit tests
  can't reproduce it, AND the user can run it. Do NOT use for deterministic logic
  bugs a failing unit test can pin, or when nothing is runnable.
---

# Runtime Trace Debugging (frontend or backend)

When a bug is non-deterministic, stop reasoning from static reading. Instrument
the real execution, read it, find the one line that proves the cause, then fix.
The user runs it once; you read the trace directly — no copy-paste.

## When to use

- Bug only reproduces in the live app / running service, not in unit tests.
- Smells like **timing** (overlap, races), **state accumulation** (fine on the
  1st action, breaks on the 2nd+), **event/effect/await ordering**, or
  **duplicate/zombie work** (a loop, listener, workflow, or instance firing twice).
- You've reasoned about the cause and been wrong, or can't tell which theory holds.
- The user can run it and reproduce on demand.

## When NOT to use

- Deterministic logic bug → write a failing unit test instead (faster).
- Nothing runnable, or you can already see the cause in the code.

## The loop (same regardless of transport)

1. **Decide the questions the trace must answer** — "how many loops/instances/
   workflows exist?", "how many times does X fire and from where?", "what's the
   order around the failure?". Instrument to answer those, not everything.
2. **Pick a transport** (below) and add a tagged logger.
3. **Instrument suspect sites:** short subsystem tag (`[POLL]`, `[FINALIZE]`); a
   **correlation id** so concurrent flows are distinguishable (FE: per-instance
   `useState(() => ++seq)`; BE: the flow's `workflow_id` / request id /
   `conversation_id`); a timestamp so interleaved writes can be sorted. Log path
   entry/exit, guard hits/skips, and every side-effectful call **with who triggered it**.
4. **Clear/scope the log, have the user reproduce** (tell them the exact repro,
   incl. "do it N times" for state-accumulation bugs), then read + `sort`.
5. **Find the discriminator** — the single line that proves which theory is right
   (a call inside a window that shouldn't exist; the same id appearing twice).
   Fix the root cause in the correct layer.
6. **Confirm the fix against the live trace — KEEP the instrumentation in.** Apply
   the fix, then have the user re-run the SAME repro. Read the trace and verify
   the discriminator is gone (the bad line no longer fires; single instead of
   double; ids no longer duplicate). The bug didn't reproduce in unit tests, so a
   passing test is NOT confirmation — only the live trace is. If it still appears,
   the fix is wrong → iterate. **Do not remove the logs yet.**
7. **Only after the user confirms it's resolved — clean up.** Add a regression
   test that reproduces the *mechanism*, then strip ALL instrumentation (see
   checklist) and run lint/types/tests.

## Transport A — read the runtime's own output (DEFAULT; backends, CLI, workers)

Anything that logs to stdout or a file you can reach needs no sink — just tag and read.

- **Instrument:** Python `logger.info("[TAG] %s", ...)` (or `print`); Node
  `console.log`/logger. Ensure the level is actually emitted (info vs debug).
- **Read it** (aetherion services run in Docker via `constellation`):
  ```bash
  docker compose logs -f --tail=0 milkyway | grep -E '\[POLL\]|\[FINALIZE\]'
  docker compose logs --since=2m supernova        # scope by time
  ```
  Or `tail -f <logfile>`, or `journalctl -fu <svc>`.
- **Correlation:** tag every line with `workflow_id` / request id / `conversation_id`
  so concurrent runs (and multi-replica/worker interleaving) stay separable.
- **Scope a clean capture:** `--since`/`--tail`, restart the service, or just grep
  your unique tag.
- **Gotchas:** confirm the right service/container; a prod-like container won't
  hot-reload — rebuild/restart so your log lines actually run; multiple replicas
  interleave (the correlation id saves you).

## Transport B — route through the app's own origin (browser apps you can't read)

Use ONLY when you cannot read the runtime's logs yourself — i.e. logs live in a
user's **browser console**. For HTTPS / proxied SPAs a standalone debug server on
`http://localhost:PORT` is blocked (CORS / mixed-content), so post to the app's
own origin and have IT write a file you read.

Next.js / Sombrero (HTTPS `app.localhost` → nginx → Next on host; same-origin
relative fetch, route runs on host so its file write is in your fs):

```ts
// src/app/api/debug-log/route.ts   (NOT _debug — underscore = private/404)
import { appendFile } from "node:fs/promises";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const { t, line } = (await request.json()) as { t?: number; line?: string };
    const ts = new Date(typeof t === "number" ? t : Date.now()).toISOString();
    await appendFile("/tmp/<app>-debug-runtime.log", `${ts} ${line ?? ""}\n`);
  } catch { /* debug-only — never throw */ }
  return NextResponse.json({ ok: true });
}
```
```ts
// src/utils/debug-sink.ts
export const postDebug = (line: string): void => {
  // eslint-disable-next-line no-console
  console.log(line);
  try {
    void fetch("/api/debug-log", { method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ t: Date.now(), line }) }).catch(() => undefined);
  } catch { /* debug-only */ }
};
```
Per-instance tag: `const [id] = useState(() => { __seq += 1; return __seq; });`
then `postDebug(\`[TAG#\${id}] ...\`)`. Read/clear/probe:
```bash
: > /tmp/<app>-debug-runtime.log                 # clear before repro
sort /tmp/<app>-debug-runtime.log                # after repro
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/debug-log \
  -H 'Content-Type: application/json' -d '{"t":0,"line":"probe"}'   # 200 = route live
```
- **Browser gotchas:** `_`-prefixed route folder → 404 (use `debug-log`); new
  route files need a dev-server restart; confirm the dev server runs on the host
  (`lsof -iTCP:3000`) so its `/tmp` write is yours (else read via `docker exec`);
  fire-and-forget the fetch so it doesn't skew the timing you're measuring.

## Cleanup checklist (only after the user confirms the bug is fixed via the trace; never skip)

- [ ] Remove every tagged log line + correlation-id/tag helper.
- [ ] Transport B: delete the route dir + `debug-sink.ts`; remove the `/tmp/*.log`.
- [ ] `grep -rn '\[TAG' src/` (and your other tags) → zero hits.
- [ ] lint + types + scoped tests green; the regression test stays.

Reference: aetherion project memory `sombrero-runtime-log-sink-debug` is a worked
Transport-B run. Sombrero vitest runs under Node 22.

#!/usr/bin/env node
// Screenshot a mock in a real Firefox-engine browser (Firefox, Zen, LibreWolf) over WebDriver BiDi.
// Zero dependencies: Node 22+ has a global WebSocket.
//
// 1. Quit the browser, then relaunch it with the remote agent on:
//      /Applications/Zen.app/Contents/MacOS/zen --remote-debugging-port 9222
//    (the address bar turns striped while it is remote-controlled; relaunch normally when done:
//     any local process can drive the browser while the port is open)
// 2. Open the mock in a tab, signed in as usual.
// 3. node firefox-capture.mjs --match ingestion-redesign-mock --sizes current,390x844,1440x900,2560x1440 --out ./shots
//
// Flags: --port 9222 · --match <url substring> · --url <open this if no tab matches>
//        --sizes current,WxH,... · --out <dir> · --wait <ms per size, default 1500>
//        --eval "<js expression>" (run in the tab after the shots; awaited, result printed as JSON)

import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]?.startsWith("--") ? true : all[i + 1] ?? true]] : acc), [])
);
const port = Number(args.port ?? 9222);
const match = args.match ?? "";
const sizes = String(args.sizes ?? "current").split(",").map((s) => s.trim()).filter(Boolean);
const out = resolve(args.out ?? "./shots");
const wait = Number(args.wait ?? 1500);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ws = new WebSocket(`ws://127.0.0.1:${port}/session`);
let nextId = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((res, rej) => {
    const id = ++nextId;
    pending.set(id, { res, rej, method });
    ws.send(JSON.stringify({ id, method, params }));
  });
ws.addEventListener("message", (e) => {
  const msg = JSON.parse(e.data);
  const p = msg.id && pending.get(msg.id);
  if (!p) return;
  pending.delete(msg.id);
  if (msg.type === "error") p.rej(new Error(`${p.method}: ${msg.error} ${msg.message ?? ""}`));
  else p.res(msg.result);
});

const fail = (m) => { console.error(m); process.exit(1); };
ws.addEventListener("error", () => fail(`Can't reach the remote agent on 127.0.0.1:${port}. Was the browser started with --remote-debugging-port ${port}?`));

ws.addEventListener("open", async () => {
  try {
    await send("session.new", { capabilities: {} });
    const { contexts } = await send("browsingContext.getTree", { maxDepth: 0 });
    let ctx = contexts.find((c) => match && c.url.includes(match));
    if (!ctx && args.url) {
      ctx = contexts[0];
      await send("browsingContext.navigate", { context: ctx.context, url: args.url, wait: "complete" });
      ctx = { ...ctx, url: args.url };
      await sleep(wait);
    }
    if (!ctx) fail(`No tab URL contains "${match}". Open tabs:\n${contexts.map((c) => `  ${c.url}`).join("\n")}`);
    await mkdir(out, { recursive: true });

    const shots = [];
    for (const s of sizes) {
      const [w, h] = s === "current" ? [] : s.split("x").map(Number);
      await send("browsingContext.setViewport", { context: ctx.context, viewport: w ? { width: w, height: h } : null });
      await sleep(wait);
      const { result } = await send("script.evaluate", { expression: "JSON.stringify([innerWidth, innerHeight, devicePixelRatio, location.pathname])", target: { context: ctx.context }, awaitPromise: false });
      const [iw, ih, dpr, path] = JSON.parse(result.value);
      const { data } = await send("browsingContext.captureScreenshot", { context: ctx.context, origin: "viewport" });
      const file = join(out, `${s === "current" ? "current-" : ""}${iw}x${ih}.png`);
      await writeFile(file, Buffer.from(data, "base64"));
      shots.push({ size: s, viewport: `${iw}x${ih}`, dpr, path, file });
    }
    await send("browsingContext.setViewport", { context: ctx.context, viewport: null });

    let evaluated;
    if (typeof args.eval === "string") {
      const r = await send("script.evaluate", { expression: `(async () => JSON.stringify(await (${args.eval})))()`, target: { context: ctx.context }, awaitPromise: true });
      evaluated = r.type === "exception" ? { error: r.exceptionDetails?.text } : JSON.parse(r.result.value ?? "null");
    }
    console.log(JSON.stringify({ tab: ctx.url, shots, evaluated }, null, 2));
    await send("session.end").catch(() => {});
    ws.close();
  } catch (err) {
    fail(String(err));
  }
});

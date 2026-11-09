#!/usr/bin/env node
// Screenshots reference pages and mock options to PNG files over the Chrome DevTools protocol.
// Zero dependencies (Node 22+ has WebSocket). Run with --help for usage.

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";

const USAGE = `Usage: node capture.mjs <refs|mock|sheet|signin> [flags]

Captures run in a headless browser (--capture-port, default 9223): no window ever opens, so
nothing takes focus. It starts on its own when needed. Before each run it copies the sign-in
cookies for local hosts from the browser you sign in with (--port, default 9222).

refs    Pages for the boards: public pages, or signed-in local pages.
        node capture.mjs refs --list refs.txt --out design-mocks/refs/<surface>
        refs.txt: one "<name> <url> [WxH]" per line; # starts a comment; default size 1440x900.

mock    Every option x state x theme x size of a mock that mounts the harness (window.__mock).
        node capture.mjs mock --url http://localhost:3000/<mock> --options S1,C1 \\
          --states populated,error --themes light,dark --sizes 1440x900,390x844 \\
          --filters none,blur,grey --out design-mocks/shots/<surface>/round-1
        A frame is saved only once window.__mock.current() reports the option, state and theme
        asked for; mismatches are listed under "errors" and exit 3. Each run opens and closes its
        own headless tab, so builders capture in parallel. --checks runs the harness checks on
        every frame; each unfiltered frame gets "checks": the failed lines ([] = all passed).

sheet   One PNG tiling the unfiltered frames listed in an --out folder's manifest.json.
        node capture.mjs sheet --out design-mocks/shots/<surface>/round-1 --options S2 \\
          --states populated,error --cols 4 [--to <png, default <out>/sheet.png>]

signin  The only command that opens a visible window: the sign-in browser on --port, if none is
        running. A person runs it; agents never do. Exit 2 from refs or mock means: sign in once
        there, then re-run. Close it when the round ends: any local process can drive a browser
        while its debug port is open.
        node capture.mjs signin --url http://localhost:3000/

Flags: --port 9222 (sign-in browser) · --capture-port 9223 (headless) · --chrome <binary>
       --profile <dir, default ~/.cache/design-mock-capture-profile> (sign-in browser)
       --wait <ms after load, 2500> · --settle <ms after each switch, 700>
       --eval "<js>" (refs: awaited on each page; mock: awaited after the shots; printed)
Exit:  0 ok · 1 error · 2 sign-in needed · 3 some frames refused`;

const [mode, ...rest] = process.argv.slice(2);
const args = Object.fromEntries(
  rest.reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1] === undefined || all[i + 1].startsWith("--") ? true : all[i + 1]]] : acc), [])
);
const list = (v, d) => String(v ?? d).split(",").map((s) => s.trim()).filter(Boolean);
const size = (s) => s.split("x").map(Number);
const signinPort = Number(args.port ?? 9222);
const capturePort = Number(args["capture-port"] ?? 9223);
const profile = resolve(args.profile ?? join(homedir(), ".cache", "design-mock-capture-profile"));
const headlessProfile = join(homedir(), ".cache", "design-mock-capture-headless");
const out = resolve(args.out ?? "./shots");
const wait = Number(args.wait ?? 2500);
const settle = Number(args.settle ?? 700);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
class Exit extends Error {
  constructor(message, code) { super(message); this.code = code; }
}
const fail = (m, code = 1) => { throw new Exit(m, code); };
const DEFAULT_SIZE = "1440x900";
const LOAD_EVENT = "Page.loadEventFired";
const FILTERS = { none: "", blur: "blur(6px)", grey: "grayscale(1)" };
const FAILED_CHECKS = "window.__mock.runChecks().then((r) => Object.values(r.lines).filter(([ok]) => !ok).map(([, line]) => line))";
const SHEET_WIDTH = 2400;
// An occluded or background page stops painting and its animation stalls; these keep every page live.
const KEEP_PAINTING = ["--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding", "--disable-background-timer-throttling"];
const LOCAL_HOST = /(^|\.)localhost$|^127\.0\.0\.1$|^\[::1\]$/;
const CHROME = {
  darwin: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  linux: "google-chrome",
  win32: "C:/Program Files/Google/Chrome/Application/chrome.exe"
};

if (args.help || mode === "--help") { console.log(USAGE); process.exit(0); }
if (!["refs", "mock", "sheet", "signin"].includes(mode)) { console.error(USAGE); process.exit(1); }

const devtools = (port, path) => `http://127.0.0.1:${port}${path}`;
const endpoint = async (port, path, method = "GET") => {
  const r = await fetch(devtools(port, path), { method });
  if (!r.ok) throw new Error(`${path} → ${r.status}`);
  return r.json();
};
const listening = (port) => endpoint(port, "/json/version").then(() => true, () => false);

const startChrome = async (port, dir, extra) => {
  const bin = args.chrome ?? CHROME[process.platform];
  if (bin.includes("/") && !existsSync(bin)) fail(`No browser at ${bin}. Pass --chrome <path to Chrome, Edge or Chromium>.`);
  spawn(bin, [`--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, "--no-first-run", "--no-default-browser-check", ...extra], { detached: true, stdio: "ignore" }).unref();
  for (let i = 0; i < 40 && !(await listening(port)); i++) await sleep(250);
  if (!(await listening(port))) fail(`Launched ${bin} but port ${port} never opened. If a browser already has ${dir} open without a debug port, close it and re-run.`);
};

const session = async (wsUrl) => {
  const ws = new WebSocket(wsUrl);
  const pending = new Map();
  const waiters = [];
  let id = 0;
  ws.addEventListener("message", (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      return msg.error ? p.rej(new Error(`${p.method}: ${msg.error.message}`)) : p.res(msg.result);
    }
    waiters.filter((w) => w.method === msg.method).forEach((w) => { waiters.splice(waiters.indexOf(w), 1); w.res(msg.params); });
  });
  await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", () => rej(new Error("DevTools socket failed"))); });
  const send = (method, params = {}) => new Promise((res, rej) => { pending.set(++id, { res, rej, method }); ws.send(JSON.stringify({ id, method, params })); });
  // The timeout is cleared when the event wins; a pending timer keeps Node alive for its full duration.
  const once = (method, ms) => new Promise((res) => {
    const timer = setTimeout(res, ms);
    waiters.push({ method, res: (params) => { clearTimeout(timer); res(params); } });
  });
  return { send, once, close: () => ws.close() };
};
const browserAt = async (port) => session((await endpoint(port, "/json/version")).webSocketDebuggerUrl);

const attach = async (target) => {
  const s = await session(target.webSocketDebuggerUrl);
  const evaluate = async (expression) => {
    const r = await s.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result.value;
  };
  const navigate = async (to) => { const loaded = s.once(LOAD_EVENT, 20000); await s.send("Page.navigate", { url: to }); await loaded; };
  await s.send("Page.enable");
  // Only ever a headless page here: activating it makes it visible without touching the screen.
  await s.send("Page.bringToFront");
  return { ...s, evaluate, navigate };
};

// Headless: its windows are never drawn, so nothing takes focus; one window per run keeps every page visible.
const headless = async () => {
  if (!(await listening(capturePort))) await startChrome(capturePort, headlessProfile, ["--headless=new", "--hide-scrollbars", ...KEEP_PAINTING, "about:blank"]);
};

// Copies the sign-in browser's cookies for local hosts only; false when no sign-in browser runs.
const syncSignIn = async (browserContextId) => {
  if (!(await listening(signinPort))) return false;
  const from = await browserAt(signinPort);
  const { cookies } = await from.send("Storage.getCookies");
  from.close();
  const local = cookies.filter((c) => LOCAL_HOST.test(c.domain.replace(/^\./, ""))).map((c) => ({
    name: c.name, value: c.value, domain: c.domain, path: c.path, secure: c.secure, httpOnly: c.httpOnly,
    ...(c.sameSite ? { sameSite: c.sameSite } : {}), ...(c.session ? {} : { expires: c.expires })
  }));
  const to = await browserAt(capturePort);
  await to.send("Storage.setCookies", { cookies: local, browserContextId });
  to.close();
  return true;
};

// Each run gets its own browser context: tabs sharing localStorage flip each other's theme through storage events.
const openTab = async () => {
  const browser = await browserAt(capturePort);
  const { browserContextId } = await browser.send("Target.createBrowserContext");
  const { targetId } = await browser.send("Target.createTarget", { url: "about:blank", newWindow: true, browserContextId });
  browser.close();
  const target = (await endpoint(capturePort, "/json/list")).find((t) => t.id === targetId);
  if (!target) fail("The capture tab never appeared.");
  const close = async () => {
    const b = await browserAt(capturePort).catch(() => null);
    await b?.send("Target.disposeBrowserContext", { browserContextId }).catch(() => {});
    b?.close();
  };
  return { target, browserContextId, close };
};

const ready = async () => {
  await headless();
  const tab = await openTab();
  const signedIn = await syncSignIn(tab.browserContextId);
  closeTab = tab.close;
  return { tab, signedIn, cdp: await attach(tab.target) };
};

const runEval = (cdp) => (typeof args.eval === "string" ? cdp.evaluate(`(async () => await (${args.eval}))()`).catch((e) => ({ error: String(e) })) : undefined);
const viewport = (cdp, w, h) => cdp.send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: w < 768 });
const shoot = async (cdp, file) => {
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
  await writeFile(file, Buffer.from(data, "base64"));
  return file;
};

const refs = async () => {
  if (!args.list) fail("refs needs --list <file>.");
  const jobs = (await readFile(resolve(args.list), "utf8")).split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")).map((l) => {
    const [name, url, wh = DEFAULT_SIZE] = l.split(/\s+/);
    return { name, url, wh };
  });
  if (!jobs.length) fail(`${args.list} lists no pages.`);
  await mkdir(out, { recursive: true });
  const { tab, cdp } = await ready();
  const shots = [];
  for (const { name, url, wh } of jobs) {
    const [w, h] = size(wh);
    await viewport(cdp, w, h);
    await cdp.navigate(url);
    await sleep(wait);
    const landed = await cdp.evaluate("location.href");
    shots.push({ name, url, landed, size: wh, file: await shoot(cdp, join(out, `${name}-${wh}.png`)), evaluated: await runEval(cdp) });
  }
  cdp.close();
  await tab.close();
  return { shots };
};

const waitForHarness = async (cdp, pathname, signedIn) => {
  for (let i = 0; i < 40; i++) {
    const info = await cdp.evaluate("({ href: location.href, ready: !!(window.__mock && window.__mock.current) })");
    if (info.ready) return;
    if (i === 39 && !info.href.includes(pathname)) {
      const at = new URL(info.href);
      const how = signedIn ? `sign in once in the sign-in browser on port ${signinPort}` : `no sign-in browser runs on port ${signinPort}: ask the user to run "node capture.mjs signin --url ${new URL(args.url).origin}/" and sign in once`;
      fail(`The mock redirected to ${at.origin}${at.pathname}. To fix, ${how}; then re-run.`, 2);
    }
    await sleep(500);
  }
  fail("window.__mock never appeared. Is the page wrapped in MockHarness?");
};

// Sets one combination and resolves to the page's own report of it, so a refused switch is visible.
const switchTo = async (cdp, want) => {
  const asked = JSON.stringify(want);
  await cdp.evaluate(`window.__mock.set(${asked})`);
  let got = "";
  for (let i = 0; i < 20 && got !== asked; i++) {
    await sleep(150);
    got = JSON.stringify(await cdp.evaluate("window.__mock.current()"));
  }
  return { asked, got };
};

// Size first, then load: layout an app decides at mount (a collapsing sidebar) must see the real width.
const load = async (cdp, wh, signedIn) => {
  const [w, h] = size(wh);
  await viewport(cdp, w, h);
  await cdp.navigate(args.url);
  await waitForHarness(cdp, new URL(args.url).pathname, signedIn);
  // The harness toolbar and overlays sit outside the design being judged; keep them out of every frame.
  await cdp.evaluate(`document.head.insertAdjacentHTML("beforeend", "<style id=capture-hide>[data-mock-chrome],nextjs-portal{visibility:hidden!important}</style>")`);
};

const captureCombos = async (cdp, combos, filters, loaded) => {
  const shots = [];
  const errors = [];
  let media = "";
  let vp = loaded.size;
  for (const { theme, wh, option, state } of combos) {
    if (media !== theme) { media = theme; await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: theme }] }); }
    if (vp !== wh) { vp = wh; await load(cdp, wh, loaded.signedIn); }
    const { asked, got } = await switchTo(cdp, { option, state, theme });
    if (got !== asked) { errors.push(`asked ${asked}, page reports ${got}`); continue; }
    await sleep(settle);
    if ((await cdp.evaluate("document.visibilityState")) !== "visible") { errors.push(`${asked}: page hidden, animation paused`); continue; }
    const checks = args.checks ? await cdp.evaluate(FAILED_CHECKS).catch((e) => [`checks failed to run: ${e.message}`]) : undefined;
    for (const f of filters) {
      await cdp.evaluate(`window.__mock.filter(${JSON.stringify(FILTERS[f])})`);
      const file = join(out, `${option}-${state}-${theme}-${wh}${f === "none" ? "" : `-${f}`}.png`);
      shots.push({ option, state, theme, size: wh, filter: f, file: await shoot(cdp, file), ...(checks && f === "none" ? { checks } : {}) });
    }
    const after = JSON.stringify(await cdp.evaluate("window.__mock.current()"));
    if (after !== asked) {
      await Promise.all(shots.splice(-filters.length).map((s) => unlink(s.file).catch(() => {})));
      errors.push(`${asked} changed to ${after} while capturing; frames deleted`);
    }
    await cdp.evaluate("window.__mock.filter('')");
  }
  await cdp.evaluate("document.getElementById('capture-hide')?.remove()");
  return { shots, errors };
};

const mock = async () => {
  if (!args.url) fail("mock needs --url <mock route URL>.");
  await mkdir(out, { recursive: true });
  const { tab, cdp, signedIn } = await ready();
  const pick = (flag, fallback) => list(args[flag], fallback);
  const sizes = pick("sizes", DEFAULT_SIZE);
  await load(cdp, sizes[0], signedIn);

  const meta = await cdp.evaluate("window.__mock.meta()");
  // Size outermost: a size change reloads the page, a theme change doesn't.
  const combos = sizes.flatMap((wh) => pick("themes", "light").flatMap((theme) =>
    pick("options", meta.options.join(",")).flatMap((option) => pick("states", "populated").map((state) => ({ theme, wh, option, state })))));
  const filters = pick("filters", "none").filter((f) => f in FILTERS);
  const { shots, errors } = await captureCombos(cdp, combos, filters, { size: sizes[0], signedIn });

  const evaluated = await runEval(cdp);
  cdp.close();
  await tab.close();
  return { url: args.url, shots, errors, evaluated };
};

const signin = async () => {
  if (await listening(signinPort)) return { signin: `already running on port ${signinPort}; sign in there` };
  await startChrome(signinPort, profile, [args.url ?? "about:blank"]);
  return { signin: `opened on port ${signinPort}; sign in once, then re-run the capture` };
};

// Tiles unfiltered frames from manifest.json into one PNG, so a reader opens one image instead of twenty.
const sheet = async () => {
  const { shots } = JSON.parse(await readFile(join(out, "manifest.json"), "utf8"));
  const keep = (flag, value) => !args[flag] || list(args[flag]).includes(value);
  const frames = shots.filter((s) => s.filter === "none" && keep("options", s.option) && keep("states", s.state) && keep("themes", s.theme) && keep("sizes", s.size));
  if (!frames.length) fail("sheet: no unfiltered frames in manifest.json match the filters.");

  const tile = (s) => `<figure><img src="${basename(s.file)}"><figcaption>${s.option} · ${s.state} · ${s.theme} · ${s.size}</figcaption></figure>`;
  const page = join(out, "sheet.html");
  await writeFile(page, `<!doctype html><meta charset=utf-8><style>body{margin:0;padding:16px;width:${SHEET_WIDTH}px;background:#ececec;font:600 20px system-ui;display:grid;grid-template-columns:repeat(${Number(args.cols ?? 4)},1fr);gap:16px;align-items:start}figure{margin:0}img{max-width:100%;display:block;background:#fff}figcaption{padding:6px 0}</style>${frames.map(tile).join("")}`);

  const { tab, cdp } = await ready();
  await viewport(cdp, SHEET_WIDTH + 32, 900);
  await cdp.navigate(`file://${page}`);
  await cdp.evaluate("Promise.all([...document.images].map((i) => i.decode()))");
  await viewport(cdp, SHEET_WIDTH + 32, await cdp.evaluate("document.documentElement.scrollHeight"));
  const file = await shoot(cdp, resolve(args.to ?? join(out, "sheet.png")));
  cdp.close();
  await tab.close();
  return { sheet: file, frames: frames.length };
};

// Parallel runs share one --out folder: each run owns runs/<scope>.json, and manifest.json is rebuilt from all of them.
const saveManifest = async (result) => {
  const scope = String(args.options ?? args.list ?? "all").replace(/[^\w.-]+/g, "_");
  const dir = join(out, "runs");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, `${scope}.json`), JSON.stringify({ at: new Date().toISOString(), scope, ...result }, null, 2));
  const runs = await Promise.all((await readdir(dir)).filter((f) => f.endsWith(".json")).map(async (f) => JSON.parse(await readFile(join(dir, f), "utf8"))));
  runs.sort((a, b) => a.at.localeCompare(b.at));
  const shots = [...new Map(runs.flatMap((r) => r.shots ?? []).map((s) => [s.file, s])).values()];
  const manifest = { at: runs.at(-1).at, shots, errors: runs.flatMap((r) => r.errors ?? []), runs: runs.map(({ shots: _, ...r }) => r) };
  await writeFile(join(out, "manifest.json"), JSON.stringify(manifest, null, 2));
};

let closeTab = async () => {};
try {
  const result = await (mode === "signin" ? signin() : mode === "refs" ? refs() : mode === "sheet" ? sheet() : mock());
  if (mode === "refs" || mode === "mock") await saveManifest(result);
  console.log(JSON.stringify(result, null, 2));
  if (result.errors?.length) process.exit(3);
} catch (err) {
  await closeTab();
  console.error(err instanceof Exit ? err.message : String(err));
  process.exit(err instanceof Exit ? err.code : 1);
}

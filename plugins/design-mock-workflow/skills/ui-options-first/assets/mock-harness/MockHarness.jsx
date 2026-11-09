"use client";
// Mock harness: the toolbar, size frames, overlays, feedback pins, filters and checks every
// options-first mock ships with. Copy this file into the mock route folder (an app cannot import
// from the skill directory); it needs React only. Throwaway mock code: delete it with the route.
//
//   import C1, { play as c1Play } from "./c1";     // each option file exports its own play
//
//   export default function Page() {
//     const { mode, setMode } = useThemeModeOfThisProject();
//     return (
//       <MockHarness
//         name="ingestion"                         // localStorage key prefix for pins
//         theme={mode} setTheme={setMode}          // "light" | "dark"; omit to follow the system
//         states={["populated", "loading", "empty", "error", "overflow", "first-run"]}
//         options={{
//           S1: { label: "Health table", track: "Simple", render: ({ state, reduce }) => <S1 state={state} /> },
//           C1: { label: "Flow", track: "Creative", render: ({ state }) => <C1 state={state} />,
//                 play: (p) => c1Play(p) },  // c1.tsx: export const play = async (p) => { await p.click("[data-act=retry]"); await p.wait(800); };
//         }}
//         grades={{ S1: { sketch: "56/60", author: 88, graders: [83, 80, 86], floors: "", fixes: "…" } }}
//         allow={{ colours: ["rgb(189,189,189)"], radii: ["4px"], fonts: [] }}  // the platform kit's "Allowed extras"
//       />
//     );
//   }
//
// Mark sections in the option code: data-tier="primary|secondary|tertiary|contextual" plus
// data-axes="daily · high value · glance (estimated)" feed the H overlay; data-why="…" feeds the ? pins.
// Keys: 1-9 option · S state · H tiers · ? rationale · F feedback · V size · Shift+V all sizes ·
// B blur · M greyscale · R reduced motion · G grades · P play. Keys are ignored while typing.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const PRESETS = [[390, 844, "Phone"], [834, 1194, "Tablet"], [1280, 800, "Laptop"], [1440, 900, "Desktop"], [1920, 1080, "Wide"], [2560, 1440, "Ultra-wide"]];
const TIERS = { primary: "#e5484d", secondary: "#f5a524", tertiary: "#3e9bff", contextual: "#8e4ec6" };
const FILTERS = { blur: "blur(6px)", mono: "grayscale(1)" };
const CHROME = { position: "fixed", zIndex: 2147483000, font: "500 12px/1.3 system-ui, sans-serif", color: "#f4f4f5" };
const PANEL = { background: "rgb(24 24 27 / .96)", border: "1px solid rgb(255 255 255 / .1)", borderRadius: 12, boxShadow: "0 1px 2px rgb(0 0 0/.3), 0 12px 40px -8px rgb(0 0 0/.5)" };
const qs = () => (typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search));
const systemTheme = () => (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; };

export default function MockHarness({ name = "mock", options, states = ["populated"], theme: themeProp, setTheme, grades = {}, presets = PRESETS, allow = {} }) {
  const ids = Object.keys(options);
  const framed = qs().get("frame") === "1";
  const [option, setOption] = useState(() => (ids.includes(qs().get("o")) ? qs().get("o") : ids[0]));
  const [state, setState] = useState(() => (states.includes(qs().get("s")) ? qs().get("s") : states[0]));
  const [sysTheme, setSysTheme] = useState("light");
  const [filter, setFilter] = useState("");
  const [reduce, setReduce] = useState(false);
  const [layer, setLayer] = useState({ tiers: false, why: false, fb: false, grades: false });
  const [vp, setVp] = useState("full");
  const [checks, setChecks] = useState(null);
  const theme = themeProp ?? sysTheme;
  const live = useRef({});
  live.current = { option, state, theme, filter, reduce };

  useEffect(() => {
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => setSysTheme(systemTheme());
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);

  const apply = useCallback((next) => {
    if (next.option && ids.includes(next.option)) setOption(next.option);
    if (next.state && states.includes(next.state)) setState(next.state);
    if (next.theme && next.theme !== live.current.theme) setTheme?.(next.theme);
    if (typeof next.filter === "string") setFilter(next.filter);
    if (typeof next.reduce === "boolean") setReduce(next.reduce);
  }, [ids.join(), states.join(), setTheme]);

  // The capture script and the size probes drive the mock through this; current() is what they verify.
  useEffect(() => {
    window.__mockAllow = allow;
    window.__mock = {
      meta: () => ({ name, options: ids, states, tracks: Object.fromEntries(ids.map((id) => [id, options[id].track])) }),
      set: apply,
      current: () => ({ option: live.current.option, state: live.current.state, theme: live.current.theme }),
      filter: (css) => setFilter(css),
      runChecks: (selector) => runChecks(selector ? document.querySelector(selector) : undefined),
      runSizeChecks: () => runSizeChecks(live.current.option, live.current.state, presets)
    };
  }, [apply]);

  // Frames follow the parent: the parent posts its state; a frame applies it.
  useEffect(() => {
    if (!framed) return;
    const on = (e) => e.data?.__mock && apply(e.data.__mock);
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  }, [framed, apply]);
  useEffect(() => {
    if (framed) return;
    document.querySelectorAll("iframe[data-vp]").forEach((f) => f.contentWindow?.postMessage({ __mock: { option, state, theme, filter, reduce } }, "*"));
  }, [framed, option, state, theme, filter, reduce, vp]);

  useEffect(() => {
    if (framed) return;
    const toggle = (k) => setLayer((l) => ({ ...l, [k]: !l[k] }));
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea, select, [contenteditable], [role=combobox], [role=listbox]")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      const n = Number(k);
      if (n >= 1 && n <= ids.length) return setOption(ids[n - 1]);
      if (k === "s" || k === "S") return setState((s) => states[(states.indexOf(s) + 1) % states.length]);
      if (k === "h" || k === "H") return toggle("tiers");
      if (k === "?") return toggle("why");
      if (k === "f" || k === "F") return toggle("fb");
      if (k === "g" || k === "G") return toggle("grades");
      if (k === "b" || k === "B") return setFilter((f) => (f === FILTERS.blur ? "" : FILTERS.blur));
      if (k === "m" || k === "M") return setFilter((f) => (f === FILTERS.mono ? "" : FILTERS.mono));
      if (k === "r" || k === "R") return setReduce((r) => !r);
      if (k === "p" || k === "P") return play(options[live.current.option]?.play);
      if (k === "v") return setVp((v) => { const list = ["full", ...presets.map(([w]) => w)]; return list[(list.indexOf(v) + 1) % list.length]; });
      if (k === "V") return setVp((v) => (v === "all" ? "full" : "all"));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [framed, ids.join(), states.join()]);

  const current = options[option];
  const stage = (
    <div data-stage data-mock-option={option} data-mock-state={state} data-reduce={reduce ? "" : undefined} style={{ position: "relative", minHeight: "100%", filter: filter || undefined, cursor: layer.fb ? "crosshair" : undefined }}>
      <style>{`[data-reduce] *, [data-reduce] *::before, [data-reduce] *::after { transition: none !important; animation: none !important; }
@keyframes mock-in { from { opacity: 0 } } [data-mock-swap] { animation: mock-in 200ms ease-out } @media (prefers-reduced-motion: reduce) { [data-mock-swap] { animation: none } }`}</style>
      <div key={option} data-mock-swap="">{current.render({ state, reduce, theme })}</div>
      {!framed && layer.tiers && <Tiers deps={[option, state, vp]} />}
      {!framed && layer.why && <Why deps={[option, state]} />}
      {!framed && <Feedback on={layer.fb} name={name} option={option} state={state} theme={theme} />}
    </div>
  );
  if (framed) return stage;
  return (
    <>
      {vp === "full" ? stage : <Sizes vp={vp} presets={presets} option={option} state={state} />}
      <Toolbar {...{ ids, options, option, setOption, states, state, setState, layer, setLayer, filter, setFilter, reduce, setReduce, vp, setVp, presets, theme, setTheme, grades, checks, setChecks }} onPlay={() => play(current.play)} />
      {layer.grades && <Grades {...{ ids, options, option, grades, checks }} close={() => setLayer((l) => ({ ...l, grades: false }))} />}
    </>
  );
}

// ---------- toolbar ----------
const Btn = ({ on, onClick, children, title }) => (
  <button type="button" aria-pressed={on} title={title} onClick={onClick} style={{ all: "unset", cursor: "pointer", padding: "6px 9px", borderRadius: 8, background: on ? "rgb(255 255 255 / .16)" : "transparent", color: on ? "#fff" : "#a1a1aa" }}>{children}</button>
);
function Toolbar(p) {
  const [open, setOpen] = useState(true);
  const [busy, setBusy] = useState(false);
  const flip = (k) => p.setLayer((l) => ({ ...l, [k]: !l[k] }));
  const check = async () => { setBusy(true); const a = await runChecks(); const b = await runSizeChecks(p.option, p.state, p.presets); p.setChecks({ ...a, sizes: b }); p.setLayer((l) => ({ ...l, grades: true })); setBusy(false); };
  if (!open) return <div data-mock-chrome style={{ ...CHROME, ...PANEL, bottom: 16, right: 16, padding: 4 }}><Btn onClick={() => setOpen(true)} title="Show mock toolbar">Mock ▴</Btn></div>;
  return (
    <div data-mock-chrome style={{ ...CHROME, ...PANEL, bottom: 16, left: "50%", transform: "translateX(-50%)", padding: 6, display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", maxWidth: "calc(100vw - 32px)" }}>
      {p.ids.map((id, i) => (
        <Btn key={id} on={p.option === id} onClick={() => p.setOption(id)} title={`${p.options[id].track} · ${p.options[id].label} (${i + 1})`}>
          <span style={{ opacity: 0.6, marginRight: 4 }}>{p.options[id].track === "Creative" ? "C" : "S"}</span>{id}
        </Btn>
      ))}
      <span style={{ width: 1, height: 20, background: "rgb(255 255 255 / .12)", margin: "0 4px" }} />
      <select value={p.state} onChange={(e) => p.setState(e.target.value)} title="State (S)" style={{ background: "transparent", color: "#f4f4f5", border: 0, font: "inherit" }}>
        {p.states.map((s) => <option key={s} value={s} style={{ color: "#000" }}>{s}</option>)}
      </select>
      <select value={String(p.vp)} onChange={(e) => p.setVp(e.target.value === "full" || e.target.value === "all" ? e.target.value : Number(e.target.value))} title="Screen size (V, Shift+V all)" style={{ background: "transparent", color: "#f4f4f5", border: 0, font: "inherit" }}>
        <option value="full" style={{ color: "#000" }}>Full width</option>
        {p.presets.map(([w, h, n]) => <option key={w} value={w} style={{ color: "#000" }}>{n} · {w} × {h}</option>)}
        <option value="all" style={{ color: "#000" }}>All sizes</option>
      </select>
      {p.setTheme && <Btn onClick={() => p.setTheme(p.theme === "dark" ? "light" : "dark")} title="Theme">{p.theme === "dark" ? "Dark" : "Light"}</Btn>}
      <Btn on={p.layer.tiers} onClick={() => flip("tiers")} title="Prominence tiers (H)">Tiers</Btn>
      <Btn on={p.layer.why} onClick={() => flip("why")} title="Rationale pins (?)">Why</Btn>
      <Btn on={p.layer.fb} onClick={() => flip("fb")} title="Feedback pins (F)">Pins</Btn>
      <Btn on={p.filter === FILTERS.blur} onClick={() => p.setFilter(p.filter === FILTERS.blur ? "" : FILTERS.blur)} title="Squint test: hierarchy should still read (B)">Blur</Btn>
      <Btn on={p.filter === FILTERS.mono} onClick={() => p.setFilter(p.filter === FILTERS.mono ? "" : FILTERS.mono)} title="Greyscale test: hierarchy without colour (M)">Mono</Btn>
      <Btn on={p.reduce} onClick={() => p.setReduce(!p.reduce)} title="Reduced motion (R)">Still</Btn>
      {p.options[p.option].play && <Btn onClick={p.onPlay} title="Play the primary flow (P)">▶ Play</Btn>}
      <Btn on={busy} onClick={check} title="Run contrast and size checks">{busy ? "Checking…" : "Checks"}</Btn>
      <Btn on={p.layer.grades} onClick={() => flip("grades")} title="Grades (G)">Grades</Btn>
      <Btn onClick={() => setOpen(false)} title="Hide toolbar">▾</Btn>
    </div>
  );
}

// ---------- prominence tiers (H) and rationale pins (?) ----------
const useRects = (selector, deps) => {
  const [rects, setRects] = useState([]);
  useLayoutEffect(() => {
    const stage = document.querySelector("[data-stage]");
    const read = () => {
      const s = stage.getBoundingClientRect();
      setRects([...stage.querySelectorAll(selector)].map((el) => ({ el, r: el.getBoundingClientRect(), s })));
    };
    read();
    const t = setTimeout(read, 400);
    window.addEventListener("resize", read);
    return () => { clearTimeout(t); window.removeEventListener("resize", read); };
  }, deps);
  return rects;
};
function Tiers({ deps }) {
  const rects = useRects("[data-tier]", deps);
  return rects.map(({ el, r, s }, i) => {
    const tier = el.dataset.tier;
    return (
      <div key={i} data-mock-chrome style={{ position: "absolute", left: r.left - s.left, top: r.top - s.top, width: r.width, height: r.height, outline: `2px solid ${TIERS[tier] ?? "#888"}`, background: `${TIERS[tier] ?? "#888"}14`, pointerEvents: "none", zIndex: 50 }}>
        <span style={{ ...CHROME, position: "absolute", top: -1, left: -1, padding: "2px 6px", background: TIERS[tier] ?? "#888", borderRadius: "0 0 6px 0" }}>{tier}{el.dataset.axes ? ` · ${el.dataset.axes}` : ""}</span>
      </div>
    );
  });
}
function Why({ deps }) {
  const rects = useRects("[data-why]", deps);
  const [open, setOpen] = useState(null);
  return rects.map(({ el, r, s }, i) => (
    <button key={i} type="button" data-mock-chrome onClick={() => setOpen(open === i ? null : i)} style={{ all: "unset", cursor: "pointer", position: "absolute", left: r.right - s.left - 10, top: r.top - s.top - 10, zIndex: 60 }}>
      <span style={{ ...CHROME, position: "static", display: "grid", placeItems: "center", width: 20, height: 20, borderRadius: 99, background: "#3e63dd" }}>{i + 1}</span>
      {open === i && <span style={{ ...CHROME, ...PANEL, position: "absolute", top: 24, right: 0, width: 260, padding: 10, fontWeight: 400 }}>{el.dataset.why}</span>}
    </button>
  ));
}

// ---------- feedback pins (F) ----------
const describe = (el) => {
  const label = el.closest("[aria-label]")?.getAttribute("aria-label") ?? el.closest("[data-tier]")?.dataset.tier ?? "";
  const role = el.getAttribute("role") ?? el.tagName.toLowerCase();
  return `${role} "${(el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 48)}"${label ? ` in ${label.slice(0, 60)}` : ""}`;
};
function Feedback({ on, name, option, state, theme }) {
  const key = `${name}-pins`;
  const read = () => { try { return JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { return []; } };
  const [list, setList] = useState([]);
  const [draft, setDraft] = useState(null);
  useEffect(() => setList(read()), []);
  const save = (next) => { setList(next); try { localStorage.setItem(key, JSON.stringify(next)); } catch {} };
  useEffect(() => {
    if (!on) return setDraft(null);
    const stage = document.querySelector("[data-stage]");
    const onClick = (e) => {
      if (e.target.closest("[data-mock-chrome]")) return;
      e.preventDefault(); e.stopPropagation();
      const b = stage.getBoundingClientRect();
      setDraft({ x: e.clientX - b.left, y: e.clientY - b.top, el: describe(e.target), note: "" });
    };
    stage.addEventListener("click", onClick, true);
    return () => stage.removeEventListener("click", onClick, true);
  }, [on]);
  const mine = list.filter((p) => p.option === option && p.state === state && p.vw === window.innerWidth);
  const copy = () => navigator.clipboard?.writeText(list.map((p, i) => `${i + 1}. [${p.option} · ${p.state} · ${p.theme} · ${p.vw}px] ${p.el}: ${p.note}`).join("\n"));
  return (
    <>
      {mine.map((p, i) => (
        <span key={i} data-mock-chrome title={p.note} style={{ ...CHROME, position: "absolute", left: p.x - 10, top: p.y - 10, width: 20, height: 20, borderRadius: 99, display: "grid", placeItems: "center", background: "#e5484d", zIndex: 70 }}>{list.indexOf(p) + 1}</span>
      ))}
      {draft && (
        <div data-mock-chrome style={{ ...CHROME, ...PANEL, position: "absolute", left: Math.min(draft.x, window.innerWidth - 320), top: draft.y + 12, width: 280, padding: 10, display: "grid", gap: 8, zIndex: 80 }}>
          <span style={{ color: "#a1a1aa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{draft.el}</span>
          <textarea autoFocus rows={3} value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="What should change here?" style={{ font: "inherit", color: "#fff", background: "rgb(255 255 255 / .06)", border: "1px solid rgb(255 255 255 / .12)", borderRadius: 8, padding: 8 }} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
            <Btn onClick={() => setDraft(null)}>Cancel</Btn>
            <Btn on onClick={() => { if (draft.note.trim()) save([...list, { ...draft, option, state, theme, vw: window.innerWidth }]); setDraft(null); }}>Add pin</Btn>
          </div>
        </div>
      )}
      {on && list.length > 0 && (
        <div data-mock-chrome style={{ ...CHROME, ...PANEL, position: "fixed", top: 16, right: 16, padding: 4, display: "flex", gap: 2 }}>
          <Btn onClick={copy}>Copy feedback ({list.length})</Btn>
          <Btn onClick={() => save([])}>Clear</Btn>
        </div>
      )}
    </>
  );
}

// ---------- screen sizes (V, Shift+V): real iframes, so media queries see the preset's width ----------
function Sizes({ vp, presets, option, state }) {
  const box = useRef(null);
  const [room, setRoom] = useState(null);
  useLayoutEffect(() => {
    const measure = () => { const b = box.current.getBoundingClientRect(); setRoom({ w: b.width - 32, h: window.innerHeight - b.top - 96 }); };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const all = vp === "all";
  const list = all ? presets : presets.filter(([w]) => w === vp);
  const tallest = Math.max(...list.map(([, h]) => h));
  const scale = !room ? 1 : all ? Math.min(1, room.h / tallest) : Math.min(1, room.w / list[0][0], room.h / list[0][1]);
  return (
    <div ref={box} style={{ display: "flex", gap: 24, padding: 16, overflowX: all ? "auto" : undefined, justifyContent: all ? "flex-start" : "center", alignItems: "flex-start" }}>
      {list.map(([w, h, label]) => (
        <figure key={all ? w : "one"} style={{ margin: 0, display: "grid", gap: 8, justifyItems: "center", flexShrink: 0 }}>
          <figcaption style={{ ...CHROME, position: "static", color: "inherit", opacity: 0.7 }}>{label} · {w} × {h}{scale < 1 ? ` · ${Math.round(scale * 100)}%` : ""}</figcaption>
          <div style={{ position: "relative", overflow: "hidden", borderRadius: 12, width: w * scale, height: h * scale, boxShadow: "0 0 0 1px rgb(127 127 127 / .3), 0 12px 32px -12px rgb(0 0 0 / .25)" }}>
            <iframe data-vp={w} title={`${label} ${w} px`} src={`${window.location.pathname}?o=${option}&s=${state}&frame=1`} style={{ position: "absolute", top: 0, left: 0, border: 0, width: w, height: h, transform: `scale(${scale})`, transformOrigin: "0 0" }} />
          </div>
        </figure>
      ))}
    </div>
  );
}

// ---------- grades (G) ----------
function Grades({ ids, options, option, grades, checks, close }) {
  const row = (id) => {
    const g = grades[id] ?? {};
    const xs = g.graders ?? [];
    const spread = xs.length ? Math.max(...xs) - Math.min(...xs) : null;
    return (
      <tr key={id} style={{ background: id === option ? "rgb(255 255 255 / .06)" : undefined }}>
        <td style={{ padding: "4px 8px" }}>{options[id].track[0]} · {id}</td>
        <td style={{ padding: "4px 8px" }}>{g.sketch ?? "–"}</td>
        <td style={{ padding: "4px 8px" }}>{g.author ?? "–"}</td>
        <td style={{ padding: "4px 8px" }}>{xs.join(" / ") || "–"}</td>
        <td style={{ padding: "4px 8px", fontWeight: 700 }}>{median(xs) ?? "–"}{spread != null && spread >= 10 ? " ⚠" : ""}</td>
        <td style={{ padding: "4px 8px", color: g.floors ? "#ff8b8b" : undefined }}>{g.floors || "none"}</td>
      </tr>
    );
  };
  const lines = checks ? [...Object.values(checks.lines ?? {}), ...Object.values(checks.sizes?.lines ?? {})] : [];
  return (
    <aside data-mock-chrome style={{ ...CHROME, ...PANEL, top: 16, right: 16, width: 520, maxHeight: "calc(100vh - 120px)", overflow: "auto", padding: 14, fontWeight: 400 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><strong>Grades · median of graders is the grade</strong><Btn onClick={close}>Close</Btn></div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontVariantNumeric: "tabular-nums" }}>
        <thead><tr style={{ color: "#a1a1aa", textAlign: "left" }}><th>Option</th><th>Sketch</th><th>Author</th><th>Graders</th><th>Median</th><th>Floors</th></tr></thead>
        <tbody>{ids.map(row)}</tbody>
      </table>
      {grades[option]?.fixes && <p style={{ margin: "10px 0 0", color: "#d4d4d8" }}>Top fixes: {grades[option].fixes}</p>}
      {lines.length > 0 && <ul style={{ margin: "12px 0 0", paddingLeft: 16 }}>{lines.map(([ok, text], i) => <li key={i} style={{ color: ok ? "#8be9a8" : "#ff8b8b" }}>{text}</li>)}</ul>}
    </aside>
  );
}

// ---------- play: scripted clicks with a visible cursor ----------
async function play(script) {
  if (!script) return;
  const dot = document.createElement("span");
  dot.setAttribute("data-mock-chrome", "");
  dot.style.cssText = "position:fixed;z-index:2147483001;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:99px;background:#3e63dd;box-shadow:0 0 0 3px #fff;pointer-events:none;transition:left .6s ease-out,top .6s ease-out;left:50vw;top:50vh";
  document.body.appendChild(dot);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const to = async (sel) => { const el = document.querySelector(`[data-stage] ${sel}`); if (!el) throw new Error(`play: no ${sel}`); const r = el.getBoundingClientRect(); dot.style.left = `${r.left + r.width / 2}px`; dot.style.top = `${r.top + r.height / 2}px`; await wait(700); return el; };
  try {
    await script({ wait, move: to, click: async (sel) => (await to(sel)).click(), type: async (sel, text) => { const el = await to(sel); el.focus(); el.value = text; el.dispatchEvent(new Event("input", { bubbles: true })); } });
  } finally {
    await wait(400);
    dot.remove();
  }
}

// ---------- checks: contrast (both themes: run once per theme) and screen sizes ----------
const rgbaOf = (() => {
  let ctx;
  return (col) => {
    if (!ctx) { const c = document.createElement("canvas"); c.width = c.height = 1; ctx = c.getContext("2d", { willReadFrequently: true }); }
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillStyle = col; // canvas parses oklch, color-mix and named colours that a regex would miss
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
})();
const blend = (top, bottom) => [0, 1, 2].map((i) => top[i] * top[3] + bottom[i] * (1 - top[3])).concat(1);
const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const bgBehind = (el) => {
  const stack = [];
  for (let e = el; e; e = e.parentElement) { const c = rgbaOf(getComputedStyle(e).backgroundColor); if (c[3] > 0) { stack.push(c); if (c[3] >= 1) break; } }
  let acc = stack.length && stack[stack.length - 1][3] >= 1 ? stack.pop() : rgbaOf(getComputedStyle(document.body).backgroundColor);
  if (acc[3] < 1) acc = [255, 255, 255, 1];
  while (stack.length) acc = blend(stack.pop(), acc);
  return acc;
};
// Text cut by its own box or a clipping ancestor; scroll areas, aria-hidden and [data-clip-ok] are exempt.
export function clippedText(root, w = window) {
  const d = root.ownerDocument;
  const out = [];
  const walk = d.createTreeWalker(root, 4);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    const el = n.parentElement;
    const text = n.textContent.trim().slice(0, 40);
    if (!text || !el || el.closest("[aria-hidden=true], [data-mock-chrome], [data-clip-ok], style, script") || !el.getClientRects().length) continue;
    const cs = w.getComputedStyle(el);
    const strict = el.closest("h1, h2, h3, h4, h5, h6, button, [role=button], [role=tab]") || /^[\d.,%\s]+$/.test(text);
    if ((cs.textOverflow === "ellipsis" && el.scrollWidth > el.clientWidth + 1) || (parseInt(cs.webkitLineClamp) > 0 && el.scrollHeight > el.clientHeight + 1)) {
      if (strict || !el.closest("[title]")) out.push({ how: "truncated", text });
      continue;
    }
    const range = d.createRange();
    range.selectNodeContents(n);
    const t = range.getBoundingClientRect();
    if (!t.width) continue;
    const clip = clipper(el, w);
    if (!clip) continue;
    const a = clip.box.getBoundingClientRect();
    const dx = Math.max(a.left - t.left, t.right - a.right);
    const dy = clip.vertical ? Math.max(a.top - t.top, t.bottom - a.bottom) : 0;
    if (dx > 1 || dy > 1) out.push({ how: dy > 1 ? "cut top/bottom" : clip.vertical ? "cut side" : "needs sideways scroll", text });
  }
  return out;
}
// Nearest clipping ancestor. In a scroll container only a side cut counts: below the fold is reachable, past the side needs sideways scroll.
const clipper = (el, w) => {
  for (let a = el; a && a !== a.ownerDocument.body; a = a.parentElement) {
    const o = w.getComputedStyle(a);
    const axes = [o.overflowX, o.overflowY];
    if (axes.some((v) => v === "auto" || v === "scroll")) return { box: a, vertical: false };
    if (axes.some((v) => v === "hidden" || v === "clip")) return { box: a, vertical: true };
  }
  return null;
};

// Colours, radii and fonts must be tokens or already used by the live platform UI on the same page.
const PAINT = ["color", "backgroundColor", "borderTopColor"];
const family = (f) => f.split(",")[0].trim().replace(/['"]/g, "");
const tag = (el) => `${el.tagName.toLowerCase()}${String(el.className?.baseVal ?? el.className ?? "").split(/\s+/).slice(0, 3).map((c) => (c ? `.${c}` : "")).join("")}`;
const platformVocabulary = (root) => {
  const css = getComputedStyle(document.documentElement);
  const colours = [], radii = new Set(["0px"]), fonts = new Set();
  const probe = document.body.appendChild(document.createElement("div"));
  for (const p of css) {
    const v = p.startsWith("--") ? css.getPropertyValue(p).trim() : "";
    if (!v) continue;
    if (CSS.supports("color", v)) colours.push(rgbaOf(v));
    if (/radius/.test(p)) { probe.style.borderRadius = `var(${p})`; radii.add(getComputedStyle(probe).borderTopLeftRadius); }
    if (/font/.test(p) && !/size|weight|leading|tracking/.test(p)) fonts.add(family(v));
  }
  probe.remove();
  for (const el of document.body.querySelectorAll("*")) {
    if (root.contains(el) || el.closest("[data-mock-chrome]")) continue;
    const cs = getComputedStyle(el);
    PAINT.forEach((k) => colours.push(rgbaOf(cs[k])));
    radii.add(cs.borderTopLeftRadius);
    fonts.add(family(cs.fontFamily));
  }
  // Values the platform kit measured on other live pages (components this page doesn't show).
  const allow = window.__mockAllow ?? {};
  (allow.colours ?? []).forEach((c) => colours.push(rgbaOf(c)));
  (allow.radii ?? []).forEach((r) => radii.add(r));
  (allow.fonts ?? []).forEach((f) => fonts.add(f));
  return { colours: colours.filter((c) => c[3] > 0), radii, fonts };
};
export function fidelity(root) {
  const v = platformVocabulary(root);
  // A faint tint reads back from the canvas imprecisely, so tolerance widens as alpha drops.
  const known = (c) => v.colours.some((t) => [0, 1, 2].every((i) => Math.abs(t[i] - c[i]) <= Math.max(2, 3 / c[3])));
  const off = { colour: new Map(), radius: new Map(), font: new Map() };
  const bump = (m, k, el) => m.set(k, { n: (m.get(k)?.n ?? 0) + 1, at: m.get(k)?.at ?? tag(el) });
  for (const el of root.querySelectorAll("*")) {
    if (el.closest("[data-mock-chrome], style, script")) continue;
    const cs = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    PAINT.forEach((k) => {
      if (k === "borderTopColor" && !parseFloat(cs.borderTopWidth)) return;
      const c = rgbaOf(cs[k]);
      if (c[3] > 0 && !known(c)) bump(off.colour, `rgb(${c.slice(0, 3).join(",")})`, el);
    });
    const r = cs.borderTopLeftRadius;
    if (!v.radii.has(r) && parseFloat(r) < Math.min(box.width, box.height) / 2 - 1) bump(off.radius, r, el);
    if ([...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()) && !v.fonts.has(family(cs.fontFamily))) bump(off.font, family(cs.fontFamily), el);
  }
  return off;
}
const listOff = (m) => [...m].slice(0, 4).map(([k, x]) => `${k} ×${x.n} (${x.at})`).join(", ");

export async function runChecks(root = document.querySelector("[data-stage]")) {
  const theme = document.documentElement.classList.contains("dark") || document.documentElement.dataset.theme?.includes("dark") ? "dark" : "light";
  const text = [];
  root.querySelectorAll("*").forEach((el) => {
    const hasText = [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim());
    if (!hasText || !el.getClientRects().length || el.closest("[aria-hidden=true], [data-mock-chrome], [aria-busy=true]")) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden") return;
    let op = 1;
    for (let e = el; e && e !== root; e = e.parentElement) op *= Number(getComputedStyle(e).opacity);
    if (op < 0.6) return;
    const bg = bgBehind(el);
    const r = ratio(blend(rgbaOf(cs.color), bg), bg);
    const px = parseFloat(cs.fontSize);
    const need = px >= 24 || (Number(cs.fontWeight) >= 700 && px >= 18.66) ? 3 : 4.5;
    text.push({ text: el.textContent.trim().slice(0, 40), r: Math.round(r * 100) / 100, need, ok: r >= need });
  });
  const fails = text.filter((t) => !t.ok);
  const ms = (v) => Math.max(...v.split(",").map((s) => parseFloat(s) * (s.includes("ms") ? 1 : 1000)));
  const slow = [...root.querySelectorAll("*")].filter((el) => ms(getComputedStyle(el).transitionDuration) > 500);
  const small = window.innerWidth < 768 ? [...root.querySelectorAll("button, a[href], input, select, textarea, [role=button], [role=tab], [role=checkbox]")].filter((el) => { const r = el.getBoundingClientRect(); return r.width && (r.width < 44 || r.height < 44); }) : [];
  const cut = clippedText(root);
  const off = fidelity(root);
  const offCount = off.colour.size + off.radius.size + off.font.size;
  return {
    theme, fails, cut, off,
    lines: {
      contrast: [!fails.length, `Text contrast · ${theme}: ${text.length - fails.length}/${text.length} pass${fails.length ? ` · ${fails.slice(0, 5).map((f) => `"${f.text}" ${f.r}:1`).join(", ")}` : ""}`],
      clipped: [!cut.length, `Clipped text: ${cut.length}${cut.length ? ` · ${cut.slice(0, 4).map((c) => `"${c.text}" ${c.how}`).join(", ")}` : ""}`],
      fidelity: [!offCount, `Platform fidelity · ${theme}: ${offCount ? [["colours", off.colour], ["radii", off.radius], ["fonts", off.font]].filter(([, m]) => m.size).map(([k, m]) => `${k} ${listOff(m)}`).join(" · ") : "every colour, radius and font is a token or already in the platform"}`],
      slow: [!slow.length, `Transitions over 500 ms: ${slow.length}`],
      touch: [!small.length, window.innerWidth < 768 ? `Touch targets under 44 px: ${small.length}` : "Touch targets: checked at phone and tablet sizes only"]
    }
  };
}
const measure = (w) => {
  const stage = w.document.querySelector("[data-stage]");
  const page = stage?.querySelector("[data-page]") ?? stage?.querySelector("[data-mock-swap]")?.firstElementChild;
  if (!page) return null;
  const s = stage.getBoundingClientRect();
  const pad = parseFloat(w.getComputedStyle(page).paddingLeft) || 0;
  const kids = [...page.children].map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0);
  const primary = stage.querySelector('[data-tier="primary"]')?.getBoundingClientRect();
  const clipped = clippedText(stage, w).length;
  return {
    left: kids.length ? Math.round(Math.min(...kids.map((r) => r.left)) - s.left - pad) : 0,
    right: kids.length ? Math.round(s.right - pad - Math.max(...kids.map((r) => r.right))) : 0,
    overflow: Math.max(w.document.documentElement.scrollWidth - w.innerWidth, 0),
    primaryTop: primary ? Math.round(primary.top) : null,
    fold: w.innerHeight,
    clipped
  };
};
export async function runSizeChecks(option, state, presets = PRESETS) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const probe = async ([w, h]) => {
    const f = document.createElement("iframe");
    f.setAttribute("aria-hidden", "true");
    f.style.cssText = `position:fixed;left:-40000px;top:0;width:${w}px;height:${h}px;border:0;visibility:hidden`;
    f.src = `${window.location.pathname}?o=${option}&s=${state}&frame=1`;
    document.body.appendChild(f);
    // A sign-in redirect can drop the query, so push the option in and measure only once the frame reports it.
    const ready = () => { const c = f.contentWindow?.__mock?.current?.(); return c && c.option === option && c.state === state; };
    for (let i = 0; i < 60 && !ready(); i++) { f.contentWindow?.__mock?.set?.({ option, state, reduce: true }); await sleep(500); }
    await sleep(600);
    const m = ready() ? measure(f.contentWindow) : null;
    f.remove();
    return { w, h, m };
  };
  const rows = await Promise.all(presets.map(probe));
  const ok = rows.filter((r) => r.m);
  const lost = rows.length - ok.length ? ` · ${rows.length - ok.length} didn't load` : "";
  const bad = (pred) => ok.filter((r) => pred(r.m));
  const at = (list, f) => list.map((r) => `${r.w} (${f(r.m)})`).join(", ");
  const empty = bad((m) => m.left > 48 || m.right > 48);
  const wide = bad((m) => m.overflow > 1);
  const sunk = bad((m) => m.primaryTop != null && m.primaryTop >= m.fold);
  const cut = bad((m) => m.clipped > 0);
  const all = ok.length === rows.length;
  return {
    rows,
    lines: {
      fill: [all && !empty.length, `Fills the width: ${ok.length - empty.length}/${rows.length}${empty.length ? ` · side space at ${at(empty, (m) => `${Math.max(m.left, m.right)} px`)}` : ""}${lost}`],
      overflow: [all && !wide.length, `No sideways scroll: ${ok.length - wide.length}/${rows.length}${wide.length ? ` · at ${at(wide, (m) => `${m.overflow} px`)}` : ""}`],
      fold: [all && !sunk.length, `Primary above the fold: ${ok.length - sunk.length}/${rows.length}${sunk.length ? ` · below at ${at(sunk, (m) => `top ${m.primaryTop}`)}` : ""}`],
      clipped: [all && !cut.length, `No clipped text: ${ok.length - cut.length}/${rows.length}${cut.length ? ` · at ${at(cut, (m) => `${m.clipped} elements`)}` : ""}`]
    }
  };
}

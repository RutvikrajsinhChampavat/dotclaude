#!/usr/bin/env node
// Counts how often the product's own source uses each styling class and each component variant/colour
// combo, then flags mock classes it never uses and combos it never or rarely uses.
// Zero dependencies. Run with --help for usage.

import { readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const USAGE = `Usage: node class-census.mjs <census|check> [flags]

census  Count styling classes and component variant/colour combos across the product's source
        (mock routes excluded).
        node class-census.mjs census --src src --exclude src/app/mock-a,src/app/mock-b \\
          --out design-mocks/class-census.json
        Prints the top classes per family and the top combos per component as markdown for the
        platform kit.

check   List classes in mock files that the product uses rarely or never, and component combos
        (<Button variant="contained" color="neutral">) never used, or used under --share of that
        component and fewer than 10 times (so a routine role like outlined error passes).
        node class-census.mjs check --census design-mocks/class-census.json [--share 0.05] <file>…
        A class or combo the product never or rarely uses is a new look; justify it as the option's
        named bold move or replace it with the product's own. Exit 3 when any class is never used
        or any combo is never or rarely used.`;

const FAMILIES = ["rounded", "bg", "text", "border", "shadow", "ring", "outline", "divide", "fill", "stroke", "font", "leading", "tracking", "opacity", "grayscale", "saturate", "brightness", "contrast", "invert", "sepia", "hue-rotate", "blur", "drop-shadow", "backdrop", "mix-blend"];
const MUI_DEFAULT_PROPS = {
  Button: { variant: "text", color: "primary" },
  IconButton: { color: "default" },
  Chip: { variant: "filled", color: "default" },
  Fab: { variant: "circular", color: "default" },
  ToggleButton: { color: "standard" },
  Badge: { variant: "standard", color: "default" },
  Alert: { variant: "standard" },
  TextField: { variant: "outlined" },
  LinearProgress: { variant: "indeterminate", color: "primary" },
  CircularProgress: { variant: "indeterminate", color: "primary" }
};
const COMBO_PROPS = ["variant", "color"];
const MIN_SAMPLE = 20;
const ROUTINE_USES = 10;
const CLASS = new RegExp(`(?<![\\w-])(?:[a-z0-9-]+:)*!?(-?(?:${FAMILIES.join("|")})(?:-[a-z0-9.\\[\\]/#%(),_-]+)?)!?(?![\\w-])`, "g");
const SOURCE = new Set([".tsx", ".ts", ".jsx", ".js", ".mjs", ".css"]);
const RARE = 3;

const [mode, ...rest] = process.argv.slice(2);
const args = Object.fromEntries(rest.reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]?.startsWith("--") ? true : all[i + 1] ?? true]] : acc), []));
const files = rest.filter((a, i) => !a.startsWith("--") && !rest[i - 1]?.startsWith("--"));
const familyOf = (cls) => FAMILIES.find((f) => cls.replace(/^-/, "").startsWith(f));
const classesIn = (text) => [...text.matchAll(CLASS)].map((m) => m[1]).filter((c) => c.length > 2);

// Opening tags of the components above, scanned to the `>` outside braces and quotes so arrow functions don't end a tag.
const tagsIn = (text) => {
  const tags = [];
  for (const m of text.matchAll(/<([A-Z]\w*)(?=[\s/>])/g)) {
    if (!MUI_DEFAULT_PROPS[m[1]]) continue;
    let depth = 0;
    let quote = null;
    let i = m.index + m[0].length;
    for (; i < text.length; i++) {
      const ch = text[i];
      if (quote) { if (ch === quote && text[i - 1] !== "\\") quote = null; continue; }
      if (ch === '"' || ch === "'" || ch === "`") quote = ch;
      else if (ch === "{") depth++;
      else if (ch === "}") depth--;
      else if (ch === ">" && depth === 0) break;
    }
    tags.push({ name: m[1], attrs: text.slice(m.index + m[0].length, i) });
  }
  return tags;
};

// Omitted props take MUI's default, so color="primary" on a Button counts the same as no color.
// null when a combo prop is dynamic or spread, since its value can't be read statically.
const comboOf = ({ name, attrs }) => {
  if (/\{\s*\.\.\./.test(attrs)) return null;
  const parts = [];
  for (const p of COMBO_PROPS) {
    const lit = attrs.match(new RegExp(`(?:^|\\s)${p}=(?:"([^"]*)"|'([^']*)'|\\{\\s*["'\`]([^"'\`]*)["'\`]\\s*\\})`));
    if (!lit && new RegExp(`(?:^|\\s)${p}=\\{`).test(attrs)) return null;
    const value = lit ? lit[1] ?? lit[2] ?? lit[3] : MUI_DEFAULT_PROPS[name][p];
    if (value) parts.push(`${p}=${value}`);
  }
  return parts.join(" ");
};

const walk = async (dir, skip) => {
  if (skip.some((s) => dir.startsWith(s))) return [];
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const nested = await Promise.all(entries.map((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return e.name === "node_modules" || e.name.startsWith(".") ? [] : walk(p, skip);
    return SOURCE.has(extname(e.name)) && !/\.(test|spec)\./.test(e.name) ? [p] : [];
  }));
  return nested.flat();
};

const census = async () => {
  const src = resolve(args.src ?? "src");
  const skip = String(args.exclude ?? "").split(",").filter(Boolean).map((p) => resolve(p));
  const paths = await walk(src, skip);
  const counts = {};
  const props = {};
  for (const p of paths) {
    const text = await readFile(p, "utf8");
    for (const c of classesIn(text)) counts[c] = (counts[c] ?? 0) + 1;
    for (const tag of tagsIn(text)) {
      const entry = (props[tag.name] ??= { total: 0, dynamic: 0, combos: {} });
      const combo = comboOf(tag);
      entry.total++;
      if (combo === null) entry.dynamic++;
      else entry.combos[combo] = (entry.combos[combo] ?? 0) + 1;
    }
  }
  const out = resolve(args.out ?? "design-mocks/class-census.json");
  await writeFile(out, JSON.stringify({ at: new Date().toISOString(), src, excluded: skip, files: paths.length, counts, props }, null, 1));
  const lines = FAMILIES.map((f) => {
    const top = Object.entries(counts).filter(([c]) => familyOf(c) === f).sort((a, b) => b[1] - a[1]).slice(0, 12);
    return top.length ? `| ${f} | ${top.map(([c, n]) => `\`${c}\` ${n}`).join(" · ")} |` : "";
  }).filter(Boolean);
  const comboLines = Object.entries(props).sort((a, b) => b[1].total - a[1].total).map(([name, e]) => {
    const top = Object.entries(e.combos).sort((a, b) => b[1] - a[1]).slice(0, 6);
    return `| ${name} | ${e.total} | ${top.map(([c, n]) => `\`${c}\` ${n} (${pct(n, e.total)})`).join(" · ")} |`;
  });
  console.log(`Census of ${paths.length} files → ${out}\n\n| Family | Most used (count) |\n|---|---|\n${lines.join("\n")}\n\n| Component | Uses | Most used variant/colour (count, share; dynamic props not counted) |\n|---|---|---|\n${comboLines.join("\n")}`);
};

const pct = (n, total) => `${((n / total) * 100).toFixed(1)}%`;

const check = async () => {
  if (!args.census || !files.length) { console.error(USAGE); process.exit(1); }
  const { counts, props } = JSON.parse(await readFile(resolve(args.census), "utf8"));
  const share = Number(args.share ?? 0.05);
  if (!props) console.error("This census has no component variant counts: re-run `census` to check combos.");
  const report = {};
  for (const f of files) {
    const text = await readFile(resolve(f), "utf8");
    const used = [...new Set(classesIn(text))];
    const never = used.filter((c) => !counts[c]);
    const rare = used.filter((c) => counts[c] && counts[c] < RARE).map((c) => `${c} (${counts[c]})`);
    const combos = props ? offPatternCombos(text, props, share) : [];
    if (never.length || rare.length || combos.length) report[f] = { never, rare, combos };
  }
  console.log(JSON.stringify(report, null, 2));
  if (Object.values(report).some((r) => r.never.length || r.combos.length)) process.exit(3);
};

// Off-pattern: never used, or under `share` of the component AND under ROUTINE_USES, so a small
// but deliberate role (outlined error for delete) still passes.
const offPatternCombos = (text, props, share) => {
  const seen = new Set();
  const found = [];
  for (const tag of tagsIn(text)) {
    const combo = comboOf(tag);
    const key = `${tag.name} ${combo}`;
    if (combo === null || seen.has(key)) continue;
    seen.add(key);
    const entry = props[tag.name];
    const n = entry?.combos[combo] ?? 0;
    const total = entry?.total ?? 0;
    if (n === 0) found.push(`${key}: never used (product has ${total} ${tag.name})`);
    else if (total >= MIN_SAMPLE && n < ROUTINE_USES && n / total < share) found.push(`${key}: ${n} of ${total} ${tag.name} (${pct(n, total)})`);
  }
  return found;
};

if (!mode || args.help || mode === "--help") { console.log(USAGE); process.exit(0); }
if (mode !== "census" && mode !== "check") { console.error(USAGE); process.exit(1); }
await (mode === "census" ? census() : check());

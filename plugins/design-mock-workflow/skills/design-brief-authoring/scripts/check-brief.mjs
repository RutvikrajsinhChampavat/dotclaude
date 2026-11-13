#!/usr/bin/env node
// Pre-send lint for a design brief. Exits 1 on anything a design tool with no codebase access
// cannot recover from. Semantic contradictions are out of reach; the consistency read covers those.
import { existsSync, readFileSync } from "node:fs";
import { basename } from "node:path";

const USAGE = "usage: node check-brief.mjs <brief.md> [--allow <check-id>]...\n";

const LINE_CHECKS = [
  { id: "unverified", pattern: /\bUNVERIFIED\b/, message: "unverified fact left in the brief; cut it or verify it" },
  {
    id: "self-grading",
    pattern: /\/100\b|\brubrics?\b|\bscor(e|ing) (each|every|the|all)\b|\bweighted\b|\bcomparison matrix\b|\bscorecard\b/i,
    message: "selection criteria or self-grading; ask for a thesis and a prose recommendation instead",
  },
  {
    id: "unresolved-colour",
    pattern: /oklch\(|\bvar\(--|color-mix\(/i,
    message: "colour is not a resolved literal; convert it to hex",
  },
  {
    id: "implementation",
    pattern: /\bclassName\b|\bsx=|\bprops\b|<[A-Z][A-Za-z]+[\s/>]|\buse[A-Z][A-Za-z]+\(|\.(tsx|jsx|vue|svelte)\b/,
    message: "implementation detail in a design-only brief; describe the behaviour instead",
  },
  {
    id: "personal-data",
    pattern: /[\w.+-]+@(?!example\.(com|org)\b)[\w-]+\.[a-z]{2,}|\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
    message: "real email or id leaving for an external tool; scrub it",
  },
];

const EXAMPLE_THESIS = /thesis[^.\n]{0,80}(\(|e\.g\.|for example|such as|like)\s*["“]/i;
const HEADING = /^(#{1,3})\s+(.+)$/;
const DESIGN_BAR = /design bar/i;
const ENGINEERING = /\b(data|tokens?|constraints|schema)\b/i;
const TOKENS = /\btokens?\b/i;
const THEME_COLUMN = /\b(light|dark|high contrast)\b/i;
const SINGLE_THEME = /\b(one theme|single theme|light only|dark only|no dark theme)\b/i;
const SCREEN_WIDTH = /\b\d{3,4}\s*(px)?\s*(wide|width)\b|\bscreen sizes?\b|\bviewport\b|\b(phone|tablet|laptop|desktop|wide|ultra-wide)\s+\d{3,4}\b/i;
const WIDTH_CONTEXT = /\b(wide|width|screen|viewport|monitor)\b|×/i;
const PIXEL_NUMBER = /\b(\d{3,4})\b/g;
const WIDE_MIN = 1920;
const WIDE_MAX = 3840;
const MOTION_HEADING = /\bmotion\b/i;
const REDUCED_MOTION = /reduced[- ]motion/i;
const NEEDS_API = /needs API/i;
const ABSENT_DATA = /\b(does not|doesn't|do not|don't|cannot|can't) (have|show|know|carry)\b/i;
const SPLIT_BOARDS = /\bevery (art)?board at every width\b|\b(art)?boards? (per|for each|for every) (state|width|screen size)\b/i;
const ONE_BOARD = /\bone (art)?board per direction\b/i;
const CONTROL_BAR = /\bcontrol bar\b/i;
const REAL_SIZE = /\b(real|actual) size\b|\b1:1\b/i;
const PROTOTYPE_HEADING = /\b(prototype|artboards?)\b/i;
const REQUESTS_HEADING = /^#{1,6}\s+Requests\b/i;
const ANY_HEADING = /^#{1,6}\s/;
const TABLE_RULE = /^\s*\|[\s:|-]+\|\s*$/;
const LIST_ITEM = /^\s*([-*]|\d+[.)])\s/;
const FAILURE = /\b(fail(s|ed|ing|ure)?|error|interrupted|offline|time[sd]? out)\b/i;
const NEEDS_LABEL = /needs (API|system change)/i;
const BACKEND_MARKS = /\bbackend marks?\b/i;
const SHIPS_TODAY = /\bships today\b/i;

function parseArgs(argv) {
  const [path, ...rest] = argv;
  if (!path || path.startsWith("--")) return null;

  const allowed = rest.flatMap((arg, i) => (rest[i - 1] === "--allow" ? [arg] : []));
  return { path, allowed: new Set(allowed) };
}

function lineFindings(lines) {
  return lines.flatMap((text, i) => {
    const hits = LINE_CHECKS.filter((check) => check.pattern.test(text));
    const thesis = EXAMPLE_THESIS.test(`${text} ${lines[i + 1] ?? ""}`) && /thesis/i.test(text);
    const all = thesis
      ? [...hits, { id: "example-thesis", message: "example theses steer the tool; ask for a thesis, give none" }]
      : hits;
    return all.map((check) => ({ line: i + 1, id: check.id, message: check.message }));
  });
}

function headings(lines) {
  return lines.flatMap((text, i) => {
    const match = HEADING.exec(text);
    return match ? [{ line: i + 1, level: match[1].length, title: match[2] }] : [];
  });
}

function designBarFirst(heads) {
  const bar = heads.find((h) => DESIGN_BAR.test(h.title));
  if (!bar) return [{ line: 1, id: "design-bar-first", message: "no design bar section" }];

  const early = heads.find((h) => ENGINEERING.test(h.title) && h.line < bar.line);
  if (!early) return [];
  return [{ line: early.line, id: "design-bar-first", message: `"${early.title}" comes before the design bar` }];
}

function tokenThemes(lines, heads, text) {
  if (SINGLE_THEME.test(text)) return [];

  const section = heads.find((h) => TOKENS.test(h.title));
  if (!section) return [{ line: 1, id: "token-themes", message: "no tokens section; say so if there is no palette" }];

  const header = lines.slice(section.line).find((l) => l.trim().startsWith("|"));
  const themes = (header ?? "").split("|").filter((cell) => THEME_COLUMN.test(cell)).length;
  if (themes >= 2) return [];
  return [{ line: section.line, id: "token-themes", message: "token table lacks a column per theme" }];
}

function wideScreen(lines) {
  const widths = lines
    .filter((line) => WIDTH_CONTEXT.test(line))
    .flatMap((line) => [...line.matchAll(PIXEL_NUMBER)].map((match) => Number(match[1])));
  if (widths.some((w) => w >= WIDE_MIN && w <= WIDE_MAX)) return [];

  return [{ line: 1, id: "wide-screen", message: `no width of ${WIDE_MIN}px or more; wide layouts come back stretched` }];
}

function motionSection(heads, text) {
  const section = heads.find((h) => MOTION_HEADING.test(h.title));
  if (!section) return [{ line: 1, id: "motion", message: "no motion section; prototypes come back without transitions" }];

  if (REDUCED_MOTION.test(text)) return [];
  return [{ line: section.line, id: "motion", message: "motion section never states the reduced-motion version" }];
}

function singleBoard(lines, text) {
  const finding = (line, message) => ({ line, id: "single-board", message });
  const split = lines.flatMap((line, i) =>
    SPLIT_BOARDS.test(line) ? [finding(i + 1, "asks for an artboard per state or width; ask for one artboard per direction")] : [],
  );
  const missing = [
    { pattern: ONE_BOARD, message: "never asks for one artboard per direction; states and widths come back as separate artboards" },
    { pattern: CONTROL_BAR, message: "no control bar; states and widths cannot be reached inside one artboard" },
    { pattern: REAL_SIZE, message: "widths not asked for at real size; wide layouts get shrunk to fit" },
  ].filter((r) => !r.pattern.test(text));
  return [...split, ...missing.map((r) => finding(1, r.message))];
}

function costMarks(text) {
  if (!NEEDS_LABEL.test(text)) return [];

  const finding = (message) => ({ line: 1, id: "cost-marks", message });
  return [
    { pattern: BACKEND_MARKS, message: "needs API ideas get no mark on the artboard; ask for backend marks" },
    { pattern: SHIPS_TODAY, message: "no Ships today switch; nobody can see what ships without backend work" },
  ]
    .filter((r) => !r.pattern.test(text))
    .map((r) => finding(r.message));
}

function sectionOf(lines, heads, pattern) {
  const index = heads.findIndex((h) => pattern.test(h.title));
  if (index < 0) return null;

  const head = heads[index];
  const next = heads.slice(index + 1).find((h) => h.level <= head.level);
  return { line: head.line, lines: lines.slice(head.line, next ? next.line - 1 : lines.length) };
}

function listItems(lines) {
  return lines.reduce((items, line, i) => {
    if (!line.trim()) return items;
    if (LIST_ITEM.test(line) || !items.length || !lines[i - 1].trim()) return [...items, line];
    return [...items.slice(0, -1), `${items.at(-1)} ${line.trim()}`];
  }, []);
}

function requestNames(factsText) {
  const lines = factsText.split("\n");
  const start = lines.findIndex((line) => REQUESTS_HEADING.test(line));
  if (start < 0) return [];

  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => ANY_HEADING.test(line));
  return (end < 0 ? rest : rest.slice(0, end))
    .filter((line) => line.trim().startsWith("|") && !TABLE_RULE.test(line))
    .slice(1)
    .map((line) => line.split("|")[1].replace(/[*`]/g, "").trim())
    .filter(Boolean);
}

function namesItem(item, name, names) {
  const longer = names.map((n) => n.toLowerCase()).filter((n) => n.length > name.length && n.includes(name.toLowerCase()));
  const rest = longer.reduce((text, n) => text.split(n).join(" "), item);
  const word = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  return word.test(rest) && FAILURE.test(item);
}

function scenarioCoverage(path, lines, heads) {
  const finding = (line, message) => [{ line, id: "scenario-coverage", message }];
  const factsPath = path.replace(/\.md$/i, ".facts.md");
  if (!existsSync(factsPath)) return finding(1, `no ${basename(factsPath)} beside the brief; scenarios have nothing to come from`);

  const names = requestNames(readFileSync(factsPath, "utf8"));
  if (!names.length) return finding(1, "facts file has no Requests table; list every request the surface makes");

  const section = sectionOf(lines, heads, PROTOTYPE_HEADING);
  if (!section) return finding(1, "no prototype section to hold the scenarios");

  const items = listItems(section.lines).map((item) => item.toLowerCase());
  return names
    .filter((name) => !items.some((item) => namesItem(item, name, names)))
    .flatMap((name) => finding(section.line, `request "${name}" has no failure scenario in the prototype section`));
}

function requiredPresence(text) {
  const required = [
    { id: "screens", pattern: SCREEN_WIDTH, message: "no screen widths named; designs come back at one width" },
    { id: "needs-api", pattern: NEEDS_API, message: "no needs API label; data beyond the API has no visible cost" },
    { id: "absent-data", pattern: ABSENT_DATA, message: "nothing says what the data does NOT have" },
  ];
  return required.filter((r) => !r.pattern.test(text)).map((r) => ({ line: 1, id: r.id, message: r.message }));
}

function lint(text, path) {
  const lines = text.split("\n");
  const heads = headings(lines);
  return [
    ...lineFindings(lines),
    ...designBarFirst(heads),
    ...tokenThemes(lines, heads, text),
    ...wideScreen(lines),
    ...motionSection(heads, text),
    ...singleBoard(lines, text),
    ...costMarks(text),
    ...scenarioCoverage(path, lines, heads),
    ...requiredPresence(text),
  ].sort((a, b) => a.line - b.line);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args) {
    process.stderr.write(USAGE);
    process.exit(2);
  }

  const findings = lint(readFileSync(args.path, "utf8"), args.path).filter((f) => !args.allowed.has(f.id));
  findings.forEach((f) => process.stdout.write(`${args.path}:${f.line}: [${f.id}] ${f.message}\n`));
  process.stdout.write(findings.length ? `${findings.length} finding(s)\n` : "brief passes\n");
  process.exit(findings.length ? 1 : 0);
}

main();

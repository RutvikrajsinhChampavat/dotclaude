#!/usr/bin/env node
// Pre-send lint for a design brief. Exits 1 on anything a design tool with no codebase access
// cannot recover from. Semantic contradictions are out of reach; the consistency read covers those.
import { readFileSync } from "node:fs";

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
const HEADING = /^#{1,3}\s+(.+)$/;
const DESIGN_BAR = /design bar/i;
const ENGINEERING = /\b(data|tokens?|constraints|schema)\b/i;
const TOKENS = /\btokens?\b/i;
const THEME_COLUMN = /\b(light|dark|high contrast)\b/i;
const SINGLE_THEME = /\b(one theme|single theme|light only|dark only|no dark theme)\b/i;
const SCREEN_WIDTH = /\b\d{3,4}\s*(px)?\s*(wide|width)\b|\bscreen sizes?\b|\bviewport\b/i;
const NEEDS_API = /needs API/i;
const ABSENT_DATA = /\b(does not|doesn't|do not|don't|cannot|can't) (have|show|know|carry)\b/i;

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
    return match ? [{ line: i + 1, title: match[1] }] : [];
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

function requiredPresence(text) {
  const required = [
    { id: "screens", pattern: SCREEN_WIDTH, message: "no screen widths named; designs come back at one width" },
    { id: "needs-api", pattern: NEEDS_API, message: "no needs API label; data beyond the API has no visible cost" },
    { id: "absent-data", pattern: ABSENT_DATA, message: "nothing says what the data does NOT have" },
  ];
  return required.filter((r) => !r.pattern.test(text)).map((r) => ({ line: 1, id: r.id, message: r.message }));
}

function lint(text) {
  const lines = text.split("\n");
  const heads = headings(lines);
  return [
    ...lineFindings(lines),
    ...designBarFirst(heads),
    ...tokenThemes(lines, heads, text),
    ...requiredPresence(text),
  ].sort((a, b) => a.line - b.line);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args) {
    process.stderr.write(USAGE);
    process.exit(2);
  }

  const findings = lint(readFileSync(args.path, "utf8")).filter((f) => !args.allowed.has(f.id));
  findings.forEach((f) => process.stdout.write(`${args.path}:${f.line}: [${f.id}] ${f.message}\n`));
  process.stdout.write(findings.length ? `${findings.length} finding(s)\n` : "brief passes\n");
  process.exit(findings.length ? 1 : 0);
}

main();

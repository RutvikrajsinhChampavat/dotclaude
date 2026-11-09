#!/usr/bin/env node
// PostToolUse hook: lints any <surface>-brief.md the agent writes; exit 2 hands findings back to it.
// Checks judged harmless are allowed by `lint-allow: <id>` lines in <surface>-brief.facts.md.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BRIEF_FILE = /-brief\.md$/i;
const FACTS_SUFFIX = "-brief.facts.md";
const ALLOW_LINE = /^lint-allow:\s*([a-z-]+)\s*$/gim;
const LINT = join(dirname(fileURLToPath(import.meta.url)), "check-brief.mjs");
const FINDINGS_EXIT = 1;
const BLOCKING_EXIT = 2;

function editedPath(raw) {
  try {
    const path = JSON.parse(raw)?.tool_input?.file_path;
    return typeof path === "string" ? path : null;
  } catch (error) {
    process.stderr.write(`check-brief hook: unreadable hook input (${error.message})\n`);
    process.exit(1);
  }
}

function allowedChecks(briefPath) {
  const facts = briefPath.replace(BRIEF_FILE, FACTS_SUFFIX);
  if (!existsSync(facts)) return [];

  return [...readFileSync(facts, "utf8").matchAll(ALLOW_LINE)].flatMap((match) => ["--allow", match[1]]);
}

function lintFindings(briefPath) {
  try {
    execFileSync(process.execPath, [LINT, briefPath, ...allowedChecks(briefPath)], { encoding: "utf8" });
    return null;
  } catch (error) {
    if (error.status !== FINDINGS_EXIT) throw error;
    return error.stdout;
  }
}

function main() {
  const path = editedPath(readFileSync(0, "utf8"));
  if (!path || !BRIEF_FILE.test(path)) process.exit(0);

  const findings = lintFindings(path);
  if (!findings) process.exit(0);

  process.stderr.write(
    "Design brief check failed. Fix each finding, or add 'lint-allow: <check-id>' to the facts " +
      `file for one you read and judged harmless.\n${findings}`,
  );
  process.exit(BLOCKING_EXIT);
}

main();

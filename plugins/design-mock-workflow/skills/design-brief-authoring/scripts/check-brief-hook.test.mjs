import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const HOOK = process.env.HOOK_UNDER_TEST ?? join(dirname(fileURLToPath(import.meta.url)), "check-brief-hook.mjs");

function runHook(filePath) {
  const input = JSON.stringify({ tool_input: { file_path: filePath } });
  return spawnSync(process.execPath, [HOOK], { input, encoding: "utf8" });
}

function fileIn(dir, name, text = "# Draft\n") {
  const path = join(dir, name);
  writeFileSync(path, text);
  return path;
}

test("skips a skill reference file whose name only ends in -brief.md", () => {
  const dir = mkdtempSync(join(tmpdir(), "brief-hook-"));
  const result = runHook(fileIn(dir, "research-and-brief.md"));

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
});

test("skips a task brief with no facts file beside it", () => {
  const dir = mkdtempSync(join(tmpdir(), "brief-hook-"));
  const result = runHook(fileIn(dir, "task-1-brief.md"));

  assert.equal(result.status, 0, result.stderr);
});

test("blocks a design brief that has its facts file beside it", () => {
  const dir = mkdtempSync(join(tmpdir(), "brief-hook-"));
  fileIn(dir, "settings-brief.facts.md", "| Fact | Value | Proof |\n");
  const result = runHook(fileIn(dir, "settings-brief.md"));

  assert.equal(result.status, 2);
  assert.match(result.stderr, /Design brief check failed/);
});

test("passes a design brief when the facts file allows every check it trips", () => {
  const dir = mkdtempSync(join(tmpdir(), "brief-hook-"));
  const tripped = ["absent-data", "design-bar-first", "motion", "needs-api", "scenario-coverage", "screens", "single-board", "token-themes", "wide-screen"];
  fileIn(dir, "settings-brief.facts.md", tripped.map((id) => `lint-allow: ${id}`).join("\n"));
  const result = runHook(fileIn(dir, "settings-brief.md"));

  assert.equal(result.status, 0, result.stderr);
});

test("ignores a file that is not named as a brief", () => {
  const dir = mkdtempSync(join(tmpdir(), "brief-hook-"));
  const result = runHook(fileIn(dir, "notes.md"));

  assert.equal(result.status, 0);
});

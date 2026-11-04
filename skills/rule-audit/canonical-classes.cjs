#!/usr/bin/env node
// Flags Tailwind v4 classes on added lines that have an EXACT canonical form (IntelliSense's
// suggestCanonicalClasses), i.e. one that renders the same at any root font size.
//
// Usage, from the repo root (needs tailwindcss >= 4.1 and @tailwindcss/node installed there):
//   added-lines.sh "$REPO" | node ~/.claude/skills/rule-audit/canonical-classes.cjs [path/to/globals.css]
// stdin: path:line:text lines.  stdout: path:line: <class> -> <canonical>.  exit 1 when any found.
//
// No `rem` option is passed on purpose: with one, px values get rewritten to the rem spacing scale
// (gap-[10px] -> gap-2.5), which is NOT the same size when the app's root font is fluid.
const fs = require("fs");
const path = require("path");
const { createRequire } = require("module");

const cssPath = process.argv[2] || "src/app/globals.css";
const repoRequire = createRequire(path.join(process.cwd(), "package.json"));
const { __unstable__loadDesignSystem } = repoRequire("@tailwindcss/node");

const STRING = /(["'`])((?:\\.|(?!\1)[^\\])*)\1/g;
const CODE_FILE = /\.(tsx?|jsx?|mdx?|html|vue|svelte|astro)$/;

const main = async () => {
  const ds = await __unstable__loadDesignSystem(fs.readFileSync(cssPath, "utf8"), {
    base: path.dirname(path.resolve(cssPath))
  });
  if (typeof ds.canonicalizeCandidates !== "function") {
    console.error("tailwindcss in this repo has no canonicalizeCandidates (needs >= 4.1)");
    process.exit(2);
  }

  const lines = fs.readFileSync(0, "utf8").split("\n");
  const seen = new Map();
  let found = 0;

  for (const entry of lines) {
    const m = entry.match(/^([^:]+):(\d+):(.*)$/);
    if (!m || !CODE_FILE.test(m[1])) continue;

    for (const [, , body] of m[3].matchAll(STRING)) {
      for (const token of body.split(/\s+/)) {
        if (!token || token.includes("${")) continue;
        if (!seen.has(token)) {
          const isUtility = ds.candidatesToCss([token])[0] !== null;
          seen.set(token, isUtility ? ds.canonicalizeCandidates([token], {})[0] : token);
        }
        const canonical = seen.get(token);
        if (canonical && canonical !== token) {
          console.log(`${m[1]}:${m[2]}: ${token} -> ${canonical}`);
          found++;
        }
      }
    }
  }
  process.exit(found ? 1 : 0);
};

main().catch((error) => {
  console.error(error.message);
  process.exit(2);
});

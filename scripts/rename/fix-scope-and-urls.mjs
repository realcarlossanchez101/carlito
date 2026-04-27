#!/usr/bin/env node
/* eslint-disable curly */
// One-shot post-rebrand fixup. Replaces:
//   @carlito/<pkg>                           → @realcarlossanchez101/<pkg>
//   github.com/realcarlossanchez101/carlito               → github.com/realcarlossanchez101/carlito
//   docs.openclaw.ai / openclaw.ai have already been swept by apply-rebrand.mjs
//   to docs.carlito.ai / carlito.ai which already matches the user's chosen target.
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..", "..");

const SUBSTITUTIONS = [
  // Scope
  [/@carlito\/([a-z0-9-]+)/g, "@realcarlossanchez101/$1"],
  // Repo URL
  [/github\.com\/carlito\/carlito/g, "github.com/realcarlossanchez101/carlito"],
];

const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "dist-runtime",
  ".tmp",
  ".artifacts",
  ".local",
  ".cache",
  ".turbo",
  ".next",
  "build",
  ".pnpm-store",
  "DerivedData",
  ".gradle",
  ".idea",
  ".vs",
  ".vscode-test",
]);

const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
  ".json",
  ".json5",
  ".yml",
  ".yaml",
  ".toml",
  ".md",
  ".mdx",
  ".txt",
  ".swift",
  ".kt",
  ".kts",
  ".java",
  ".sh",
  ".bash",
  ".zsh",
  ".html",
  ".htm",
  ".xml",
  ".plist",
  ".entitlements",
  ".gradle",
  ".properties",
]);

function looksLikeText(p) {
  const ext = path.extname(p).toLowerCase();
  if (TEXT_EXTENSIONS.has(ext)) return true;
  const base = path.basename(p).toLowerCase();
  if (base === "package.json" || base === "tsconfig.json") return true;
  if (base.startsWith("dockerfile")) return true;
  return false;
}

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      yield* walk(full);
    } else if (e.isFile()) {
      yield full;
    }
  }
}

let edited = 0;
for await (const file of walk(REPO_ROOT)) {
  if (!looksLikeText(file)) continue;
  let buf;
  try {
    buf = await readFile(file, "utf8");
  } catch {
    continue;
  }
  let updated = buf;
  for (const [re, repl] of SUBSTITUTIONS) updated = updated.replace(re, repl);
  if (updated !== buf) {
    await writeFile(file, updated);
    edited++;
  }
}
console.log(`Edited ${edited} files.`);

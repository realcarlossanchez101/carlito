#!/usr/bin/env node
/* eslint-disable curly */
// One-shot rebrand tooling. NOT shipped — excluded from package.json `files`.
// Usage:
//   node scripts/rename/apply-rebrand.mjs --dry-run --include 'src/agents/**/*.ts'
//   node scripts/rename/apply-rebrand.mjs --include 'src/**' --exclude 'src/infra/state-migrations.ts'
//   node scripts/rename/apply-rebrand.mjs --rename-paths --include 'src/config/types.carlito.ts'
// See scripts/rename/RENAME_DENYLIST.txt for paths that must never be touched.
import { existsSync } from "node:fs";
import { readFile, writeFile, rename, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..", "..");
const DENYLIST_FILE = path.join(HERE, "RENAME_DENYLIST.txt");

const PATTERN = /carlito/gi;

// Mirrors src/agents/carlito-outbound-rewriter.ts:replaceCarlitoPreservingCase.
export function replacePreservingCase(input) {
  if (!input.includes("o") && !input.includes("O")) return input;
  return input.replace(PATTERN, (match) => {
    if (match === match.toUpperCase()) return "CARLITO";
    if (match[0] === match[0].toUpperCase()) return "Carlito";
    return "carlito";
  });
}

function parseArgs(argv) {
  const args = {
    include: [],
    exclude: [],
    dryRun: false,
    renamePaths: false,
    contentOnly: false,
    pathsOnly: false,
    files: [],
    verbose: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--rename-paths") args.renamePaths = true;
    else if (a === "--content-only") args.contentOnly = true;
    else if (a === "--paths-only") args.pathsOnly = true;
    else if (a === "--verbose" || a === "-v") args.verbose = true;
    else if (a === "--include") args.include.push(argv[++i]);
    else if (a === "--exclude") args.exclude.push(argv[++i]);
    else if (a === "--files-from") {
      const list = argv[++i];
      args.files.push(...readListFile(list));
    } else if (a === "--help" || a === "-h") {
      printHelp();
      process.exit(0);
    } else if (a.startsWith("--")) {
      throw new Error(`Unknown flag: ${a}`);
    } else {
      args.files.push(a);
    }
  }
  return args;
}

function printHelp() {
  console.log(`apply-rebrand.mjs — case-preserving carlito → carlito rename

Flags:
  --include <glob>       Add a glob to the include set (repeatable). If empty, includes everything.
  --exclude <glob>       Add a glob to the exclude set (repeatable). Combined with the denylist.
  --files-from <path>    Read additional file paths (one per line) from a file.
  --rename-paths         After content rewrites, also rename files/dirs whose path contains 'carlito' (any case).
  --content-only         Only rewrite file contents (default behavior).
  --paths-only           Only rename paths, do not modify content.
  --dry-run              Print what would change without writing.
  --verbose              Log every file touched.

Positional args are treated as additional file paths to process (relative to repo root).
`);
}

function readListFile(p) {
  const txt = require("node:fs").readFileSync(p, "utf8");
  return txt
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("#"));
}

// Minimal glob matcher: supports **, *, and literal segments. Sufficient for our use.
function globToRegex(glob) {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*\//g, "(?:.+/)?")
    .replace(/\*\*/g, ".*")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, "[^/]");
  return new RegExp(`^${escaped}$`);
}

function matchesAny(rel, regexes) {
  return regexes.some((re) => re.test(rel));
}

async function loadDenylist() {
  if (!existsSync(DENYLIST_FILE)) return [];
  const txt = await readFile(DENYLIST_FILE, "utf8");
  return txt
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("#"))
    .map(globToRegex);
}

async function* walkRepo(root) {
  // Avoid heavy dirs that don't carry source we need to rewrite.
  const SKIP = new Set([
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
  async function* walk(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name.startsWith(".DS_Store")) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (SKIP.has(e.name)) continue;
        yield* walk(full);
      } else if (e.isFile()) {
        yield full;
      }
    }
  }
  yield* walk(root);
}

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
  ".m",
  ".mm",
  ".h",
  ".hpp",
  ".c",
  ".cc",
  ".cpp",
  ".sh",
  ".bash",
  ".zsh",
  ".fish",
  ".ps1",
  ".html",
  ".htm",
  ".xml",
  ".xib",
  ".storyboard",
  ".plist",
  ".entitlements",
  ".pbxproj",
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".gradle",
  ".properties",
  ".rb",
  ".py",
  ".go",
  ".sql",
  ".graphql",
  ".gql",
  ".env",
  ".dockerfile",
]);

function looksLikeText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (TEXT_EXTENSIONS.has(ext)) return true;
  const base = path.basename(filePath).toLowerCase();
  if (base.startsWith("dockerfile") || base.startsWith(".env")) return true;
  if (base === "package.json" || base === "tsconfig.json") return true;
  return false;
}

async function isBinary(buf) {
  // Quick sniff: NUL byte in first 8KB.
  const slice = buf.subarray(0, Math.min(8192, buf.length));
  for (let i = 0; i < slice.length; i++) if (slice[i] === 0) return true;
  return false;
}

async function processFileContent(filePath, dryRun, verbose) {
  const buf = await readFile(filePath);
  if (await isBinary(buf)) return null;
  const original = buf.toString("utf8");
  if (!PATTERN.test(original)) return null;
  PATTERN.lastIndex = 0;
  const updated = replacePreservingCase(original);
  if (updated === original) return null;
  if (!dryRun) await writeFile(filePath, updated);
  if (verbose) console.log(`content: ${path.relative(REPO_ROOT, filePath)}`);
  return { kind: "content", path: filePath };
}

async function renamePath(oldPath, dryRun, verbose) {
  const dir = path.dirname(oldPath);
  const base = path.basename(oldPath);
  const newBase = replacePreservingCase(base);
  if (newBase === base) return null;
  const newPath = path.join(dir, newBase);
  if (existsSync(newPath)) {
    console.warn(
      `skip rename (target exists): ${path.relative(REPO_ROOT, oldPath)} → ${path.relative(REPO_ROOT, newPath)}`,
    );
    return null;
  }
  if (!dryRun) await rename(oldPath, newPath);
  if (verbose)
    console.log(
      `rename: ${path.relative(REPO_ROOT, oldPath)} → ${path.relative(REPO_ROOT, newPath)}`,
    );
  return { kind: "rename", from: oldPath, to: newPath };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const denylist = await loadDenylist();
  const includes = args.include.map(globToRegex);
  const excludes = args.exclude.map(globToRegex);

  const candidateFiles =
    args.files.length > 0
      ? args.files.map((f) => (path.isAbsolute(f) ? f : path.join(REPO_ROOT, f)))
      : await collectFromRepo(REPO_ROOT);

  let contentChanges = 0;
  let renameChanges = 0;
  const renameQueue = [];

  for (const abs of candidateFiles) {
    const rel = path.relative(REPO_ROOT, abs);
    if (rel.startsWith("..")) continue;
    if (matchesAny(rel, denylist)) continue;
    if (includes.length > 0 && !matchesAny(rel, includes)) continue;
    if (excludes.length > 0 && matchesAny(rel, excludes)) continue;

    if (!args.pathsOnly && looksLikeText(abs)) {
      try {
        const r = await processFileContent(abs, args.dryRun, args.verbose);
        if (r) contentChanges++;
      } catch (err) {
        console.warn(`skip content (${err.code || err.message}): ${rel}`);
      }
    }
    if (args.renamePaths || args.pathsOnly) {
      if (/carlito/i.test(path.basename(abs))) {
        renameQueue.push(abs);
      }
    }
  }

  // Rename leaves first, then walk up parents. Sort by depth descending.
  renameQueue.sort((a, b) => b.split(path.sep).length - a.split(path.sep).length);
  for (const oldPath of renameQueue) {
    if (!existsSync(oldPath)) continue; // parent already renamed
    try {
      const r = await renamePath(oldPath, args.dryRun, args.verbose);
      if (r) renameChanges++;
    } catch (err) {
      console.warn(
        `skip rename (${err.code || err.message}): ${path.relative(REPO_ROOT, oldPath)}`,
      );
    }
  }

  // Also rename carlito-named directories (only when --rename-paths and no specific files given).
  if ((args.renamePaths || args.pathsOnly) && args.files.length === 0) {
    await renameMatchingDirs(REPO_ROOT, denylist, includes, excludes, args.dryRun, args.verbose);
  }

  console.log(
    `\nDone. content_changes=${contentChanges} rename_changes=${renameChanges}${args.dryRun ? " (dry-run)" : ""}`,
  );
}

async function collectFromRepo(root) {
  const out = [];
  for await (const f of walkRepo(root)) out.push(f);
  return out;
}

async function renameMatchingDirs(root, denylist, includes, excludes, dryRun, verbose) {
  const SKIP = new Set([".git", "node_modules", "dist", "dist-runtime"]);
  // Collect candidate dirs first, deepest first.
  const candidates = [];
  async function walk(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      if (SKIP.has(e.name)) continue;
      const full = path.join(dir, e.name);
      await walk(full);
      if (/carlito/i.test(e.name)) candidates.push(full);
    }
  }
  await walk(root);
  candidates.sort((a, b) => b.split(path.sep).length - a.split(path.sep).length);
  for (const oldPath of candidates) {
    const rel = path.relative(REPO_ROOT, oldPath);
    if (matchesAny(rel, denylist)) continue;
    if (includes.length > 0 && !matchesAny(rel, includes)) continue;
    if (excludes.length > 0 && matchesAny(rel, excludes)) continue;
    if (!existsSync(oldPath)) continue;
    try {
      await renamePath(oldPath, dryRun, verbose);
    } catch (err) {
      console.warn(`skip dir rename (${err.code || err.message}): ${rel}`);
    }
  }
}

await main();

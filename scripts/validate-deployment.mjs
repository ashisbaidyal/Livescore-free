import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const syntaxOnly = process.argv.includes("--syntax-only");
const failures = [];
const notes = [];

function fail(message) {
  failures.push(message);
}

function note(message) {
  notes.push(message);
}

function assertFile(filePath) {
  const absolutePath = path.join(rootDir, filePath);
  if (!existsSync(absolutePath)) {
    fail(`Missing required file: ${filePath}`);
  }
}

function walkJsFiles(startDir) {
  const absoluteStart = path.join(rootDir, startDir);
  const files = [];

  if (!existsSync(absoluteStart)) {
    return files;
  }

  for (const entry of readdirSync(absoluteStart)) {
    const absolutePath = path.join(absoluteStart, entry);
    const relativePath = path.relative(rootDir, absolutePath);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      files.push(...walkJsFiles(relativePath));
      continue;
    }

    if (relativePath.endsWith(".js")) {
      files.push(relativePath);
    }
  }

  return files;
}

function runSyntaxCheck(filePath) {
  try {
    const source = readFileSync(path.join(rootDir, filePath), "utf8");
    const normalizedSource = source
      .replace(/^\s*import[\s\S]*?;\s*$/gm, "")
      .replace(/\bexport\s+(?=async function|function|const|let|var|class)/g, "");

    // Parse the file body without executing it.
    // Module-only import/export syntax is stripped above for function files.
    new Function(normalizedSource);
  } catch (error) {
    fail(`Syntax check failed for ${filePath}\n${error.message}`);
  }
}

function validateIndexHtml() {
  const indexHtml = readFileSync(path.join(rootDir, "index.html"), "utf8");

  if (!indexHtml.includes('<base href="/">')) {
    fail("index.html is missing <base href=\"/\"> for SPA deep-link asset loading.");
  }

  for (const requiredRef of ["/styles.css", "/api-config.js", "/app.js", "/manifest.json"]) {
    if (!indexHtml.includes(`"${requiredRef}"`) && !indexHtml.includes(`'${requiredRef}'`)) {
      fail(`index.html is missing required root-absolute reference: ${requiredRef}`);
    }
  }

  const refs = [...indexHtml.matchAll(/\b(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
  for (const ref of refs) {
    if (/^(?:[a-z]+:|\/\/|#)/i.test(ref)) {
      continue;
    }

    const cleanRef = ref.split(/[?#]/, 1)[0];
    if (!cleanRef || !path.posix.basename(cleanRef).includes(".")) {
      continue;
    }

    const relativeFile = cleanRef.startsWith("/") ? cleanRef.slice(1) : cleanRef;
    if (!existsSync(path.join(rootDir, relativeFile))) {
      fail(`index.html references a missing local asset: ${ref}`);
    }
  }
}

function validateSpaRouting() {
  const redirects = readFileSync(path.join(rootDir, "_redirects"), "utf8");
  if (!redirects.includes("/* /index.html 200")) {
    fail("_redirects is missing the SPA fallback rule: /* /index.html 200");
  }

  const fallbackHtml = readFileSync(path.join(rootDir, "404.html"), "utf8");
  if (!fallbackHtml.includes('"/?route="')) {
    fail("404.html is missing the GitHub Pages route fallback redirect.");
  }

  const middleware = readFileSync(path.join(rootDir, "functions/_middleware.js"), "utf8");
  if (redirects.includes("/index.html / 301") && middleware.includes('new URL("/index.html", request.url)')) {
    fail("functions/_middleware.js rewrites to /index.html while _redirects redirects /index.html to /. This causes redirect loops on Cloudflare Pages.");
  }
}

function validateWrangler() {
  const wrangler = readFileSync(path.join(rootDir, "wrangler.toml"), "utf8");

  if (!wrangler.includes('pages_build_output_dir = "."')) {
    fail('wrangler.toml must keep pages_build_output_dir = "." for static Pages deploys.');
  }

  if (!wrangler.includes("https://*.pages.dev")) {
    fail("wrangler.toml ALLOWED_ORIGINS must include https://*.pages.dev for preview deployments.");
  }
}

function validateServiceWorker() {
  const sw = readFileSync(path.join(rootDir, "sw.js"), "utf8");
  const cacheName = sw.match(/const CACHE_NAME = "(lsf-v[^"]+)";/);
  const cacheVersion = sw.match(/const CACHE_VERSION = "(v[^"]+)";/);

  if (!cacheName || !cacheVersion) {
    fail("sw.js must define both CACHE_NAME and CACHE_VERSION.");
    return;
  }

  if (!cacheName[1].endsWith(cacheVersion[1])) {
    fail("sw.js CACHE_NAME and CACHE_VERSION are out of sync.");
  }
}

const requiredFiles = [
  "index.html",
  "404.html",
  "_headers",
  "_redirects",
  "wrangler.toml",
  "manifest.json",
  "app.js",
  "api-config.js",
  "sw.js",
  "functions/_middleware.js",
  "functions/_shared.js",
  "functions/api/live.js",
  "functions/api/timeline.js",
  "functions/api/standings.js",
  "functions/api/health.js",
  "functions/api/proxy.js",
  "functions/api/cricket-live.js",
  "functions/api/nhl-live.js",
  "functions/api/mlb-live.js"
];

for (const filePath of requiredFiles) {
  assertFile(filePath);
}

const jsFiles = [
  "app.js",
  "api-config.js",
  "sw.js",
  ...walkJsFiles("functions")
];

const uniqueJsFiles = [...new Set(jsFiles)].sort();

for (const filePath of uniqueJsFiles) {
  runSyntaxCheck(filePath);
}

if (!syntaxOnly) {
  validateIndexHtml();
  validateSpaRouting();
  validateWrangler();
  validateServiceWorker();
  note(`Validated ${requiredFiles.length} required files and ${uniqueJsFiles.length} JavaScript entrypoints.`);
}

if (failures.length) {
  console.error("Validation failed.\n");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Validation passed.");
for (const message of notes) {
  console.log(`- ${message}`);
}

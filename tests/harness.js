/*
 * Reads the code samples out of the pages that display them, and runs them.
 *
 * The site has no JavaScript library to import: every implementation a reader
 * sees is embedded in its page, either as escaped text inside a <pre id="...">
 * (the data-structure pages) or as a template literal assigned to `jsCode`
 * (the algorithm pages and the graph page). The suite tests that text, so a
 * test passes only if the code a reader copies is correct.
 *
 * `rev: "original"` reads a file from the commit this pass started from
 * instead of the working tree. Tests whose names start with "regression:" run
 * a scenario against both and assert the original gets it wrong, so a check
 * that stops exercising its defect fails here rather than passing quietly.
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..");

/*
 * The last commit on main before this pass. Pinned by hash: its subject is
 * ".", which is no use for finding it, and a rewritten history should fail
 * loudly rather than quietly test the wrong bytes.
 */
const BASELINE = "08916500c5ed09fab228fed57fe62818ba0eb124";

function readSource(file, rev = "working") {
  if (rev === "working") return fs.readFileSync(path.join(ROOT, file), "utf8");
  if (rev === "original") {
    return execFileSync("git", ["show", `${BASELINE}:${file}`], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
  }
  throw new Error(`unknown rev ${rev}`);
}

/* What a browser's textContent gives back for the entities these pages use. */
function unescapeHtml(s) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

/*
 * Every sample in an HTML file, keyed by the id of the <pre> that shows it.
 * A <pre> with text in it is the sample; an empty one is filled by an inline
 * script from the `jsCode` literal that precedes its getElementById.
 */
function samplesIn(file, rev = "working") {
  const html = readSource(file, rev).replace(/\r\n/g, "\n");
  const out = {};
  for (const m of html.matchAll(/<pre id="([^"]+)">([\s\S]*?)<\/pre>/g)) {
    if (m[2].trim()) out[m[1]] = unescapeHtml(m[2]);
  }
  for (const m of html.matchAll(/const jsCode = `([\s\S]*?)`;\s*const block = document\.getElementById\("([^"]+)"\)/g)) {
    // The literal is evaluated by the page, so its escapes are too.
    out[m[2]] = vm.runInNewContext("`" + m[1] + "`");
  }
  return out;
}

function sample(file, id, rev = "working") {
  const all = samplesIn(file, rev);
  if (!(id in all)) throw new Error(`no sample #${id} in ${file} (${rev})`);
  return all[id];
}

/*
 * Run a sample and hand back the names it declares. The samples report
 * misuse with console.log ("Invalid index", "Heap is empty"), which is their
 * intended output, so it is captured in `logs` rather than printed.
 */
function run(code, names) {
  const logs = [];
  const ctx = vm.createContext({
    console: { log: (...a) => logs.push(a.join(" ")) },
    // The constructors check `initialArray instanceof Array`. An array made
    // by a test belongs to this realm, not the context's, so without this
    // every initial array would be silently ignored.
    Array,
  });
  const exported = vm.runInContext(`${code}\n;({ ${names.join(", ")} })`, ctx);
  exported.logs = logs;
  return exported;
}

function load(file, id, names, rev = "working") {
  return run(sample(file, id, rev), names);
}

/* Every HTML page under the site, relative to ROOT, with forward slashes. */
function htmlPages() {
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = dir ? `${dir}/${e.name}` : e.name;
      if (e.isDirectory()) {
        if (!["node_modules", "tests", ".git"].includes(e.name)) walk(rel);
      } else if (e.name.endsWith(".html")) out.push(rel);
    }
  };
  walk("");
  return out.sort();
}

/* A small seeded generator, so a failing random case can be replayed. */
function rng(seed) {
  let s = seed >>> 0 || 1;
  const next = () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
  next.int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
  return next;
}

module.exports = { ROOT, BASELINE, readSource, unescapeHtml, samplesIn, sample, run, load, htmlPages, rng };

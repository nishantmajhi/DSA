#!/usr/bin/env node
/*
 * The site, in a real Chrome.
 *
 * The node suite runs the samples and the two scripts on stand-ins. This
 * opens the real pages in headless Chrome and works them through the
 * DevTools protocol the way a reader would -- clicking with a real mouse
 * event, reading the real clipboard -- to check that what the node suite
 * proves is what the page does. The checks that run code take it off the
 * clipboard after pressing the page's own copy button, so they run what a
 * reader would paste.
 *
 *   node tests/browser/run.js              the working copy
 *   node tests/browser/run.js --original    the code this pass started from
 *
 * In --original mode every check named "regression:" must fail and every
 * other check must pass. A regression check that passes against the original
 * is not testing the defect it names.
 *
 * Pages are served over loopback, and two checks also open the site from a
 * file:// URL, which is how the README says to use it. Any request that is
 * neither is refused and recorded. No dependency: the server is Node's http
 * module, and Chrome is driven with Node's own WebSocket and fetch. It
 * prints SKIP and exits 0 if no Chrome is found, which is why it is not part
 * of `npm test` -- a skip there would read as a pass.
 */

"use strict";

const { spawn, execFileSync } = require("node:child_process");
const { createServer } = require("node:http");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { BASELINE, samplesIn } = require("../harness");

const ROOT = path.resolve(__dirname, "..", "..");
const ORIGINAL = process.argv.includes("--original");
const REV = ORIGINAL ? "original" : "working";

const CHROME_CANDIDATES = [
  process.env.CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Google/Chrome/Application/chrome.exe"),
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------- the source --- */

/* The site's files at the baseline commit, written to a temporary directory. */
function extractOriginal() {
  const files = execFileSync("git", ["ls-tree", "-r", "--name-only", BASELINE], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-original-"));
  for (const file of files) {
    const bytes = execFileSync("git", ["show", `${BASELINE}:${file}`], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), bytes);
  }
  return dir;
}

/* --------------------------------------------------------------- serving --- */

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

class SiteServer {
  constructor(dir) {
    this.dir = dir;
    this.port = 0;
  }

  handle(req, res) {
    let rel = decodeURIComponent(new URL(req.url, "http://localhost").pathname).replace(/^\/+/, "");
    if (rel === "" || rel.endsWith("/")) rel += "index.html";
    const file = path.resolve(this.dir, rel);
    if (!file.startsWith(path.resolve(this.dir) + path.sep)) {
      res.writeHead(403).end("no");
      return;
    }
    try {
      const body = fs.readFileSync(file);
      res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream", "cache-control": "no-store" }).end(body);
    } catch {
      res.writeHead(404, { "content-type": "text/plain" }).end("not found");
    }
  }

  start() {
    this.server = createServer((req, res) => this.handle(req, res));
    return new Promise((resolve, reject) => {
      this.server.once("error", reject);
      this.server.listen(0, "127.0.0.1", () => {
        this.port = this.server.address().port;
        resolve();
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      this.server.close(() => resolve());
      this.server.closeAllConnections();
    });
  }

  url(p = "") {
    return `http://127.0.0.1:${this.port}/${p}`;
  }

  fileUrl(p = "") {
    return pathToFileURL(path.join(this.dir, p)).href;
  }
}

/* ---------------------------------------------------------------- chrome --- */

function findChrome() {
  return CHROME_CANDIDATES.find((c) => {
    try {
      return fs.existsSync(c);
    } catch {
      return false;
    }
  });
}

async function launchChrome(chrome) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-chrome-"));
  const child = spawn(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--disable-component-update",
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  child.stderr.resume();

  const portFile = path.join(profile, "DevToolsActivePort");
  let port = 0;
  for (const deadline = Date.now() + 30000; Date.now() < deadline && !port; await sleep(50)) {
    if (child.exitCode !== null) throw new Error(`Chrome exited with ${child.exitCode} before listening`);
    try {
      port = Number(fs.readFileSync(portFile, "utf8").split("\n")[0]) || 0;
    } catch {
      /* not written yet */
    }
  }
  if (!port) throw new Error("Chrome never wrote DevToolsActivePort");

  let wsUrl = null;
  for (const deadline = Date.now() + 30000; Date.now() < deadline && !wsUrl; await sleep(50)) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (page) wsUrl = page.webSocketDebuggerUrl;
    } catch {
      /* not up yet */
    }
  }
  if (!wsUrl) throw new Error("no debuggable page target appeared");

  const page = new Page(wsUrl);
  await page.open();
  const downloads = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-downloads-"));
  await page.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloads, eventsEnabled: true });
  await page.send("Browser.grantPermissions", { permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"] });
  await page.send("Page.bringToFront");
  return {
    page,
    close() {
      page.close();
      child.kill();
      for (const dir of [profile, downloads]) {
        for (let i = 0; i < 20; i++) {
          try {
            fs.rmSync(dir, { recursive: true, force: true });
            break;
          } catch {
            /* Chrome still holds the profile for a moment after exit */
          }
          const until = Date.now() + 100;
          while (Date.now() < until) {
            /* synchronous back-off; close() is called from a finally */
          }
        }
      }
    },
  };
}

/*
 * A page target driven over the DevTools protocol. Requests to the local
 * server and to file:// are let through; anything else is refused and
 * recorded.
 */
class Page {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.nextId = 1;
    this.pending = new Map();
    this.exceptions = [];
    this.refused = [];
    this.downloads = [];
  }

  open() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.addEventListener("open", async () => {
        try {
          await this.send("Runtime.enable");
          await this.send("Page.enable");
          await this.send("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] });
          resolve();
        } catch (e) {
          reject(e);
        }
      });
      this.ws.addEventListener("error", () => reject(new Error("the DevTools websocket errored")));
      this.ws.addEventListener("message", (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.pending.has(msg.id)) {
          const { res, rej } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) rej(new Error(msg.error.message));
          else res(msg.result);
        } else if (msg.method === "Runtime.exceptionThrown") {
          const d = msg.params.exceptionDetails;
          this.exceptions.push(`${d.text} ${(d.exception && d.exception.description) || ""}`.trim());
        } else if (msg.method === "Browser.downloadWillBegin") {
          this.downloads.push(msg.params.suggestedFilename);
        } else if (msg.method === "Fetch.requestPaused") {
          this.route(msg.params).catch(() => {
            /* the page navigated away mid-request */
          });
        }
      });
    });
  }

  async route({ requestId, request }) {
    const url = new URL(request.url);
    if (url.protocol === "file:" || url.hostname === "127.0.0.1") return this.send("Fetch.continueRequest", { requestId });
    this.refused.push(request.url);
    return this.send("Fetch.failRequest", { requestId, errorReason: "BlockedByClient" });
  }

  send(method, params = {}) {
    return new Promise((res, rej) => {
      const id = this.nextId++;
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  /* Evaluate an expression in the page, or in its frame, and return its value. */
  async eval(expression, contextId) {
    const out = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      ...(contextId ? { contextId } : {}),
    });
    if (out.exceptionDetails) {
      const d = out.exceptionDetails;
      throw new Error(`in page: ${(d.exception && d.exception.description) || d.text}`);
    }
    return out.result.value;
  }

  /* An execution context in the site's <iframe>, which may be cross-origin. */
  async frameContext() {
    const { frameTree } = await this.send("Page.getFrameTree");
    const child = (frameTree.childFrames || [])[0];
    if (!child) throw new Error("no iframe");
    const { executionContextId } = await this.send("Page.createIsolatedWorld", {
      frameId: child.frame.id,
      worldName: `check${this.nextId}`,
    });
    return { url: child.frame.url, id: executionContextId };
  }

  async goto(url) {
    await this.send("Page.navigate", { url });
    await this.waitFor(`document.readyState === 'complete' && location.href === ${JSON.stringify(url)}`);
  }

  async waitFor(expression, timeoutMs = 15000, contextId) {
    const deadline = Date.now() + timeoutMs;
    let last = null;
    while (Date.now() < deadline) {
      try {
        if (await this.eval(expression, contextId)) return;
      } catch (e) {
        last = e; // mid-navigation, the context can vanish under an evaluate
      }
      await sleep(50);
    }
    throw new Error(`timed out waiting for: ${expression}${last ? ` (last error: ${last.message})` : ""}`);
  }

  /* A real mouse click, which is what the clipboard API wants. */
  async click([x, y]) {
    for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) {
      await this.send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 });
    }
  }

  close() {
    try {
      this.ws.close();
    } catch {
      /* already closed */
    }
  }
}

/* --------------------------------------------------------- page helpers --- */

const js = JSON.stringify;
const crlf = (s) => String(s).replace(/\r\n/g, "\n");

/* Centre of the nth element matching sel, in the given context's viewport. */
const centre = (sel, n = 0) =>
  `(() => { const el = document.querySelectorAll(${js(sel)})[${n}]; if (!el) throw new Error("no " + ${js(sel)});
     el.scrollIntoView({ block: "center" }); const r = el.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`;

function expectEqual(actual, expected, what) {
  if (actual !== expected) throw new Error(`${what}: expected ${js(expected)}, got ${js(actual)}`);
}

/* The same, for a whole sample: on a mismatch, show where the two part. */
function expectSameText(actual, expected, what) {
  if (actual === expected) return;
  let i = 0;
  while (actual[i] === expected[i]) i++;
  const at = (s) => js(s.slice(Math.max(0, i - 10), i + 30));
  throw new Error(`${what}: differs at character ${i}: expected …${at(expected)}…, got …${at(actual)}…`);
}

async function open(page, url) {
  await page.goto("about:blank");
  page.exceptions.length = 0;
  page.refused.length = 0;
  page.downloads.length = 0;
  await page.goto(url);
}

async function clipboard(page) {
  return crlf(await page.eval("navigator.clipboard.readText()"));
}

async function resetClipboard(page) {
  await page.eval("navigator.clipboard.writeText('nothing copied yet')");
}

/* Press the copy button of the nth code block on a page opened at top level. */
async function copyBlock(page, n = 0) {
  await resetClipboard(page);
  await page.click(await page.eval(centre("section > button", n)));
  await page.waitFor("[...document.querySelectorAll('section > button')].some((b) => b.textContent !== '📋')", 3000);
  return clipboard(page);
}

/* Copy a sample off its page and run it; returns the value of `expr`. */
async function runCopied(page, server, p, n, expr) {
  await open(page, server.url(p));
  const code = await copyBlock(page, n);
  return page.eval(`(() => { ${code}\n; return ${expr}; })()`);
}

/* ----------------------------------------------------------------- checks --- */

const checks = [];
const check = (name, fn) => checks.push({ name, fn });

const PAGES = [
  "index.html",
  "pages/home.html",
  "pages/lists.html",
  "pages/stacks.html",
  "pages/queues.html",
  "pages/heaps.html",
  "pages/graphs.html",
  "algorithms/iterative/sequentialSearch.html",
  "algorithms/iterative/BFS.html",
  "algorithms/iterative/DFS.html",
  "algorithms/iterative/sort.html",
  "algorithms/divideAndConquer/binarySearch.html",
  "algorithms/divideAndConquer/mergeSort.html",
  "algorithms/divideAndConquer/quickSort.html",
  "algorithms/divideAndConquer/heapSort.html",
  "algorithms/greedy/Dijkstra.html",
  "algorithms/greedy/Kruskal.html",
  "algorithms/greedy/Prim.html",
  "algorithms/greedy/Huffman.html",
  "algorithms/dynamic/knapsack.html",
  "algorithms/dynamic/stringEditing.html",
  "algorithms/dynamic/Floyd.html",
  "algorithms/dynamic/travelingSalesman.html",
];

for (const p of PAGES) {
  check(`${p} loads cleanly, and every sample is highlighted, intact and copyable`, async ({ page, server }) => {
    await open(page, server.url(p));
    await sleep(150);
    if (page.exceptions.length) throw new Error(page.exceptions.join("\n"));
    const blocks = await page.eval(`[...document.querySelectorAll("code.javascript")].map((c) => {
      const pre = c.querySelector("pre");
      return { id: pre.id, text: pre.textContent, spans: pre.querySelectorAll("span").length,
               button: !!c.parentNode.querySelector(":scope > button") };
    })`);
    const expected = samplesIn(p, REV);
    expectEqual(js(blocks.map((b) => b.id).sort()), js(Object.keys(expected).sort()), "code blocks");
    for (const b of blocks) {
      expectSameText(crlf(b.text), crlf(expected[b.id]), `#${b.id} text`);
      if (b.spans < 10) throw new Error(`#${b.id} is not highlighted`);
      if (!b.button) throw new Error(`#${b.id} has no copy button`);
    }
  });
}

check("no page asks for anything from another site", async ({ page, server }) => {
  const refused = [];
  for (const p of PAGES) {
    await open(page, server.url(p));
    refused.push(...page.refused);
  }
  if (refused.length) throw new Error(`requests: ${refused.join(", ")}`);
});

/* -- the copy button --------------------------------------------------------- */

check("regression: copying a data-structure sample gives exactly the sample", async ({ page, server }) => {
  await open(page, server.url("pages/lists.html"));
  expectSameText(await copyBlock(page, 0), crlf(samplesIn("pages/lists.html", REV).array), "clipboard");
  expectEqual(await page.eval("document.body.lastElementChild.textContent"), "Code copied successfully!", "toast");
});

check("regression: copying an algorithm sample gives exactly the sample", async ({ page, server }) => {
  const p = "algorithms/greedy/Dijkstra.html";
  await open(page, server.url(p));
  expectSameText(await copyBlock(page, 0), crlf(samplesIn(p, REV).dijkstra), "clipboard");
});

/* Open the site's shell, pick a header section, and copy from inside the frame. */
async function copyInFrame(page, url, section) {
  await open(page, url);
  await resetClipboard(page);
  await page.click(await page.eval(centre("header a", section)));
  await sleep(300);
  const frame = await page.frameContext();
  await page.waitFor("document.readyState === 'complete' && !!document.querySelector('section > button')", 5000, frame.id);
  const [bx, by] = await page.eval(centre("section > button"), frame.id);
  const [fx, fy] = await page.eval(`(() => { const f = document.querySelector("iframe"); const r = f.getBoundingClientRect();
    const cs = getComputedStyle(f); return [r.x + parseFloat(cs.paddingLeft), r.y + parseFloat(cs.paddingTop)]; })()`);
  await page.click([bx + fx, by + fy]);
  await sleep(300);
  return { frame, text: await clipboard(page) };
}

check("regression: copying inside the site's frame, served, gives exactly the sample", async ({ page, server }) => {
  const { text } = await copyInFrame(page, server.url("index.html"), 3); // Queue
  expectSameText(text, crlf(samplesIn("pages/queues.html", REV).array), "clipboard");
});

check("regression: copying inside the site's frame, opened from disk, gives exactly the sample", async ({ page, server }) => {
  const { frame, text } = await copyInFrame(page, server.fileUrl("index.html"), 4); // Heap
  if (!frame.url.startsWith("file:")) throw new Error(`frame is at ${frame.url}`);
  expectSameText(text, crlf(samplesIn("pages/heaps.html", REV).array), "clipboard");
});

/* -- running what a reader copies --------------------------------------------- */

check("regression: the linked heap a reader copies keeps every value", async ({ page, server }) => {
  const values = await runCopied(
    page,
    server,
    "pages/heaps.html",
    1,
    `(() => { const h = new MinHeap([4, 3, 2, 1]); const out = [];
       const walk = (n) => n && (out.push(n.value), walk(n.left), walk(n.right)); walk(h.root);
       return out.sort((a, b) => a - b); })()`,
  );
  expectEqual(js(values), js([1, 2, 3, 4]), "values in the heap");
});

check("regression: Prim's as copied returns on a disconnected graph", async ({ page, server }) => {
  const parent = await runCopied(
    page,
    server,
    "algorithms/greedy/Prim.html",
    0,
    "(() => { try { return prim([[0, 4, 0, 0], [4, 0, 0, 0], [0, 0, 0, 2], [0, 0, 2, 0]]); } catch (e) { return String(e); } })()",
  );
  expectEqual(js(parent), js([-1, 0, -1, -1]), "parent");
});

check("regression: the travelling salesman as copied prices a one-city tour at 0", async ({ page, server }) => {
  // String(): Infinity does not survive the DevTools protocol as a value.
  const cost = await runCopied(page, server, "algorithms/dynamic/travelingSalesman.html", 0, "String(travelingSalesman([[0]]))");
  expectEqual(cost, "0", "cost");
});

check("the copied sorts sort, in the browser", async ({ page, server }) => {
  const out = await runCopied(
    page,
    server,
    "algorithms/iterative/sort.html",
    2,
    "insertionSort([5, -1, 3, 3, 0])",
  );
  expectEqual(js(out), js([-1, 0, 3, 3, 5]), "insertion sort");
});

/* -- the highlighter's colours ----------------------------------------------- */

const PURPLE = "rgb(174, 129, 255)";
const PINK = "rgb(249, 38, 114)";
const CYAN = "rgb(102, 217, 239)";

const coloursOf = (word) =>
  `[...document.querySelectorAll("pre span")].filter((s) => s.textContent === ${js(word)}).map((s) => getComputedStyle(s).color)`;

check("regression: null, true and false are drawn purple, not keyword pink", async ({ page, server }) => {
  await open(page, server.url("pages/heaps.html"));
  for (const word of ["null", "true"]) {
    const colours = [...new Set(await page.eval(coloursOf(word)))];
    expectEqual(js(colours), js([PURPLE]), `${word} colours`);
  }
  await open(page, server.url("pages/stacks.html"));
  expectEqual(js([...new Set(await page.eval(coloursOf("false")))]), js([PURPLE]), "false colours");
});

check("regression: Huffman's .char is drawn as a property, not a keyword", async ({ page, server }) => {
  await open(page, server.url("algorithms/greedy/Huffman.html"));
  const colours = await page.eval(coloursOf("char"));
  if (colours.includes(PINK)) throw new Error(`char drawn as a keyword: ${js(colours)}`);
  if (!colours.includes(CYAN)) throw new Error(`no char drawn as a property: ${js(colours)}`);
});

check("return, class and new are still drawn as keywords", async ({ page, server }) => {
  await open(page, server.url("pages/lists.html"));
  for (const word of ["return", "class", "new"]) {
    expectEqual(js([...new Set(await page.eval(coloursOf(word)))]), js([PINK]), `${word} colours`);
  }
});

/* -- the shell --------------------------------------------------------------- */

check("the header marks the section shown, and the footer is open only on Home", async ({ page, server }) => {
  await open(page, server.url("index.html"));
  const state = () =>
    page.eval(`({
      current: [...document.querySelectorAll("header a")].findIndex((a) => a.getAttribute("aria-current") === "page"),
      marked: [...document.querySelectorAll("header li")].filter((li) => li.style.backgroundColor).length,
      open: document.querySelector("footer details").open,
      frame: document.querySelector("iframe").contentWindow.location.pathname,
      fits: document.querySelector("iframe").getBoundingClientRect().bottom <= document.querySelector("footer").getBoundingClientRect().top + 1,
    })`);
  let s = await state();
  expectEqual(js([s.current, s.marked, s.open, s.fits]), js([0, 1, true, true]), "on load");

  await page.click(await page.eval(centre("header a", 2)));
  await page.waitFor(`document.querySelector("iframe").contentWindow.location.pathname.endsWith("/stacks.html")`);
  s = await state();
  expectEqual(js([s.current, s.marked, s.open, s.fits]), js([2, 1, false, true]), "after Stack");

  await page.click(await page.eval(centre("header a", 0)));
  await page.waitFor(`document.querySelector("iframe").contentWindow.location.pathname.endsWith("/home.html")`);
  s = await state();
  expectEqual(js([s.current, s.marked, s.open, s.fits]), js([0, 1, true, true]), "back on Home");
});

check("a footer link opens its algorithm in the frame", async ({ page, server }) => {
  await open(page, server.url("index.html"));
  await page.click(await page.eval(centre(`footer a[href$="Huffman.html"]`)));
  await page.waitFor(`document.querySelector("iframe").contentWindow.location.pathname.endsWith("/Huffman.html")`);
  expectEqual(await page.eval(`document.querySelector("iframe").contentDocument.querySelector("h3").textContent`), "Huffman Encoding", "heading");
});

check("an analysis link, served, downloads under the name the page gives it", async ({ page, server }) => {
  await open(page, server.url("pages/stacks.html"));
  await page.click(await page.eval(centre("a[download]", 1)));
  await page.waitFor("true");
  for (let i = 0; i < 40 && !page.downloads.length; i++) await sleep(50);
  expectEqual(js(page.downloads), js(["Linked List Based Stack - Analysis.md"]), "downloads");
  expectEqual(await page.eval("location.pathname"), "/pages/stacks.html", "page after the click");
});

/* ------------------------------------------------------------------- main --- */

async function main() {
  const chrome = findChrome();
  if (!chrome) {
    console.log("SKIP: no Chrome or Edge found. Set CHROME=<path to chrome.exe> to run these checks.");
    return 0;
  }

  const source = ORIGINAL ? extractOriginal() : ROOT;
  if (ORIGINAL) console.log(`Against ${BASELINE.slice(0, 7)}, the last commit before this pass`);

  const server = new SiteServer(source);
  await server.start();
  const browser = await launchChrome(chrome);
  const results = [];
  try {
    for (const { name, fn } of checks) {
      try {
        await fn({ page: browser.page, server });
        results.push({ name, ok: true });
      } catch (e) {
        results.push({ name, ok: false, detail: e.message });
      }
    }
  } finally {
    browser.close();
    await server.stop();
    if (ORIGINAL) fs.rmSync(source, { recursive: true, force: true });
  }

  for (const r of results) {
    console.log(`${r.ok ? "ok  " : "FAIL"}  ${r.name}${r.ok ? "" : `\n        ${r.detail}`}`);
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length} passed, ${failed.length} failed, ${results.length} checks`);

  if (!ORIGINAL) return failed.length === 0 ? 0 : 1;

  const wrong = results.filter((r) => r.name.startsWith("regression:") === r.ok);
  if (wrong.length) {
    console.error("\nAgainst the original, every regression check must fail and every other check must pass. These did not:");
    for (const r of wrong) console.error(`  - ${r.ok ? "passed" : "failed"}: ${r.name}`);
    return 1;
  }
  console.log(`\nAgainst the original: all ${results.filter((r) => r.name.startsWith("regression:")).length} regression checks fail, as they should.`);
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err.stack || String(err));
    process.exit(1);
  },
);

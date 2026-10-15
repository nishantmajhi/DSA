/*
 * The parts of the site that are not a code sample: the copies of the samples
 * kept in src/, and the copy-to-clipboard button.
 */

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const { readSource, sample } = require("./harness");

/*
 * src/ holds the data-structure samples as plain .js files. Nothing loads
 * them -- the pages carry their own copy, so that the site works from a
 * file:// URL where fetch() cannot -- which means nothing keeps the two in
 * step except this test.
 */
const SRC_COPIES = [
  ["src/List/Array.js", "pages/lists.html", "array"],
  ["src/List/LinkedList.js", "pages/lists.html", "linked_list"],
  ["src/Stack/Array.js", "pages/stacks.html", "array"],
  ["src/Stack/LinkedList.js", "pages/stacks.html", "linked_list"],
  ["src/Queue/Array.js", "pages/queues.html", "array"],
  ["src/Queue/LinkedList.js", "pages/queues.html", "linked_list"],
  ["src/Heap/Array.js", "pages/heaps.html", "array"],
  ["src/Heap/LinkedList.js", "pages/heaps.html", "linked_list"],
];

const normalise = (s) => s.replace(/\r\n/g, "\n").replace(/\n*$/, "\n");

for (const [file, page, id] of SRC_COPIES) {
  test(`${file} is the code ${page} shows`, () => {
    assert.equal(normalise(readSource(file)), normalise(sample(page, id)));
  });
}

/* ---------------------------------------------------------- copy button --- */

/*
 * Runs assets/js/copyCode.js against a page with one code block shaped like
 * the site's: <code class="javascript"> wrapping a <pre>, with the HTML
 * source's indentation between them. Returns what a click puts on the
 * clipboard.
 */
async function copiedText(rev, preText, indent = "\n            ") {
  const listeners = {};
  const el = (tag) => {
    const node = {
      tag,
      style: {},
      children: [],
      attrs: {},
      listeners: {},
      appendChild(c) {
        this.children.push(c);
        return c;
      },
      setAttribute(k, v) {
        this.attrs[k] = v;
      },
      removeAttribute(k) {
        delete this.attrs[k];
      },
      addEventListener(t, fn) {
        (this.listeners[t] ||= []).push(fn);
      },
    };
    return node;
  };
  const pre = el("pre");
  pre.textContent = preText;
  const code = el("code");
  code.textContent = indent + preText + indent.slice(0, -2);
  code.querySelector = (sel) => (sel === "pre" ? pre : null);
  code.parentNode = el("section");

  const written = [];
  const ctx = vm.createContext({
    document: {
      addEventListener: (t, fn) => (listeners[t] ||= []).push(fn),
      createElement: el,
      body: el("body"),
      querySelectorAll: (sel) => (sel === "code.javascript" ? [code] : []),
    },
    navigator: { clipboard: { writeText: async (t) => written.push(t) } },
    setTimeout: () => 0,
  });
  vm.runInContext(readSource("assets/js/copyCode.js", rev), ctx);
  for (const fn of listeners.DOMContentLoaded) fn();

  const button = code.parentNode.children[0];
  for (const fn of button.listeners.click) fn();
  await new Promise((r) => setImmediate(r));
  return written[0];
}

test("regression: the copy button copies the sample, not the HTML indentation around it", async () => {
  const sampleText = "class List {\n  constructor() {}\n}\n";
  const original = await copiedText("original", sampleText);
  assert.notEqual(original, sampleText);
  assert.match(original, /^\n {12}class List/, "the original starts with a blank line and twelve spaces");

  assert.equal(await copiedText("working", sampleText), sampleText);
});

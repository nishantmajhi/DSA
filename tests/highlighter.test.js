/*
 * assets/js/formatJScode.js, the syntax highlighter every code block passes
 * through. It reads a block's textContent and writes back HTML, so the two
 * things that matter are that the text survives exactly and that nothing in
 * it is interpreted as markup. Colour is checked for the token kinds the
 * highlighter's own table names.
 */

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const { readSource, unescapeHtml, samplesIn, htmlPages } = require("./harness");

function formatter(rev = "working") {
  const ctx = vm.createContext({ window: {} });
  vm.runInContext(readSource("assets/js/formatJScode.js", rev), ctx);
  return new ctx.window.JSCodeFormatter();
}

/* The highlighted HTML as [colour, text] pairs; unhighlighted text has none. */
function tokens(f, code) {
  const html = f.parseAndHighlight(code);
  const out = [];
  for (const m of html.matchAll(/<span style="color: ([^"]+)">([\s\S]*?)<\/span>|([^<]+)/g)) {
    out.push(m[1] ? [m[1], unescapeHtml(m[2])] : [null, m[3]]);
  }
  return out;
}

/*
 * Assert the colour `word` is drawn in, by the name the highlighter's colour
 * table gives it. Several names share a colour (number, boolean and null are
 * all purple), so this checks the colour, which is what a reader sees.
 */
function assertKind(f, code, word, kind) {
  const hit = tokens(f, code).find(([, t]) => t === word);
  assert.ok(hit, `${word} not found as a token in ${code}`);
  assert.equal(hit[0], f.colors[kind], `${word} in ${JSON.stringify(code)} should be drawn as ${kind}`);
}

const ALL_SAMPLES = htmlPages().flatMap((p) => Object.entries(samplesIn(p)).map(([id, code]) => [`${p}#${id}`, code]));

test("the site has the 28 samples the suite expects", () => {
  assert.equal(ALL_SAMPLES.length, 28);
});

test("every sample on the site comes back out of the highlighter character for character", () => {
  const f = formatter();
  for (const [name, code] of ALL_SAMPLES) {
    assert.equal(
      tokens(f, code)
        .map(([, t]) => t)
        .join(""),
      code,
      name,
    );
  }
});

test("nothing outside the highlighter's own spans is markup", () => {
  const f = formatter();
  for (const [name, code] of ALL_SAMPLES) {
    const bare = f.parseAndHighlight(code).replace(/<span style="color: #[0-9a-f]{6}">|<\/span>/gi, "");
    assert.doesNotMatch(bare, /[<>]/, name);
    assert.doesNotMatch(bare.replace(/&(amp|lt|gt|quot|#39);/g, ""), /&/, name);
  }
});

test("comparison and logical operators are escaped, the review's P3", () => {
  const f = formatter();
  const code = 'if (a < b && c > d) { s = "<b>&amp;</b>"; }';
  const html = f.parseAndHighlight(code);
  assert.ok(html.includes("&lt;"));
  assert.ok(html.includes("&amp;&amp;"));
  assert.ok(html.includes("&gt;"));
  assert.ok(!html.includes("<b>"));
  assert.equal(tokens(f, code).map(([, t]) => t).join(""), code);
});

test("formatCodeBlock reads text and writes markup that reads back as the same text", () => {
  const f = formatter();
  const el = { textContent: "for (let i = 0; i < n; i++) {}", innerHTML: "", style: {} };
  f.formatCodeBlock(el);
  assert.ok(el.innerHTML.startsWith("<span"));
  assert.equal(unescapeHtml(el.innerHTML.replace(/<[^>]+>/g, "")), "for (let i = 0; i < n; i++) {}");
  assert.equal(el.style.whiteSpace, "pre");
});

test("token kinds: keywords, functions, classes, properties, strings, numbers, comments", () => {
  const f = formatter();
  assertKind(f, "return x;", "return", "keyword");
  assertKind(f, "foo(1);", "foo", "function");
  assertKind(f, "Math.floor(x)", "Math", "function");
  assertKind(f, "class List {}", "List", "className");
  assertKind(f, "this.head = 1", "head", "property");
  assertKind(f, 'x = "hi";', '"hi"', "string");
  assertKind(f, "x = 42;", "42", "number");
  assertKind(f, "x; // note\n", "// note\n", "comment");
  assertKind(f, "for (const x of xs) {}", "of", "keyword");
  assertKind(f, "x = undefined;", "undefined", "null");
});

test("a template literal's interpolation is highlighted as code", () => {
  const f = formatter();
  const code = "console.log(`${value} not found!`);";
  assertKind(f, code, "value", "variable");
  assert.equal(tokens(f, code).map(([, t]) => t).join(""), code);
});

test("regression: true, false and null are drawn in the colour the table gives them", () => {
  // They were also in the keyword set, which was checked first, so the
  // boolean and null branches below it never ran.
  const code = "if (x === null) return true; else return false;";
  const original = formatter("original");
  for (const word of ["null", "true", "false"]) assertKind(original, code, word, "keyword");

  const f = formatter();
  assertKind(f, code, "null", "null");
  assertKind(f, code, "true", "boolean");
  assertKind(f, code, "false", "boolean");
});

test("regression: char is an identifier, and a property even when spelt like a keyword", () => {
  // The Huffman sample's node.char and its char parameter were drawn as
  // keywords: char was in the keyword set, one of sixteen words reserved
  // only in ES1-3, and the keyword check ignored a preceding dot.
  const code = "constructor(char) { this.char = char; } m.delete(k);";
  const original = formatter("original");
  assertKind(original, code, "char", "keyword");
  assert.equal(tokens(original, code).filter(([, t]) => t === "char")[1][0], original.colors.keyword);

  const f = formatter();
  const chars = tokens(f, code).filter(([, t]) => t === "char");
  assert.deepEqual(
    chars.map(([c]) => c),
    [f.colors.variable, f.colors.property, f.colors.variable],
  );
  assertKind(f, code, "delete", "function");
});

test("every word still in the keyword set is reserved or contextual in modern JavaScript", () => {
  const f = formatter();
  const es3Only = ["abstract", "boolean", "byte", "char", "double", "final", "float", "goto", "int", "long", "native", "short", "synchronized", "throws", "transient", "volatile"];
  for (const w of es3Only) assert.ok(!f.keywords.has(w), w);
  for (const w of ["return", "class", "const", "let", "of", "async", "await", "yield", "static"]) assert.ok(f.keywords.has(w), w);
});

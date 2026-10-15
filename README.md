# coco !: 🥥

A reference site for data structures and algorithms, in plain HTML, CSS and
JavaScript. Each page explains one structure or algorithm and shows a
working JavaScript implementation, syntax-highlighted, with a button that
copies it.

It was written to learn JavaScript by building something useful, so it has
no framework, no build step and no runtime dependency.

Live at <https://nishantmajhi.github.io/DSA/>.

## What is in it

**Data structures**, each in an array-based and a linked version, with a
downloadable complexity analysis for each:

- List
- Stack
- Queue
- Min-heap (array, and a linked binary tree)
- Graph (adjacency matrix and adjacency list)

**Algorithms**, grouped by paradigm:

| Paradigm | Algorithms |
| --- | --- |
| Iterative | Sequential search, breadth-first search, depth-first search, bubble / selection / insertion sort |
| Divide and conquer | Binary search, merge sort, quick sort, heap sort |
| Greedy | Dijkstra's shortest paths, Kruskal's and Prim's minimum spanning tree, Huffman coding |
| Dynamic programming | 0/1 knapsack, edit distance, Floyd–Warshall, travelling salesman (bitmask) |

## Using it

Open `index.html` in a browser. Nothing needs installing and no server is
required: every code sample is written into its page rather than fetched,
so the site works from a `file://` URL.

One thing does need a server. The analysis links (for example "Array
Based" on the Stack page) are downloads, and browsers ignore the `download`
attribute on a page opened from disk — Chrome shows the raw Markdown inside
the site's frame instead. Served over HTTP, as on the live site, they
download under a readable name such as `Array Based Stack - Analysis.md`.
Any static server works, for example:

```bash
python -m http.server
```

The site is laid out for a desktop browser; it was not built for phones.

## How it is put together

`index.html` is a shell: a header of data-structure sections, a footer of
algorithm links, and an `<iframe>` between them that every link opens into.
`script.js` marks the current header section, opens the footer on Home and
closes it elsewhere, and keeps the frame sized to the space between them.

Each page in `pages/` and `algorithms/` carries its own code. The
data-structure pages hold it as escaped text in a `<pre>`; the algorithm
pages and the graph page hold it in a template literal that a small inline
script puts into an empty `<pre>`. Two shared scripts then run on every
code block:

- `assets/js/formatJScode.js` — a small JavaScript syntax highlighter.
  It reads the block's text and writes it back wrapped in coloured spans,
  escaping everything it writes.
- `assets/js/copyCode.js` — the copy button and its confirmation toast.

`src/` holds the data-structure samples again as plain `.js` files, for
reading or running outside the site. Nothing loads them. The test suite
fails if they stop matching the pages.

`analysis/` holds one Markdown file per data-structure implementation:
operation complexities, space, strengths and weaknesses.

```
index.html, script.js, style.css   the shell
pages/                              home and the five data-structure pages
algorithms/<paradigm>/              one page per algorithm
analysis/<Structure>/               complexity write-ups, linked as downloads
src/<Structure>/                    the data-structure samples as .js files
assets/js/                          highlighter and copy button
assets/css/                         theme colours and page layout
_config.yml                         keeps tests and notes off GitHub Pages
tests/                              the test suites
```

## Changing a sample

Edit the code in its page. For a data-structure page, the code sits in a
`<pre>`, so `<`, `>` and `&` must be written as `&lt;`, `&gt;` and
`&amp;`; make the same change in the matching file in `src/`. For an
algorithm page the code is a JavaScript template literal, so a backtick or
`${` in it would need escaping. Then run the tests.

## Tests

```bash
npm test               # 61 tests, Node 22 or later, nothing to install
npm run test:browser   # 38 checks in headless Chrome
```

`npm test` reads every sample out of the page that displays it and runs
it. Each algorithm is checked against an answer reached another way —
sorts against `Array.prototype.sort`, shortest paths against Bellman–Ford,
spanning trees against an exhaustive search, the knapsack against every
subset, the tour against every permutation — over hundreds of random
inputs with fixed seeds. Each data structure is driven through random
sequences of operations alongside a plain array. The suite also checks that
every sample survives the highlighter unchanged and unescaped markup never
reaches the page.

`npm run test:browser` opens every page in a real headless Chrome and
presses the copy buttons with a real mouse, reads the clipboard back, and
runs what it copied. It finds Chrome or Edge in the usual places, or takes
a path in `CHROME`, and skips with a message if there is none.
`npm run test:original` runs it against the code before the 2026-10-01
fixes, where every check named `regression:` must fail.

## Limits worth knowing

These are properties of the samples as written, kept because they are the
textbook form:

- The array queue never reuses the slots it dequeues from, so it can report
  full while holding fewer than `maxSize` items. Its analysis file says so;
  a circular buffer is the fix.
- Prim's builds the tree of whatever is reachable from vertex 0. On a
  disconnected graph, vertices outside that component keep parent `-1`.
- Kruskal's sorts the edge array it is given, in place.
- Huffman coding expects at least one character; an empty list throws.
- Quick sort uses the last element as its pivot, so an already-sorted
  array is its worst case: O(n²) time and n levels of recursion.
- The array heap's analysis lists a bottom-up "build heap" in O(n). The
  sample builds its heap by inserting one value at a time, which is
  O(n log n).

## Licence

Free for personal, non-commercial use. You may use, study and modify this
software for yourself, but you may not use it commercially, and you may not
share or publish it, in its original form or modified. See [LICENSE](LICENSE)
for the full terms.

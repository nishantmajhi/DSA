# Code Review — DSA Reference Site

First reviewed 2026-09-04. Remediated 2026-10-01 on `cleanup/2026-10-01`,
nine commits, not pushed. This file is now the record of that pass; the
original findings are summarised under "The first review" below.

## Corrections to the first review

**It did not run the code, and the code had a P1 in it.** The review said
"the content itself is good and should not need changing". The linked-tree
min-heap on the Heap page lost values from its fourth insert:
`new MinHeap([4, 3, 2, 1])` reported size 4 and held 1, 2 and 4. Two other
samples gave a wrong answer or crashed on ordinary input. None of this was
visible without running the samples, and nothing in the project ran them.

**Its P2 about the analysis files described the design as a defect.** It
said the `analysis/*.md` links "will download rather than render" and are
"effectively inaccessible". The links carry `download="… - Analysis.md"`
and `title="Download Analysis File"`, and the README advertised
"Downloadable Markdown analysis files": downloading is the intent. Checked
in headless Chrome, served over HTTP the link downloads under its readable
name. The live site serves the raw `.md` (200, `text/markdown`), so the
downloads work there too. The one real gap is opening the site from disk,
where browsers ignore `download` and Chrome shows the raw Markdown in the
frame. That is a browser rule, so it is documented in the README rather
than changed.

**It said there was no README.** There was one, committed on 2026-07-14,
before the review.

**Its P3 was right that the escaping needed checking, and it holds.**
`colorize()` escapes every token, and every character that can be `<`, `>`
or `&` is an operator token. All 28 samples were run through the
highlighter and come back character for character with nothing unescaped;
`a < b && c > d` is a test case, as the review asked.

## What was fixed

| # | Defect | How it showed | Commit |
| --- | --- | --- | --- |
| 1 | **P1.** Linked heap's `getNodeAt` read the binary path from the 0-based index, not the 1-based position | From the fourth insert, new nodes overwrote existing children; `new MinHeap([1, 1]).extractMin()` threw | `848d6d3` |
| 2 | The analysis page's worked example made the same mistake ("index 5 → `101` → left then right") | It taught the bug | `848d6d3` |
| 3 | Prim's used `minKey`'s `-1` ("nothing reachable") as a vertex | `TypeError` on any disconnected graph | `5c14c66` |
| 4 | The travelling salesman's final loop started at city 1 | A one-city tour cost `Infinity` | `da78fcf` |
| 5 | The copy button copied the `<code>` wrapper, not the `<pre>` | Every paste began with a blank line and twelve spaces | `fc626bf` |
| 6 | `true`, `false`, `null` were in the highlighter's keyword set, checked before their own branches | Drawn keyword pink, not the purple the colour table gives them | `71d5901` |
| 7 | The keyword check ignored a preceding dot, and the set held sixteen ES1–3-only words (`char`, `int`, `goto`…) | Huffman's `node.char` and `char` parameter drawn as keywords | `71d5901` |

Also: `script.js` leaked `footerDetails` as an implicit global, now a
`const` (`4acc15b`).

Every fix is in the page a reader sees. Where a data-structure sample
changed, `src/` changed with it.

**On-screen changes**, all listed in the archive's `CLEANUP-LOG.md`: the
displayed code of the linked heap, Prim's and the travelling salesman
changed (two to four lines each); one sentence of
`analysis/Heap/LinkedList.md`; and 68 highlighted tokens changed colour
across the site — 50 `null`, 6 `true`, 6 `false`, 6 `char` — measured by
running both versions of the highlighter over all 28 samples. No layout,
styling, palette, copy or interaction changed.

## Tests

There were none. Now:

- `npm test` — 61 tests, `node --test`, no dependencies. Each sample is
  read out of the page that displays it, so the suite tests what a reader
  copies. Algorithms against independent answers over random inputs
  (Bellman–Ford, exhaustive spanning trees, every subset, every
  permutation, the recursive edit distance, the optimal Huffman cost).
  Data structures against a plain array through random operation
  sequences. The highlighter over every sample. `src/` against the pages.
  Copy button on a stand-in DOM.
- `npm run test:browser` — 38 checks in headless Chrome over the DevTools
  protocol, no dependencies. Real mouse clicks, the real clipboard, the
  copied code run in the page, computed colours, the shell's header and
  footer, a real download.
- `npm run test:original` — the browser suite against the baseline
  commit, `0891650`. All 9 `regression:` checks fail there and the other 29
  pass, which the runner enforces. The node suite's 7 `regression:` tests
  each load the original from git and assert its failure in the same run.

Each commit was checked out into its own worktree and tested there.

## Deliberately not done

- **The iframe (the first review's main P2).** Replacing it with real pages
  is a navigation change, which is interface. It is the right long-term
  shape for a reference site; it is the author's call. Related and also
  left: the header highlight does not follow the browser's back button or
  footer links, because the shell cannot see the frame's location when the
  site is opened from disk (the frame is a different origin there).
- **Precondition cases that fail loudly.** Huffman with an empty list
  throws; Kruskal's sorts the caller's edge array; quick sort recurses n
  deep on sorted input. These are textbook behaviour, documented in the
  README's "Limits worth knowing", and changing them would add lines to
  teaching code for inputs nobody would pass.
- **The array queue's false "full".** Documented in its own analysis file
  as the reason for a circular buffer. It is the lesson, not a bug.
- **The array heap analysis's "Build Heap O(n)".** The sample has no
  bottom-up build; its constructor inserts one at a time. Noted in the
  README; the analysis prose is the author's.
- **`favicon.png`.** Byte-identical to `assets/img/home.png` and referenced
  by nothing, but it is published on the live site, so deleting it could
  break an outside link. `index.html` declares `favicon.ico` as
  `image/png`; it is an ICO. Browsers sniff it and it displays; left.
- **A licence.** Not chosen; the README says so.

## Notes for the next session

- The samples live in the HTML. `tests/harness.js` (`samplesIn`, `load`)
  reads both forms — escaped `<pre>` text and `jsCode` template literals —
  from the working tree or from the baseline commit.
- `node:vm` gotcha, hit twice here: an array or error made in the test's
  realm is not `instanceof` the context's `Array` or `TypeError`. The
  harness hands the context the host `Array`; tests match errors by
  `name`.
- The site is live on GitHub Pages. `_config.yml` excludes `review.md`,
  `README.md`, `package.json` and `tests`. After the next deploy, worth
  one look that an analysis link still downloads, since the config file is
  new.

## The first review, summarised

Verdict: substantial and well organised; the main problem is the iframe.
Findings: (1) iframe navigation means no page has its own URL — P2;
(2) analysis Markdown "will download rather than render" — P2, corrected
above; (3) verify the highlighter escapes `<`, `>`, `&` — P3, verified;
(4) a hand-written highlighter is maintenance surface — opinion, left.
Smaller notes: no README (wrong), two favicons, no licence, put complexity
tables on the algorithm pages (content, left). It also said the 92
`console.log` calls are the samples' intended output, which is right; the
tests capture them rather than remove them.

## Licence, 2026-10-02

The author chose one licence for all of their projects: free for personal,
non-commercial use, modifiable for the user's own use, and not to be
distributed, original or modified. No standard licence says that, so `LICENSE`
is a short custom text, the same in every project apart from the year and what
it excludes. The README's licence section says the same, and `package.json`
declares `SEE LICENSE IN LICENSE`, npm's form for a licence with no SPDX
identifier. Anything above that calls the licence an open question, or calls
the project MIT, is superseded.

## CI, 2026-10-02

`.github/workflows/ci.yml` runs the node checks and the browser suite as two
jobs on `ubuntu-latest`. Nothing has been pushed, so it has not run on GitHub
yet. Every job was run before committing, from a fresh clone of this branch,
the way a runner would run it: Linux jobs in a throwaway Ubuntu 24.04 (the
image `ubuntu-latest` uses) with the same tool versions. 61 and 38; the
clipboard checks pass in headless Chrome there.

The node job fetches full history, which the regression tests read (they fail
without it, checked). The browser job fails if the runner prints `SKIP`, which
it does when it finds no Chrome; otherwise a missing browser would read as a
pass.

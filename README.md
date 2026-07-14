# DSA 🥥

A vanilla HTML/CSS/JS reference site for Data Structures and Algorithms — built as a project to learn JavaScript by making something useful rather than following tutorials.

No frameworks, no build step, no dependencies. Just open `index.html` in a browser.

## Features

- **Data structures**, each with both an array-based and a linked-list-based implementation:
  - List
  - Stack
  - Queue
  - Heap
  - Graph
- **Algorithms**, grouped by paradigm:
  - Iterative — Sequential Search, BFS, DFS, Sort
  - Divide & Conquer — Binary Search, Merge Sort, Quick Sort, Heap Sort
  - Greedy — Dijkstra's, Kruskal's, Prim's, Huffman Encoding
  - Dynamic — 0/1 Knapsack, String Editing, Floyd's Algorithm, Travelling Salesman
- Syntax-highlighted code blocks with a copy-to-clipboard button
- Downloadable Markdown analysis files (complexity, trade-offs) for each data structure
- A single-page app shell (`index.html`) that loads every section into an iframe, so navigation never triggers a full page reload

## Getting Started

Clone the repo and open `index.html` directly in your browser — no server required:

```bash
git clone https://github.com/<your-username>/DSA.git
cd DSA
```

Then just double-click `index.html`, or open it via `File > Open` in your browser.

> All source code shown on each page is embedded directly in the HTML (rather than fetched at runtime), so the site works entirely from the local filesystem with no CORS issues.

## Project Structure

```
DSA/
├── index.html              # App shell — header nav + iframe viewport
├── script.js                # Nav state + iframe sizing
├── style.css
├── favicon.png
│
├── pages/                   # Data structure overview pages
│   ├── home.html
│   ├── lists.html
│   ├── stacks.html
│   ├── queues.html
│   ├── heaps.html
│   └── graphs.html
│
├── algorithms/               # One page per algorithm, grouped by paradigm
│   ├── iterative/
│   ├── divideAndConquer/
│   ├── greedy/
│   └── dynamic/
│
├── src/                     # Data structure implementations (array & linked list)
│   ├── List/
│   ├── Stack/
│   ├── Queue/
│   └── Heap/
│
├── analysis/                 # Downloadable complexity/trade-off analysis (Markdown)
│   ├── List/
│   ├── Stack/
│   ├── Queue/
│   └── Heap/
│
└── assets/
    ├── css/                  # theme.css (colors/vars), pages.css (page layout)
    ├── js/
    │   ├── copyCode.js        # Copy-to-clipboard button for code blocks
    │   └── formatJScode.js    # Lightweight JS syntax highlighter
    └── img/
```

## Notes

- This project isn't optimized for mobile — the goal was learning JavaScript, not responsive design.
- No frameworks or bundlers are used on purpose; everything is plain HTML, CSS, and JS.

## License

No license specified yet — add one (e.g. MIT) if you'd like others to reuse this freely.

/*
 * The sixteen algorithm pages, each checked against an answer worked out a
 * different way: sorts against Array.prototype.sort, shortest paths against
 * Bellman-Ford, spanning trees against an exhaustive search, the knapsack and
 * the tour against every subset and every permutation.
 */

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { load, rng } = require("./harness");

const ALG = "algorithms";
const page = (p) => `${ALG}/${p}.html`;

/* ----------------------------------------------------------- references --- */

const numeric = (a, b) => a - b;

function randomArray(r, maxLen = 30, lo = -50, hi = 50) {
  return Array.from({ length: r.int(0, maxLen) }, () => r.int(lo, hi));
}

/* A random undirected adjacency list, each list in ascending order. */
function randomAdjList(r, n, p) {
  const g = Array.from({ length: n }, () => []);
  for (let u = 0; u < n; u++)
    for (let v = u + 1; v < n; v++)
      if (r() < p) {
        g[u].push(v);
        g[v].push(u);
      }
  g.forEach((l) => l.sort(numeric));
  return g;
}

/* A random weighted matrix, 0 meaning no edge, symmetric unless `directed`. */
function randomMatrix(r, n, p, { directed = false, lo = 1, hi = 20 } = {}) {
  const m = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let u = 0; u < n; u++)
    for (let v = directed ? 0 : u + 1; v < n; v++) {
      if (u === v || r() >= p) continue;
      let w = r.int(lo, hi);
      if (w === 0) w = 1;
      m[u][v] = w;
      if (!directed) m[v][u] = w;
    }
  return m;
}

/* Shortest distances by relaxing every edge V - 1 times. */
function bellmanFord(m, s) {
  const n = m.length;
  const d = new Array(n).fill(Infinity);
  d[s] = 0;
  for (let k = 0; k < n - 1; k++)
    for (let u = 0; u < n; u++)
      for (let v = 0; v < n; v++)
        if (u !== v && m[u][v] !== 0 && d[u] + m[u][v] < d[v]) d[v] = d[u] + m[u][v];
  return d;
}

/* The connected components of a 0-means-no-edge matrix. */
function components(m) {
  const n = m.length;
  const comp = new Array(n).fill(-1);
  let c = 0;
  for (let s = 0; s < n; s++) {
    if (comp[s] !== -1) continue;
    const stack = [s];
    comp[s] = c;
    while (stack.length) {
      const u = stack.pop();
      for (let v = 0; v < n; v++)
        if (m[u][v] !== 0 && comp[v] === -1) {
          comp[v] = c;
          stack.push(v);
        }
    }
    c++;
  }
  return { comp, count: c };
}

/* Weight of a minimum spanning forest, by trying every subset of edges. */
function bruteForceMSF(n, edges) {
  const { count } = components(edgesToMatrix(n, edges));
  const need = n - count;
  let best = Infinity;
  const pick = (i, chosen, weight) => {
    if (weight >= best) return;
    if (chosen.length === need) {
      if (isForest(n, chosen)) best = weight;
      return;
    }
    if (i === edges.length || edges.length - i < need - chosen.length) return;
    pick(i + 1, [...chosen, edges[i]], weight + edges[i].weight);
    pick(i + 1, chosen, weight);
  };
  pick(0, [], 0);
  return best;
}

function isForest(n, edges) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  for (const { u, v } of edges) {
    const a = find(u);
    const b = find(v);
    if (a === b) return false;
    parent[a] = b;
  }
  return true;
}

function edgesToMatrix(n, edges) {
  const m = Array.from({ length: n }, () => new Array(n).fill(0));
  for (const { u, v, weight } of edges) m[u][v] = m[v][u] = weight;
  return m;
}

function matrixToEdges(m) {
  const edges = [];
  for (let u = 0; u < m.length; u++)
    for (let v = u + 1; v < m.length; v++) if (m[u][v] !== 0) edges.push({ u, v, weight: m[u][v] });
  return edges;
}

function permutations(xs) {
  if (xs.length <= 1) return [xs];
  return xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
}

/* ------------------------------------------------------------- searching --- */

test("sequential search finds the first occurrence, or -1", () => {
  const { sequentialSearch } = load(page("iterative/sequentialSearch"), "seq_search", ["sequentialSearch"]);
  const r = rng(1);
  for (let t = 0; t < 500; t++) {
    const arr = randomArray(r, 20, 0, 9);
    const target = r.int(0, 10);
    assert.equal(sequentialSearch(arr, target), arr.indexOf(target));
  }
});

test("binary search on a sorted array lands on the target, or -1 when it is absent", () => {
  const { binarySearch } = load(page("divideAndConquer/binarySearch"), "binary_search", ["binarySearch"]);
  const r = rng(2);
  for (let t = 0; t < 1000; t++) {
    const arr = randomArray(r, 25, -20, 20).sort(numeric);
    const target = r.int(-22, 22);
    const i = binarySearch(arr, target);
    if (arr.includes(target)) assert.equal(arr[i], target, `${target} in ${arr}`);
    else assert.equal(i, -1);
  }
  assert.equal(binarySearch([], 3), -1);
});

/* --------------------------------------------------------------- sorting --- */

const SORTS = [
  ["iterative/sort", "bubble_sort", "bubbleSort"],
  ["iterative/sort", "selection_sort", "selectionSort"],
  ["iterative/sort", "insertion_sort", "insertionSort"],
  ["divideAndConquer/mergeSort", "merge_sort", "mergeSort"],
  ["divideAndConquer/quickSort", "quick_sort", "quickSort"],
  ["divideAndConquer/heapSort", "heap_sort", "heapSort"],
];

for (const [p, id, name] of SORTS) {
  test(`${name} sorts ascending, duplicates and negatives included`, () => {
    const fn = load(page(p), id, [name])[name];
    const r = rng(name.length * 97);
    for (let t = 0; t < 400; t++) {
      const arr = randomArray(r, 40, -30, 30);
      const expected = [...arr].sort(numeric);
      assert.deepEqual([...fn([...arr])], expected, `input ${JSON.stringify(arr)}`);
    }
    assert.deepEqual([...fn([])], []);
    assert.deepEqual([...fn([7])], [7]);
    assert.deepEqual([...fn([3, 3, 3])], [3, 3, 3]);
  });
}

test("the in-place sorts sort the array they are given; merge sort leaves it alone", () => {
  for (const [p, id, name] of SORTS) {
    const fn = load(page(p), id, [name])[name];
    const arr = [5, 1, 4, 2, 3];
    const out = fn(arr);
    if (name === "mergeSort") assert.deepEqual(arr, [5, 1, 4, 2, 3]);
    else assert.equal(out, arr, `${name} returns its argument`);
  }
});

/* ------------------------------------------------------------ traversals --- */

function referenceBFS(g, s) {
  const seen = new Set([s]);
  const order = [];
  for (let q = [s]; q.length; ) {
    const u = q.shift();
    order.push(u);
    for (const v of g[u]) if (!seen.has(v)) seen.add(v), q.push(v);
  }
  return order;
}

function referenceDFS(g, s, seen = new Set(), order = []) {
  seen.add(s);
  order.push(s);
  for (const v of g[s]) if (!seen.has(v)) referenceDFS(g, v, seen, order);
  return order;
}

test("BFS visits in the same order as a textbook queue BFS, and reaches exactly the component", () => {
  const { BFS } = load(page("iterative/BFS"), "bfs", ["BFS"]);
  assert.deepEqual([...BFS([[1, 2], [0, 3], [0, 3], [1, 2]], 0)], [0, 1, 2, 3]);
  const r = rng(3);
  for (let t = 0; t < 300; t++) {
    const g = randomAdjList(r, r.int(1, 12), r() * 0.5);
    const s = r.int(0, g.length - 1);
    assert.deepEqual([...BFS(g, s)], referenceBFS(g, s));
  }
});

test("DFS visits in the same order as a recursive DFS over the same lists", () => {
  const { DFS } = load(page("iterative/DFS"), "dfs", ["DFS"]);
  assert.deepEqual([...DFS([[1, 2], [0, 3], [0, 3], [1, 2]], 0)], [0, 1, 3, 2]);
  const r = rng(4);
  for (let t = 0; t < 300; t++) {
    const g = randomAdjList(r, r.int(1, 12), r() * 0.5);
    const s = r.int(0, g.length - 1);
    assert.deepEqual([...DFS(g, s)], referenceDFS(g, s));
  }
});

/* ---------------------------------------------------------------- greedy --- */

test("Dijkstra agrees with Bellman-Ford, unreachable vertices included", () => {
  const { dijkstra } = load(page("greedy/Dijkstra"), "dijkstra", ["dijkstra"]);
  const r = rng(5);
  for (let t = 0; t < 400; t++) {
    const n = r.int(1, 10);
    const m = randomMatrix(r, n, r() * 0.6, { directed: r() < 0.5 });
    const s = r.int(0, n - 1);
    assert.deepEqual([...dijkstra(m, s)], bellmanFord(m, s), JSON.stringify(m));
  }
});

function primForestWeight(m, parent) {
  let w = 0;
  parent.forEach((p, v) => {
    if (p === -1) return;
    assert.notEqual(m[p][v], 0, `parent ${p} of ${v} is not a neighbour`);
    w += m[p][v];
  });
  return w;
}

test("Prim's tree has minimum weight on connected graphs", () => {
  const { prim } = load(page("greedy/Prim"), "prim", ["prim"]);
  const r = rng(6);
  let tried = 0;
  while (tried < 200) {
    const n = r.int(1, 7);
    const m = randomMatrix(r, n, 0.3 + r() * 0.7);
    if (components(m).count !== 1) continue;
    tried++;
    const parent = [...prim(m)];
    assert.equal(parent.filter((p) => p === -1).length, 1, "exactly one root");
    assert.equal(parent[0], -1, "rooted at vertex 0");
    assert.ok(isForest(n, parent.flatMap((p, v) => (p === -1 ? [] : [{ u: p, v }]))), "no cycle");
    assert.equal(primForestWeight(m, parent), bruteForceMSF(n, matrixToEdges(m)));
  }
});

test("regression: Prim's on a disconnected graph returns instead of throwing", () => {
  // Two components, {0, 1} and {2, 3}. MST is undefined; what must not happen
  // is minKey returning -1 and the loop indexing graph[-1].
  const m = [
    [0, 4, 0, 0],
    [4, 0, 0, 0],
    [0, 0, 0, 2],
    [0, 0, 2, 0],
  ];
  const original = load(page("greedy/Prim"), "prim", ["prim"], "original").prim;
  assert.throws(() => original(m), { name: "TypeError" });

  const { prim } = load(page("greedy/Prim"), "prim", ["prim"]);
  assert.deepEqual([...prim(m)], [-1, 0, -1, -1], "vertices unreachable from 0 keep parent -1");
});

test("Prim's on random disconnected graphs spans exactly vertex 0's component, minimally", () => {
  const { prim } = load(page("greedy/Prim"), "prim", ["prim"]);
  const r = rng(7);
  let tried = 0;
  while (tried < 200) {
    const n = r.int(2, 7);
    const m = randomMatrix(r, n, r() * 0.5);
    const { comp, count } = components(m);
    if (count === 1) continue;
    tried++;
    const parent = [...prim(m)];
    const inZero = [...Array(n).keys()].filter((v) => comp[v] === comp[0]);
    for (let v = 0; v < n; v++) {
      if (comp[v] !== comp[0]) assert.equal(parent[v], -1, `${v} is outside 0's component`);
    }
    const sub = inZero.map((u) => inZero.map((v) => m[u][v]));
    const subEdges = matrixToEdges(sub);
    assert.equal(primForestWeight(m, parent), bruteForceMSF(inZero.length, subEdges));
  }
});

test("Kruskal's forest has minimum weight, and V - 1 edges when connected", () => {
  const { kruskal } = load(page("greedy/Kruskal"), "kruskal", ["kruskal"]);
  const r = rng(8);
  for (let t = 0; t < 300; t++) {
    const n = r.int(1, 7);
    const m = randomMatrix(r, n, r() * 0.9);
    const edges = matrixToEdges(m);
    const mst = [...kruskal(n, edges.map((e) => ({ ...e })))];
    assert.ok(isForest(n, mst), "no cycle");
    assert.equal(mst.length, n - components(m).count);
    assert.equal(
      mst.reduce((s, e) => s + e.weight, 0),
      bruteForceMSF(n, edges),
    );
  }
});

/* The optimal weighted code length: the sum of every merge a heap would make. */
function optimalCodeCost(freqs) {
  if (freqs.length === 1) return freqs[0];
  const q = [...freqs];
  let cost = 0;
  while (q.length > 1) {
    q.sort(numeric);
    const merged = q.shift() + q.shift();
    cost += merged;
    q.push(merged);
  }
  return cost;
}

test("Huffman codes are prefix-free and optimal", () => {
  const { huffman } = load(page("greedy/Huffman"), "huffman", ["huffman"]);
  assert.deepEqual({ ...huffman([{ char: "a", freq: 5 }]) }, { a: "0" });
  const r = rng(9);
  for (let t = 0; t < 300; t++) {
    const k = r.int(1, 12);
    const input = Array.from({ length: k }, (_, i) => ({ char: String.fromCharCode(97 + i), freq: r.int(1, 40) }));
    const codes = huffman(input.map((x) => ({ ...x })));
    assert.deepEqual(Object.keys(codes).sort(), input.map((x) => x.char).sort());
    const words = Object.values(codes);
    for (const a of words) {
      assert.match(a, /^[01]+$/);
      for (const b of words) if (a !== b) assert.ok(!b.startsWith(a), `${a} is a prefix of ${b}`);
    }
    const cost = input.reduce((s, x) => s + x.freq * codes[x.char].length, 0);
    assert.equal(cost, optimalCodeCost(input.map((x) => x.freq)));
  }
});

/* --------------------------------------------------------------- dynamic --- */

test("0/1 knapsack agrees with trying every subset", () => {
  const { knapsack } = load(page("dynamic/knapsack"), "knapsack", ["knapsack"]);
  assert.equal(knapsack([1, 3, 4, 5], [1, 4, 5, 7], 7), 9);
  const r = rng(10);
  for (let t = 0; t < 300; t++) {
    const n = r.int(0, 10);
    const w = Array.from({ length: n }, () => r.int(1, 12));
    const v = Array.from({ length: n }, () => r.int(0, 30));
    const cap = r.int(0, 30);
    let best = 0;
    for (let mask = 0; mask < 1 << n; mask++) {
      let tw = 0;
      let tv = 0;
      for (let i = 0; i < n; i++) if (mask & (1 << i)) (tw += w[i]), (tv += v[i]);
      if (tw <= cap) best = Math.max(best, tv);
    }
    assert.equal(knapsack(w, v, cap), best);
  }
});

test("edit distance agrees with the recursive definition", () => {
  const { editDistance } = load(page("dynamic/stringEditing"), "string_editing", ["editDistance"]);
  assert.equal(editDistance("kitten", "sitting"), 3);
  assert.equal(editDistance("", "abc"), 3);
  assert.equal(editDistance("flaw", "lawn"), 2);
  const ref = (s, t) => {
    const memo = new Map();
    const go = (i, j) => {
      if (i === 0) return j;
      if (j === 0) return i;
      const key = i * 100 + j;
      if (!memo.has(key))
        memo.set(
          key,
          s[i - 1] === t[j - 1] ? go(i - 1, j - 1) : 1 + Math.min(go(i - 1, j), go(i, j - 1), go(i - 1, j - 1)),
        );
      return memo.get(key);
    };
    return go(s.length, t.length);
  };
  const r = rng(11);
  const word = () => Array.from({ length: r.int(0, 9) }, () => "abc"[r.int(0, 2)]).join("");
  for (let t = 0; t < 500; t++) {
    const a = word();
    const b = word();
    assert.equal(editDistance(a, b), ref(a, b), `${a} -> ${b}`);
  }
});

test("Floyd's agrees with Bellman-Ford from every source, negative edges included", () => {
  const { floyd } = load(page("dynamic/Floyd"), "floyd", ["floyd"]);
  const r = rng(12);
  for (let t = 0; t < 300; t++) {
    const n = r.int(1, 8);
    // A DAG (edges only from lower to higher index) cannot have a negative cycle.
    const m = randomMatrix(r, n, r() * 0.7, { directed: true, lo: -5, hi: 15 });
    for (let u = 0; u < n; u++) for (let v = 0; v <= u; v++) m[u][v] = 0;
    const dist = floyd(m);
    for (let s = 0; s < n; s++) assert.deepEqual([...dist[s]], bellmanFord(m, s), JSON.stringify(m));
  }
});

test("Floyd's leaves the caller's matrix alone", () => {
  const { floyd } = load(page("dynamic/Floyd"), "floyd", ["floyd"]);
  const m = [
    [0, 3, 0],
    [0, 0, 4],
    [0, 0, 0],
  ];
  floyd(m);
  assert.deepEqual(m, [
    [0, 3, 0],
    [0, 0, 4],
    [0, 0, 0],
  ]);
});

test("the travelling salesman's tour cost agrees with every permutation", () => {
  const { travelingSalesman } = load(page("dynamic/travelingSalesman"), "tsp", ["travelingSalesman"]);
  const r = rng(13);
  for (let t = 0; t < 150; t++) {
    const n = r.int(2, 7);
    const d = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : r.int(1, 50))));
    let best = Infinity;
    for (const p of permutations([...Array(n).keys()].slice(1))) {
      const tour = [0, ...p, 0];
      let c = 0;
      for (let i = 0; i + 1 < tour.length; i++) c += d[tour[i]][tour[i + 1]];
      best = Math.min(best, c);
    }
    assert.equal(travelingSalesman(d), best);
  }
});


test("regression: a single city is a tour of cost 0, not Infinity", () => {
  const load_ = (rev) => load(page("dynamic/travelingSalesman"), "tsp", ["travelingSalesman"], rev).travelingSalesman;
  assert.equal(load_("original")([[0]]), Infinity);
  assert.equal(load_()([[0]]), 0);
});

/*
 * The data-structure pages: List, Stack, Queue and Heap, each in an array and
 * a linked version, and the two graph representations. Each structure is
 * driven through long random sequences of operations alongside a plain
 * JavaScript array doing the same thing, and the two must agree after every
 * step -- including on misuse, where the samples log a message and return
 * null or -1 rather than throwing.
 */

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { load, rng } = require("./harness");

const VARIANTS = [
  ["array", "Array"],
  ["linked_list", "LinkedList"],
];

/* ------------------------------------------------------------------ List --- */

for (const [id, label] of VARIANTS) {
  const cls = id === "array" ? "List" : "LinkedList";

  test(`${label} list agrees with an array through random inserts, removes and updates`, () => {
    const loaded = load("pages/lists.html", id, [cls]);
    const L = loaded[cls];
    const r = rng(id === "array" ? 21 : 22);
    const contents = (list) => Array.from({ length: list.size }, (_, i) => list.get(i));

    for (let run = 0; run < 60; run++) {
      const init = Array.from({ length: r.int(0, 6) }, () => r.int(0, 9));
      const list = new L(init);
      const model = [...init];
      for (let step = 0; step < 80; step++) {
        const op = r.int(0, 6);
        const i = r.int(-1, model.length + 1);
        const v = r.int(0, 9);
        if (op === 0) {
          list.insert(v);
          model.push(v);
        } else if (op === 1) {
          list.insert(v, i);
          if (i >= 0 && i <= model.length) model.splice(i, 0, v);
        } else if (op === 2) {
          list.remove(i);
          if (i >= 0 && i < model.length) model.splice(i, 1);
        } else if (op === 3) {
          list.update(v, i);
          if (i >= 0 && i < model.length) model[i] = v;
        } else if (op === 4) {
          assert.equal(list.search(v), model.indexOf(v));
        } else if (op === 5) {
          assert.equal(list.get(i), i >= 0 && i < model.length ? model[i] : null);
        } else {
          list.reverse();
          model.reverse();
        }
        assert.equal(list.size, model.length);
        assert.deepEqual(contents(list), model);
      }
    }
  });

  test(`${label} list reports a bad index rather than throwing`, () => {
    const loaded = load("pages/lists.html", id, [cls]);
    const list = new loaded[cls]([1, 2, 3]);
    list.insert(9, 7);
    list.remove(3);
    list.update(9, -1);
    assert.equal(list.get(5), null);
    assert.deepEqual(loaded.logs, ["Invalid index", "Invalid index", "Invalid index", "Invalid index"]);
    assert.equal(list.size, 3);
  });

  test(`${label} list traverses in order and reverses an empty or single list`, () => {
    const loaded = load("pages/lists.html", id, [cls]);
    new loaded[cls]([4, 5, 6]).traverse();
    assert.deepEqual(loaded.logs, ["4", "5", "6"]);
    const empty = new loaded[cls]();
    empty.reverse();
    assert.equal(empty.size, 0);
    const one = new loaded[cls](["x"]);
    one.reverse();
    assert.equal(one.get(0), "x");
  });
}

/* ----------------------------------------------------------------- Stack --- */

for (const [id, label] of VARIANTS) {
  test(`${label} stack agrees with an array through random pushes and pops`, () => {
    const loaded = load("pages/stacks.html", id, ["Stack"]);
    const r = rng(id === "array" ? 31 : 32);
    const size = (s) => (typeof s.size === "function" ? s.size() : s.size);

    for (let run = 0; run < 60; run++) {
      const init = Array.from({ length: r.int(0, 5) }, () => r.int(0, 9));
      const stack = id === "array" ? new loaded.Stack(init, 8) : new loaded.Stack(init);
      const model = [...init];
      for (let step = 0; step < 60; step++) {
        const op = r.int(0, 3);
        const v = r.int(0, 9);
        if (op === 0) {
          stack.push(v);
          if (id !== "array" || model.length < 8) model.push(v);
        } else if (op === 1) {
          assert.equal(stack.pop(), model.length ? model.pop() : null);
        } else if (op === 2) {
          assert.equal(stack.peek(), model.length ? model[model.length - 1] : null);
        } else {
          const fromTop = [...model].reverse().indexOf(v);
          assert.equal(stack.search(v), fromTop);
        }
        assert.equal(size(stack), model.length);
        assert.equal(stack.isEmpty(), model.length === 0);
        assert.equal(stack.isFull(), id === "array" && model.length === 8);
      }
    }
  });
}

test("array stack refuses an initial array longer than its capacity and overflows at it", () => {
  const loaded = load("pages/stacks.html", "array", ["Stack"]);
  const tooBig = new loaded.Stack([1, 2, 3], 2);
  assert.equal(tooBig.size(), 0);
  const s = new loaded.Stack([1, 2], 2);
  s.push(3);
  assert.equal(s.peek(), 2);
  assert.deepEqual(loaded.logs, ["Initial array exceeds maximum stack size", "Stack overflow"]);
});

/* ----------------------------------------------------------------- Queue --- */

for (const [id, label] of VARIANTS) {
  test(`${label} queue agrees with an array through random enqueues and dequeues`, () => {
    const loaded = load("pages/queues.html", id, ["Queue"]);
    const r = rng(id === "array" ? 41 : 42);
    const size = (q) => (typeof q.size === "function" ? q.size() : q.getSize());

    for (let run = 0; run < 60; run++) {
      const init = Array.from({ length: r.int(0, 5) }, () => r.int(0, 9));
      // A large capacity: the array queue never reuses dequeued slots, which
      // its analysis page documents, so a small one would test that instead.
      const q = id === "array" ? new loaded.Queue(init, 1000) : new loaded.Queue(init);
      const model = [...init];
      for (let step = 0; step < 60; step++) {
        const op = r.int(0, 3);
        const v = r.int(0, 9);
        if (op === 0) {
          q.enqueue(v);
          model.push(v);
        } else if (op === 1) {
          assert.equal(q.dequeue(), model.length ? model.shift() : null);
        } else if (op === 2) {
          assert.equal(q.peek(), model.length ? model[0] : null);
        } else {
          assert.equal(q.search(v), model.indexOf(v));
        }
        assert.equal(size(q), model.length);
        assert.equal(q.isEmpty(), model.length === 0);
      }
    }
  });
}

test("array queue is full once rear reaches capacity, even after dequeues, as its analysis says", () => {
  const loaded = load("pages/queues.html", "array", ["Queue"]);
  const q = new loaded.Queue([1, 2, 3], 3);
  assert.equal(q.isFull(), true);
  q.dequeue();
  assert.equal(q.isFull(), true, "the documented weakness: no circular reuse");
  q.dequeue();
  q.dequeue();
  assert.equal(q.isFull(), false, "emptying it resets both pointers");
});

/* ------------------------------------------------------------------ Heap --- */

for (const [id, label] of VARIANTS) {
  test(`${label} min-heap extracts in sorted order and keeps the heap property`, () => {
    const loaded = load("pages/heaps.html", id, ["MinHeap"]);
    const r = rng(id === "array" ? 51 : 52);

    for (let run = 0; run < 80; run++) {
      const init = Array.from({ length: r.int(0, 10) }, () => r.int(-9, 9));
      const heap = new loaded.MinHeap(init);
      const model = [...init];
      for (let step = 0; step < 60; step++) {
        const op = r.int(0, 2);
        if (op === 0) {
          const v = r.int(-9, 9);
          heap.insert(v);
          model.push(v);
        } else if (op === 1) {
          model.sort((a, b) => a - b);
          assert.equal(heap.extractMin(), model.length ? model.shift() : null);
        } else {
          assert.equal(heap.peek(), model.length ? Math.min(...model) : null);
        }
        assert.equal(heap.size, model.length);
        assert.equal(heap.isEmpty(), model.length === 0);
      }

      // Heap property, read back through the page's own level-order traverse.
      loaded.logs.length = 0;
      heap.traverse();
      const levels = loaded.logs.map(Number);
      assert.deepEqual([...levels].sort((a, b) => a - b), [...model].sort((a, b) => a - b));
      for (let i = 1; i < levels.length; i++) {
        assert.ok(levels[Math.floor((i - 1) / 2)] <= levels[i], `parent of ${i} is larger: ${levels}`);
      }
      for (const v of new Set(model)) assert.equal(levels[heap.search(v)], v);
    }
  });
}

/* Every value in a linked heap, by walking the tree rather than trusting size. */
function linkedHeapValues(heap) {
  const out = [];
  const walk = (n) => n && (out.push(n.value), walk(n.left), walk(n.right));
  walk(heap.root);
  return out.sort((a, b) => a - b);
}

test("regression: the linked heap keeps every value it is given", () => {
  // getNodeAt read the binary path from the 0-based index instead of the
  // 1-based position, so from the fourth insert on it returned the wrong
  // parent and the new node overwrote an existing child.
  const original = load("pages/heaps.html", "linked_list", ["MinHeap"], "original");
  const lossy = new original.MinHeap([4, 3, 2, 1]);
  assert.equal(lossy.size, 4);
  assert.deepEqual(linkedHeapValues(lossy), [1, 2, 4], "the original loses the 3");

  const { MinHeap } = load("pages/heaps.html", "linked_list", ["MinHeap"]);
  assert.deepEqual(linkedHeapValues(new MinHeap([4, 3, 2, 1])), [1, 2, 3, 4]);
  assert.deepEqual(linkedHeapValues(new MinHeap([5, 6, 7, 8, 9, 10])), [5, 6, 7, 8, 9, 10]);
});

test("regression: extracting from a two-node linked heap does not throw", () => {
  const original = load("pages/heaps.html", "linked_list", ["MinHeap"], "original");
  assert.throws(() => new original.MinHeap([1, 1]).extractMin(), { name: "TypeError" });

  const { MinHeap } = load("pages/heaps.html", "linked_list", ["MinHeap"]);
  const h = new MinHeap([1, 1]);
  assert.equal(h.extractMin(), 1);
  assert.equal(h.extractMin(), 1);
  assert.equal(h.isEmpty(), true);
});

test("getNodeAt reaches index i by the path the analysis page describes", () => {
  const { MinHeap } = load("pages/heaps.html", "linked_list", ["MinHeap"]);
  const h = new MinHeap([0, 1, 2, 3, 4, 5, 6]); // already a heap, so no swaps
  for (let i = 0; i < 7; i++) assert.equal(h.getNodeAt(i).value, i);
  assert.equal(h.getNodeAt(5), h.root.right.left, "index 5 is right then left");
});

/* ---------------------------------------------------------------- Graphs --- */

for (const id of ["adj_matrix", "adj_list"]) {
  test(`${id === "adj_matrix" ? "adjacency matrix" : "adjacency list"} graph adds, finds and removes undirected edges`, () => {
    const loaded = load("pages/graphs.html", id, ["Graph"]);
    const g = new loaded.Graph(4);
    g.addEdge(0, 1);
    g.addEdge(1, 2, 5);
    assert.equal(g.hasEdge(1, 0), true);
    assert.equal(g.hasEdge(2, 1), true);
    assert.equal(g.hasEdge(0, 2), false);
    assert.deepEqual([...g.getNeighbors(1)].sort(), [0, 2]);
    g.removeEdge(2, 1);
    assert.equal(g.hasEdge(1, 2), false);
    assert.deepEqual([...g.getNeighbors(1)], [0]);
    g.printGraph();
    assert.equal(loaded.logs.length, 4);
  });
}

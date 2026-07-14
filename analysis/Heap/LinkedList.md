# Linked Binary Tree Min Heap

## Time Complexity

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Insert | O(log n) | Navigate to next position via binary path, heapify up |
| Extract Min | O(log n) | Copy last value to root, detach last node, heapify down |
| Peek (min) | O(1) | Direct access to root node |
| isEmpty | O(1) | Check root pointer |
| Search | O(n) | BFS through all nodes |
| Traverse | O(n) | Level-order BFS |

## Space Complexity

O(n) — each node stores value, parent, left, and right pointers.

## Node Navigation

The insertion index is converted to a binary path (e.g. index 5 → `101` → skip leading bit → path `01` → go left then right from root). This gives O(log n) access to any node without extra bookkeeping.

## Strengths

- Truly dynamic size — grows with allocation
- Clean tree structure makes heap property easy to visualise

## Weaknesses

- Four pointers per node (value, parent, left, right) — significant overhead
- Slower traversal in practice vs array due to pointer chasing
- More complex implementation than array-based heap

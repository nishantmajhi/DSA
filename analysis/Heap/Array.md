# Array-Based Min Heap

## Time Complexity

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Insert | O(log n) | Heapify up from inserted position |
| Extract Min | O(log n) | Move last to root, heapify down |
| Peek (min) | O(1) | Root is always the minimum |
| isEmpty | O(1) | Check size |
| Search | O(n) | No ordering guarantee across siblings |
| Traverse | O(n) | Visit every element in array |
| Build Heap | O(n) | Bottom-up heapification |

## Space Complexity

O(n) — one contiguous array; parent-child relationships encoded by index arithmetic.

## Parent / Child Index Formulas

For a node at index `i`:
- Parent: `floor((i - 1) / 2)`
- Left child: `2i + 1`
- Right child: `2i + 2`

## Strengths

- O(1) access to minimum element
- Cache-friendly due to contiguous array storage
- No pointer overhead

## Weaknesses

- No O(1) arbitrary access or search
- Must restore heap property on every insert / extract

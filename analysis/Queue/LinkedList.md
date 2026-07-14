# Linked List-Based Queue

## Time Complexity

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Enqueue | O(1) | Insert at rear via direct rear pointer |
| Dequeue | O(1) | Remove from front via direct front pointer |
| Peek | O(1) | Direct access to front node |
| isEmpty | O(1) | Check front pointer |
| Search | O(n) | Traverse from front to rear |
| Traverse | O(n) | Visit every node |

## Space Complexity

O(n) — each element stored in a separate node with a pointer to the next.

## Strengths

- O(1) enqueue and dequeue
- Truly unbounded size — no overflow (until memory runs out)
- No wasted space from dequeued elements

## Weaknesses

- Extra memory per node for `next` pointer
- Slightly slower in practice due to dynamic allocation and pointer chasing

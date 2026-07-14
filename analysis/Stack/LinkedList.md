# Linked List-Based Stack

## Time Complexity

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Push | O(1) | Insert at top via direct top pointer |
| Pop | O(1) | Remove from top via direct top pointer |
| Peek | O(1) | Direct access to top node |
| isEmpty | O(1) | Check top pointer |
| Search | O(n) | Traverse from top to bottom |
| Traverse | O(n) | Visit every node |

## Space Complexity

O(n) — each element stored in a separate node with a pointer to the next.

## Strengths

- O(1) push and pop
- Truly unbounded size — no overflow (until memory runs out)
- No wasted space

## Weaknesses

- Extra memory per node for `next` pointer
- Slightly slower in practice due to dynamic allocation

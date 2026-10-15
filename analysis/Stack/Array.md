# Array-Based Stack

## Time Complexity

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Push | O(1) | Increment top and insert |
| Pop | O(1) | Return top element and decrement |
| Peek | O(1) | Direct access to top index |
| isEmpty | O(1) | Check top pointer |
| isFull | O(1) | Check top against maxSize |
| Search | O(n) | Scan from top to bottom |
| Traverse | O(n) | Visit every element top to bottom |

## Space Complexity

O(n) — static array of size `maxSize`.

## Strengths

- O(1) push and pop
- Cache-friendly contiguous memory
- Simple implementation

## Weaknesses

- Fixed maximum size (`maxSize`)
- Overflow if more than `maxSize` elements are pushed

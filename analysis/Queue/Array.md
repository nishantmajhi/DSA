# Array-Based Queue

## Time Complexity

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Enqueue | O(1) | Increment rear and insert |
| Dequeue | O(1) | Increment front pointer |
| Peek | O(1) | Direct access to front index |
| isEmpty | O(1) | Check front pointer |
| isFull | O(1) | Check rear against maxSize |
| Search | O(n) | Scan from front to rear |
| Traverse | O(n) | Visit every element |

## Space Complexity

O(n) — static array of size `maxSize`.

## Strengths

- O(1) enqueue and dequeue
- Cache-friendly contiguous memory
- Simple implementation

## Weaknesses

- Fixed maximum size (`maxSize`)
- Elements dequeued from front leave unused space — a circular buffer would fix this
- Queue can appear full even when front has advanced (wasted slots)

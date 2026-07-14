# Array-Based List

## Time Complexity

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Insert (end) | O(1) | No shifting required |
| Insert (arbitrary) | O(n) | Elements from index onwards shift right |
| Remove | O(n) | Elements after removed index shift left |
| Get | O(1) | Direct index access |
| Update | O(1) | Direct index access |
| Search | O(n) | Sequential scan |
| Traverse | O(n) | Visit every element |
| Reverse | O(n) | Two-pointer swap |

## Space Complexity

O(n) — one contiguous block proportional to the number of elements.

## Strengths

- O(1) random access via index
- Cache-friendly due to contiguous memory layout
- Simple and predictable performance

## Weaknesses

- Insertions and deletions in the middle require O(n) shifting
- Size is not truly dynamic (logical size tracked manually)

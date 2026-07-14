# Linked List-Based List

## Time Complexity

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Insert (head) | O(1) | Just update head pointer |
| Insert (tail / arbitrary) | O(n) | Must traverse to insertion point |
| Remove (head) | O(1) | Just update head pointer |
| Remove (arbitrary) | O(n) | Must traverse to node before target |
| Get | O(n) | Must traverse from head |
| Update | O(n) | Must traverse to node |
| Search | O(n) | Sequential scan from head |
| Traverse | O(n) | Visit every node |
| Reverse | O(n) | Three-pointer in-place reversal |

## Space Complexity

O(n) — each element stored in a separate node with a pointer to the next.

## Strengths

- O(1) insertions and deletions at the head
- True dynamic size — nodes allocated as needed
- No shifting required

## Weaknesses

- O(n) random access (no direct indexing)
- Extra memory per element for the `next` pointer
- Poor cache locality compared to arrays

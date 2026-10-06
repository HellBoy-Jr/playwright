# 4. CODING & ALGORITHMS — SDET FOCUS

# 4.1 Interview Coding Standard

For each problem:

```text
Input/output
 ↓
Constraints
 ↓
Brute force
 ↓
Pattern
 ↓
Optimization
 ↓
Complexity
 ↓
Implementation
 ↓
Edge cases
```

The interviewer evaluates reasoning and communication as much as code.

---

# 4.2 Pattern 1 — HashMap / Frequency Counting

Use for:

- counts;
- uniqueness;
- lookup;
- grouping;
- duplicate detection.

Typical:

```text
Time: O(n) average
Space: O(k)
```

Examples:

- first non-repeated character;
- anagram;
- two sum;
- duplicate detection;
- log aggregation.

---

# 4.3 Pattern 2 — Two Pointers

Recognition:

- sorted arrays;
- compare both ends;
- in-place transformations.

```java
int left = 0;
int right = values.length - 1;

while (left < right) {
    ...
    left++;
    right--;
}
```

Often reduces nested O(n²) scans to O(n).

---

# 4.4 Pattern 3 — Sliding Window

Recognition:

> A contiguous substring/subarray under a changing constraint.

```java
int left = 0;

for (int right = 0; right < input.length(); right++) {

    // include right

    while (windowIsInvalid()) {
        // remove left
        left++;
    }

    // evaluate window
}
```

Applications:

- longest substring;
- minimum window;
- burst detection;
- rolling telemetry.

---

# 4.5 Pattern 4 — Stack

Use for LIFO or nested structure.

```java
Deque<Character> stack =
        new ArrayDeque<>();

for (char c : input.toCharArray()) {

    if (c == '(') {
        stack.push(c);

    } else if (c == ')') {

        if (stack.isEmpty()) {
            return false;
        }

        stack.pop();
    }
}

return stack.isEmpty();
```

Use `Deque` / `ArrayDeque` rather than legacy `Stack` in modern Java.

---

# 4.6 Pattern 5 — BFS / DFS

### BFS

```text
Queue
 ↓
Level by level
```

Good for:

- shortest path in unweighted graphs;
- dependency exploration.

### DFS

```text
Recursive / explicit stack
 ↓
Deep exploration
```

Good for:

- hierarchical structures;
- dependency graphs;
- cycle detection.

Typical graph traversal:

```text
Time: O(V + E)
Space: O(V)
```

---

# 4.7 Complex Problem 1 — Log Burst Detection

Given events:

```text
10:00:00 ERROR payment failed
10:00:01 INFO request accepted
10:00:02 ERROR payment failed
10:00:03 ERROR timeout
```

Find the maximum ERROR events in any 60-second window.

### Approach

1. Parse timestamp.
2. Keep only ERROR timestamps in deque.
3. Add newest.
4. Remove timestamps older than 60 seconds.
5. Update maximum.

### Complexity

```text
Time: O(n)
Space: O(n)
```

This is a sliding-window problem.

---

# 4.8 Complex Problem 2 — JSON Payload Reconstruction

Input:

```text
user.id=101
user.name=John
user.address.city=Pune
user.address.pin=411001
```

Output:

```json
{
  "user": {
    "id": 101,
    "name": "John",
    "address": {
      "city": "Pune",
      "pin": 411001
    }
  }
}
```

### Key concerns

- path splitting;
- node creation;
- number/boolean/string typing;
- duplicate paths;
- malformed paths;
- nulls.

For very large inputs, consider streaming construction rather than retaining all data.

---

# 4.9 Complex Problem 3 — Correlate Distributed Logs

Input:

```text
requestId=R100 service=A status=START
requestId=R200 service=A status=START
requestId=R100 service=B status=OK
requestId=R100 service=A status=END
```

Goal:

> Identify requests that started but never completed.

Use:

```java
Map<String, RequestState> stateByRequest =
        new HashMap<>();
```

Model states:

```text
START → STARTED
END   → COMPLETED
FAIL  → FAILED
```

For out-of-order logs, maintain event timestamps and apply a state machine rather than assuming arrival order.

---

# 4.10 JSON / Log Parsing Edge Cases

Ask:

- What if input is malformed?
- What if records are out of order?
- What if timestamps use different zones?
- What if file is 20 GB?
- What if one request has millions of events?
- What if input arrives continuously?
- What if data contains Unicode or escaped characters?

Senior answer:

> Complexity is not enough; I also need to reason about memory, I/O, streaming, partitioning, and correctness under partial or out-of-order data.

---

# 4.11 Common SDET Coding Questions

1. First non-repeated character
2. Character frequency
3. Anagram
4. Remove duplicates
5. Missing number
6. Two Sum
7. Second largest distinct value
8. Valid parentheses
9. Next greater element
10. Longest substring without repeating characters
11. Merge intervals
12. Top N slow tests
13. Parse logs by correlation ID
14. Find duplicate test cases
15. Detect overlapping test execution windows

---

# 4.12 Complexity Cheat Sheet

| Pattern | Typical complexity |
|---|---|
| HashMap lookup | O(1) average |
| Two pointers | O(n) |
| Sliding window | O(n) |
| Stack scan | O(n) |
| BFS | O(V+E) |
| DFS | O(V+E) |
| Binary search | O(log n) |
| Prefix sum preprocessing | O(n) |

---

# 4.13 Scale Follow-Ups

### "What if there are 10 million records?"

Think:

- streaming;
- bounded memory;
- batching;
- partitioning;
- external sorting;
- backpressure.

### "What if events arrive continuously?"

Think:

- online algorithms;
- bounded state;
- time windows;
- checkpointing.

### "Can you reduce memory?"

Trade:

- additional passes;
- sorting;
- compressed state;
- arrays versus maps;
- database aggregation.

---

# 4.14 Coding Communication Template

> I see this as a sliding-window problem because the requirement is about a contiguous range under a changing constraint. A brute-force solution repeatedly inspects overlapping ranges and can become O(n²). I can maintain the window state incrementally and move the left boundary only when required, giving O(n) time.

---

# 4.15 Boss-Level SDET Coding

Connect:

```text
Algorithm
 ↓
Data structure
 ↓
Complexity
 ↓
Production scale
 ↓
Testing implications
```

For a 20 GB log file, a theoretically optimal O(n) algorithm may still be wrong if it loads the entire file into memory.

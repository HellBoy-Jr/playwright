# SECTION 10 — JAVA CODING AND DSA FOR SDET

## Topics Covered
- 10.1 Framework, 10.2 Arrays, 10.3 Strings, 10.4 Frequency Counting, 10.5 HashMap/Set Patterns, 10.6 Two Pointers, 10.7 Sliding Window, 10.8 Prefix Sum, 10.9 Stack, 10.10 Queue/Deque, 10.11 Binary Search, 10.12 Linked Lists, 10.13 Recursion, 10.14 Trees Basics, 10.15 Sorting, 10.16 Comparators, 10.17 Big-O, 10.18 Space, 10.19 Edge Cases, 10.20 Code Review, 10.21 SDET Problems, 10.22 Variants, 10.23 Log Parsing, 10.24 JSON Diffing

*Built with dedicated subagent, internet-validated, code+complexity per pattern*

---
- **Framework U.P.I.D.E:** Understand restate nulls/sizes/sorted, Plan brute→optimize Big-O, Implement helpers, Dry-run example, Edge. Reduces debug.
- **Arrays O(n)/O(1):** rotation/2nd largest/missing/move zeros/merge, index in-place, null/empty check. Kadane maxSub.
- **Strings O(n)/O(1):** reverse words/anagram/palindrome/first unique, Builder+two-pointer, equals not ==. Log/locator parsing.
- **Frequency O(n)/O(1):** int[26]/[128]/Map, anagram/dup/majority/ransom. Lowercase array beats map.
- **HashMap/Set O(n)/O(n):** Two-Sum `getOrDefault/merge/computeIfAbsent`, dup/consecutive/group-anagrams/topK. Sets O(1) existence.
- **TwoPtr O(n)/O(1):** sorted Two-Sum/container/remove-dups/palindrome, opposite ends vs slow/fast. Sort first O(n log n).
- **Sliding O(n)/O(k):** longest unique/max K/min window, [l,r]+freq shrink invalid. Fixed sum vs variable distinct. Latency windows.
- **Prefix O(n)/O(n):** range sum `pre[j+1]-pre[i]`, subSumK Map, equilibrium/split. long[] overflow. Negatives where sliding fails.
- **Stack O(n)/O(n):** LIFO parens/next-greater/min-stack/backspace/expr, ArrayDeque not Stack, empty check.
- **Queue/Deque O(n)/O(k):** BFS/sliding-max/recent/scheduling, ArrayDeque both ends, PQ ordering, monotonic decreasing window maxima.
- **BinarySearch O(log n)/O(1):** sorted search/first-last/rotated-min/insert/sqrt/capacity, `mid=lo+(hi-lo)/2`, verify sorted/dups.
- **Linked O(n)/O(1):** reverse/middle/cycle/merge/removeNth, dummy head, fast/slow, draw refs null-check.
- **Recursion:** base+progress+combine, traversals/backtrack/flood, overflow→iterative, memo O(2^n)→O(n).
- **Trees O(n)/O(h):** depth/diameter/inorder/level queue/BST bounds/LCA, DFS recursive vs BFS queue. DOM/JSON model.
- **Sorting O(n log n):** Arrays.sort dual-pivot, merge stable, counting bounded, Dutch-flag colors 1-pass. Stability/in-place tradeoff.
- **Comparators:** `comparing().thenComparing()`, nullsFirst, consistent equals. `comparingInt(salary).reversed().thenComparing(name)`.
- **Big-O:** 1/log/n/nlog/n²/2^n, dominant loops/recursion tree, best/avg/worst. HasDup O(n²)→O(n) set tradeoff.
- **Space:** in-place filter, palindrome O(1), BitSet, rolling vars, stream files not load logs. removeVal k pointer.
- **Edges:** null/empty/single/dup/neg/overflow/large/unsorted/case. requireNonNull, long sums, addExact.
- **Review:** names/SRP/no magic/early return/final/try-resources/tests, no sleep, log context. Guard clause.
- **SDET:** dedup IDs, missing number `n(n+1)/2-sum`, brackets, move zeros, FizzBuzz, retry counters + JUnit asserts O(n).
- **Variants:** count pairs, group anagrams `sort→map`, longest pal substring, longest valid parens. Pattern persists complexity shifts O(n*k log k).
## 10.23 Log Parsing & String Tokenization — Production Engine
Theory: Stream GB logs line-by-line, never load fully. Regex named groups + groupingBy counting + sliding window for bursts.
Enterprise Relevance: 5000+ nightly parallel runs emit GB logs; OOM if `readAllLines`. Streaming keeps heap O(1).
```java
private static final Pattern LOG = Pattern.compile(
  "(?<ts>\\d{4}-\\d{2}-\\d{2}T\\S+)\\s+(?<lvl>INFO|WARN|ERROR)\\s+(?<code>\\w+-\\d+)\\s+(?<msg>.*)");
public static Map<String, Long> errorCounts(Path logFile) throws IOException {
  try (Stream<String> lines = Files.lines(logFile)) {
    return lines.filter(l -> l.contains("ERROR"))
      .map(LOG::matcher).filter(Matcher::find)
      .collect(Collectors.groupingBy(m -> m.group("code"), Collectors.counting()));
  }
}
// Burst: sliding 5-min window
public static List<String> burstWindows(Path f, int threshold) throws IOException {
  List<Long> errEpochs = new ArrayList<>();
  try (Stream<String> lines = Files.lines(f)) {
    lines.map(LOG::matcher).filter(Matcher::find)
      .filter(m -> m.group("lvl").equals("ERROR"))
      .map(m -> Instant.parse(m.group("ts")).getEpochSecond())
      .sorted().forEach(errEpochs::add);
  }
  List<String> out = new ArrayList<>();
  int l = 0;
  for (int r = 0; r < errEpochs.size(); r++) {
    while (errEpochs.get(r) - errEpochs.get(l) > 300) l++;
    if (r - l + 1 >= threshold) out.add(Instant.ofEpochSecond(errEpochs.get(l)) + " burst=" + (r-l+1));
  }
  return out;
}
```
Complexity: Time O(L), Space O(u) unique codes + O(w) window. Triage: `MalformedInput` → `Files.lines(path, UTF_8)` + `CoderResult` lenient; regex catastrophic → pre-filter `contains`. Anti: `readAllLines` on GB, `String.split` without limit, regex in loop without precompiled Pattern.
Edge map: null file, empty, single line, malformed ts, non-ERROR only, 10M lines.
## 10.24 Deep Payload Structural Validation & Nested JSON Diffing — Production Engine
Theory: Parse both to `JsonNode`, recurse objects/arrays, collect path mismatches. Normalize dynamic fields (timestamps, IDs) via ignore set.
Enterprise Relevance: API + UI + DB validation at scale; contract drift breaks 100s tests. Path-wise diff `order.items[2].price: 99 != 109` beats `assertEquals(json)` blob.
```java
public static List<String> diff(JsonNode exp, JsonNode act, String path, Set<String> ignore) {
  List<String> out = new ArrayList<>();
  if (ignore.contains(path)) return out;
  if (exp.getNodeType() != act.getNodeType()) {
    out.add(path + ": type " + exp.getNodeType() + " != " + act.getNodeType());
    return out;
  }
  if (exp.isObject()) {
    exp.fieldNames().forEachRemaining(f -> {
      String p = path.isEmpty() ? f : path + "." + f;
      if (!act.has(f)) out.add(p + ": missing in actual");
      else out.addAll(diff(exp.get(f), act.get(f), p, ignore));
    });
    act.fieldNames().forEachRemaining(f -> {
      String p = path.isEmpty() ? f : path + "." + f;
      if (!exp.has(f)) out.add(p + ": extra in actual=" + act.get(f));
    });
  } else if (exp.isArray()) {
    if (exp.size() != act.size()) out.add(path + ": size " + exp.size() + " != " + act.size());
    for (int i = 0; i < Math.min(exp.size(), act.size()); i++)
      out.addAll(diff(exp.get(i), act.get(i), path + "[" + i + "]", ignore));
  } else if (!exp.equals(act)) {
    out.add(path + ": " + exp + " != " + act);
  }
  return out;
}
// Usage:
ObjectMapper om = new ObjectMapper();
List<String> diffs = diff(om.readTree(expectedJson), om.readTree(actualJson), "",
  Set.of("createdAt", "requestId", "timestamp"));
Assertions.assertTrue(diffs.isEmpty(), "Payload drift:\n" + String.join("\n", diffs));
```
Complexity: Time O(n) nodes, Space O(d) recursion depth. Triage: `UnrecognizedProperty` → `FAIL_ON_UNKNOWN=false` or DTO update; order-sensitive array false positive → sort by `id` before diff. Anti: string `equals` on pretty-printed JSON, ignoring numeric `1 vs 1.0` node-type diff, recursion without depth guard on 100MB payload.
Edge map: null nodes, missing vs extra, type change, empty array/object, dynamic IDs/timestamps.

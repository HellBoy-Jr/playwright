# SECTION 4 — JAVA COLLECTIONS FRAMEWORK

## Topics Covered

- 4.1 Collection Hierarchy
- 4.2 List / Set / Map / Queue / Deque
- 4.3 ArrayList
- 4.4 LinkedList
- 4.5 CopyOnWriteArrayList
- 4.6 HashSet
- 4.7 LinkedHashSet
- 4.8 TreeSet
- 4.9 HashMap
- 4.10 LinkedHashMap
- 4.11 TreeMap
- 4.12 ConcurrentHashMap
- 4.13 Queue Implementations
- 4.14 Deque
- 4.15 PriorityQueue
- 4.16 ArrayList vs LinkedList
- 4.17 HashSet vs LinkedHashSet vs TreeSet
- 4.18 HashMap vs LinkedHashMap vs TreeMap
- 4.19 HashMap vs Hashtable vs ConcurrentHashMap
- 4.20 Collection Selection Scenarios
- 4.21 Collection Time Complexities
- 4.22 Collections in Automation Frameworks

*Full-contract, internet-validated 2025-2026*

---

## 4.1 Hierarchy — Full
`Iterable` → `Collection` → `List/Set/Queue`; `Map` separate (K-V not single elements); `Deque extends Queue`; `AbstractList/Set/Map/Queue` skeletons. Code to interfaces: `List<String> t = new ArrayList<>()` swappable. `Collections` (plural) utility, not interface. Map is NOT Collection.
Enterprise: utilities accept `Collection` for DataProviders/Excel readers.

## 4.2 Contracts — Full
List ordered indexed dup OK; Set unique; Map unique keys→values unordered; Queue FIFO `offer/poll/peek`; Deque double-ended LIFO/FIFO.
```java
Deque<String> dq = new ArrayDeque<>(); dq.offerLast("t1"); dq.offerFirst("urgent"); dq.pollFirst();
```
Triage: `add` throws full vs `offer` false; `remove` throws vs `poll` null. Use offer/poll in bounded grids. Anti: `Map` as Collection, `Stack` legacy.

## 4.3 ArrayList — Full
Array, cap 10 grow 1.5x `Arrays.copyOf`, get/set O(1), mid add/remove O(n) shift, not sync, fail-fast.
```java
List<String> urls = new ArrayList<>(100); urls.add("/login");
```
Enterprise: `findElements()` results, POI rows, response lists — iteration + random access. Share across parallel → sync/copy.
Triage CME in for-each remove → `iterator.remove/removeIf`. Cap≠size (`new ArrayList<>(100)` size 0).

## 4.4 LinkedList — Full
Doubly-linked `List+Deque`, ends O(1), get O(n), node overhead prev/next, null OK, fail-fast. Retry queue, nav history, undo.
Triage: mid-insert still O(n) traversal w/o positioned Iterator; pure queue/stack → `ArrayDeque` (locality+GC wins).

## 4.5 CopyOnWriteArrayList — Full
Copy-on-write, lock-free snapshot reads, iterator no CME but no `remove()` + stale post-iterator writes. Read-heavy write-rare (listeners/config flags).
```java
CopyOnWriteArrayList<ITestListener> ls = new CopyOnWriteArrayList<>();
ls.add(new ReportListener()); for (ITestListener l : ls) l.onTestStart(result);
```
Triage stale → snapshot; write-heavy logs slow → `ConcurrentLinkedQueue`. Anti: `iterator.remove` (UOE).

## 4.6 HashSet — Full
`HashMap`-backed `PRESENT` dummy, unordered 1 null, O(1), uniqueness via hash+equals, fail-fast.
```java
Set<String> ids = new HashSet<>(); ids.add("TC-01"); ids.add("TC-01"); // size 1
```
Enterprise dedup: failed IDs, visited URLs, Cucumber tags. Mutating hash field after add → unfindable + dup. Use immutable keys.

## 4.7 LinkedHashSet — Full
`HashSet` + insertion-order linked list, O(1), 1 null, extra mem. Deterministic tags/rerun files/Excel dedup preserving order (fixes HashSet flaky asserts).
Re-add doesn’t move pos; insertion not sorted (→ TreeSet). 

## 4.8 TreeSet — Full
`TreeMap` Red-Black `NavigableSet`, sorted natural/Comparator, O(log n), no null natural (NPE), `first/last/headSet/tailSet`.
```java
TreeSet<Integer> ms = new TreeSet<>(Comparator.reverseOrder()); ms.addAll(List.of(200,100,500));
```
Mixed types → CCE; `compareTo==0` vs `equals` inconsistent drops distincts. Sorted SLAs/timestamps/dropdowns.

## 4.9 HashMap — Full
Buckets+list/tree (treeify ≥8), O(1) good hash, 1 null key + multi null values, unordered, fail-fast, LF 0.75. Java 8 tree resists DoS.
```java
Map<String,String> d = new HashMap<>(); d.put("user","admin"); d.getOrDefault("env","qa");
```
Bad hash/equals → dup keys/miss; concurrent resize pre-8 loop / post-8 loss → parallel flake. Never share; use CHM/ThreadLocal.

## 4.10 LinkedHashMap — Full
`HashMap` + insertion-order list, optional access-order LRU (`(16,0.75f,true)` + `removeEldestEntry`). O(1), nulls OK.
```java
Map<String,String> lru = new LinkedHashMap<>(16,0.75f,true){
  @Override protected boolean removeEldestEntry(Map.Entry e) { return size() > 2; }};
```
Deterministic payload/signature/ordered forms/Allure logs; token/response cache. Flag `true` required or insertion-order only.

## 4.11 TreeMap — Full
RB-tree `NavigableMap` sorted key, O(log n), no null key natural, null values OK, `first/last/ceiling/floor/headMap/tailMap`.
```java
TreeMap<String,Integer> runs = new TreeMap<>(); runs.put("2026-10-06",5);
```
Uses `compareTo` not `equals/hashCode` → inconsistent comparator breaks `containsKey`. Mutating ordering field corrupts tree. Deterministic compliance dashboards.

## 4.12 ConcurrentHashMap — Full
CAS+bin-lock (Java 8+; 7 segments), lock-free reads, bin-only writes, treeified, no nulls, weakly-consistent iter, atomic `compute/merge/putIfAbsent`.
```java
ConcurrentHashMap<String,Integer> rc = new ConcurrentHashMap<>();
rc.merge("TC01", 1, Integer::sum); rc.computeIfAbsent("token", k -> login());
```
Enterprise parallel results/counters/token cache over `synchronizedMap` (whole-lock). `size/isEmpty` estimates; `contains+put` racy → atomic. Null banned (absent vs null ambiguity).

## 4.13 Queues — Full
`LinkedList` null OK unsync; `ArrayBlocking` bounded locks; `LinkedBlocking` opt-bounded throughput; `ConcurrentLinked` lock-free unbounded; `PriorityBlocking` ordered; `Synchronous` handoff.
```java
BlockingQueue<String> q = new ArrayBlockingQueue<>(100);
q.offer("https://app/login"); String u = q.poll(5, TimeUnit.SECONDS);
```
Producer-consumer URLs/data, throttle Grid to avoid OOM. add/put/offer + remove/poll/take semantics differ — mixing causes flaky waits. Never LinkedList parallel.

## 4.14 Deque — Full
Double-ended: `ArrayDeque` circular array O(1) both, no null unsync; `ConcurrentLinkedDeque` thread-safe; `LinkedList` node-based slower. Replaces `Stack` (Vector sync).
```java
Deque<String> st = new ArrayDeque<>(); st.push("w1"); st.push("w2"); String t = st.pop();
```
Back/forward history, undo, palindrome/window, BFS/DFS. `push=addFirst`, `pop` throws vs `pollFirst` null.

## 4.15 PriorityQueue — Full
Heap least-head, array sift, natural/Comparator, no nulls unsync (`PriorityBlocking` thread-safe), `offer/poll O(log n)`, `peek O(1)`, `remove/contains O(n)`. Iterator NOT sorted.
```java
PriorityQueue<TestCase> pq = new PriorityQueue<>(Comparator.comparingInt(t -> t.priority));
pq.offer(new TestCase("P0",0)); pq.poll(); // least
```
P0-before-P2, retry most-failed, SLA scheduling. Must poll repeatedly for sorted; non-Comparable w/o Comparator → CCE.

## 4.16 ArrayList vs LinkedList — Full
Both `List`. Array: indexed O(1), mid O(n); Linked nodes+Queue/Deque: ends O(1), indexed O(n), higher mem.
Default ArrayList (DataProviders, WebElements, CSV — iteration+get). Linked only frequent head ops. Cache locality wins.
```java
List<String> ids = new ArrayList<>(1000); Deque<String> dq = new LinkedList<>(); dq.addFirst("latest");
```
Remove in for-each → CME → `iterator.remove/removeIf`. LinkedList almost never beats ArrayDeque for queue/stack.

## 4.17 Sets — Full
| | Order | Ops |
|---|---|---|
| Hash | none | O(1) |
| Linked | insertion | O(1) |
| Tree | sorted | O(log n) |
Dedup IDs/URLs/defects; Linked preserves Excel/CSV order; Tree sorted reports/range. Mutable elems break hash; Tree inconsistent compareTo drops; Hash rehash changes order.

## 4.18 Maps — Full
| | Order | Ops |
|---|---|---|
| Hash | none | O(1) |
| Linked | insertion/access LRU | O(1) |
| Tree | sorted | O(log n) |
Config/test-data Hash; deterministic JSON/order Linked; sorted dashboards/range Tree. Hash JSON order assert flaky → Linked/Jackson ORDER; Tree keys comparable else CCE; none thread-safe.

## 4.19 HashMap vs Hashtable vs CHM — Full
| | Lock | Nulls |
|---|---|---|
| HashMap | none, fastest single | yes |
| Hashtable | table-wide legacy | no |
| CHM | bin-level modern | no |
Parallel driver/token/counts → CHM; Hashtable legacy/interview only; local vars Hash. `synchronizedMap` still needs ext sync iteration; CHM get+put still racy → atomic. Hashtable Enumeration vs Hash fail-fast.

## 4.20 Selection — Full
Uniqueness→Set, K-V→Map, FIFO→Queue, LIFO→Deque stack, sorted→Tree, ordered→Linked, concurrent→concurrent/Blocking. Null/order/safety/bounded.
Cheat: DataProvider `ArrayList<Object[]>`; defect IDs `HashSet`; env `HashMap`; ordered payload `LinkedHashMap`; parallel queue `ArrayBlockingQueue`; shared `CHM`; priority `PQ`; stack `ArrayDeque`.
```java
Queue<Runnable> work = new LinkedBlockingQueue<>(50);
Set<String> seen = ConcurrentHashMap.newKeySet();
```
Default ArrayList/HashMap parallel → CME/lost updates; Tree overuse O(log n)+comparator bugs; unbounded queue deadlock Grid.

## 4.21 Complexities — Full
Hash O(1) avg (bad hash degrades), worst O(n)→O(log n) treeified; Tree O(log n); ArrayList get O(1) mid O(n); Linked get O(n) ends O(1); PQ offer/poll O(log n) contains O(n); CHM O(1)/tree O(log n).
10k API/DB-vs-UI diff: `HashSet` O(1) beats nested O(n²). Sort+binary only if repeated queries justify O(n log n).
```java
Set<String> db = new HashSet<>(fetchDbIds()); for (String ui : uiIds) Assert.assertTrue(db.contains(ui));
```
Qualify “average” + hash quality; `List.contains` O(n) slow-framework cause.

## 4.22 Frameworks — Full
`TestNG @DataProvider Object[][]` from `List<Map<String,String>>` Excel/CSV/DB; Page caches `List<WebElement>`; RestAssured `Map→JSON`; listeners `CHM<String,Status>`; retry `Set` dedup.
```java
@DataProvider(parallel = true) public Object[][] dp() { return data.stream().map(m -> new Object[]{m}).toArray(Object[][]::new); }
ConcurrentHashMap<String,String> results = new ConcurrentHashMap<>();
```
POI→LinkedHashMap (column order)→ArrayList→DP→dedup LinkedHashSet→parallel BlockingQueue+CHM→sorted TreeMap report.
Traps: sharing ArrayList/HashMap parallel corrupts; storing WebElements across nav → Stale → re-find or store `Map<String,By>`.

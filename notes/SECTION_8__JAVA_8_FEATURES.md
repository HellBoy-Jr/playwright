# SECTION 8 — JAVA 8+ FEATURES

## Topics Covered
- 8.1 Lambda, 8.2 Functional Interfaces, 8.3 Predicate, 8.4 Function, 8.5 Consumer, 8.6 Supplier, 8.7 BiFunction/BiConsumer/BiPredicate, 8.8 Method References, 8.9 Stream API, 8.10 map, 8.11 filter, 8.12 flatMap, 8.13 sorted, 8.14 distinct, 8.15 limit/skip, 8.16 reduce, 8.17 collect, 8.18 groupingBy, 8.19 partitioningBy, 8.20 joining, 8.21 Stream vs Loop, 8.22 Parallel Streams Risks, 8.23 Optional, 8.24 Date/Time API, 8.25 Coding Qs

*Built with dedicated subagent, internet-validated, full 25-header research condensed*

---
- **Lambda:** `(a,b)->compare`, replaces anonymous Runnable/Comparator, effectively-final capture. Avoid multi-line logic.
- **Functional:** SAM + @FunctionalInterface, default/static don't break. Prefer java.util.function, custom only for checked ex.
- **Predicate<T> test:** filter, validations, `and/or/negate/isEqual`, IntPredicate avoids boxing.
- **Function<T,R> apply:** map/DTO parse, `andThen/compose/identity`, pure null-safe. `fmt.compose(len)`.
- **Consumer<T> accept:** side-effects logging/DB/screenshots forEach, `andThen` chain.
- **Supplier<T> get:** lazy UUID/users/driver, `orElseGet` lazy vs orElse eager.
- **Bi*:** BiFunction apply, BiConsumer Map.forEach/collect, BiPredicate test, BinaryOperator for reduce. No BiSupplier.
- **MethodRefs ::** static `Integer::sum`, bound `list::add`, unbound `String::length`, ctor `ArrayList::new`. Delegate only.
- **Stream:** source→lazy intermediate→eager terminal, no storage/mutation, single-use. Filter-map-collect for API JSON.
- **map:** 1-1 transform, mapToInt avoids boxing, order-preserving. `trim→upper`.
- **filter:** retains match, lazy, pure, peek debug only. `c>=500`.
- **flatMap:** 1-many flatten `List<List>`→List, nested JSON arrays, `Collection::stream`. map would give Stream<Stream>.
- **sorted:** stateful full traversal, `comparing().thenComparing().reversed()`. DB sort huge data.
- **distinct:** equals/hashCode based, stateful. Custom key → toMap/newKeySet.
- **limit/skip:** pagination Top-N, `generate().limit()` terminates infinite. sorted+limit deterministic.
- **reduce:** fold via BinaryOperator assoc/stateless, Optional/no-id/combiner variants. Prefer sum/max/collect built-ins.
- **collect:** mutable to List/Set/Map `toMap(k,v,merge)`, TreeSet. Duplicate keys need merge fn.
- **groupingBy:** SQL GROUP BY `Map<K,List<T>>`, downstream counting/summing/mapping, nested. Group tests by status.
- **partitioningBy:** `Map<Boolean,List>` true/false exactly, downstream counting. Pass/fail split, SLA breach.
- **joining:** concat `joining(delim,prefix,suffix)`, NPE on null filter first. CSV/debug/query params.
- **Stream pipelines (production aggregation + filter):**
```java
// Payload filter + group + Top-N slowest + CSV join
List<ApiResult> fails = results.stream()
  .filter(r -> r.status() >= 500).toList();
Map<String, Long> byEnv = results.stream()
  .collect(Collectors.groupingBy(ApiResult::env, Collectors.counting()));
Map<Boolean, List<ApiResult>> sla = results.stream()
  .collect(Collectors.partitioningBy(r -> r.ms() <= 1000));
List<String> top3 = results.stream()
  .sorted(Comparator.comparingInt(ApiResult::ms).reversed())
  .limit(3).map(ApiResult::id).toList();
String csv = top3.stream().collect(Collectors.joining(",", "[", "]"));
// Parallel only after benchmark: default sequential; parallel pollutes commonPool on blocking IO
```
Triage: `IllegalStateException duplicate key` → add merge `(x,y)->x`; NPE joining → filter nulls; wrong Top-N → sorted before limit. Anti: shared ArrayList add in parallel stream, `groupingBy` on huge unsplittable LinkedList.
- **Parallel risks:** commonPool ForkJoin, only large CPU independent splittable (ArrayList). No shared mutable/stateful/blocking IO, ordering cost, groupingByConcurrent. Benchmark, default sequential.
- **Optional:** container not field/param, `of/ofNullable/empty`, `orElse/orElseGet/orElseThrow/ifPresent/map/filter`. Never get() without isPresent. Nullable API/config/findFirst.
- **Date/Time:** java.time immutable LocalDate/Time/DateTime/ZonedDateTime/Period/Duration, plus/minus/until/parse/format DateTimeFormatter. Thread-safe vs Date/Calendar.
- **Coding Qs:** 2nd highest `distinct.sorted.reverse.skip.findFirst`, freq `groupingBy counting`, pass `partitioningBy`, join names, date filter. Null-safe chaining.

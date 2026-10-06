# SECTION 3 — ADVANCED JAVA CONCEPTS

## Topics Covered

- 3.1 `equals()` / `hashCode()` Contract
- 3.2 `toString()`
- 3.3 Mutable Objects as Map Keys
- 3.4 String Immutability
- 3.5 String Pool
- 3.6 `==` vs `equals()`
- 3.7 `String` vs `StringBuilder` vs `StringBuffer`
- 3.8 `final` vs Immutable
- 3.9 Wrapper Classes
- 3.10 Autoboxing / Unboxing
- 3.11 `enum`
- 3.12 Inner Classes
- 3.13 Anonymous Classes
- 3.14 Nested Static Classes
- 3.15 Varargs
- 3.16 Annotations
- 3.17 Reflection — Interview Awareness
- 3.18 Serialization / Deserialization
- 3.19 `transient`
- 3.20 `volatile`
- 3.21 `synchronized`
- 3.22 `Atomic` Classes
- 3.23 Immutability and Thread Safety
- 3.24 Common Advanced-Java Trap Questions

*Full-contract, internet-validated 2025-2026*

---

## 3.1 equals/hashCode — Full
Contract: reflexive/symmetric/transitive/consistent; `a.equals(b)` → same hash; stable while in map. Override both, same fields, `Objects.equals/hash`. Breaking → `get` null, dup “equal” entries, `contains` false.
Enterprise: DTO dedup, `HashSet<TestCase>`, response cache, Hibernate business-key equality at 5000+ runs.
```java
public final class Employee {
  private final String empId, name;
  public Employee(String id, String n) { this.empId = id; this.name = n; }
  @Override public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Employee e)) return false;
    return Objects.equals(empId, e.empId) && Objects.equals(name, e.name);
  }
  @Override public int hashCode() { return Objects.hash(empId, name); }
}
// Prefer: record Employee(String empId, String name) {}
```
Triage: `contains(equalCopy)` false → check both overridden? same fields? null-safe? mutated after put? Fix immutable/record.
Anti: equals w/o hashCode, different fields, `==` on String, mutable hash fields, `return 1`, equals on hash compare.

## 3.2 toString — Full
Default `getClass().getName()+"@"+hex(hashCode)` — useless for triage. Override compact state `Employee{id=101,name='Asha'}` for Log4j/SLF4J, RestAssured logs, TestNG asserts, debugger.
```java
@Override public String toString() { return "Employee{id="+id+", name='"+name+"'}"; }
```
Triage: `Class@hash` in logs → missing override; NPE in toString → null field; StackOverflow → bidirectional mutual calls.
Anti: parsing toString for logic/asserts (use getters/equals), PII/secrets leak, DB calls/mutation/throw inside.

## 3.3 Mutable Map Keys — Full
Put fixes bucket h1; mutate → lookup h2 miss → `get/remove/contains` null/false but `size` 1 leaked, iteration still shows entry. Effective leak if looped.
```java
Map<Key,String> m = new HashMap<>(); Key k = new Key(1); m.put(k,"a"); k.x = 2;
m.get(k); // null — bucket 2 vs entry in 1
```
Triage: get null but forEach shows key → log hashCode before/after, check non-final fields in hash/equals, MAT size grows hit-rate drops. Fix remove-mutate-reput or immutable.
Anti: `List/Date/StringBuilder`/entity as key, setter on key w/o reinsert, cached hash not equals-consistent.

## 3.4 String Immutability — Full
`final class` + `final byte[]`: pool sharing safe, security (checked value == used value, no TOCTOU, ClassLoader safe), thread-safe no sync, hash cached for HashMap keys.
```java
String s = "ab"; s.concat("cd"); // ignored
s = s.concat("cd"); // new "abcd"
StringBuilder sb = new StringBuilder(); for (String w : words) sb.append(w);
```
Triage: O(n²) `s+=x` loop + GC churn → Builder/join; `==` passes locally (pool) fails prod (`new String`) → equals.
Anti: `+` large loop, `new String("lit")` defeating pool, password in String (unwipeable → `char[]` + zero).

## 3.5 String Pool — Full
StringTable hash on heap (Java 7+; pre-7 PermGen OOM). Literals auto-interned; `new String` always new heap. `intern()` returns canonical (adds self Java 7+). Tunable `-XX:StringTableSize` buckets (1009 legacy → 60013 Java 8 → 65536 Java 11+, `PrintStringTableStatistics`). Java 9+ compact strings `byte[]+coder` (Latin1/UTF16).
```java
String a = "hello"; String b = new String("hello"); // a!=b, equals true
String c = b.intern(); // c==a true
String d = "he"+"llo"; // const → pool, d==a
```
Triage: MAT duplicate `char[]/byte[]` + huge StringTable + `jmap -histo` → unbounded intern. Fix LRU/TTL, no intern on user input (DOS).
Anti: `new String("lit")`, intern unbounded CSV, `==` content compare, assuming runtime `+`/substring pooled.

## 3.6 == vs equals — Full
`==` identity (primitives value, JLS 15.21.3); `equals` value (default `==`, String/Integer override). Literals interned `"hi"=="hi"` true but `new String` false; Integer cache -128..127 (`IntegerCache`, `-XX:AutoBoxCacheMax`) masks bugs.
```java
Integer c = 128, d = 128; c == d; // false! c.equals(d) true
if (Integer.valueOf(127) == Integer.valueOf(127)) {} // true cached
```
Triage: passes locally fails prod → repro outside cache (`1000`), `new`, DB/deser values. Fix equals/unbox.
Anti: `str1==str2`, `boxed==boxed`, relying on 127 test.

## 3.7 String vs Builder vs Buffer — Full
| | String | Buffer | Builder |
|---|---|---|---|
| Mutable | No (+) | Yes sync | Yes unsync |
| Thread-safe | Yes immut | Yes | No |
| Single-thread | O(n²) loop | slower 10-30% | fastest |
JIT `makeConcatWithConstants` (Java 9+) makes single-expr `+` = Builder; loop still needs Builder.
```java
StringBuilder sb = new StringBuilder(256);
for (String e : events) sb.append(e).append(';');
String log = sb.toString();
```
Triage: heap `char[]/String` spike + slow loop → `+` in loop; shared log corrupt → Builder cross-thread → Buffer/Joiner/Collector; local Buffer → Builder.
Anti: `s+=x` traces loop, default Buffer single-thread, shared Builder field unlocked.

## 3.8 final vs Immutable — Full
`final` locks ref/value not graph. Deep needs copy on in/out + unmodifiable. `final List` + `add` allowed; `unmodifiableList` w/o copy still mutates via backing; record component mutable still leaks.
```java
public record User(List<String> roles) { public User { roles = List.copyOf(roles); } }
final class Period {
  private final Date s, e;
  Period(Date s, Date e) { this.s = new Date(s.getTime()); this.e = new Date(e.getTime()); }
  public Date start() { return new Date(s.getTime()); }
}
```
Triage checklist: final class? private final all? mutable type? ctor copy? getter copy/unmod? Fail any → mutable.
Anti: `final List` claim, `return list`, array in record, Lombok `@Value`/record w/o compact copy.

## 3.9 Wrappers — Full
Boxing `valueOf`/`intValue`, immutable nullable, required generics/collections. Cache Boolean/Byte/Short/Integer/Long (-128..127, `AutoBoxCacheMax`), Character 0..127, Float/Double none. `new Integer` deprecated defeats cache.
```java
Map<String,Integer> m = new HashMap<>(); int total = m.get("missing"); // NPE unbox null
if (c.equals(128)) {} // correct, never ==
```
Triage: NPE arithmetic/compare → nullable DB/JSON/Map; flaky `==` → replace equals/unbox; hot-loop perf → `int/long`.
Anti: `==` wrappers, `new Integer`, unguarded unbox, Double NaN/-0.0 as key.

## 3.10 Autoboxing — Full
Hidden `valueOf/intValue` for collections/generics/varargs. Null unbox NPE; perf O(n) garbage + 2.8x slower streams (JFR Primitive-to-Object warning).
```java
Integer freq = map.get(word); int n = freq; // NPE if absent → getOrDefault/orElse
Long sum = 0L; for (...) sum += i; // garbage → long sum + IntStream/mapToLong
```
Triage: NPE at `intValue` line → nullable `get/find`; GC spikes → profile loop/stream box. Fix primitive + null/default path.
Anti: `==` Integers, `remove(int)` vs `remove(Object)`, boxed accumulator, Boolean unbox in if.

## 3.11 enum — Full
Fixed instances, type-safe, `==` safe, `switch`-able. `values/valueOf/ordinal/name`, private ctor, fields/methods, implements interfaces, constant bodies. Cannot extend (extends Enum). Singleton `INSTANCE` (Bloch #3) thread-safe ser-safe.
```java
enum BrowserEnv {
  CHROMIUM("chromium"), FIREFOX("firefox"), WEBKIT("webkit");
  private final String pwName; BrowserEnv(String n) { this.pwName = n; }
  public String pwName() { return pwName; }
  public static BrowserEnv from(String s) { return valueOf(s.trim().toUpperCase()); }
}
```
Relevance: `LoadState`, `SameSite`, `ScreenshotType`; map `BROWSER` env → enum eliminates stringly bugs.
Triage: `valueOf` IAE → log + default; never `ordinal()` persistence (reorder fragile) → explicit field.
Anti: String/int constants dup, equals vs == confusion (prefer ==), mutable fields, huge switch outside (use poly method).

## 3.12 Inner Classes — Full
Member (`outer.new Inner()`, holds `Outer.this`, no statics), static nested (`new Outer.Nested()`, prefer, top-level for packaging), local (method/block, final/effectively-final), anonymous (one-shot subtype).
Leak: non-static holds `this$0`; cached/returned/posted outliving outer → outer unGCable (Android Activity classic). Fix static + `WeakReference`/fields only + unregister.
```java
class Outer { String f = "hi"; class Inner { void m() { System.out.println(f); } } static class Nested { void m(Outer o) { System.out.println(o.f); } } }
```
Triage: heap path via `this$0` → static collection/thread holding inner → convert static+weak.
Anti: non-static w/o outer need, serializing inner/local/anon (`this$0` compat break), public inner exposing `Outer.this`, giant anon.

## 3.13 Anonymous — Full
No-name `new Super(args){body}`, extend class or impl interface, no explicit ctor (initializer), at use-site (listener/Runnable).
Captures effectively-final only (copy semantics, outlive frame); `this`=self vs lambda `this`=enclosing; extra `.class` file; fields/methods/initializers allowed; generics specialization possible.
```java
button.addActionListener(new ActionListener() {
  @Override public void actionPerformed(ActionEvent e) { System.out.println("Clicked: " + label); }
});
// SAM single-method → lambda: button.addActionListener(e -> System.out.println(label));
```
Triage: single SAM → lambda/method-ref; need state/multi/abstract-class → anon; reused/tested → named/top-level.
Anti: giant body, mutable array hack vs field, `this` confusion + long-lived listener leak.

## 3.14 Nested Static — Full
Static nested (`static class N`) vs inner (non-static). Static: no outer instance, `new Outer.Nested()`, only static direct, statics allowed, top-level behavior nested for packaging. Bloch Builder (Item 2) must be static; GoF polymorphic Builder separate.
```java
public class BankAccount {
  private final long acct; private final String owner;
  private BankAccount(Builder b) { acct = b.acct; owner = b.owner; }
  public static class Builder {
    private long acct; private String owner;
    public Builder(long acct) { this.acct = acct; }
    public Builder owner(String o) { owner = o; return this; }
    public BankAccount build() { return new BankAccount(this); }
  }
}
```
Triage: needs outer? → inner; helper/packaging only? → static; Builder needs outer instance? → wrongly non-static; leak `this$0`? → static.
Anti: non-static Builder dummy outer, non-static handler long-lived leak, static touching instance w/o ref.

## 3.15 Varargs — Full
`m(String...a)`, one last param. Inside `Type[]`; call `m("a","b")`/`m()`/`m(new String[]{})` → array creation. Fixed-arity (phase 1-2) beats varargs (phase 3, JLS 15.12.2). `m(Object)` wins over `m(Object...)`.
Heap pollution: generic `<T> m(List<T>... )` erases to `List[]`; store via `Object[]` pollutes → later CCE no visible cast. Compiler warns. Fix no store/escape; `@SafeVarargs` only static/final/private/ctor (private since 9) if safe else `List<List<T>>`.
```java
@SafeVarargs static <T> List<T> flatten(List<T>... lists) { List<T> r = new ArrayList<>(); for (List<T> l : lists) r.addAll(l); return r; }
```
Triage: generic varargs warning → audit store/escape; `NoSuchMethodError` `T[]` vs `T...` → recompile.
Anti: overload `String...` + `String[]`, exposing `T...` field, `Object...` poor-man API.

## 3.16 Annotations — Full
`@Test`/`@Before` discovered via reflection. `@Retention(RUNTIME)` for runtime `isAnnotationPresent`, CLASS `.class` only, SOURCE compile only (`@Override`). `@Target(METHOD/TYPE/FIELD...)` restricts. Custom `@interface`, elements no params/throws, return primitives/String/Class/enum/annotation/arrays.
```java
@Retention(RetentionPolicy.RUNTIME) @Target(ElementType.METHOD)
public @interface Test { boolean enabled() default true; }
// Runner: for (Method m : Class.forName(a[0]).getMethods())
//   if (m.isAnnotationPresent(Test.class) && m.getAnnotation(Test.class).enabled()) m.invoke(null);
```
Triage ignored: check RUNTIME? Target match? `getMethods` vs `getDeclared`+`setAccessible`? JUnit4 vs Jupiter import?
Anti: logic w/o processor, CLASS+reflection, custom @Test vs JUnit, asserts in @Before.

## 3.17 Reflection — Full
Entry `Class.forName/getClass/X.class`; `getDeclared*` (all mods, no inherit) vs `get*` (public+inherit); `Field/Method/Ctor`, `newInstance/get/set/invoke`. Backbone TestNG/JUnit (`@Test` discover+invoke), Spring/Guice (`@Inject` set), Jackson/Hibernate field map.
Risks: breaks encaps/invariants, JDK 9+ `InaccessibleObjectException` (strong encaps, `--add-opens`), SecurityManager/restricted fail, refactor-fragile, perf slower (lookup/check/box/no-inline — cache handles; `MethodHandle` faster warmup), RCE if untrusted names.
```java
Class<?> c = Class.forName("com.acme.Service");
Field f = c.getDeclaredField("repo"); f.setAccessible(true);
Object svc = c.getDeclaredConstructor().newInstance(); f.set(svc, mockRepo);
```
Triage: `ClassNotFound` → name/loader; `NoSuchMethod/Field` → sig/refactor; `IllegalAccess/Inaccessible` → modules; `InvocationTarget` → unwrap `getCause()`.
Anti: reflection for direct-callable logic, stringly names prod, uncached handles loop, mutating `private static final`, testing privates vs behavior.

## 3.18 Serialization — Full
`Serializable` marker → `ObjectOutputStream/InputStream`, all non-transient non-static recursive; super must Serializable or no-arg ctor. `serialVersionUID` explicit else compiler-sensitive → `InvalidClassException: local incompatible`. `serialver` to preserve. Jackson preferred APIs: `writeValueAsString/readValue(json,Foo.class)`, `@JsonProperty/Ignore/Include(NON_NULL)/Format`, `@JsonCreator`, no-arg/creator, `JavaTimeModule`.
```java
class User implements Serializable { private static final long serialVersionUID = 1L; private String name; private transient String password; }
ObjectMapper m = new ObjectMapper().registerModule(new JavaTimeModule());
```
Triage InvalidClass: compare UIDs msg, added/removed member w/o explicit UID? different compiler/JDK? stale cache? Fix explicit UID, clean+rebuild, same lib, custom read/writeObject migration. Never long-term JDK ser.
Anti: no explicit UID, JDK ser for DB/files/API (fragile/insecure deser attacks), `Thread/Socket`/secrets w/o transient, Jackson no-ctor/`FAIL_ON_UNKNOWN`/tz/internal exposure.

## 3.19 transient — Full
Skips `defaultWriteObject`, restores null/0/false. For derived/cached, non-Serializable, sensitive, handles (`Logger`, pool, `Socket`, passwords). Both `static`+`transient` skipped but different: static=class state not object state; never use static to suppress (changes sharing). `static transient` redundant default, matters custom reflection ser.
```java
class User implements Serializable { private String name; private transient String password; private transient Logger log = Logger.getLogger("u"); }
```
Triage: `NotSerializableException` → transient or Serializable; null after deser → expected, re-init `readObject()`; secret in `.ser` → missed transient + custom `writeObject`.
Anti: static mutable dodge, transient alone for security w/o encrypt/`serialPersistentFields`, no `readObject` revalidation (invariant bypass).

## 3.20 volatile — Full
Visibility not atomicity. Read→main mem, write→flush + happens-before prior writes visible. `count++` 3 ops still racy. Single read/write atomic only. Flag/status → volatile; counter/check-then-act → Atomic/sync; multi-var invariant → sync/lock; publish multi-fields → volatile ref to immutable.
```java
class Worker implements Runnable { private volatile boolean running = true; public void shutdown() { running = false; } @Override public void run() { while (running) doWork(); } }
```
Triage: infinite/stale flag → missing volatile; lost update `volatile++` → Atomic/sync; multi-field publish → final+safe pub/sync/volatile-immutable.
Anti: volatile counter, check-then-act null-init, `volatile array` (ref only not elems), multi-var `low<=high` invariant.

## 3.21 synchronized — Full
Intrinsic monitor per object, one holder, reentrant, block-structured auto-release, unlock syncs-with next lock → happens-before. Method locks `this/Class` (coarse/public-exposed); block locks explicit `private final lock` (fine, split `inputLock/outputLock`).
Relevance: shared counters/pools/files/Account state; over-sync `this` serializes tests. Prefer fine blocks/private locks; drivers via ThreadLocal not sync.
```java
private final Object lock = new Object(); private int c = 0;
public void increment() { synchronized (lock) { c++; } }
```
Triage deadlock: `transfer(A,B)` vs `transfer(B,A)` + `alphonse.bow/gaston.bow` circular hold-and-wait → `jstack`, `findDeadlockedThreads`, fix global order/single lock/`tryLock(timeout)`.
Anti: `sync(this/String/Integer)`, whole-method/IO/sleep inside, inconsistent nested order, alien `bower.bowBack()` while holding.

## 3.22 Atomic — Full
`java.util.concurrent.atomic`: `AtomicInteger/Long/Reference/Boolean`, arrays, `LongAdder`. CAS `compareAndSet(expect,update)` via hardware (`Unsafe/VarHandle`); `incrementAndGet/addAndGet/updateAndGet` CAS loops. Lock-free, volatile read/write semantics. `volatile` visibility only; `sync` visibility+exclusion blocking; `atomic` visibility+single-var RMW lock-free fastest counters; multi-var still needs lock.
```java
class AtomicCounter { private final AtomicInteger c = new AtomicInteger(0); void increment() { c.incrementAndGet(); } int value() { return c.get(); } }
```
Triage: lost contended → volatile++ → Atomic; bottleneck counter → LongAdder; stale graph → AtomicReference.
Anti: `volatile AtomicInteger` redundant, `if(get>0)decrement` check-then-act race (CAS loop), Map key (no stable equals), AtomicLong money.

## 3.23 Immutability Thread-Safety — Full
Truly immutable needs no lock. JLS 17.5 final safe publication: no `this`-escape → any thread seeing ref sees finalized finals, even via race; non-finals may see 0. Rules: all `private final`, no mutators/escape/rep exposure. Records shallow — still copy.
```java
public record Person(String name, List<String> hobbies) { public Person { hobbies = List.copyOf(hobbies); } }
public final class Box { private final int[] a; public Box(int[] a) { this.a = a.clone(); } public int[] get() { return a.clone(); } }
```
Triage race: all finals incl super? ctor `this`-escape/publish? mutable component shared/copied? record mutable? Pass all → no volatile/sync needed.
Anti: `final List` w/o copy, no-setters≠immutable (non-final), ctor listener/publish, lazy cache beneficent mutation unsync, record ArrayList direct.

## 3.24 Trap Qs — Full
Q1 `==` vs `equals` String? `==` refs, equals content. `new String("a")=="a"` false, equals true. Always equals/assertEquals.
Q2 `Integer 127 vs 128`? Cache -128..127 `IntegerCache` reuse → `==` true inside, false outside. Always equals. Same Long/Short.
Q3 `volatile` vs `sync`? volatile visibility only, `volatile i++` races; sync visibility+atomicity. Parallel counter → Atomic/sync.
Q4 `transient`? Skips ser → null after deser. `static` also not ser. DTO token cache trap.
Q5 Fail-fast vs safe? ArrayList/HashMap fail-fast `for:remove` → CME. Fix `iterator.remove/removeIf/CopyOnWrite/CHM` weakly-consistent. Filtering test data loop classic.
Q6 String/Builder/Buffer? immut/`+` garbage; Builder mutable fast unsync; Buffer sync slower. `==` concat fails; Builder large payloads.
Q7 `finally/finalize` + HashMap null? finally always (after return); finalize GC hook never rely. HashMap 1 null key + multi null values unordered; Hashtable/CHM NPE nulls; never assert HashMap order.

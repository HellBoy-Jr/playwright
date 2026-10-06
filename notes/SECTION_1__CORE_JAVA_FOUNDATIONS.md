# SECTION 1 — CORE JAVA FOUNDATIONS

## Topics Covered

- 1.1 JVM / JDK / JRE (Low-level execution loops)
- 1.2 Java Compilation and Bytecode
- 1.3 Class Loading Basics (Custom ClassLoaders in test isolated plugins)
- 1.4 Stack vs Heap (Thread stacks, allocation traps, and OutOfMemoryError profiles)
- 1.5 Primitive vs Reference Types
- 1.6 Pass-by-Value in Java (The explicit reference manipulation mechanics)
- 1.7 Object Creation and References
- 1.8 Garbage Collection — SDET Interview Depth (G1GC vs ZGC tuning, memory leaks via unclosed streams)
- 1.9 Immutability
- 1.10 Common Java Memory Questions

*Generated from Deloitte Senior SDET Modular Prompts — Section 1, one subagent per header, internet-validated*

---

## 1.1 JVM / JDK / JRE

**Theory & Core Mechanics**
`JDK > JRE > JVM`: JDK = JRE + `javac`, `jdb`, `jstat`, `jcmd`, JFR; JRE = JVM + core libs + runtime; JVM = abstract spec + platform-dependent implementation (HotSpot) that loads, verifies, and executes bytecode. Flow: `.java` → `javac` → platform-independent `.class` bytecode → ClassLoader (Bootstrap/Platform/App) → Verifier → Execution Engine. Memory: shared Heap (objects, Young/Old) + Metaspace/Method Area (class metadata); per-thread JVM Stack, PC Register, Native Method Stack. Execution is tiered: interpreter starts fast with profiling counters, then C1/C2 JIT compiles hot methods to native code in Code Cache with inlining, escape analysis, loop unrolling, deoptimization on bad speculation.

**Enterprise Relevance:** At 5000+ parallel Selenium/RestAssured tests on Selenium Grid/K8s, each JVM fork multiplies Heap + Metaspace + threads (~1MB stack each). Under-sized `-Xmx`, thread-leaked WebDrivers, and retained PageObjects cause `Java heap space`, `GC overhead limit`, `unable to create native thread`. JIT warm-up also skews perf baselines — first suite run is slower until hot paths compile.

**Production-Ready Code:**
```java
// Run: java -Xms2g -Xmx4g -XX:+UseG1GC -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/oom.hprof -jar tests.jar
public static void logMemory(String phase) {
  Runtime r = Runtime.getRuntime();
  System.out.printf("%s: used=%dMB max=%dMB%n", phase,
    (r.totalMemory()-r.freeMemory())/1024/1024, r.maxMemory()/1024/1024);
}
```

**High-Stakes Scenario:** OOM in CI — 1. Classify log: `heap space` vs `Metaspace` vs `native thread`. 2. Preserve `-XX:+HeapDumpOnOutOfMemoryError` artifact + `jcmd <pid> GC.class_histogram`. 3. Analyze with MAT/JVisualVM for leak suspects (e.g., static `List<WebDriver>`). 4. Mitigate: raise `-Xmx`, fix `driver.quit()` in `finally`, shard suites. 5. Harden: pin Docker memory, add `-XX:+ExitOnOutOfMemoryError`.

**Anti-Patterns & Pitfalls**
- Confusing JDK/JRE; shipping only JRE to build agents, losing `javac/jcmd`.
- `String +=` in loops, static collections holding test data; ignoring `Metaspace` leaks from dynamic proxies.
- Setting `-Xmx` > container limit; unbounded `ThreadPool` for parallel tests.

**Likely Interview Qs**
1. *Interpreter vs JIT?* Interpreter runs bytecode line-by-line fast-start/slow; JIT compiles hot code to native for peak throughput.
2. *Why OOM despite free heap?* Native/Metaspace/thread-limit exhaustion or single huge allocation, not just heap leak — check dump + NMT.

---

## 1.2 Java Compilation and Bytecode

**Theory:** `javac` compiles `.java` source to platform-neutral `.class` files containing JVM bytecode, not native code. Pipeline: parse → enter/annotate → desugar (generics erased, enhanced-for lowered) → emit → `ClassFile` structure: `magic (0xCAFEBABE)`, `major/minor_version`, `constant_pool[]`, `access_flags`, `fields`, `methods`, `attributes (Code, LineNumberTable, StackMapTable)`. Bytecode is stack-based (~200 opcodes: `aload_0`, `invokestatic/virtual/special/dynamic`, `ldc`, `if_icmp`). At runtime, ClassLoader + Verifier + Interpreter loads it, then HotSpot JIT tiered compilation optimizes hot paths. Inspect via `javap -c -p -v`.

**Enterprise Relevance for 5000+ test scale:** Same JAR on heterogeneous JDKs/agents; `major_version` mismatch causes `UnsupportedClassVersionError` and mass suite aborts. JIT warmup skews performance assertions. Understanding `constant_pool`/`invokedynamic` explains lambda-heavy framework startup cost and code-cache exhaustion in long soak runs.

```java
// Triage: javac -d target src/AuthPage.java && javap -c -p target/AuthPage.class
public class AuthPage {
  public boolean isValid(String token) { return token != null && !token.isBlank(); }
}
```

**Triage Scenario:** After JDK 17→21 upgrade, 30% API tests fail with `NoSuchMethodError`. `javap -v` reveals stale dependency compiled against old signature; `major_version 61 vs 65` + `Methodref` mismatch confirms binary incompatibility. Fix: recompile with `-release 21`, enforce Maven enforcer.

**Anti-Patterns:** 1. Committing `.class` files. 2. Disabling tiered compilation (`-Xint`) to "stabilize" timings. 3. Ignoring `-Xlint`/warnings.

**Interview Qs:**
1. Why both interpretation and JIT — what triggers C1→C2 promotion?
2. What does `javap -c` show for `invokedynamic`, and why does it matter for lambdas?

---

## 1.3 Class Loading Basics — Custom ClassLoaders in Test Isolated Plugins

**Theory:** 3 built-in loaders: `Bootstrap (null)` → `Extension / Platform (Java 9+)` → `App / System`. Delegation in `ClassLoader.loadClass()`: check loaded → delegate to parent → own `findClass()` → `defineClass(bytes)`. Ensures uniqueness and security.

**Enterprise Relevance:** Test platforms are plugin systems: Jenkins plugins, Grid nodes, Surefire forked providers, TestNG listeners. Without isolation, RestAssured 5 + Jackson 2.15 clashes with Jackson 2.12. Solution: one `URLClassLoader` per plugin with parent = shared API loader.

```java
public class PluginClassLoader extends URLClassLoader {
  public PluginClassLoader(URL[] urls, ClassLoader parent) { super(urls, parent); }
  @Override protected Class<?> findClass(String name) throws ClassNotFoundException {
    byte[] bytes = loadBytesFromJar(name);
    return defineClass(name, bytes, 0, bytes.length);
  }
}
```

**Triage:** `ClassNotFoundException` → missing jar in plugin `URL[]`. `NoClassDefFoundError` → compiled OK but runtime missing — check Surefire classpath. `LinkageError / ClassCastException: X cannot be cast to X` → same class loaded twice — duplicate jar in parent + child.

**Anti-Patterns:** 1. Overriding `loadClass()` instead of `findClass()`. 2. Child-first without allowlist. 3. Static refs preventing loader GC → Metaspace OOM.

**Q1:** Why does `getParent()` return `null` for `String`? **Q2:** Child-first vs parent-first in test plugin?

---

## 1.4 Stack vs Heap (Thread Stacks, Allocation Traps, OOM Profiles)

**Stack:** per-thread LIFO for frames — locals, refs, return addresses. Fast, fixed `-Xss` (~512K–1M). Not GC'd. **Heap:** shared for all `new` objects. GC-managed. **Metaspace:** native memory for class metadata.

**Enterprise Relevance — Parallel TestNG:** Each TestNG thread gets its own stack. 200 threads × 1M = 200M native memory before heap. Causes `unable to create new native thread` even when heap free.

```java
public void processOrder(int orderId) {
    int discount = 10;
    String label = "ORD-" + orderId;
    List<String> items = new ArrayList<>();
    items.add(label);
    validate(items);
}
void recursiveBug(int n) { recursiveBug(n + 1); } // -> StackOverflowError
```

**Triage:**
| Error | Cause | CI Action |
|---|---|---|
| `StackOverflowError` | Deep recursion | Check top frames, fix recursion |
| `OOM: Java heap space` | Leak / `-Xmx` small | HeapDump + MAT, check static WebDrivers |
| `OOM: Metaspace` | Classloader leak | Check mocks, set MaxMetaspaceSize |
| `OOM: unable to create new native thread` | Too many threads | Lower thread-count, reduce `-Xss`, `ulimit -u` |

**Anti-Patterns:** thread-count=50 with -Xss1M on 2GB agent; static WebDriver maps; catching OOM and continuing.

---

## 1.5 Primitive vs Reference Types

8 **primitives**: `byte, short, int, long, float, double, char, boolean`. By value, fixed size, defaults `0/false`. **References** — objects, arrays, wrappers — store reference to heap object, default `null`, compare with `.equals()`.

Memory: `int[1M]` ≈ 4MB. `List<Integer>` ≈ 20-28MB + GC. JVM caches `Integer -128..127`.

```java
int a = 10;
Integer b = null;
Map<String,Integer> m = new HashMap<>();
m.put("age", null);
int age = m.get("age"); // NPE on unboxing!
```

**Triage — NPE from Unboxed Null:** `Cannot invoke Integer.intValue()` at `map.get(k)`. Fix: null-check / `getOrDefault`, distinguish 0 vs missing.

**Anti-Patterns:** `==` on wrappers; `Boolean flag=null; if(flag)`; autoboxing in hot loops.

---

## 1.6 Pass-by-Value in Java

Java is **strictly pass-by-value**. Primitives copy value. Objects copy reference value. Mutation via copied ref visible; reassignment invisible.

```java
class UserDTO { String name; UserDTO(String n){name=n;} }
static void rename(UserDTO u){ u.name = "Deloitte"; } // visible
static void replace(UserDTO u){ u = new UserDTO("Ghost"); } // invisible
```

**Enterprise Relevance:** Service helpers `enrichOrder(OrderDTO dto)` rely on mutation. Risk: hidden side-effects, JPA dirty-check surprises.

**Anti-Patterns:** Expecting `swap()` to propagate; void helpers that both mutate and return new object.

---

## 1.7 Object Creation and References

`new` = allocate heap + header + zero fields + run constructor chain. Assignment copies reference. Object GC-eligible when unreachable from GC roots.

```java
Order o1 = new Order(101);
Order o2 = o1; // alias
o1 = null; // still reachable via o2
o2 = null; // now eligible
try (BufferedReader br = new BufferedReader(new FileReader("data.csv"))) {
  return br.readLine();
}
```

**Triage:** NPE → check alias nulled; OOM → heap dump + MAT; unclosed → `lsof`, add `AutoCloseable`.

**Anti-Patterns:** `finalize()/System.gc()`; premature `null`; static holders of drivers.

---

## 1.8 Garbage Collection — SDET Interview Depth

Young (Eden+Survivor) + Old. **ParallelGC:** throughput, high pauses. **G1GC (default):** region-based, pause goal `-XX:MaxGCPauseMillis=200`. **ZGC:** concurrent, <1ms pauses, 5-15% throughput cost. Logs: `-Xlog:gc*:file=gc.log:time`.

**Enterprise Relevance:** 5000-test nightly OOMs from leaked drivers, unclosed POI workbooks, static caches. G1GC hides until Old fills, then thrash 3x slowdown.

```java
// -XX:+UseG1GC -Xms2g -Xmx2g -XX:MaxGCPauseMillis=200 -Xlog:gc*:file=gc.log:time
public void readEvidence(String path) throws IOException {
  try (FileInputStream fis = new FileInputStream(path)) { fis.readAllBytes(); }
}
```

**Triage:** 1. HeapDumpOnOOM 2. `jstat -gcutil` watch Old Gen 3. `jmap -dump:live` + MAT dominators 4. Fix `driver.quit()`, clear ThreadLocal.

**Anti-Patterns:** `close()` vs `quit()`; unclosed streams; unbounded static List; huge -Xmx to hide leak.

---

## 1.9 Immutability

Rules: `final` class, `private final` fields, no setters, defensive copies, unmodifiable getters. `final` freezes pointer, not object. JMM: `final` fields safely published.

**Enterprise Relevance:** Parallel TestNG shares TestData/Config/Tokens. Mutable POJOs → flaky overwrites. Immutable → zero sync.

```java
public final class TestData {
  private final String userId;
  private final List<String> roles;
  public TestData(String userId, List<String> roles) {
    this.userId = userId;
    this.roles = List.copyOf(roles);
  }
  public String userId() { return userId; }
  public List<String> roles() { return roles; }
  public TestData withUserId(String id) { return new TestData(id, this.roles); }
}
```

**Anti-Patterns:** `final List` without copy; exposing internal list; adding setter for convenience.

---

## 1.10 Common Java Memory Questions

- **StackOverflow vs OOM?** Stack = recursion depth; OOM = heap/Metaspace live objects.
- **Stack vs Heap vs Metaspace?** Stack thread-private frames; Heap `new` objects GC'd; Metaspace class metadata native.
- **GC? Minor vs Major? G1 vs ZGC?** Minor Young fast copy; Major Old slow. G1 regions predictable pauses; ZGC concurrent low-latency.
- **String.intern() leak?** Yes — unbounded intern pins strings. Fix LRU/TTL, avoid intern on dynamic data. Check MAT `char[]/byte[]`.
- **static leak?** `static List/WebDriver/Map` lives for ClassLoader life. Clear in `@AfterMethod/@AfterSuite`.
- **ThreadLocal leak?** Pool reuse + strong value → stale driver. Always `remove()` in finally.
- **OOME triage in CI?** `-XX:+HeapDumpOnOutOfMemoryError -Xlog:gc*`, MAT Leak Suspects, cap thread-count/forkCount.

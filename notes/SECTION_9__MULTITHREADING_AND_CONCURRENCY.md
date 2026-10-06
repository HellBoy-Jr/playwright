# SECTION 9 — MULTITHREADING AND CONCURRENCY

## Topics Covered
- 9.1 Process vs Thread, 9.2 Lifecycle, 9.3 Creating Threads, 9.4 Runnable, 9.5 Callable, 9.6 Future, 9.7 ExecutorService, 9.8 Thread Pools, 9.9 synchronized, 9.10 Race, 9.11 Deadlock, 9.12 Starvation, 9.13 Thread Safety, 9.14 Immutable, 9.15 Concurrent Collections, 9.16 Atomic, 9.17 ThreadLocal, 9.18 Sync in Frameworks, 9.19 Parallel Execution, 9.20 Data Isolation, 9.21 Interview Scenarios

*Built with dedicated subagent, internet-validated*

---
- **Process vs Thread:** process OS mem isolated (Chrome), thread JVM shared heap (TestNG parallel). Driver not thread-safe.
- **Lifecycle:** NEW→RUNNABLE→BLOCKED/WAITING/TIMED_WAITING→TERMINATED. getState debug hangs, join timeout+interrupt.
- **Creating:** extends Thread wastes inherit, Runnable+Thread demo, prefer ExecutorService. Never unbounded new Thread in hooks.
- **Runnable:** `void run()` no return/checked, fire-forget logs/screenshots/seed, lambda reusable.
- **Callable<V> call:** returns + throws, parallel data fetch/DB/health + Future/invokeAll. Runnable vs Callable favorite.
- **Future<V>:** get/get(timeout)/cancel/isDone. Never blocking get, use get(10s)+Timeout/Execution handling. Modern CompletableFuture chaining.
- **ExecutorService:** execute/submit/invokeAll/shutdown. Always shutdown in AfterSuite else hang. shutdown vs now vs awaitTermination.
- **Pools + ExecutorService (production):** fixed stable, cached bursts OOM risk, single ordered, scheduled health. Always shutdown/awaitTermination in AfterSuite. Fresh 2024+: Java 21 virtual threads (`Executors.newVirtualThreadPerTaskExecutor()`) for IO-bound API tests; still use bounded platform pool for Selenium drivers (virtual threads pin on synchronized/native driver calls).
```java
ExecutorService pool = new ThreadPoolExecutor(
  4, 8, 30L, TimeUnit.SECONDS,
  new ArrayBlockingQueue<>(100),
  new ThreadFactoryBuilder().setNameFormat("sdet-%d").build(),
  new ThreadPoolExecutor.CallerRunsPolicy());
try {
  List<Future<String>> out = pool.invokeAll(List.of(
    () -> RestAssured.get("/users/1").asString(),
    () -> RestAssured.get("/orders/1").asString()), 60, TimeUnit.SECONDS);
} catch (InterruptedException e) { Thread.currentThread().interrupt(); }
finally { pool.shutdown(); if (!pool.awaitTermination(30, TimeUnit.SECONDS)) pool.shutdownNow(); }
```
Triage: hang → missing shutdown; RejectedExecution → bounded queue full + CallerRuns; thread-count > cores*2 → context-switch thrash. Anti: `Executors.newCachedThreadPool()` unbounded on Grid, `get()` without timeout.
- **synchronized:** intrinsic reentrant, minimal blocks around report/counter never whole test. Prefer ThreadLocal isolation.
- **Race:** read-modify-write `count++`/shared Extent interleaving flaky. Fix Atomic/sync/ThreadLocal. 100 threads demo loses.
- **Deadlock:** circular Lock1↔Lock2 (DriverFactory↔DataFactory sync). jstack dump, order locks/tryLock timeout, avoid nested.
- **Starvation:** low-priority/fair-less never scheduled vs deadlock RUNNABLE. Infinite test hogs sync report → TestNG timeout. ReentrantLock(true) fair, short sections.
- **Safety:** immutable/sync/concurrent/confinement. Driver/ArrayList/HashMap unsafe; CHM/Atomic safe. Share nothing mutable, stress 4x50.
- **Immutable:** final no setters inherently safe (String, record Credentials). Final class/fields/defensive copy. Pass immutable to parallel.
- **Concurrent:** CHM result aggregator, CopyOnWrite listeners, BlockingQueue pipeline. Never syncList high contention.
- **Atomic:** CAS incrementAndGet/compareAndSet lock-free counters/retry/IDs. Faster than sync simple. `passed.incrementAndGet()`.
- **ThreadLocal:** per-thread driver isolation standard: `ThreadLocal<WebDriver> set/get/quit+remove` avoids leak. Eliminates interference no sync.
- **Sync frameworks:** isolate drivers/data ThreadLocal, sync tiny report flush only, concurrent map, ThreadLocal<ExtentTest>. Over-sync BeforeMethod serializes.
- **Parallel:** TestNG `parallel=methods thread-count=4`, JUnit concurrent, ExecutorService API. 4x faster but needs independent+isolated+safe reporting. Grid/Selenoid scale. Timeouts+idempotent retry.
- **Isolation (production factory):** unique users/emails/IDs per thread, BeforeMethod gen AfterMethod cleanup.
```java
public final class TestDataFactory {
  private static final BlockingQueue<String> USER_POOL = new LinkedBlockingQueue<>();
  private static final ThreadLocal<String> EMAIL = ThreadLocal.withInitial(
    () -> "user-" + UUID.randomUUID() + "-t" + Thread.currentThread().getId() + "@deloitte.test");
  public static String email() { return EMAIL.get(); }
  public static String checkoutUser() throws InterruptedException {
    String u = USER_POOL.poll(10, TimeUnit.SECONDS);
    if (u == null) throw new FrameworkException("No isolated user available");
    return u;
  }
  public static void release(String u) { USER_POOL.offer(u); }
  public static void clear() { EMAIL.remove(); }
}
```
Triage: collision false-fail → hardcoded same account; leak → missing AfterMethod clear/release; pool starvation → size < thread-count. Anti: static shared email, same orderId parallel.
- **Scenarios:** static driver flaky→ThreadLocal; race counter→Atomic; nested sync deadlock→ordering; missing shutdown hang→awaitTermination; end-to-end parallel+isolation+reporting.
```java
public class DriverFactory {
  private static ThreadLocal<WebDriver> tl = new ThreadLocal<>();
  public static void setDriver(WebDriver d){tl.set(d);}
  public static WebDriver getDriver(){return tl.get();}
  public static void quit(){getDriver().quit(); tl.remove();}
}
```

# SECTION 9 — MULTITHREADING AND CONCURRENCY (Senior SDET Masterclass)

## Topics Covered
- **9.1 Process vs. Thread (OS Memory Address Spaces & Context Switching Overhead)**
- **9.2 Thread Lifecycle State Machine (NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED)**
- **9.3 Creating Threads (`Thread` vs. `Runnable` vs. `Callable`)**
- **9.4 `Runnable` vs. `Callable` vs. `Future`**
- **9.5 `CompletableFuture` (Asynchronous Non-Blocking Pipelines for Test Hydration)**
- **9.6 `ExecutorService` & Thread Pools Architecture**
- **9.7 `ThreadPoolExecutor` Deep Tuning (`corePoolSize`, `maxPoolSize`, `workQueue`, `RejectedExecutionHandler`)**
- **9.8 `synchronized` Keyword (Monitor Locks, Object Headers, & Bytecode `monitorenter`/`monitorexit`)**
- **9.9 Explicit Locks (`ReentrantLock`, `ReadWriteLock`, & `tryLock` Timeouts)**
- **9.10 Race Conditions & Critical Sections (Read-Modify-Write Hazards)**
- **9.11 Deadlock (The 4 Coffman Conditions), Livelock, & Starvation**
- **9.12 Thread Safety Principles (Immutability, Confinement, Synchronization, Volatiles)**
- **9.13 `volatile` Keyword & The Java Memory Model (JMM Happens-Before Guarantee)**
- **9.14 `Atomic` Classes & CPU Hardware CAS (`Compare-And-Swap`)**
- **9.15 `ThreadLocal` in Test Automation (Driver & Context Isolation Mechanics)**
- **9.16 Thread-Safe Collections (`ConcurrentHashMap`, `CopyOnWriteArrayList`, `BlockingQueue`)**
- **9.17 Parallel Test Execution Architecture (TestNG Concurrency Tuning)**
- **9.18 Test Data Isolation in Concurrent Runs (Worker-Scoped Identifiers)**
- **9.19 Thread Safety in Test Framework Design (Singleton vs. ThreadLocal Anti-Patterns)**
- **9.20 Virtual Threads (Java 21 Project Loom — Carrier Threads & SDET Pipeline Impact)**
- **9.21 High-Stakes Senior Concurrency Interview Questions & Spoken Solutions**

---

## 9.1 Process vs. Thread

```
┌────────────────────────────────────────────────────────────────────────┐
│                   OPERATING SYSTEM PROCESS (e.g. JVM)                  │
│   Private Virtual Address Space, File Descriptors, Sockets, OS PID     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ SHARED PROCESS MEMORY: Heap, Metaspace, CodeCache                │  │
│  │                                                                  │  │
│  │  ┌────────────────────────┐         ┌────────────────────────┐   │  │
│  │  │ Thread 1 (Test Worker) │         │ Thread 2 (Test Worker) │   │  │
│  │  │ • Dedicated PC Register│         │ • Dedicated PC Register│   │  │
│  │  │ • Private Stack (-Xss) │         │ • Private Stack (-Xss) │   │  │
│  │  └────────────────────────┘         └────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

| Dimension | OS Process | Java Thread |
| :--- | :--- | :--- |
| **Memory Isolation** | Strictly isolated by OS kernel; no direct memory sharing. | Shares the same JVM Heap and Metaspace memory. |
| **Creation Cost** | Heavyweight (spawns new OS memory table, file handles). | Lightweight (~1MB stack, shares heap). |
| **Context Switching** | Expensive (invalidates CPU TLB cache, page table swap). | Faster (saves registers, switches stack pointer). |
| **Failure Blast Radius**| Crash in one process does not kill other processes. | Unhandled fatal error (`OOM`) crashes the whole JVM. |

---

## 9.2 Thread Lifecycle State Machine

```
         ┌────────────┐
         │    NEW     │
         └─────┬──────┘
               │ Thread.start()
               ▼
         ┌────────────┐               Waiting on Monitor Lock
         │  RUNNABLE  │ ◄─────────────────────────────────────────┐
         └─────┬──────┘                                           │
               │                                                  │
 ┌─────────────┼──────────────┐                                   │
 │             │              │                                   │
 ▼             ▼              ▼                                   ▼
┌────────────┐┌────────────┐┌────────────┐                  ┌────────────┐
│  WAITING   ││TIMED_WAITIN││  BLOCKED   │ ────────────────► │  BLOCKED   │
│(join, wait)││(sleep, wait││(sync lock) │                  └────────────┘
└────────────┘└────────────┘└────────────┘
       │              │              │
       └──────────────┴──────────────┘
                      │ Run method completes
                      ▼
               ┌────────────┐
               │ TERMINATED │
               └────────────┘
```

---

## 9.5 `CompletableFuture` (Asynchronous Non-Blocking Test Pipelines)

In high-scale API testing or test data pre-seeding, executing requests sequentially wastes massive amounts of time waiting for I/O. `CompletableFuture` enables asynchronous, non-blocking execution with composable pipelines:

```java
package com.deloitte.sdet.concurrency;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ParallelDataHydration {

    private final ExecutorService executor = Executors.newFixedThreadPool(10);

    public record TestPayload(String userToken, String orderId, String inventoryStatus) {}

    public CompletableFuture<TestPayload> hydrateTestDataAsync() {
        // Step 1: Authenticate user asynchronously
        CompletableFuture<String> authFuture = CompletableFuture.supplyAsync(() -> {
            return mockApiCall("/auth/token");
        }, executor);

        // Step 2: Concurrently create product inventory
        CompletableFuture<String> inventoryFuture = CompletableFuture.supplyAsync(() -> {
            return mockApiCall("/inventory/reserve");
        }, executor);

        // Step 3: Combine both results to generate order
        return authFuture.thenCombine(inventoryFuture, (token, inventory) -> {
            String orderId = mockApiCall("/orders/create?token=" + token + "&item=" + inventory);
            return new TestPayload(token, orderId, inventory);
        });
    }

    private String mockApiCall(String endpoint) {
        // Simulated network I/O latency
        return "SUCCESS-" + endpoint.hashCode();
    }
}
```

---

## 9.6 `ExecutorService` & 9.7 `ThreadPoolExecutor` Tuning

> [!CAUTION]
> **Never use `Executors.newCachedThreadPool()` in automation frameworks!** It creates an unbounded number of threads. Under high test load, it will spawn hundreds of threads, exhausting OS native memory and crashing with `java.lang.OutOfMemoryError: unable to create new native thread`.

### Production Code: Fully Tuned `ThreadPoolExecutor`
```java
package com.deloitte.sdet.concurrency;

import java.util.concurrent.*;

public final class CustomTestThreadPool {

    public static ExecutorService createSafePool(int poolSize) {
        return new ThreadPoolExecutor(
            poolSize,                       // Core pool size: Persistent worker count
            poolSize * 2,                   // Max pool size: Burst ceiling
            60L, TimeUnit.SECONDS,          // Keep-alive time for idle burst threads
            new ArrayBlockingQueue<>(500),  // Bounded queue: Prevents runaway memory allocation
            new ThreadFactory() {           // Custom thread naming for legible jstack thread dumps
                private int counter = 0;
                @Override
                public Thread newThread(Runnable r) {
                    Thread t = new Thread(r, "sdet-worker-" + (++counter));
                    t.setDaemon(false);
                    return t;
                }
            },
            // Rejection Policy: When queue and max threads are full,
            // executing thread runs the task itself, throttling incoming tasks!
            new ThreadPoolExecutor.CallerRunsPolicy() 
        );
    }
}
```

---

## 9.8 `synchronized` Keyword vs. 9.9 `ReentrantLock`

### The Under-the-Hood Bytecode Mechanics of `synchronized`
When compiling a `synchronized` block, the compiler emits two bytecode instructions:
1. `monitorenter`: Acquires the object's monitor lock (stored in the Mark Word of the object header). If already locked by another thread, execution suspends until released.
2. `monitorexit`: Releases the monitor lock. The compiler emits multiple `monitorexit` instructions—including inside exception handlers—to guarantee the lock is freed even if an exception occurs!

### Why `ReentrantLock` Wins in Complex Architectures
```java
Lock lock = new ReentrantLock();

// 1. Timed lock acquisition (Prevents permanent deadlocks!)
if (lock.tryLock(5, TimeUnit.SECONDS)) {
    try {
        // Critical section: interact with shared resource
    } finally {
        lock.unlock(); // Always release in finally block
    }
} else {
    // Graceful fallback / retry mechanism
    throw new TimeoutException("Could not acquire lock within 5 seconds");
}
```

---

## 9.10 Race Conditions & 9.11 Deadlock

### The 4 Coffman Conditions of Deadlock
Deadlock occurs when two or more threads are permanently blocked, each holding a resource the other needs. All 4 conditions must hold simultaneously:
1. **Mutual Exclusion**: Resources cannot be shared.
2. **Hold and Wait**: A thread holds one resource while waiting for another.
3. **No Preemption**: Resources cannot be forcibly taken from a thread.
4. **Circular Wait**: Thread 1 waits for Resource B (held by Thread 2), and Thread 2 waits for Resource A (held by Thread 1).

**The Senior Architectural Solution**: Enforce a strict **Global Lock Acquisition Order**. All threads must acquire Resource A before Resource B.

---

## 9.15 `ThreadLocal` in Test Automation (Driver & Context Isolation)

### 1. Theory & Memory Layout
In parallel test execution (e.g. TestNG with `parallel="methods" thread-count="4"`), each test method executes on an independent OS thread.
- `ThreadLocal<T>` provides **Thread Confinement**: every thread accessing the `ThreadLocal` variable gets its own independent, isolated copy of the object.
- **Under the Hood**: Every `java.lang.Thread` object contains a field `ThreadLocal.ThreadLocalMap threadLocals`.
- The key is a `WeakReference<ThreadLocal<?>>`, and the value is a strong reference to the target object (`WebDriver`).

```
                    ThreadLocal Storage Layout
                    
  [Thread-1 Object]                          [Thread-2 Object]
  └── threadLocals (ThreadLocalMap)          └── threadLocals (ThreadLocalMap)
      └── Entry[WeakRef(TL), WebDriver-A]        └── Entry[WeakRef(TL), WebDriver-B]
```

### 2. The Catastrophic Memory Leak in Thread Pools
When worker threads belong to a long-running thread pool (e.g. Jenkins build agent or Surefire runner), threads are **never destroyed**; they are reused across tests.
If `@AfterMethod` forgets to invoke `threadLocal.remove()`, the entry in `ThreadLocalMap` retains a strong reference to the `WebDriver` instance indefinitely. As thousands of tests run, dead browser sessions and memory heap allocations accumulate, terminating the JVM with `OutOfMemoryError: Java heap space`.

---

### 3. Production-Ready Code: Thread-Safe Driver & Data Factory
```java
package com.deloitte.sdet.driver;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

import java.util.Objects;

public final class ThreadSafeDriverFactory {

    // ThreadLocal container: Guarantees 100% thread isolation
    private static final ThreadLocal<WebDriver> DRIVER_HOLDER = new ThreadLocal<>();

    private ThreadSafeDriverFactory() {}

    public static WebDriver getDriver() {
        return Objects.requireNonNull(
            DRIVER_HOLDER.get(), 
            "WebDriver has not been initialized for the current thread: " + Thread.currentThread().getName()
        );
    }

    public static void initDriver(boolean headless) {
        ChromeOptions options = new ChromeOptions();
        if (headless) {
            options.addArguments("--headless=new");
        }
        WebDriver driver = new ChromeDriver(options);
        DRIVER_HOLDER.set(driver);
    }

    public static void quitDriver() {
        WebDriver driver = DRIVER_HOLDER.get();
        if (driver != null) {
            try {
                driver.quit(); // Closes physical browser window and OS process
            } finally {
                // MANDATORY SENIOR STEP: Purges entry from ThreadLocalMap to prevent memory leak
                DRIVER_HOLDER.remove();
            }
        }
    }
}
```

---

## 9.17 Parallel Test Execution Architecture

### Concurrency Tuning Formula for SDETs
How do you determine the optimal `thread-count` in `testng.xml` or Playwright?

$$\text{Optimal Threads} = \text{Available CPU Cores} \times \left(1 + \frac{\text{Wait Time (I/O)}}{\text{Compute Time (CPU)}}\right)$$

- For **CPU-Bound Tasks** (pure unit calculations): $\text{Threads} \approx \text{Cores}$.
- For **I/O-Bound UI/API Automation**: Tests spend 90% of their time waiting on network roundtrips, browser DOM rendering, or database queries ($\frac{\text{Wait}}{\text{Compute}} \approx 9$).
- On an 8-core CI agent: $\text{Optimal Threads} \approx 8 \times (1 + 4) \approx 32\text{ to }40\text{ threads}$ (bounded primarily by available RAM: allow 1GB RAM per active Chrome browser process).

---

## 9.20 Virtual Threads (Java 21 Project Loom — SDET Impact)

Introduced in Java 21, Virtual Threads are lightweight threads managed directly by the JVM, not the OS kernel:
- **Scale**: You can spawn **1,000,000 virtual threads** simultaneously without exhausting memory (each consumes only a few hundred bytes of heap memory, unlike 1MB platform thread stacks).
- **Mount / Unmount**: When a virtual thread executes a blocking I/O call (HTTP request in RestAssured, database socket read), the JVM **unmounts** it from the underlying carrier platform thread, allowing the carrier thread to execute other virtual threads!

```java
// Java 21: High-throughput API regression executor running 5,000 requests concurrently
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 5000; i++) {
        final int id = i;
        executor.submit(() -> {
            RestAssured.get("https://api.deloitte.com/orders/" + id);
        });
    }
} // Auto-waits for all 5,000 requests to complete!
```

> [!WARNING]
> **Virtual Thread Pinning Hazard**: If code invokes a blocking operation inside a `synchronized` block or native JNI call, the virtual thread cannot unmount and becomes **pinned** to the carrier thread. When using Virtual Threads, replace `synchronized` with `ReentrantLock`.

---

## 9.21 High-Stakes Senior Concurrency Interview Questions & Spoken Solutions

### Q1: "Explain how you diagnose and fix a test that passes when executed alone, but fails intermittently when run in parallel with 4 threads."
> *"A test that passes in isolation but fails under parallel execution is a textbook signature of **Shared Mutable State**. I follow a systematic 3-step triage:*
> 1. *First, I identify the failure signature: Is it a `NoSuchSessionException` or `NullPointerException`? That points to a shared, un-thread-safe `static WebDriver` or `static PageObject` instance. I resolve this by enforcing **Thread Confinement** using `ThreadLocal<WebDriver>` and ensuring every thread instantiates its own Page Objects.*
> 2. *Second, I inspect Test Data Collisions: Are tests using hardcoded credentials (e.g. `admin@test.com`) or updating the same database order ID concurrently? One test's state mutation invalidates another's assertions. I resolve this by implementing a dynamic `TestDataFactory` that appends `UUID.randomUUID()` or thread worker IDs to all created entities.*
> 3. *Third, I inspect Test Suite Dependencies: Did Test B rely on database state seeded by Test A? In parallel runs, execution order is non-deterministic. I make every test completely self-contained with its own API setup and teardown phases."*

---

### Q2: "What is the difference between `volatile` and `AtomicInteger`?"
> *"The difference centers on **Visibility** versus **Atomicity**:
> - *`volatile` only guarantees **Memory Visibility** and prevents CPU instruction reordering. It ensures that when one thread writes to a variable, all other threads immediately see the updated value in main memory. However, it does NOT provide mutual exclusion. A compound operation like `count++` involves three separate operations (Read $\to$ Increment $\to$ Write); running `count++` across multiple threads on a volatile variable will still result in race conditions and lost updates.*
> - *`AtomicInteger` guarantees both **Visibility AND Atomicity**. It utilizes low-level CPU hardware **Compare-And-Swap (CAS)** instructions (e.g. `CMPXCHG` on x86). Method calls like `incrementAndGet()` execute as an atomic, lock-free hardware operation, ensuring safe multi-threaded updates with zero synchronization overhead."*

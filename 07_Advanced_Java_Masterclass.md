# Advanced Java Masterclass — Senior SDET Interview

## 1. Object Contracts

### equals / hashCode

Contract:

```text
equals(a, b) == true
        ↓
hashCode(a) == hashCode(b)
```

Collision is valid:

```text
same hash
   ↓
equals can still be false
```

### Mutable key warning

Do not use mutable fields in the equality/hash identity of a map key.

```java
Map<TestUser, String> map = new HashMap<>();

TestUser user = new TestUser("john", "tenant-a");
map.put(user, "ACTIVE");

// If username changes after insertion, lookup may fail.
```

Senior answer:

> Hash-based collections assume the key's equality and hash identity remain stable while the key is stored.

---

## 2. String Internals

### Immutability

```java
String s = "abc";
s.concat("def");
```

does not change `s`.

Strings are immutable, so operations create new objects.

### Why this matters in testing

- safer shared values;
- thread-friendly;
- predictable configuration values;
- useful as map keys.

### StringBuilder

Use for repeated concatenation:

```java
StringBuilder builder = new StringBuilder();

for (String value : values) {
    builder.append(value).append('\n');
}

String result = builder.toString();
```

---

## 3. OOP for Framework Design

### Composition

Prefer composition when behavior should be assembled rather than inherited.

```java
public final class LoginService {
    private final AuthenticationClient authClient;
    private final TestDataFactory testDataFactory;

    public LoginService(
            AuthenticationClient authClient,
            TestDataFactory testDataFactory) {

        this.authClient = authClient;
        this.testDataFactory = testDataFactory;
    }
}
```

### Why?

Testing frameworks contain replaceable dependencies:

```text
API client
Browser adapter
DB client
Logger
Config
```

Composition makes replacement and testing easier.

---

## 4. SOLID in Automation

### Single Responsibility

One class should have one reason to change.

Bad:

```text
LoginTest
 + browser lifecycle
 + SQL
 + REST
 + reporting
 + locators
```

Better:

```text
LoginTest
LoginPage
UserApi
DatabaseClient
Reporter
DriverManager
```

### Open/Closed

Add new browser behavior without modifying all tests.

### Liskov

Subtypes should remain valid substitutes.

### Interface Segregation

Prefer small interfaces:

```java
interface AuthProvider {
    String token();
}

interface UserApi {
    Response getUser(String id);
}
```

### Dependency Inversion

Tests should depend on abstractions:

```java
public final class CheckoutService {

    private final PaymentClient paymentClient;

    public CheckoutService(PaymentClient paymentClient) {
        this.paymentClient = paymentClient;
    }
}
```

---

## 5. Generics

### Generic utility

```java
public static <T> T firstOrFail(
        List<T> values,
        Predicate<T> condition) {

    return values.stream()
            .filter(condition)
            .findFirst()
            .orElseThrow(
                    () -> new AssertionError(
                            "Expected element was not found"
                    )
            );
}
```

### PECS

```text
Producer → extends
Consumer → super
```

---

## 6. Exceptions

Framework exceptions should add context.

```java
public class FrameworkException
        extends RuntimeException {

    public FrameworkException(
            String message,
            Throwable cause) {

        super(message, cause);
    }
}
```

Never hide root cause.

---

## 7. Lambdas and Functional Interfaces

```java
Predicate<String> isValid =
        value -> value != null && !value.isBlank();

Function<String, String> normalize =
        String::trim;

Consumer<String> logger =
        System.out::println;
```

Senior question:

> Why use a Predicate rather than hard-code the condition?

Answer:

> It allows reusable behavior to be passed into generic framework utilities.

---

## 8. Streams

### Group failures

```java
Map<String, List<TestResult>> byService =
        results.stream()
                .filter(TestResult::failed)
                .collect(
                        Collectors.groupingBy(
                                TestResult::service
                        )
                );
```

### Avoid accidental complexity

Don't create long chained streams that become harder to debug than loops.

---

## 9. Optional

Good:

```java
String status =
        response.optionalPath("status")
                .orElse("UNKNOWN");
```

Avoid:

```java
Optional<String> optional;

if (optional.isPresent()) {
    return optional.get();
}
```

Prefer `map`, `orElse`, `orElseGet`, or `orElseThrow`.

Do not use Optional as a general-purpose field type for every domain property.

---

## 10. Thread Safety

### Race condition

Two threads access mutable state and outcome depends on scheduling.

Example:

```java
counter++;
```

is not one indivisible operation.

### Synchronized

```java
public synchronized void increment() {
    counter++;
}
```

### Atomic

```java
AtomicInteger count =
        new AtomicInteger();

count.incrementAndGet();
```

### ConcurrentHashMap

```java
ConcurrentHashMap<String, TestContext> contexts =
        new ConcurrentHashMap<>();
```

---

## 11. ThreadLocal

Useful for thread-scoped execution resources:

```java
private static final ThreadLocal<WebDriver> DRIVER =
        new ThreadLocal<>();
```

Use:

```java
DRIVER.set(driver);
```

Retrieve:

```java
WebDriver driver = DRIVER.get();
```

Always clean:

```java
try {
    ...
} finally {
    driver.quit();
    DRIVER.remove();
}
```

---

## 12. ExecutorService

Avoid manually creating uncontrolled threads.

```java
ExecutorService pool =
        Executors.newFixedThreadPool(5);

Future<TestResult> future =
        pool.submit(() -> runTest());

TestResult result =
        future.get();

pool.shutdown();
```

Understand:

- queueing;
- worker count;
- shutdown;
- rejected tasks;
- futures;
- exception propagation.

---

## 13. `volatile`

`volatile` provides visibility guarantees but does not make compound operations atomic.

```java
private volatile boolean running = true;
```

Do not claim:

> volatile makes code thread-safe.

---

## 14. Advanced Java Interview Questions

1. Why does overriding equals require hashCode?
2. Why are mutable map keys dangerous?
3. String immutable — why?
4. Composition vs inheritance?
5. What does ThreadLocal solve?
6. What is a race condition?
7. synchronized vs AtomicInteger?
8. ConcurrentHashMap vs HashMap?
9. When is a stream worse than a loop?
10. What does volatile actually guarantee?
11. What happens to ThreadLocal state in pooled threads?
12. How would you make a test context thread-safe?

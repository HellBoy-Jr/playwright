# TestNG Deep Dive — Senior SDET Interview

## 1. TestNG Mental Model

TestNG provides:

- lifecycle;
- execution ordering;
- grouping;
- parameterization;
- data providers;
- listeners;
- retries;
- parallelism;
- reporting integration.

Use features to model execution intentionally rather than relying on arbitrary order.

---

# 2. Lifecycle

```text
@BeforeSuite
 ↓
@BeforeTest
 ↓
@BeforeClass
 ↓
@BeforeMethod
 ↓
@Test
 ↓
@AfterMethod
 ↓
@AfterClass
 ↓
@AfterTest
 ↓
@AfterSuite
```

Resource rule:

> Choose the smallest lifecycle scope that matches the resource's safe lifetime.

---

# 3. Assertions

Hard:

```java
Assert.assertEquals(
        actual,
        expected,
        "Status mismatch"
);
```

Soft:

```java
SoftAssert soft = new SoftAssert();

soft.assertEquals(actualStatus, "ACTIVE");
soft.assertTrue(email.contains("@"));

soft.assertAll();
```

Use soft assertions when multiple independent validations provide useful evidence.

Do not use them to ignore a critical failure.

---

# 4. Groups

```java
@Test(groups = {"smoke", "checkout"})
public void checkoutWorks() {}
```

Run selective suites:

```text
smoke
regression
api
ui
checkout
critical
```

Groups should represent meaningful execution policy, not random categories.

---

# 5. dependsOnMethods

```java
@Test
public void createUser() {}

@Test(dependsOnMethods = "createUser")
public void updateUser() {}
```

Use dependencies sparingly.

A highly dependent test suite becomes fragile and sequential.

Prefer test independence where possible.

---

# 6. DataProvider

```java
@DataProvider(name = "users")
public Object[][] users() {
    return new Object[][] {
        {"standard", "password"},
        {"admin", "password"},
        {"locked", "password"}
    };
}
```

```java
@Test(dataProvider = "users")
public void login(
        String username,
        String password) {

    ...
}
```

---

# 7. Parallel DataProvider

```java
@DataProvider(
        name = "users",
        parallel = true
)
public Object[][] users() {
    ...
}
```

Before using this:

- isolate test data;
- avoid static mutable state;
- use thread-safe clients;
- use ThreadLocal driver/context.

---

# 8. Parameters

XML:

```xml
<parameter
    name="browser"
    value="chrome"/>
```

Test:

```java
@Parameters("browser")
@Test
public void login(String browser) {
    ...
}
```

Use parameters for environment/execution configuration rather than large business datasets.

---

# 9. RetryAnalyzer

```java
public final class RetryOnce
        implements IRetryAnalyzer {

    private int attempts;

    @Override
    public boolean retry(ITestResult result) {
        return attempts++ < 1;
    }
}
```

The retry must be visible in reporting.

---

# 10. Listeners

### ITestListener

Use for:

- on start;
- pass;
- fail;
- skip;
- finish;
- screenshots;
- attachments.

```java
@Override
public void onTestFailure(ITestResult result) {

    WebDriver driver =
            DriverManager.get();

    byte[] image =
            ((TakesScreenshot) driver)
                    .getScreenshotAs(
                            OutputType.BYTES
                    );

    // Attach to report
}
```

---

# 11. IInvokedMethodListener

Useful for method-level execution hooks:

```text
Before invocation
After invocation
```

Potential uses:

- timing;
- logging;
- diagnostics;
- metadata.

Do not hide business setup in listeners where ordinary fixtures are clearer.

---

# 12. TestNG XML

Typical:

```xml
<suite name="Regression"
       parallel="tests"
       thread-count="4">

    <test name="Chrome">
        <classes>
            <class name="tests.LoginTests"/>
        </classes>
    </test>

</suite>
```

Know the difference among:

- tests;
- classes;
- methods.

---

# 13. Parallel Execution

Parallelism may happen at:

```text
suite
tests
classes
methods
DataProvider
```

Choose the level based on isolation and resource boundaries.

---

# 14. Thread Safety

Danger:

```java
public static WebDriver driver;
```

Safer:

```java
private static final ThreadLocal<WebDriver> DRIVER =
        new ThreadLocal<>();
```

But ThreadLocal alone does not make business data safe.

You also need:

- unique users;
- independent entities;
- safe API clients;
- isolated DB state.

---

# 15. Test Context

```java
public final class TestContext {

    private final Map<String, Object> values =
            new ConcurrentHashMap<>();

    public void put(
            String key,
            Object value) {

        values.put(key, value);
    }

    public Object get(String key) {
        return values.get(key);
    }
}
```

Per-test context should be preferable to global state.

---

# 16. Common TestNG Mistakes

### Mistake 1

Using `priority` to create business dependency.

### Mistake 2

Making every test depend on a previous test.

### Mistake 3

Using one shared mutable user during parallel runs.

### Mistake 4

Retrying every failure automatically.

### Mistake 5

Putting too much logic in listeners.

### Mistake 6

Using global setup for test-specific state.

---

# 17. TestNG Interview Questions

1. Explain annotation order.
2. BeforeMethod vs BeforeClass?
3. DataProvider vs Parameters?
4. How do you run tests in parallel?
5. How do you make TestNG parallel-safe?
6. How do listeners work?
7. How do you capture screenshots?
8. How does RetryAnalyzer work?
9. When should dependsOnMethods be avoided?
10. How would you design TestNG for 10,000 tests?

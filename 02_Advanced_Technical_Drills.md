# 2. ADVANCED TECHNICAL DRILLS — Production-Grade SDET Code

## 2.0 Engineering Standard

Production test code should be:

- modular;
- deterministic;
- thread-safe;
- diagnosable;
- environment-agnostic;
- secure;
- reviewable;
- explicit about ownership and cleanup.

---

# 2.1 Advanced Java — `equals()` / `hashCode()`

```java
public final class TestUser {
    private final String username;
    private final String tenant;

    public TestUser(String username, String tenant) {
        this.username = Objects.requireNonNull(username);
        this.tenant = Objects.requireNonNull(tenant);
    }

    public String username() {
        return username;
    }

    public String tenant() {
        return tenant;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }

        if (!(other instanceof TestUser that)) {
            return false;
        }

        return username.equals(that.username)
                && tenant.equals(that.tenant);
    }

    @Override
    public int hashCode() {
        return Objects.hash(username, tenant);
    }
}
```

### Interview points

- equal objects must return equal hash codes;
- same hash code does not imply equality;
- mutable key fields are dangerous;
- equality should model domain identity.

---

# 2.2 Advanced Java — Collections

| Requirement | Collection |
|---|---|
| Ordered duplicates | `ArrayList` |
| Unique values | `HashSet` |
| Unique + insertion order | `LinkedHashSet` |
| Unique + sorted | `TreeSet` |
| Key/value lookup | `HashMap` |
| Key/value + insertion order | `LinkedHashMap` |
| Concurrent key/value | `ConcurrentHashMap` |
| Queue | `ArrayDeque` / `Queue` |
| Priority | `PriorityQueue` |

Automation examples:

```java
Set<String> uniqueTestIds = new LinkedHashSet<>();
Map<String, String> userRoles = new HashMap<>();
Map<String, TestContext> contexts = new ConcurrentHashMap<>();
```

---

# 2.3 Advanced Java — Generics and PECS

PECS:

> Producer Extends, Consumer Super.

```java
public void copyUsers(
        List<? extends TestUser> source,
        List<? super TestUser> target) {

    for (TestUser user : source) {
        target.add(user);
    }
}
```

Use generics heavily in framework utilities, test-data factories, assertion helpers, API clients, and fixtures.

---

# 2.4 Advanced Java — Exceptions

Bad:

```java
try {
    executeTest();
} catch (Exception ignored) {
}
```

Better:

```java
try {
    executeTest();
} catch (Exception e) {
    throw new FrameworkException(
            "Execution failed for test=" + testName,
            e
    );
}
```

A mature framework differentiates:

- assertion failure;
- application failure;
- environment failure;
- configuration failure;
- data failure;
- framework defect.

---

# 2.5 Java Streams

Group failed tests by owner:

```java
Map<String, List<TestResult>> failuresByOwner =
        results.stream()
               .filter(TestResult::failed)
               .collect(Collectors.groupingBy(TestResult::owner));
```

Find slow tests:

```java
List<TestResult> slowTests =
        results.stream()
               .filter(r -> r.duration().toMillis() > 10_000)
               .sorted(Comparator.comparing(TestResult::duration).reversed())
               .toList();
```

Senior answer:

> Use streams for clear transformations and aggregations, not merely for code golf. A loop can be better for stateful logic, diagnostics, or highly performance-sensitive code.

---

# 2.6 Concurrency — ThreadLocal Driver

```java
public final class DriverManager {

    private static final ThreadLocal<WebDriver> DRIVER =
            new ThreadLocal<>();

    private DriverManager() {}

    public static void set(WebDriver driver) {
        DRIVER.set(driver);
    }

    public static WebDriver get() {
        WebDriver driver = DRIVER.get();

        if (driver == null) {
            throw new IllegalStateException(
                    "WebDriver is not initialized"
            );
        }

        return driver;
    }

    public static void remove() {
        WebDriver driver = DRIVER.get();

        if (driver != null) {
            driver.quit();
            DRIVER.remove();
        }
    }
}
```

### Why cleanup?

Thread pools reuse threads. Thread-local values can remain associated with those threads beyond a logical test unless explicitly cleared.

---

# 2.7 Selenium — BasePage

```java
public abstract class BasePage {

    protected final WebDriver driver;
    protected final WebDriverWait wait;

    protected BasePage(WebDriver driver) {
        this.driver = Objects.requireNonNull(driver);
        this.wait = new WebDriverWait(
                driver,
                Duration.ofSeconds(15)
        );
    }

    protected WebElement visible(By locator) {
        return wait.until(
                ExpectedConditions.visibilityOfElementLocated(locator)
        );
    }

    protected void click(By locator) {
        wait.until(
                ExpectedConditions.elementToBeClickable(locator)
        ).click();
    }

    protected void type(By locator, String value) {
        WebElement element = visible(locator);
        element.clear();
        element.sendKeys(value);
    }
}
```

---

# 2.8 Selenium — Login Page Object

```java
public final class LoginPage extends BasePage {

    private final By username =
            By.id("username");

    private final By password =
            By.id("password");

    private final By loginButton =
            By.cssSelector("[data-testid='login-button']");

    private final By errorMessage =
            By.cssSelector("[data-testid='login-error']");

    public LoginPage(WebDriver driver) {
        super(driver);
    }

    public LoginPage open(String baseUrl) {
        driver.get(baseUrl + "/login");
        return this;
    }

    public HomePage loginValidUser(
            String user,
            String pass) {

        type(username, user);
        type(password, pass);
        click(loginButton);

        return new HomePage(driver);
    }

    public String loginAndGetError(
            String user,
            String pass) {

        type(username, user);
        type(password, pass);
        click(loginButton);

        return visible(errorMessage).getText();
    }
}
```

Test:

```java
@Test
public void validUserCanLogin() {

    HomePage homePage =
            new LoginPage(driver)
                    .open(baseUrl)
                    .loginValidUser(
                            "qa-user",
                            "secret"
                    );

    Assert.assertTrue(homePage.isLoaded());
}
```

---

# 2.9 Selenium — Locator Patterns

Stable test ID:

```java
By.cssSelector("[data-testid='checkout']");
```

Dynamic attribute:

```java
By.cssSelector("button[id^='save-']");
```

Relative XPath:

```java
By.xpath(
    "//label[normalize-space()='Email']/following::input[1]"
);
```

Table row by business value:

```java
By.xpath(
    "//tr[td[normalize-space()='ORD-1001']]"
    + "//button[@data-action='view']"
);
```

Avoid positional DOM paths.

---

# 2.10 Selenium — Wait Utility

```java
public final class Waits {

    private Waits() {}

    public static WebElement clickable(
            WebDriver driver,
            By locator,
            Duration timeout) {

        WebDriverWait wait =
                new WebDriverWait(driver, timeout);

        return wait.until(
                ExpectedConditions.elementToBeClickable(locator)
        );
    }

    public static boolean urlContains(
            WebDriver driver,
            String expected,
            Duration timeout) {

        WebDriverWait wait =
                new WebDriverWait(driver, timeout);

        return wait.until(
                ExpectedConditions.urlContains(expected)
        );
    }
}
```

Use condition-based waits. Selenium documents dynamic application state and race conditions as major synchronization concerns. citeturn325406search1

---

# 2.11 Selenium — Frame

```java
WebDriverWait wait =
        new WebDriverWait(driver, Duration.ofSeconds(10));

WebElement frame = wait.until(
        ExpectedConditions.presenceOfElementLocated(
                By.id("payment-frame")
        )
);

driver.switchTo().frame(frame);

driver.findElement(By.id("cardNumber"))
      .sendKeys("4111111111111111");

driver.switchTo().defaultContent();
```

---

# 2.12 Selenium — Multiple Windows

```java
String original = driver.getWindowHandle();

driver.findElement(By.id("openTerms")).click();

new WebDriverWait(driver, Duration.ofSeconds(10))
        .until(d -> d.getWindowHandles().size() == 2);

for (String handle : driver.getWindowHandles()) {
    if (!handle.equals(original)) {
        driver.switchTo().window(handle);
        break;
    }
}
```

---

# 2.13 Selenium — Actions

```java
Actions actions = new Actions(driver);

actions.moveToElement(menu)
       .click(subMenu)
       .perform();
```

Use JavaScript execution only when there is a legitimate browser-level reason. It should not become a generic workaround for broken synchronization or invalid locators.

---

# 2.14 TestNG — Lifecycle

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

Use the smallest lifecycle scope that matches the resource.

---

# 2.15 TestNG — DataProvider

```java
@DataProvider(name = "invalidUsers")
public Object[][] invalidUsers() {

    return new Object[][] {
        {"unknown@example.com", "secret"},
        {"locked@example.com", "secret"},
        {"", "secret"}
    };
}

@Test(dataProvider = "invalidUsers")
public void invalidLoginShouldFail(
        String username,
        String password) {

    String error =
            loginPage.loginAndGetError(username, password);

    Assert.assertTrue(
            error.contains("Invalid"),
            "Unexpected error: " + error
    );
}
```

Parallel DataProvider:

```java
@DataProvider(
        name = "users",
        parallel = true
)
public Object[][] users() {
    ...
}
```

Parallel DataProvider requires thread-safe framework state and isolated test data.

---

# 2.16 TestNG — Listener

```java
public final class FailureListener
        implements ITestListener {

    @Override
    public void onTestFailure(ITestResult result) {

        WebDriver driver =
                DriverManager.get();

        byte[] screenshot =
                ((TakesScreenshot) driver)
                        .getScreenshotAs(OutputType.BYTES);

        Path output = Paths.get(
                "reports",
                result.getName()
                        + "-"
                        + System.currentTimeMillis()
                        + ".png"
        );

        try {
            Files.createDirectories(output.getParent());
            Files.write(output, screenshot);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
```

Listener responsibilities should remain focused on reporting and diagnostics rather than hiding business test behavior.

---

# 2.17 TestNG — Retry Analyzer

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

Best practice:

```text
retry
+
record retry
+
track flake
+
root-cause
```

---

# 2.18 REST Assured — Architecture

```text
Test
 ↓
API Client
 ↓
Request Specification
 ↓
Authentication Provider
 ↓
REST Assured
 ↓
API
```

This keeps tests business-focused.

---

# 2.19 REST Assured — Dependencies

Use versions approved by the organization. The official REST Assured documentation currently documents the JSON schema validator as a separate module. citeturn264812search10turn264812search11

```xml
<dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>rest-assured</artifactId>
    <version>${rest-assured.version}</version>
</dependency>

<dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>json-schema-validator</artifactId>
    <version>${rest-assured.version}</version>
    <scope>test</scope>
</dependency>
```

---

# 2.20 OAuth2 Authentication Provider

```java
public interface AuthProvider {
    String token();
}
```

```java
public final class OAuthTokenProvider
        implements AuthProvider {

    private final String tokenUrl;
    private final String clientId;
    private final String clientSecret;

    public OAuthTokenProvider(
            String tokenUrl,
            String clientId,
            String clientSecret) {

        this.tokenUrl = tokenUrl;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    @Override
    public String token() {

        return given()
                .contentType(ContentType.URLENC)
                .formParam(
                        "grant_type",
                        "client_credentials"
                )
                .formParam("client_id", clientId)
                .formParam(
                        "client_secret",
                        clientSecret
                )
        .when()
                .post(tokenUrl)
        .then()
                .statusCode(200)
                .extract()
                .path("access_token");
    }
}
```

### Production requirements

- cache until expiry;
- avoid concurrent refresh storms;
- never log client secret;
- use secret manager;
- refresh safely under parallel load.

---

# 2.21 RequestSpecification

```java
public final class RequestSpecFactory {

    private RequestSpecFactory() {}

    public static RequestSpecification authenticated(
            String baseUri,
            AuthProvider authProvider) {

        return new RequestSpecBuilder()
                .setBaseUri(baseUri)
                .setContentType(ContentType.JSON)
                .addHeader(
                        "Accept",
                        "application/json"
                )
                .addHeader(
                        "Authorization",
                        "Bearer " + authProvider.token()
                )
                .build();
    }
}
```

---

# 2.22 REST Assured API Client

```java
public final class UserApi {

    private final RequestSpecification requestSpec;

    public UserApi(
            RequestSpecification requestSpec) {

        this.requestSpec = requestSpec;
    }

    public Response createUser(
            CreateUserRequest request) {

        return given()
                .spec(requestSpec)
                .body(request)
        .when()
                .post("/users");
    }

    public Response getUser(String id) {

        return given()
                .spec(requestSpec)
        .when()
                .get("/users/{id}", id);
    }

    public Response deleteUser(String id) {

        return given()
                .spec(requestSpec)
        .when()
                .delete("/users/{id}", id);
    }
}
```

Test:

```java
@Test
public void createUser() {

    Response response =
            userApi.createUser(request);

    response.then()
            .statusCode(201)
            .body(
                    "email",
                    equalTo(request.email())
            );
}
```

---

# 2.23 JSON Schema Validation

```java
response.then()
        .assertThat()
        .body(
                matchesJsonSchemaInClasspath(
                        "schemas/user.json"
                )
        );
```

Schema validation catches structural problems; business assertions still need to validate domain behavior.

---

# 2.24 PostgreSQL — Seed / Query / Tear Down

```java
public final class DatabaseClient {

    private final DataSource dataSource;

    public DatabaseClient(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public UUID createUser(String email)
            throws SQLException {

        String sql =
                "INSERT INTO users(email, status) " +
                "VALUES (?, 'ACTIVE') " +
                "RETURNING id";

        try (Connection connection =
                     dataSource.getConnection();
             PreparedStatement ps =
                     connection.prepareStatement(sql)) {

            ps.setString(1, email);

            try (ResultSet rs = ps.executeQuery()) {

                if (!rs.next()) {
                    throw new SQLException(
                            "Insert returned no ID"
                    );
                }

                return UUID.fromString(
                        rs.getString("id")
                );
            }
        }
    }

    public String getUserStatus(UUID id)
            throws SQLException {

        String sql =
                "SELECT status FROM users WHERE id = ?";

        try (Connection connection =
                     dataSource.getConnection();
             PreparedStatement ps =
                     connection.prepareStatement(sql)) {

            ps.setObject(1, id);

            try (ResultSet rs = ps.executeQuery()) {

                if (!rs.next()) {
                    return null;
                }

                return rs.getString("status");
            }
        }
    }

    public void deleteUser(UUID id)
            throws SQLException {

        String sql =
                "DELETE FROM users WHERE id = ?";

        try (Connection connection =
                     dataSource.getConnection();
             PreparedStatement ps =
                     connection.prepareStatement(sql)) {

            ps.setObject(1, id);
            ps.executeUpdate();
        }
    }
}
```

Use parameterized SQL. Never perform broad destructive cleanup in parallel environments.

---

# 2.25 TestNG Database Lifecycle

```java
private UUID testUserId;

@BeforeMethod
public void setUp() throws Exception {

    testUserId = db.createUser(
            "test-" +
            UUID.randomUUID() +
            "@example.com"
    );
}

@AfterMethod(alwaysRun = true)
public void tearDown() throws Exception {

    if (testUserId != null) {
        db.deleteUser(testUserId);
    }
}
```

---

# 2.26 Advanced Java Interview Drill List

1. Why must equals/hashCode be consistent?
2. Why are mutable HashMap keys dangerous?
3. ArrayList versus LinkedList?
4. HashMap versus ConcurrentHashMap?
5. What does ThreadLocal solve?
6. What is a race condition?
7. What causes deadlock?
8. Checked versus unchecked exception?
9. Why use composition?
10. Interface versus abstract class?
11. Streams versus loops?
12. When should a retry not be used?

---

# 2.27 Code Review Checklist

### Correctness
- Is the assertion testing business behavior?
- Are edge cases included?

### Isolation
- Does the test share mutable state?
- Is test data independently owned?

### Synchronization
- Is there a condition-based wait?
- Is sleep hiding a race?

### Concurrency
- Is mutable framework state thread-safe?
- Is ThreadLocal cleaned?

### Diagnostics
- Does failure output tell me why?

### Cleanup
- Does the test release what it creates?

## 2.28 References

- https://github.com/rest-assured/rest-assured/wiki/Usage
- https://www.selenium.dev/documentation/
- https://testng.org/
- https://jdbc.postgresql.org/

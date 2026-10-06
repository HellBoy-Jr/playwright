# Selenium Deep Dive — Senior SDET Interview

## 1. Selenium Architecture

```text
Test Code
   ↓
WebDriver API
   ↓
W3C WebDriver protocol
   ↓
Browser Driver
   ↓
Browser
```

Senior interview goal:

Explain the architecture without pretending WebDriver directly manipulates browser internals.

---

## 2. Driver Factory

```java
public final class DriverFactory {

    private DriverFactory() {}

    public static WebDriver create(
            String browser,
            boolean headless) {

        return switch (browser.toLowerCase()) {

            case "chrome" -> {
                ChromeOptions options =
                        new ChromeOptions();

                if (headless) {
                    options.addArguments("--headless=new");
                }

                yield new ChromeDriver(options);
            }

            case "firefox" -> {
                FirefoxOptions options =
                        new FirefoxOptions();

                if (headless) {
                    options.addArguments("-headless");
                }

                yield new FirefoxDriver(options);
            }

            default ->
                    throw new IllegalArgumentException(
                            "Unsupported browser: " + browser
                    );
        };
    }
}
```

---

## 3. ThreadLocal Driver

```java
public final class DriverManager {

    private static final ThreadLocal<WebDriver> DRIVER =
            new ThreadLocal<>();

    public static void initialize(
            String browser,
            boolean headless) {

        DRIVER.set(
                DriverFactory.create(
                        browser,
                        headless
                )
        );
    }

    public static WebDriver get() {

        WebDriver driver = DRIVER.get();

        if (driver == null) {
            throw new IllegalStateException(
                    "Driver not initialized"
            );
        }

        return driver;
    }

    public static void quit() {

        WebDriver driver = DRIVER.get();

        try {
            if (driver != null) {
                driver.quit();
            }
        } finally {
            DRIVER.remove();
        }
    }
}
```

---

## 4. Locator Strategy

Preferred:

```text
data-testid
accessible role / label
stable id/name
CSS
XPath when relationships/text require it
```

Examples:

```java
By.id("username");

By.cssSelector("[data-testid='login']");

By.xpath(
    "//label[normalize-space()='Email']"
    + "/following::input[1]"
);
```

Avoid brittle position selectors.

---

## 5. Page Object Model

### BasePage

```java
public abstract class BasePage {

    protected final WebDriver driver;
    protected final WebDriverWait wait;

    protected BasePage(WebDriver driver) {
        this.driver = driver;
        this.wait =
                new WebDriverWait(
                        driver,
                        Duration.ofSeconds(15)
                );
    }

    protected WebElement visible(By locator) {
        return wait.until(
                ExpectedConditions
                        .visibilityOfElementLocated(locator)
        );
    }

    protected void click(By locator) {
        wait.until(
                ExpectedConditions
                        .elementToBeClickable(locator)
        ).click();
    }

    protected void type(
            By locator,
            String value) {

        WebElement element = visible(locator);
        element.clear();
        element.sendKeys(value);
    }
}
```

### Page

```java
public final class LoginPage extends BasePage {

    private final By username =
            By.id("username");

    private final By password =
            By.id("password");

    private final By login =
            By.cssSelector(
                    "[data-testid='login-button']"
            );

    public LoginPage(WebDriver driver) {
        super(driver);
    }

    public LoginPage open(String baseUrl) {
        driver.get(baseUrl + "/login");
        return this;
    }

    public HomePage login(
            String user,
            String pass) {

        type(username, user);
        type(password, pass);
        click(login);

        return new HomePage(driver);
    }
}
```

---

## 6. Explicit Waits

```java
WebDriverWait wait =
        new WebDriverWait(
                driver,
                Duration.ofSeconds(15)
        );

wait.until(
        ExpectedConditions
                .elementToBeClickable(button)
);
```

Avoid:

```java
Thread.sleep(5000);
```

unless there is a rare, justified non-condition-based need.

Selenium documents race conditions and dynamic page state as common synchronization challenges. citeturn325406search1

---

## 7. FluentWait

```java
Wait<WebDriver> wait =
        new FluentWait<>(driver)
                .withTimeout(Duration.ofSeconds(20))
                .pollingEvery(Duration.ofMillis(500))
                .ignoring(
                        NoSuchElementException.class
                );
```

Use when polling and exception behavior need explicit control.

---

## 8. StaleElementReferenceException

Typical cause:

```text
locate element
 ↓
DOM changes
 ↓
old WebElement reference becomes invalid
```

Better pattern:

```java
wait.until(
    ExpectedConditions
        .visibilityOfElementLocated(locator)
);
```

Re-find the element rather than holding stale references.

---

## 9. Frames

```java
WebElement frame =
        wait.until(
            ExpectedConditions
                .presenceOfElementLocated(
                    By.id("payment-frame")
                )
        );

driver.switchTo().frame(frame);

driver.findElement(
        By.id("cardNumber")
).sendKeys("4111111111111111");

driver.switchTo().defaultContent();
```

---

## 10. Windows / Tabs

```java
String parent =
        driver.getWindowHandle();

driver.findElement(
        By.id("openTerms")
).click();

wait.until(
        d -> d.getWindowHandles().size() == 2
);

for (String handle :
        driver.getWindowHandles()) {

    if (!handle.equals(parent)) {
        driver.switchTo().window(handle);
        break;
    }
}
```

---

## 11. Web Tables

Business-value selection:

```java
By row =
        By.xpath(
            "//tr[td[normalize-space()='ORD-1001']]"
        );

WebElement orderRow =
        wait.until(
            ExpectedConditions
                .visibilityOfElementLocated(row)
        );

orderRow.findElement(
        By.cssSelector(
            "[data-action='view']"
        )
).click();
```

---

## 12. JavaScriptExecutor

Use for legitimate browser-level operations:

```java
JavascriptExecutor js =
        (JavascriptExecutor) driver;

js.executeScript(
        "arguments[0].scrollIntoView({block:'center'});",
        element
);
```

Do not use JavaScript to hide a genuine interaction problem.

---

## 13. Selenium Grid

```text
Test runner
     ↓
Grid
     ↓
Router / Distributor
     ↓
browser nodes
```

Scale along:

- browser count;
- node count;
- sessions;
- CPU;
- memory;
- network.

---

## 14. Selenium Interview Questions

1. Explain WebDriver architecture.
2. Why does Selenium need waits?
3. Implicit vs explicit vs fluent wait?
4. How do you handle stale elements?
5. How do you build a thread-safe DriverManager?
6. How would you run 1,000 tests in parallel?
7. Why can more Grid nodes make execution slower?
8. How do you handle iframes?
9. CSS vs XPath?
10. How do you design maintainable POMs?

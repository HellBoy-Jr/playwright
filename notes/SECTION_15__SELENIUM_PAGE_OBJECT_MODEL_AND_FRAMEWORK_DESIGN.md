# SECTION 15 — SELENIUM PAGE OBJECT MODEL AND FRAMEWORK DESIGN (Refined)

## Topics Covered

- 15.1 POM through 15.24 Anti-Patterns (24 headers)

*Refined header-by-header — full contract (search API 401, prior pass)*

---

## 15.1 POM — Refined
Theory: Each page class private locators + public intent `loginAs(u,p)` returns same/next fluent; no asserts except loaded; UI change 1 place. Reusable/readable/maintainable TestNG/JUnit large suites.
```java
public HomePage loginAs(String u, String p) {
  type(user,u); type(pass,p); click(btn); return new HomePage(driver);
}
```
Triage: UI churn 200 fails → missing POM. Anti: asserts in pages, locators in tests, void no-navigation.

## 15.2 Page Factory — Refined
Theory: `@FindBy/initElements` discouraged (Stewart/Fortner, Sel5 deprioritized): lazy proxies inflate commands, break invisibility waits, confusing NoSuch vs Stale, CacheLookup worsens. Modern: `By + WebDriverWait` explicit debuggable.
```java
// AVOID proxy; PREFER private By user = By.id("username");
```
Triage: invisibility never true + extra finds → Factory proxies. Anti: PageFactory new code.

## 15.3 BasePage — Refined
Theory: Abstract parent driver/wait/log + safe click/type/find/text/visible; eliminates dup; consistent timeout/exception/screenshot hooks; `super(driver)`; lean no page-specific/asserts; fragments separate no god.
```java
protected void click(By l) { wait.until(ExpectedConditions.elementToBeClickable(l)).click(); }
protected void type(By l, String t) { WebElement e = wait.until(ExpectedConditions.visibilityOfElementLocated(l)); e.clear(); e.sendKeys(t); }
```
Triage: dup wait/click everywhere → missing base. Anti: god BasePage.

## 15.4 Driver Factory — Refined
Theory: Factory centralizes create(browser,headless,gridUrl) Chrome/Firefox/Remote + Options/timeouts/Manager; no direct `new ChromeDriver`; cross/headless/Grid param; enum switch BrowserFactory+Target local/Grid; fail-fast unsupported + TestNG params.
```java
if (gridUrl != null) return new RemoteWebDriver(new URL(gridUrl), o); return new ChromeDriver(o);
```
Triage: scattered `new ChromeDriver` matrix impossible → factory. Anti: options in tests.

## 15.5 Driver Manager — Refined
Theory: Owns lifecycle create/get/quit + maximize/timeouts/teardown; decouples BaseTest one-line; Singleton single-thread else ThreadLocal; listeners shots; always quit orphans Jenkins.
```java
public static void quitDriver() { if (driver.get() != null) { driver.get().quit(); driver.remove(); } }
```
Triage: orphan browsers CI → missing quit. Anti: static shared parallel.

## 15.6 ThreadLocal WebDriver — Refined
Theory: Not thread-safe shared static overwrites parallel methods/tests/classes. `ThreadLocal set/get/remove` isolated per thread; Before set After quit+remove (pool leak w/o remove); pages via Manager.get no passing everywhere.
```java
private static ThreadLocal<WebDriver> tl = new ThreadLocal<>();
// Before: tl.set(Factory.create(...)); After: tl.get().quit(); tl.remove();
```
Triage: parallel cross-navigation → static; memory growth → missing remove. Anti: static driver.

## 15.7 Configuration Manager — Refined
Theory: Centralizes baseURL/browser/headless/timeouts/creds/Grid URL once `config.properties` Properties/ConfigReader singleton; typed getters; fail-fast missing; `-D` CI override; never log secrets; env values separate.
```java
public static String get(String k) { return System.getProperty(k, p.getProperty(k)); }
```
Triage: hardcoded URLs scattered → config. Anti: secrets logs.

## 15.8 Environment Management — Refined
Theory: Switches qa/uat/prod no code: separate `qa/uat.properties` + `-Denv=qa`/Maven profile; Config resolves env props + testng params browser/Grid; URLs/endpoints/users per env, secrets vault not Git; log active env triage.
```java
String env = System.getProperty("env","qa"); p.load(new FileInputStream("src/test/resources/"+env+".properties"));
```
Triage: prod data in QA → env leak. Anti: code branch URLs.

## 15.9 Page Components — Refined
Theory: Reusable section not full page (header/card/table/nav) per Selenium Component Objects; root WebElement + relative children, no global locators; pages compose via getters; fixes 1 class maintainability.
```java
public ProductCard(WebElement root) { super(root); }
root.findElement(By.cssSelector(".inventory_item_name")).getText();
```
Triage: dup header locators 20 pages → component. Anti: full-page dup.

## 15.10 Reusable UI Components — Refined
Theory: Generalized widgets buttons/tables/date/dialogs/pagination `common/components` params locators/roots; shared waits/safe-click/log; tests clean; composition not inherit; scalable PrimeFaces-style wrappers.
```java
table.findElement(By.xpath(".//tr[td[text()='"+rowText+"']]/td["+col+"]")).click();
```
Triage: widget logic copy 10× → component. Anti: inherit for reuse.

## 15.11 Utility Layer — Refined
Theory: Static framework-wide Wait/Driver/Element/JS/Excel/Config independent pages; centralizes waits/clicks/scroll/windows/dropdowns; take driver arg, handle Timeout/Stale, log; pages/tests call not raw APIs.
```java
public static void safeClick(WebDriver d, By loc) { new WebDriverWait(d, Duration.ofSeconds(15)).until(ExpectedConditions.elementToBeClickable(loc)).click(); }
```
Triage: raw Selenium scatter → utils. Anti: stateful utils.

## 15.12 Test Data Layer — Refined
Theory: Separates inputs logic external Excel/CSV/JSON/DB + DataProvider Object[][] multi datasets; POI/Jackson readers; `testdata/` no hardcoded creds; data-driven coverage no code change.
```java
@DataProvider(name="loginData") public Object[][] dp() throws Exception { return ExcelUtil.read("Login.xlsx","Sheet1"); }
```
Triage: data change needs code → externalize. Anti: hardcoded creds.

## 15.13 Constants — Refined
Theory: Fixed env-independent timeouts/paths/sheets/regex/messages final FrameworkConstants `public static final` private ctor grouped; reference utils/pages/listeners; global tuning 10→15s trivial; no magic scattered.
```java
public static final long EXPLICIT_WAIT = 15; public static final String SCREENSHOT_DIR = "test-output/screenshots/";
```
Triage: magic numbers drift → constants. Anti: instantiate constants.

## 15.14 Enums — Refined
Theory: Type-safe fixed browsers/envs/roles/categories vs error strings; fields/ctor/behavior + valueOf/fromString config-driven DriverFactory; compile safety/readability/autocomplete.
```java
CHROME("chrome"); public static Browser fromString(String s) { return Arrays.stream(values()).filter(b -> b.value.equalsIgnoreCase(s)).findFirst().orElseThrow(); }
```
Triage: typo string runtime → enum compile. Anti: static String constants.

## 15.15 Logging — Refined
Theory: Traceability Log4j2/SLF4J + driver java.util.logging; console+rolling file `log4j2.properties`; every action/retry/assert INFO/DEBUG + WARN; per-class Logger + LogUtil; cuts CI triage; production discipline consulting.
```java
private static final Logger LOG = LogManager.getLogger(LoginPage.class); LOG.info("Login {}", user);
```
Triage: silent failures → logs. Anti: System.out.

## 15.16 Screenshots on Failure — Refined
Theory: Auto ITestListener/JUnit extensions TakesScreenshot FILE timestamp `test-output/screenshots` + Extent/Allure + source/console logs; null-guard; irrefutable evidence flaky triage mandatory.
```java
File src = ((TakesScreenshot) d).getScreenshotAs(OutputType.FILE);
Files.copy(src.toPath(), Paths.get("screenshots/"+r.getName()+"_"+System.currentTimeMillis()+".png"));
```
Triage: no evidence → listener. Anti: on-demand only.

## 15.17 Retry Strategy — Refined
Theory: Transient flake w/o masking real: TestNG IRetryAnalyzer max 1-2 + Transformer global; never assert failures blind; log attempts; infra (timeout/stale) vs functional; quarantine CI; JUnit Extend/failsafe; cap predictable fail-fast.
```java
public boolean retry(ITestResult r) { return count++ < max; }
```
Triage: all green via retry → masking; track flaky quarantine. Anti: infinite retry.

## 15.18 Reporting — Refined
Theory: Actionable not pass/fail: TestNG native quick + Extent/Allure dashboards steps/shots/logs/trends; screenshot listener + browser/env/data params; HTML Jenkins/Actions artifacts; owner/severity/defect/flake release signal.
```java
test.fail("Checkout failed", MediaEntityBuilder.createScreenCaptureFromPath(path).build());
```
Triage: pass/fail only → decisions impossible. Anti: no history/trends.

## 15.19 Parallel Execution — Refined
Theory: Hours→minutes: TestNG `parallel=methods/tests/classes thread-count` + Grid4/cloud cross; ThreadLocal isolated (static collides); thread-safe data/independent/no shared; size CPU/RAM or timeouts false-neg.
```xml
<suite name="Suite" parallel="methods" thread-count="4">
```
Triage: parallel-only fail → shared state. Anti: static driver.

## 15.20 Folder Structure — Refined
Theory: Maven `src/main/pages,utils,config,driver` vs `src/test/tests,listeners,dataproviders` + resources props/data/testng.xml + drivers/shots/reports root; locators Pages not tests; onboarding/review/CI clean.
```
src/main/java/pages,utils,config,driver | src/test/java/tests,listeners | resources/config.properties,testdata.xlsx,testng.xml
```
Triage: flat `src/tests` chaos → structure. Anti: drivers/reports git.

## 15.21 Skeleton — Refined
Theory: Runnable slice proves wiring: DriverFactory ThreadLocal from config + BaseTest setup/teardown + Pages actions not locators + ConfigReader/WaitUtils no hardcode + DataProvider/props; whiteboard LLD interview slice.
```java
@BeforeMethod void setUp() { driver = DriverFactory.init(Config.browser()); } @AfterMethod void tearDown() { DriverFactory.quit(); }
```
Triage: cannot whiteboard → missing slice. Anti: god test class.

## 15.22 Design Interview Qs — Refined
POM vs procedural? waits/windows/dynamic? data/creds? parallel safety? report/rerun? CI trigger? API+UI+DB? version/tags? Decisions/alternatives/impact maint/speed/onboard STAR metrics. Hybrid = POM+libs config/report/grid.

## 15.23 Trade-Offs — Refined
POM boilerplate vs maint; Factory simple hides waits; UI e2e confidence slow/flaky vs API/unit pyramid; cloud scales costs vs local maint; Allure/Extent storage; Excel non-coders vs Faker/code refactor; parallel faster needs isolation. State explicitly senior judgment.

## 15.24 Anti-Patterns — Refined
sleep, absolute XPath, logic locators, static driver, God Page, order-dependent, hardcoded URL/creds, swallow ex, on-demand shots, reports/drivers git, over-retry hides bugs, data coupling, logic dup. Fix waits/relative/independent/config/review/Sonar.
```java
// BAD sleep → GOOD wait.until(visibilityOf(el));
```

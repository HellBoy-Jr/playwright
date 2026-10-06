# SECTION 2 — OBJECT-ORIENTED PROGRAMMING

## Topics Covered

- 2.1 Encapsulation
- 2.2 Inheritance
- 2.3 Polymorphism
- 2.4 Abstraction
- 2.5 Composition vs Inheritance
- 2.6 Association / Aggregation / Composition
- 2.7 Interface vs Abstract Class
- 2.8 Default and Static Interface Methods
- 2.9 Method Overloading
- 2.10 Method Overriding
- 2.11 Dynamic Method Dispatch
- 2.12 Constructor Chaining
- 2.13 `this` vs `super`
- 2.14 Access Modifiers
- 2.15 `static`
- 2.16 `final`
- 2.17 SOLID Principles
- 2.18 SOLID Applied to Test Automation
- 2.19 OOP Design Questions for SDET

*Section 2 full-contract, internet-validated 2025-2026*

---

## 2.1 Encapsulation — Full Block
Theory: Bundling state+behavior, restricting via `private` + public intent methods. Invariants enforced in ctor/methods, callers insulated from locator/wait changes.
Enterprise Relevance (5000+ tests): Test → Page → Core layering. Locator/timeout change touches 1 Page, not 200 tests. Enables multi-team ownership + stable CI.
```java
public final class LoginPage {
  private final WebDriver driver; private final WebDriverWait wait;
  private final By username = By.id("username");
  private final By password = By.id("password");
  private final By loginBtn = By.cssSelector("[data-testid='login']");
  public LoginPage(WebDriver d) {
    this.driver = Objects.requireNonNull(d);
    this.wait = new WebDriverWait(d, Duration.ofSeconds(10));
  }
  public DashboardPage loginAs(String u, String p) {
    try {
      wait.until(ExpectedConditions.visibilityOfElementLocated(username)).sendKeys(u);
      driver.findElement(password).sendKeys(p);
      wait.until(ExpectedConditions.elementToBeClickable(loginBtn)).click();
      return new DashboardPage(driver);
    } catch (TimeoutException e) {
      throw new FrameworkException("TIMEOUT-01", "Login not ready @ " + driver.getCurrentUrl(), e);
    }
  }
}
```
Triage: fail in test data/assert vs Page (locator/timing) vs core (grid/driver)? All pages fail → core/base; one page → private By. Fix centrally propagates.
Anti: public WebElement/By fields, raw findElement in @Test, God Page 500+ lines, static driver leak, setters exposing internals.
Qs: Why private locators? How does one-place fix scale to 200 tests?

## 2.2 Inheritance — Full Block
Theory: `is-a`, single `extends`, `Object` root. `super(...)` must be first line; ctors not inherited; `private` not inherited; `final` blocks extend/override.
Enterprise: `BasePage` (driver/wait/click/type) + `BaseTest` (setup/teardown/config/listeners) reuse. DRY waits/logging.
```java
public class BasePage {
  protected final WebDriver driver; protected final WebDriverWait wait;
  public BasePage(WebDriver d) {
    this.driver = Objects.requireNonNull(d);
    this.wait = new WebDriverWait(d, Duration.ofSeconds(10));
  }
  protected void click(By l) {
    wait.until(ExpectedConditions.elementToBeClickable(l)).click();
  }
}
public final class LoginPage extends BasePage {
  private final By user = By.id("username"), pass = By.id("password");
  public LoginPage(WebDriver d) { super(d); }
  public HomePage login(String u, String p) {
    driver.findElement(user).sendKeys(u); driver.findElement(pass).sendKeys(p);
    click(By.id("login")); return new HomePage(driver);
  }
}
```
Triage fragile base: all pages fail → base change (`git bisect` BasePage); one page → locator. Fix via overload not contract break.
Anti: `BaseTest extends BasePage` (test is-not-a page), 4-level chains, god BasePage with API/DB/asserts. Prefer composition + small hierarchy.

## 2.3 Polymorphism — Full Block
Theory: One declared type, many runtime forms. Compile-time (overloading `findElement(By)` vs `findElements`) resolved by compiler; runtime (overriding `driver.get()` Chrome vs Firefox vs Remote) resolved by JVM.
Enterprise: `WebDriver driver = new ChromeDriver()` swaps browsers via factory/config for cross-browser matrix/grid/headless without rewriting tests. `By` strategy: id/css/xpath same `findElement(By)` contract.
```java
WebDriver driver = DriverFactory.create("chrome"); // upcast
driver.get("https://app.com"); // runtime dispatch
By strategy = useCss ? By.cssSelector("#submit") : By.xpath("//button[@id='submit']");
driver.findElement(strategy).click();
```
Triage: browser-swap-only failure → runtime behavior/timing, not compile; wrong overload → compile-time resolution (autoboxing/varargs).
Anti: `instanceof ChromeDriver` branching; boolean-flag overloads. Use factory/capabilities + Strategy.

## 2.4 Abstraction — Full Block
Theory: Expose what, hide how. Abstract class = partial (state+ctor+concrete+abstract, single extends, is-a). Interface = full contract (public constants+abstract/default/static, multiple implements, can-do).
Enterprise: Tests code to `WebDriver` (`get/find/quit`) impl by Chrome/Firefox/Edge. POM `login(u,p)` hides By/waits. `DriverFactory.getDriver()` hides options/Grid vs local.
```java
interface LoginContract { void login(String u, String p); }
abstract class BaseTest {
  protected WebDriver driver;
  void setUp() { driver = DriverFactory.create("chrome"); }
  void tearDown() { if (driver != null) driver.quit(); }
  abstract void runTest();
}
```
Triage: contract wrong → fix all impls; setup wrong → fix BaseTest once; browser-only → fix factory.
Anti: leaky `By/WebDriver` in @Test; 500-line god BaseTest. Prefer composition for utils.

## 2.5 Composition vs Inheritance — Full Block
Theory: Inheritance IS-A white-box compile-time (fragile base, single hierarchy). Composition HAS-A black-box runtime (loose, flexible, testable). Favor composition (Effective Java 18).
Enterprise: Pages share Header/Nav/Search/Footer. Inheritance forces duplication or god BasePage. Composition: Page has components.
```java
final class HomePage {
  private final HeaderComponent header;
  HomePage(WebDriver d) { this.header = new HeaderComponent(d); }
  void search(String q) { header.search(q); }
}
final class HeaderComponent {
  private final WebDriver driver;
  HeaderComponent(WebDriver d) { this.driver = d; }
  void search(String q) { driver.findElement(By.cssSelector("[data-testid='search']")).sendKeys(q); }
  void logout() { driver.findElement(By.id("logout")).click(); }
}
```
Triage: Need runtime swap/share across unrelated pages → composition. True substitutable IS-A + small stable hierarchy → inheritance.
Anti: `HomePage extends HeaderPage` (violates IS-A), deep Base chains, extends for single-method reuse.

## 2.6 Association / Aggregation / Composition — Full Block
Theory: Association uses-a (peers, no ownership, `Test→driver` param). Aggregation has-a shared (whole refs externally-created part, survives, shareable: `Suite◇—TestCase` via `add(t)`). Composition owns-a (whole creates/disposes, exclusive, dies together: `Suite◆—TestCase` via `new` inside).
Enterprise: `Test→WebDriver` association (injected/swappable); `Suite→Test` composition (run instances discarded with suite) unless same Test object reused across suites → weaken to aggregation.
```java
class LoginTest { void run(WebDriver driver) { driver.get("/login"); } } // association
class Suite {
  private final List<TestCase> tests = new ArrayList<>();
  void add(TestCase t) { tests.add(t); } // aggregation: caller-created
  void addLogin() { tests.add(new LoginTest()); } // composition: owned
}
```
Triage: Who `new`s? Outlive whole? Shareable? Yes→Assoc/Agg; No→Comp. `getTests()` returning mutable list breaks encaps.
Anti: everything composition (blocks mock/reuse), static driver hidden composition killing parallel, bidirectional default.

## 2.7 Interface vs Abstract Class — Full Block
| | Interface | Abstract |
|---|---|---|
| State | only `public static final` | fields+ctor |
| Methods | abstract+default/static, public | abstract+concrete, any vis |
| Inherit | implements multiple | extends single |
Use interface for capability (`Searchable`, `TakesScreenshot`, `Repository`) + mocking/DI; abstract for is-a + shared template (`AbstractList`, `BasePage`).
```java
interface Drawable { void draw(); default void info() { System.out.println("drawable"); } }
abstract class Shape { int x, y; abstract double area(); void move(int dx, int dy) { x += dx; y += dy; } }
final class Circle extends Shape implements Drawable {
  private final double r; Circle(double r) { this.r = r; }
  @Override double area() { return Math.PI * r * r; }
  @Override public void draw() { System.out.println("circle"); }
}
```
Triage diamond: `I1,I2` same default → class must `override + A.super.m()` else compile error. No state diamond (interfaces stateless).
Anti: fat GodInterface forcing empty methods (violates ISP); abstract for pure contract (wastes extends slot).

## 2.8 Default and Static Interface Methods — Full Block
Theory: Java 8 `default` (inherited concrete, backward-compat e.g. `Collection.stream/sort`, `Comparator.thenComparing`) + `static` (`Interface.m()`, not inherited) + Java 9 `private` helpers.
Enterprise: Evolve framework APIs without breaking implementors (add `default retry()` to listener interface).
Resolution: 1. Class method > default. 2. Most specific subinterface > super. 3. Unrelated conflict → compile error, override + `X.super.m()`.
```java
interface Vehicle { default String alarm() { return "on"; } static int hp(int rpm, int t) { return rpm*t/5252; } }
class C implements A, B { @Override public void m() { A.super.m(); } }
```
Anti: defaults holding state/fat interface; silent behavior change to all impls; calling static via instance.

## 2.9 Method Overloading — Full Block
Theory: Same name, different params (count/type/order) same class. Compiler-resolved (static poly). Return/throws/modifier/erasure alone insufficient. Exact>widening>boxing>varargs.
Enterprise: `waitFor(sel)` → `waitFor(sel,timeout)` → `waitFor(sel,timeout,poll)` delegate to fullest.
```java
public static void waitFor(String s) { waitFor(s, 5000); }
public static void waitFor(String s, int timeoutMs) { waitFor(s, timeoutMs, 500); }
public static void waitFor(String s, int timeoutMs, int pollMs) { /* loop visible+sleep */ }
```
Triage: `foo(5)` with `foo(Integer)/foo(long)` → picks `long` (widen beats box); `foo(null)` with Integer vs Double → ambiguous compile error → cast.
Anti: swapped-type overloads `save(String,int)/save(int,String)`, boolean flags, >3 overloads (use builder/options).

## 2.10 Method Overriding — Full Block
Theory: Same name+params runtime dispatch. Rules: same params, covariant return, not more restrictive, no broader checked ex, `final/static/private` cannot override (hiding/new), `@Override` mandatory practice.
Enterprise: `BaseTest.setup()` → `ChromeTest.setup(){super.setup(); addOptions();}`; Playwright `createContext()` per class.
```java
class BaseTest { void setup() { System.out.println("launch"); } }
class ChromeTest extends BaseTest {
  @Override void setup() { super.setup(); System.out.println("chrome opts"); }
}
```
Triage: parent not called → missing `super.setup()`; overload ran → signature mismatch + missing `@Override`; `NoSuchMethodError` → upstream signature change.
Anti: forgetting `@Override` (silent overload), `throw UnsupportedOperationException`, calling overridable from ctor.

## 2.11 Dynamic Method Dispatch — Full Block
Theory: JVM selects override at runtime via vtable (object→class→slot). `invokevirtual/interface` dispatched; `static/private/final/ctor` statically bound. HotSpot inline caches optimize.
Enterprise: `WebDriver d = new ChromeDriver()` vs `new FirefoxDriver()` same call site different target; enables cross-browser + mocks + Page polymorphism.
```java
class A { void call() { System.out.println("A"); } }
class B extends A { @Override void call() { System.out.println("B"); } }
A r = new B(); r.call(); // B — actual type, not ref type
```
Triage: wrong method → check `@Override` present, not static/private/final, `getClass()` of receiver.
Anti: `instanceof` chains vs override; overridable call in ctor (subclass fields null).

## 2.12 Constructor Chaining — Full Block
Theory: `this(...)` same-class, `super(...)` parent, exactly one, first statement. Init top-down: super→fields→rest. (Java 22 JEP 447 relaxes slightly but classic rule tested.)
Enterprise: Centralize driver+timeouts+`initElements`/baseUrl in master ctor; overloads chain for defaults/DI.
```java
class BasePage { protected final WebDriver driver; BasePage(WebDriver d) { this.driver = d; } }
final class LoginPage extends BasePage {
  LoginPage(WebDriver d) { this(d, 10); }
  LoginPage(WebDriver d, int timeout) {
    super(d);
    d.manage().timeouts().implicitlyWait(Duration.ofSeconds(timeout));
  }
}
```
Triage: NPE elements → master skipped; StackOverflow → cyclic `this()`; compile error → parent lacks no-arg, add `super(args)`.
Anti: duplicated init per overload, heavy network in chain, cyclic chaining, overridable call in ctor.

## 2.13 this vs super — Full Block
`this`: current object (shadow `this.field`, `this()` ctor chain, `this.method()`, `return this`, pass self). `super`: parent view (hidden `super.field`, overridden `super.method()`, `super(args)` ctor). One of `this()/super()` only, first line. Neither in static.
```java
class Dog extends Animal {
  String name = "Dog";
  Dog(String n) { super(n); }
  Dog() { this("Fido"); }
  @Override void speak() { super.speak(); System.out.println(this.name + " barks"); }
}
```
Triage: `call to super must be first` → move to line 1; `no default ctor` → add explicit `super(args)`; `this.m()` virtual vs `super.m()` parent.
Anti: field hiding vs encaps, `this/super` in static, leaking `this` from ctor, skipping `super.method()` then duplicating.

## 2.14 Access Modifiers — Full Block
`private` (class) → default package-private (package) → `protected` (package+subclass other pkg) → `public` (world). Top-level: public/default only.
Enterprise: Minimal API surface: public services/controllers, private helpers, package-private impl, protected for extension points. Refactor internals without breaking clients.
```java
package bank;
public class Account {
  private double balance;
  String owner; // package
  protected void audit() {}
  public void deposit(double amt) { if (amt <= 0) throw new IllegalArgumentException(); balance += amt; }
}
```
Triage: `not visible / IllegalAccessError` → check package vs modifier vs module exports; widen minimally.
Anti: public mutable fields; everything public “to make it work”.

## 2.15 static — Full Block
Belongs to class, one copy, loaded once. Field shared state; method no `this` (only static access, `ClassName.m()`); block runs once at load for complex init.
Enterprise: Utils (`WaitUtils`), constants, counters. Danger: `static WebDriver` shared across parallel threads → overwrite/quit-while-use → `NoSuchSession`, flaky navigation.
```java
public final class Config {
  static String baseUrl = "https://app.com";
  static { System.out.println("loaded once"); }
  private Config() {}
  static String url(String p) { return baseUrl + p; }
}
// Parallel fix: ThreadLocal<WebDriver>, never static driver
```
Triage: parallel-only fail + serial pass → static mutable suspect (`static driver`, `SimpleDateFormat`, static list). Fix ThreadLocal/DI.
Anti: static mutable collections/counters unsync, static blocks doing I/O/driver start, static method calling instance `login()` directly.

## 2.16 final — Full Block
Var (no reassign, blank final set once in ctor/inline; `static final` constant UPPER_SNAKE); method (no override, safe in ctor); class (no extend: String/Integer/Math).
`final List` ≠ immutable: ref frozen, `add()` allowed. JMM safe publication + lambda effectively-final + JIT opts.
```java
final class Calc {
  public static final int MAX = 100;
  private final int id;
  Calc(int id) { this.id = id; }
  public final int getId() { return id; }
}
```
Triage: `might not initialized` → assign all finals every ctor; `cannot assign` → reassign attempt; `cannot inherit/override` → check API, use composition.
Anti: `final` mutable array/collection as “constant” (expose `List.of()/unmodifiable`), `public static final int[]`, final-everything blocking mocks.

## 2.17 SOLID Principles — Full Block
S: one job/reason to change. `Book` with save+print+data → split. O: extend not modify. `if CHROME else FIREFOX` in factory → new `EdgeStrategy implements BrowserStrategy`. L: substitutable. `Square extends Rectangle` breaking width/height independence. I: small segregated (`Clickable,Typable`) not fat `Worker{work,eat}` forcing `Robot.eat()` throw. D: depend on abstraction + inject (`OrderNotifier(EmailClient)` not `new EmailService()`).
Enterprise: SRP split Page/assert/Driver/Data; OCP add browser/page via new class; ISP `Searchable/Loginnable`; DIP tests→`WebDriver` + DI (Pico/Guice) for mocks/parallel/evolution.
```java
class LoginPage { void login(String u, String p) { /* selenium only */ } }
class ReportWriter { void save(String r) { /* io only */ } }
class Notifier { private final EmailClient c; Notifier(EmailClient c) { this.c = c; } void send(String r) { c.send(r); } }
```
Triage: change ripples → SRP/DIP break; add feature edits 5 stable classes → OCP break; subclass throws UOE → ISP/LSP break. Fix high-churn first.
Anti: god BaseTest/Utils, if-else driver chains, `sleep`+driver creation in Page, fat 20-method interface, scattered `new ChromeDriver()`.

## 2.18 SOLID Applied to Test Automation — Full Block
S: `LoginPage` login only, `DriverFactory` create only, `ConfigReader` load only, `ExtentReporter` log only. No GodBasePage. O: add `EdgeStrategy/CheckoutPage` without editing factory/tests (poly over if-chains). L: any `Chrome/Firefox/Remote` works in `new LoginPage(driver)`; don’t change `click()` contract. I: `Searchable,Loginnable,TakesScreenshot` not `AllActions`. D: test→`WebDriver/Config` interface, not `ChromeDriver/FileConfig`.
```java
public interface DriverStrategy { WebDriver create(); }
public final class ChromeStrategy implements DriverStrategy {
  @Override public WebDriver create() { return new ChromeDriver(); }
}
public final class DriverFactory {
  private DriverFactory() {}
  public static WebDriver get(DriverStrategy s) { return Objects.requireNonNull(s).create(); }
}
// Test depends on abstraction:
WebDriver driver = DriverFactory.get(new ChromeStrategy());
```
Triage: rerun 2-3x + trace/video; flake-rate per test; quarantine PR→nightly; root cluster timing→explicit wait, locator→data-testid, data/order→isolate. Fix <7d SLO.
Anti: locators/asserts in wrong layer, sleep, hardcoded URLs/creds, copy-paste tests, giant tests, blind retries.

## 2.19 OOP Design Questions for SDET — Full Block
1. Inheritance vs Composition for pages? Composition (Test HAS-A Login+Checkout); inherit only shared BasePage waits. Deep hierarchies brittle.
2. Abstract vs Interface for drivers? Abstract shared launch/quit/waits (is-a+reuse); interface capability Searchable/Screenshot across Chrome/Firefox/Appium (can-do+poly).
3. Encapsulation? Private By + public `loginAs(user)`; never expose `findElement` to tests; intent not Selenium.
4. Polymorphism? `Factory.get("chrome")` returns `WebDriver`; `login()` overridden Web vs Mobile; same test runtime binding.
5. Singleton vs Static? Singleton+ThreadLocal for parallel-safe DriverManager; static for stateless WaitUtils. Static driver breaks parallel.
6. Scalable SOLID? SRP Page/Api/Utils, OCP add Edge via `implements Driver` no edit, DIP tests→`Browser` abstraction, Factory+Strategy+POM, draw UML boxes.

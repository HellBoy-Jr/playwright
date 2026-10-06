# SECTION 16 — SELENIUM ADVANCED SCENARIOS (Refined)

## Topics Covered

- 16.1 Dynamic DOM through 16.16 Debugging Scenarios (16 headers)

*Refined header-by-header — full contract*

---

## 16.1 Dynamic DOM — Refined
Theory: Async AJAX/React → NoSuch/flaky if early. Explicit/Fluent over sleep/implicit. Re-locate after updates + stable assert.
```java
WebElement btn = wait.until(ExpectedConditions.elementToBeClickable(By.id("submit"))); btn.click();
```
Triage: dynamic flake → explicit not sleep. Anti: implicit/sleep.

## 16.2 Stale Elements — Refined
Theory: Held element detached refresh/nav/re-render. Never cache across mutations. Re-find retry + refreshed/stalenessOf + invisibility old + re-query lists + log retries fail-fast.
```java
int t=0; while(t++<3){ try{driver.findElement(By.id("price")).click(); break;}catch(StaleElementReferenceException e){} }
```
Triage: SPA/pagination Stale → re-query. Anti: cached lists.

## 16.3 Shadow DOM — Refined
Theory: Encapsulated shadow-root invisible normal By. Sel4 `getShadowRoot()` SearchContext chained nested, or JS `querySelector.shadowRoot.querySelector`. Playwright piercing only; Sel Java explicit traversal helpers.
```java
SearchContext root = driver.findElement(By.cssSelector("my-card")).getShadowRoot();
root.findElement(By.cssSelector(".title")).click();
```
Triage: NoSuch shadow → traversal missing. Anti: normal By.

## 16.4 Web Components — Refined
Theory: Custom/templates/slots/lifecycle + Shadow. Black-box contracts: `customElements.whenDefined()` + ready attrs, light-DOM slots/exposed props/methods JS, no brittle internals, dev `data-testid`, verify events/attrs.
```java
((JavascriptExecutor)driver).executeAsyncScript("await customElements.whenDefined('my-card'); arguments[1]();");
```
Triage: premature interact → whenDefined. Anti: internal selectors.

## 16.5 Nested Iframes — Refined
Theory: One context at a time; frame(index/name/element) chained + default/parent exit + frameAvailable wait. No-switch → NoSuch.
```java
wait.until(ExpectedConditions.frameToBeAvailableAndSwitchToIt("outer")); driver.switchTo().frame("inner");
driver.findElement(By.id("field")).sendKeys("hi"); driver.switchTo().defaultContent();
```
Triage: NoSuch iframe → context. Anti: no switch-back.

## 16.6 Multiple Windows — Refined
Theory: New handles; parent + count wait + iterate switch + actions + close child + back parent (nondet) + titles/URLs log.
```java
String main = driver.getWindowHandle(); driver.findElement(By.linkText("Open")).click();
for(String h:driver.getWindowHandles()) if(!h.equals(main)) driver.switchTo().window(h);
driver.close(); driver.switchTo().window(main);
```
Triage: no handle → blocked/timing. Anti: index assume.

## 16.7 Browser Authentication — Refined
Theory: Basic/Digest native not DOM sendKeys fails. URL `user:pass@host` test envs or CDP Authorization header; Sel4 HasAuthentication UsernameAndPassword; SSO/OAuth normal web; vault secrets never hardcode.
```java
((HasAuthentication)driver).register(UsernameAndPassword.of("user","pass"));
```
Triage: native dialog → not DOM. Anti: hardcoded secrets.

## 16.8 Downloads and Uploads — Refined
Theory: Upload `<input type=file>` sendKeys abs path bypass picker; custom unhide JS or Robot/AutoIT last. Downloads ChromeOptions `download.default_directory` no prompts + poll existence non-zero + clean per test + checksum + PDF force.
```java
driver.findElement(By.id("file")).sendKeys("/tmp/resume.pdf");
```
Triage: custom button → hidden input; Grid → FileDetector. Anti: OS dialog first.

## 16.9 Notifications — Refined
Theory: Push native OS not Alert; prefs `notifications 0/1/2` or `--disable-notifications` deterministic CI (cover flake).
```java
prefs.put("profile.default_content_setting_values.notifications",2);
```
Triage: cover intercept → block. Anti: Alert handling.

## 16.10 Permissions — Refined
Theory: Geo/cam/mic/clipboard prompts block; ChromeOptions prefs or CDP/BiDi `set_permission GRANTED/DENIED/PROMPT`; geo DevTools override; programmatic repeatable.
```java
driver.executeCdpCommand("Browser.grantPermissions", Map.of("permissions",List.of("geolocation")));
```
Triage: prompt blocks → grant. Anti: manual clicks.

## 16.11 Headless Execution — Refined
Theory: No-UI Jenkins/Docker/Linux; Chrome109+ `--headless=new` full vs legacy; Sel deprecated setHeadless → args + `--no-sandbox --disable-gpu --window-size` + shots/logs.
```java
opt.addArguments("--headless=new","--no-sandbox","--window-size=1920,1080");
```
Triage: headless-only fail → viewport/shm/fonts. Anti: old headless.

## 16.12 Remote Execution — Refined
Theory: Decouples code/host `RemoteWebDriver` Hub `http://hub:4444`; JSON/W3C → node browser; standalone/hub+node; Options caps; FileDetector uploads + managed downloads; centralized no local browsers.
```java
WebDriver d = new RemoteWebDriver(new URL("http://localhost:4444/wd/hub"), opt);
```
Triage: refused → hub/firewall. Anti: local paths remote.

## 16.13 Grid Parallelization — Refined
Theory: Grid4 Router/Distributor/Map/Queue/Bus Hub→nodes caps; Docker hub+node `--scale 5` + TestNG parallel methods/tests thread-count + ThreadLocal (static collides) + unique data; 45min→minutes.
```xml
<suite name="GridSuite" parallel="tests" thread-count="4">
```
Triage: queue pile → nodes/threads. Anti: static driver.

## 16.14 Cross-Browser Execution — Refined
Theory: Same script different drivers chromedriver/geckodriver/msedgedriver; TestNG Params/JUnit Parameterized + factory; local seq or Grid/cloud BrowserStack name/version/platform; normalize waits/locators rendering differ.
```java
driver = browser.equals("firefox") ? new FirefoxDriver() : new ChromeDriver();
```
Triage: browser-only fail → timing/render. Anti: hardcoded browser.

## 16.15 Hybrid Tests — Refined
Theory: Selenium UI + RestAssured API one TestNG: POST users → id/token → cookies/localStorage inject → assert frontend backend; faster less flaky UI-only; shared configs Allure/Extent; microservices E2E.
```java
int id = given().body(body).post("/users").then().statusCode(201).extract().path("id");
driver.manage().addCookie(new Cookie("session",token)); driver.navigate().refresh();
```
Triage: UI-only slow/flaky → API seed. Anti: UI setup data.

## 16.16 Debugging Scenarios — Refined
NoSuch bad locator/wait → explicit stable; Stale re-render → re-locate no cache; Intercepted overlay/modal → close/scroll/clickable; Timeout/headless viewport → maximize + shots; DevTools logs + remote-debug + retry triage.
```java
wait.until(ExpectedConditions.elementToBeClickable(By.id("submit"))).click();
```

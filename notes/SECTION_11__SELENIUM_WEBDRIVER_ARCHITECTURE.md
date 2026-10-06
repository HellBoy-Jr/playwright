# SECTION 11 — SELENIUM WEBDRIVER ARCHITECTURE (First Pass)

## Topics Covered

- 11.1 Selenium Overview
- 11.2 Selenium Components
- 11.3 WebDriver Architecture
- 11.4 W3C WebDriver Protocol
- 11.5 BrowserDriver Communication
- 11.6 ChromeDriver / GeckoDriver / EdgeDriver
- 11.7 Local Execution
- 11.8 RemoteWebDriver
- 11.9 Selenium Grid
- 11.10 Grid Architecture
- 11.11 Desired Capabilities / Options
- 11.12 Browser Context and Session Concepts
- 11.13 Selenium 4 Features (CDP & BiDi)
- 11.14 Common Selenium Architecture Questions

*First pass — 14 parallel header subagents, to be refined in second pass*

---

## 11.1 Selenium Overview — Refined
Theory: Open-source browser automation suite, W3C WebDriver-compliant since Selenium 4. Suite = IDE (record/prototype extension) + RC (deprecated) + WebDriver (core native API) + Grid (distributed). Language bindings Java/Python/C#/JS/Ruby. Cross-browser Chrome/FF/Edge/Safari. NOT test-management, perf/security, RPA, desktop/native, API-only. No built-in runner/assert/report — pair TestNG/JUnit + Allure/Extent.
Enterprise Relevance (5000+ tests): Only WebDriver + Grid matter. IDE scripts unmaintainable at scale; WebDriver + POM + explicit waits + Grid sharding + CI gates scale. Version parity driver↔browser + Grid observability decide suite stability.
```java
// Senior entry: no manual binary, Manager auto-resolves
WebDriver driver = new ChromeDriver();
try {
  driver.get(Config.baseUrl());
  Assertions.assertTrue(new LoginPage(driver).isLoaded());
} finally { driver.quit(); }
```
Triage: Team proposes IDE export for regression → reject for >50 tests (no waits/POM/parallel); proposes RC → migrate (removed). Flaky IDE suite → rewrite WebDriver + waits.
Anti: record-playback commit, RC usage, expecting reporting/parallel built-in, using Selenium for load/security.
Qs: Suite vs WebDriver? When NOT to use Selenium (Playwright better async/shadow)?

## 11.2 Selenium Components — Refined
Theory: Bindings (language client APIs Java/Python/C#/JS) serialize commands; Drivers (chromedriver/geckodriver/edgedriver/safaridriver) HTTP servers translate W3C→browser-native (CDP/Marionette); Grid (Router/Queue/Distributor/Node/SessionMap/EventBus) distributes; Manager (Rust CLI 4.6+ `~/.cache/selenium` auto binaries, replaces WebDriverManager); IDE (record/prototype/export extension).
Enterprise (5000+): Tests→bindings→local driver (debug) or Grid/Remote (parallel). Manager eliminates PATH/version toil in CI; IDE never committed beyond prototype.
```java
// No manual binary: Manager resolves; Grid via Remote
WebDriver local = new ChromeDriver();
WebDriver grid = new RemoteWebDriver(new URI("http://hub:4444").toURL(), new ChromeOptions());
```
Triage: `driver executable not found` → pre-4.6 PATH issue, post-4.6 Manager proxy/offline; Grid `no matching slot` → caps vs Node mismatch.
Anti: WebDriverManager manual pinning post-4.6 without need, IDE scripts in regression, expecting Grid in bindings alone.
Qs: Manager vs WebDriverManager? Bindings vs driver responsibility?

## 11.3 WebDriver Architecture — Refined
Theory: Client-server: test → bindings serialize JSON HTTP (Sel3 JSONWP, Sel4 W3C) `POST /session/{id}/element {using,value}` → driver HTTP server → browser-native automation (Blink/CDP, Marionette, SafariDriver) → JSON `{value:{element-6066...}}` back. Synchronous per-command round-trip.
Enterprise (5000+): ms local × 1000s commands/test × 5000 tests = hours network overhead. Minimize round-trips: efficient CSS over chained finds, no attribute loops, Grid close to tests, bulk state checks.
```java
// Chatty (N round-trips) vs efficient (1 + stream)
List<WebElement> rows = driver.findElements(By.cssSelector("#grid tbody tr")); // 1 call
long bad = rows.stream().filter(r -> r.getText().contains("X")).count(); // each getText = round-trip!
```
Triage: Suite 3x slower after Grid move → cross-AZ latency + chatty loops; profile driver logs `--verbose` + reduce finds.
Anti: `findElement` in loops, `getAttribute` per row, remote Grid far from tests.
Qs: Why stateless HTTP hurts scale? How to cut commands 10x?

## 11.4 W3C Protocol — Refined
Theory: W3C Recommendation replaces informal JSONWP. Session `capabilities:{alwaysMatch,firstMatch}` + namespaced extensions (`goog:chromeOptions`, `moz:firefoxOptions`, `se:*`) vs `desiredCapabilities`. All responses `{"value":...}` + std errors (`no such element`, `invalid session id`, `stale element reference`). Endpoints `POST /session`, `/session/{id}/element`, `/actions`. Element opaque `element-6066-11e4-a52e-4f735466cecf` vs legacy `ELEMENT`.
Enterprise: Mixed old driver + new bindings → `unknown command` mass aborts. Pin Selenium + drivers together in Dockerfile.
```
POST /session {"capabilities":{"alwaysMatch":{"browserName":"chrome","browserVersion":"120"}}}
→ {"value":{"sessionId":"abc","capabilities":{...}}}
POST /session/abc/element {"using":"css selector","value":"[data-testid='login']"}
→ {"value":{"element-6066-11e4-a52e-4f735466cecf":"elem-1"}}
```
Triage: `invalid session id` → quit/timeout/crash; `unknown command` → JSONWP driver; `invalid argument using` → bad strategy name.
Anti: `desiredCapabilities` post-Sel4, parsing `ELEMENT` key, ignoring `alwaysMatch`.
Qs: W3C vs JSONWP 3 diffs? Why opaque element key?

## 11.5 BrowserDriver Communication — Refined
Theory: Driver exe standalone HTTP server (:9515 chrome, :4444 gecko). Bindings POST `/session` caps → driver validates → launches browser clean profile → owns process → translates `GET/POST/DELETE /session/{id}/...` to CDP/Marionette by sessionId → routes JSON back. Lockstep majors (Chrome-for-Testing since v115).
Enterprise: Skewed pair in CI = 100% SessionNotCreated outage. Pin both via Manager/CfT endpoint + Docker digest + `--verbose` logs artifact.
```bash
chromedriver --version # must match chrome --version major
chromedriver --port=9515 --verbose --log-path=/tmp/driver.log
```
Triage: `only supports Chrome version X` → upgrade both; `not reachable/crashed` → `--no-sandbox/user-data-dir` Docker + shm 2gb + kill stale; `cannot connect localhost:port` → firewall/port-busy.
Anti: manual download + PATH drift, ignoring CfT, swallowing driver logs.
Qs: Who owns browser process? Why clean profile per session?

## 11.6 Chrome/Gecko/Edge — Refined
Theory: Same W3C, different natives/quirks. ChromeDriver Blink→CDP richest + extensions + `--headless=new`. GeckoDriver W3C→Marionette proxy (server built into FF, binary external) via prefs/profile `-headless`; CDP shim removed post-FF129 → BiDi only. EdgeDriver Chromium Blink like Chrome (`ms:edgeOptions`); EdgeHTML/`use_chromium` obsolete.
Enterprise: Abstract `*Options` via factory; never hardcode. Pin browser+driver per Dockerfile; normalize waits/locators (render/timing differ).
```java
ChromeOptions co = new ChromeOptions();
co.addArguments("--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--window-size=1920,1080");
FirefoxOptions fo = new FirefoxOptions(); fo.addArguments("-headless");
EdgeOptions eo = new EdgeOptions(); eo.addArguments("--headless=new");
WebDriver d = switch (browser) { case "firefox" -> new FirefoxDriver(fo); case "edge" -> new EdgeDriver(eo); default -> new ChromeDriver(co); };
```
Triage: FF-only fail → Marionette pref + stricter W3C; Chrome-only CDP code → guard `instanceof ChromeDriver`. `setHeadless()` deprecation (4.8-4.10) → args.
Anti: `setHeadless()` post-4.10, EdgeHTML caps, CDP on Firefox.
Qs: CDP shim removal impact? How to matrix without branching tests?

## 11.7 Local Execution — Refined
Theory: Direct `new ChromeDriver()` same-host, Manager auto-resolves binary, no Grid hop. Single browser, direct files/DevTools/debugger.
Enterprise: Authoring/repro only. No parallel/matrix/scale; version-coupled; interferes user session; no mobile/cloud. Promote to Grid after green single.
```java
WebDriver driver = new ChromeDriver(new ChromeOptions().addArguments("--headless=new"));
try { driver.get(url); /* repro single headed + pause */ }
finally { driver.quit(); }
```
Triage: passes local fails CI → env parity (viewport/headless/shm/fonts), not logic; add `--window-size/shm/log` + screenshot.
Anti: committing local-only paths, parallel via multiple `new ChromeDriver()` unbounded (OOM), CI on headed dev box.
Qs: When local vs Grid? Why headed repro before Grid triage?

## 11.8 RemoteWebDriver — Refined
Theory: HTTP to Grid/cloud Router `http://hub:4444` (Sel4 no `/wd/hub`) + W3C `*Options` (browser/version/platform/`se:name/recordVideo`). Router→Queue→Distributor→Node matching; LocalFileDetector for uploads, managed downloads.
Enterprise: Parallel/OS matrix, Docker/cloud scale, centralized artifacts. Slot = scarce resource; leak = queue stall.
```java
ChromeOptions o = new ChromeOptions();
o.setPlatformName("linux"); o.setBrowserVersion("120");
o.setCapability("se:name", testName); o.setCapability("se:recordVideo", true);
WebDriver d = new RemoteWebDriver(new URI("http://hub:4444").toURL(), o);
try { d.get(url); /* ... */ } finally { d.quit(); } // DELETE session frees slot
```
Triage: `Connection refused` → hub down/firewall; `no matching slot` → caps vs Node (version/platform); queue growth → maxSessions/slots vs thread-count; `close()`-only → slot leak (must quit).
Anti: `close()` no quit, hardcoded hub URL (config it), `/wd/hub` post-Sel4 confusion, no se:name traceability.
Qs: close vs quit slot impact? How does Distributor match caps?

## 11.9 Selenium Grid — Refined
Theory: Distributed parallel across Nodes heterogenous OS. Modes: Standalone single-process debug/quick CI; Hub-Node classic Router+Distributor+Queue+Map+Bus :4444 + nodes (Small ≤5 / Mid 6-60 / Large 60-100); Distributed separate processes/K8s 100+ (EventBus Redis first).
Enterprise: 1 slot/CPU Chromium/FF (~1GB/session), Safari 1; small isolated Nodes; Docker `shm_size: 2gb` (Chrome crash w/o); scale `--scale chrome=5` / K8s HPA queue-driven.
```yaml
services:
  hub: { image: selenium/hub:4.41, ports: ["4444:4444","4442:4442","4443:4443"] }
  chrome: { image: selenium/node-chrome:4.41, shm_size: 2gb,
    environment: [SE_EVENT_BUS_HOST=hub, SE_NODE_MAX_SESSIONS=4, SE_NODE_SESSION_TIMEOUT=120] }
```
Triage: Chrome `crashed` → shm; version skew → pin hub/node same tag; flapping Node → max-sessions/mem/driver logs.
Anti: huge monolithic Node, shm default 64mb, hub/node version split, unbounded thread-count vs slots.
Qs: Standalone vs hub-node vs distributed triggers? How to size slots/RAM?

## 11.10 Grid Architecture — Refined
Theory: Router sole entry/load-balance → Queue FIFO new sessions (timeout+retry-interval, evicts expired) : existing via SessionMap `sessionId→NodeId` proxied direct. Distributor owns scheduling via GridModel (registration EventBus + HTTP health), polls Queue, matches free slot, creates session, writes Map, returns ID. Node executes only, auto-registers slots. EventBus async backbone (distributed first). 4.41 native WebSocket for BiDi/CDP proxy, no gymnastics.
Enterprise: Queue pile = demand > slots. Fix: add Nodes / lower thread-count / shard by duration / raise `session-request-timeout` + `session-retry-interval` cautiously.
```bash
java -jar selenium-server.jar hub --session-request-timeout 60 --session-retry-interval 5
```
Triage: `session queue full/timeout` → slots vs threads + caps mismatch; Node UNKNOWN → health/mem/driver; Map miss → restarted hub (sticky lost).
Anti: infinite timeout hiding capacity, caps too strict (version exact vs stable), single hub SPOF 100+ nodes (go distributed).
Qs: Router vs Distributor vs Map responsibilities? Where does queued request live?

## 11.11 Caps/Options — Refined
Theory: Sel3 `DesiredCapabilities` untyped map JSONWP silent typos → Sel4 typed `*Options` + std (`browserName/Version/platformName/acceptInsecureCerts/pageLoadStrategy/timeouts`) + namespaced (`goog:chromeOptions` args/prefs, `moz:firefoxOptions` prefs/profile, `se:*` Grid). `se:recordVideo/videoName` Grid-only MP4 docker-video, non-W3C via setCapability, ignored local.
Enterprise: Type + fail-fast in factory; version `stable` vs pinned digest; video only Grid (storage cost); never secrets in caps (logs).
```java
ChromeOptions o = new ChromeOptions();
o.setBrowserVersion("stable"); o.setPlatformName("linux");
o.setAcceptInsecureCerts(true); o.setPageLoadStrategy(PageLoadStrategy.NORMAL);
o.setCapability("se:recordVideo", true); o.setCapability("se:videoName", testName + ".mp4");
```
Triage: `invalid argument capability` → typo/non-W3C local; video missing → non-Grid or docker-video absent; strict version no slot → relax to stable.
Anti: DesiredCapabilities post-Sel4, `se:*` local expectation, secrets in caps.
Qs: DesiredCapabilities vs Options 3 diffs? Where does `se:recordVideo` execute?

## 11.12 Context/Session — Refined
Theory: Hierarchy `Browser(process) > Context(incognito cookies/storage/cache/perms) > Page(tab)`. Selenium session = server `sessionId` + caps + browser instance; stateless HTTP carries id each call. Context = browsing context (window/tab id). Selenium needs new session/incognito flag for isolation; Playwright `browser.newContext()` cheap isolated, object refs not sessionId.
Enterprise: Cross-test cookie leak = shared session. Parallel = 1 session/thread (ThreadLocal). New window/tab same session, new context/session isolated.
```java
driver.switchTo().newWindow(WindowType.TAB);
String h = driver.getWindowHandle(); // same sessionId, new context handle
// Isolation: ChromeOptions --incognito or fresh Remote session per thread, plus deleteAllCookies in teardown
```
Triage: logged-in state leaks → not new session/incognito + no cleanup; popup in parent ctx surprise → switch not new session.
Anti: `deleteAllCookies` as isolation (misses storage), assuming window = session, sharing session parallel.
Qs: sessionId vs window handle vs Playwright context? How to isolate parallel Selenium?

## 11.13 Selenium 4 Features — Refined
Theory: Manager Rust CLI 4.6+ auto `~/.cache/selenium` (`SE_MANAGER_PATH`, `--browser/--driver`, proxy/offline) replaces WebDriverManager. Relative locators `above/below/toLeftOf/toRightOf/near` visual position chainable. CDP Chromium-only powerful (network/emul/logs) version-coupled; BiDi W3C WebSocket cross-browser successor (log/network/script events). Grid 4.41 native WS proxy.
Enterprise: New automation → BiDi; CDP legacy fallback Chrome-only. Relative locators reduce brittle XPath but need stable anchor + size.
```java
// Relative
driver.findElement(with(By.tagName("input")).below(By.id("email")));
// CDP (Chrome-only)
DevTools dev = ((ChromeDriver) driver).getDevTools(); dev.createSession();
dev.send(Network.enable(Optional.empty(), Optional.empty(), Optional.empty()));
// BiDi (W3C future): log.entryAdded / network.beforeRequest via BiDi session
```
Triage: Relative `NoSuch` → anchor unstable/viewport; CDP `unknown command` → non-Chromium/version; BiDi WS fail → old Grid (need 4.41+).
Anti: CDP cross-browser expectation, relative everywhere (slow), Manager disabled offline w/o cache.
Qs: CDP vs BiDi 3 diffs + migration rule? When relative beats XPath?

## 11.14 Architecture Questions — Refined
1. Local vs Remote? Local direct driver debug single; Remote Grid/cloud parallel matrix. Triage solo-pass Grid-fail → caps/slots/env parity. Use local repro then Grid.
2. W3C vs JSONWP? W3C std REST/caps `alwaysMatch`/`element-6066`/errors; JSONWP informal `desiredCapabilities`/`ELEMENT`. Mixed → unknown command; pin together.
3. Queue full? Demand > slots/caps mismatch. Fix add Nodes/lower threads/shard/timeouts + always quit. Monitor queue length + session-timeout.
4. SessionNotCreated? Version skew/caps/port/binary. Fix Manager/CfT align + `--no-sandbox/shm` Docker + verbose logs. Never bump blindly.
5. quit vs close? close window only leaks slot; quit DELETE session+process frees. Always quit finally + ThreadLocal remove (pool leak).
6. CDP vs BiDi? CDP Chromium coupled powerful; BiDi W3C WS cross-browser events. New → BiDi, legacy Chrome → CDP; Grid 4.41+ for WS proxy. Interview close: draw test→bindings→driver→browser + Router→Queue→Distributor→Node map.

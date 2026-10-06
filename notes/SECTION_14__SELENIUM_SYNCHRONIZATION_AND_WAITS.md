# SECTION 14 — SELENIUM SYNCHRONIZATION AND WAITS (Refined)

## Topics Covered

- 14.1 Why Synchronization through 14.19 Interview Qs (19 headers)

*Refined header-by-header — full contract (search API 401, prior pass)*

---

## 14.1 Why Synchronization — Refined
Theory: Async AJAX/JS/DOM → elements unavailable at execute → NoSuch/NotInteractable flaky. Sleep fixed unreliable slow; poll desired state immediate determinism + CI reliability.
Enterprise: determinism + flake + CI signal.
```java
// BAD sleep → GOOD poll (see 14.3)
```
Triage: intermittent NoSuch → timing not locator. Anti: sleep.

## 14.2 Implicit Wait — Refined
Theory: Global per session polls findElement defined duration if absent; default 0 instant fail; applies every lookup early return; presence only not visible/clickable. Never mix implicit+explicit (compound unpredictable). Prefer explicit enterprise.
```java
driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
```
Triage: 20s+ timeouts → mixed waits; set implicit 0. Anti: mix.

## 14.3 Explicit Wait — Refined
Theory: Specific element+condition polling until true/timeout TimeoutException via WebDriverWait + lambda/ExpectedConditions; only where needed exact readiness; default 500ms ignores NotFound. Precision no delay dynamic pages. Recommended.
```java
WebElement btn = new WebDriverWait(driver, Duration.ofSeconds(15)).until(d -> d.findElement(By.id("submit")));
```
Triage: Timeout → condition/timeout/capability; add message. Anti: implicit.

## 14.4 Fluent Wait — Refined
Theory: Configurable parent Wait interface: timeout/poll/message/ignored; re-applies fn until non-null/false or timeout. Dynamic/polling APIs/animations/frequent Stale. Sel4 Duration + withMessage diagnostics. Max control when defaults insufficient.
```java
Wait<WebDriver> f = new FluentWait<>(driver).withTimeout(Duration.ofSeconds(30)).pollingEvery(Duration.ofMillis(500)).ignoring(NoSuchElementException.class).ignoring(StaleElementReferenceException.class);
```
Triage: Stale-heavy → ignore Stale + poll. Anti: defaults for highly dynamic.

## 14.5 ExpectedConditions — Refined
Theory: Factory reusable canned states presence/visibility/clickable/text/title/frames/alerts/selection/staleness + and/or/not; By or element; returns element/Boolean/list. Readable consistent (Java retains, .NET4 removed).
```java
wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("dashboard"))).click();
```
Triage: wrong condition (presence before click) → clickable. Anti: raw lambdas everywhere.

## 14.6 Visibility — Refined
Theory: DOM + displayed + size>0 (not display:none/hidden/zero). `visibilityOfElementLocated(By)` fresh vs `visibilityOf(element)` existing + All variants. Stricter than presence; before click/type/text. Prevents NotInteractable hidden modals/spinners/tabs.
```java
WebElement b = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("successBanner")));
```
Triage: hidden AJAX → visibility not presence. Anti: presence for click.

## 14.7 Presence — Refined
Theory: Exists DOM anywhere hidden ok; fast after nav/AJAX/table/shadow where interaction later; `presenceOfElementLocated` returns on find success w/o displayed; All variants. Count rows/parse hidden/chain visibility. Never alone before click.
```java
String token = wait.until(ExpectedConditions.presenceOfElementLocated(By.id("csrfToken"))).getAttribute("value");
```
Triage: NotInteractable after presence → add visibility/clickable. Anti: presence-click.

## 14.8 Clickability — Refined
Theory: Visible + enabled real-click `elementToBeClickable(By/element)` guards disabled/overlay/spinner/validation/animation; returns element chaining. Prefer dynamic forms/checkout over presence. Scroll/JS fallback only after expiry.
```java
wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("button.submit"))).click();
```
Triage: Intercepted after clickable → overlay race; scroll/close. Anti: presence-click.

## 14.9 Element State Conditions — Refined
Theory: Granular Selected/SelectionState/Staleness/Invisibility/Text/Attribute/Title/Url/Alert/Frame sync checkboxes/transitions/spinners/messages. Precise avoids exists-but-not-advanced races; and/or/not E2E business rules.
```java
wait.until(ExpectedConditions.invisibilityOfElementLocated(By.id("spinner")));
wait.until(ExpectedConditions.textToBePresentInElementLocated(By.id("status"), "Complete"));
```
Triage: exists but workflow stuck → state not presence. Anti: presence-only.

## 14.10 Custom Wait Conditions — Refined
Theory: Business table counts/attr/chart/API status → lambda/Function/ExpectedCondition impl null/false polling + Fluent poll/ignore + withMessage + WaitUtils helper. Senior maturity extensibility.
```java
wait.withMessage("Orders never 5 rows").until(d -> d.findElements(By.cssSelector("table tbody tr")).size() >= 5);
```
Triage: generic timeout → custom message. Anti: sleep for business.

## 14.11 Polling Intervals — Refined
Theory: Frequency re-evaluate before timeout. WebDriverWait 500ms default; Fluent pollingEvery custom; Playwright expect.poll/toPass intervals. Short fast CPU/DOM; long slow feedback. Default unless slow API/animation/job.
```java
new FluentWait<>(driver).withTimeout(Duration.ofSeconds(30)).pollingEvery(Duration.ofMillis(500));
```
Triage: slow backend miss → longer poll; CPU spike → longer. Anti: 50ms hammer.

## 14.12 Timeout Strategy — Refined
Theory: Layered fail-fast signal not hang. Sel implicit 0/explicit 10-15/pageLoad 30-60/script 30; Playwright test30/expect5/action/nav per-call/config. Short normal, long known-slow (report/payment). Never raise global hide flake; trace/shot/network classify.
```ts
await expect(locator).toBeVisible({ timeout: 10_000 });
```
Triage: global bump hides root → layered. Anti: 120s global.

## 14.13 Thread.sleep Why Avoid — Refined
Theory: Blind fixed full even if ready 100ms, fails if longer, ignores state/events, wastes scheduler/CPU 13-71%, env flaky. Tactical debug/think abstraction only. Fix WebDriverWait/auto/web-first/Awaitility non-DOM.
```java
// Avoid sleep → wait visibility (see 14.6)
```
Triage: suite bloat + flake → grep sleep. Anti: sleep readiness.

## 14.14 SPAs — Refined
Theory: React/Angular/Vue mutate w/o loads; readyState/load insufficient. Sync user-visible: visible/enabled/stable/URL/loader gone. Playwright auto+web-first + waitForURL/Function; Sel explicit clickability/text. Avoid networkidle analytics polling open.
```ts
await expect(page.getByRole("heading", { name: "Results" })).toBeVisible(); await expect(page).toHaveURL(/.*dashboard/);
```
Triage: load-pass action-fail → SPA state. Anti: load/networkidle every action.

## 14.15 AJAX/Network Timing — Refined
Theory: XHR/fetch background; spinner-hide alone unreliable non-clickable. Deterministic network+UI: Playwright waitForResponse/Request before trigger (no race) + visible; Sel invisibility(loader)+visibility(result) or NetworkInterceptor. Match method/glob/status.
```ts
const p = page.waitForResponse("**/api/orders/*"); await page.getByRole("button", {name:"Submit"}).click(); await (await p).ok();
```
Triage: race missing response → declare before click. Anti: spinner-only.

## 14.16 Stale Element Reference — Refined
Theory: Held ID unmapped after re-render/nav/AJAX/remove. Playwright locators re-resolve avoid class. Fix re-find retry + refreshed/stalenessOf, no cached across SPA/pagination, wait stability.
```java
wait.until(ExpectedConditions.refreshed(ExpectedConditions.elementToBeClickable(By.id("submit")))).click();
```
Triage: loop Stale → re-query each iter. Anti: cache across routes.

## 14.17 Anti-Patterns — Refined
Theory: Mix implicit+explicit 20s+, sleep/timeout, spinner-only w/o visibility, networkidle/loadState every action, broad selector before auto-wait, swallow Timeout. Fix implicit 0, explicit per need, final user state, specific, timeout diagnostic traces.
```ts
// Bad waitForTimeout → Good toBeHidden spinner
```
Triage: compounded timeouts → audit waits. Anti: listed.

## 14.18 Snippets — Refined
Theory: Cross-lang idioms timeout+condition+assert; Sel Java/Python WebDriverWait+EC; Playwright auto+poll/toPass; wrapper `waitForVisible(By,timeout)` centralize policy Page Objects.
```python
WebDriverWait(driver, 15).until(EC.element_to_be_clickable((By.ID, "submit"))).click()
```
Triage: dup waits → utils. Anti: inline waits everywhere.

## 14.19 Interview Qs — Refined
Implicit vs explicit vs fluent; never mix; defaults polling/timeout; sleep vs explicit; AJAX/SPAs; stale cause/fix; Playwright auto vs Sel; waitForResponse vs assert. STAR checkout sleep→response+visible cut time/flake. State-over-time principle.
```ts
await expect(page.getByText("Export complete")).toBeVisible({ timeout: 30_000 });
```

# SECTION 13 — SELENIUM ELEMENT INTERACTIONS (Refined)

## Topics Covered

- 13.1 Finding Elements through 13.27 Common Snippets (27 headers)

*Refined header-by-header — full contract (search API 401, prior 2025-2026 pass)*

---

## 13.1 Finding Elements — Refined
Theory: `By` id/name/class/tag/link/partial/css/xpath; id+CSS fastest stable, XPath axes/text complex. Pair with explicit waits (dynamic → NoSuch).
Enterprise: POM-centralized + waits; `1/1` uniqueness.
```java
WebElement btn = wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("#submit")));
```
Triage: NoSuch → locator vs timing; fix stable + wait. Anti: raw find in @Test, absolute.

## 13.2 findElement — Refined
Theory: First match else NoSuch; immediate unless implicit; wrap visibility wait.
Enterprise: Single unique (login/input); try/wait not swallow.
```java
WebElement user = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("username")));
```
Triage: NoSuch flaky → wait not sleep. Anti: implicit mix.

## 13.3 findElements — Refined
Theory: List all or empty never throws; tables/options/links counts; check size/empty before index; streams asserts.
Enterprise: result counts, row iterate, filter validation.
```java
List<WebElement> links = driver.findElements(By.tagName("a"));
Assertions.assertFalse(links.isEmpty());
```
Triage: IndexOOB → empty check. Anti: singular for plural.

## 13.4 click — Refined
Theory: Native click needs visible+enabled; else NotInteractable/Intercepted. Overlays → scroll/JS/Actions; wait clickable AJAX.
Enterprise: flaky checkout → clickable wait.
```java
wait.until(ExpectedConditions.elementToBeClickable(By.id("loginBtn"))).click();
```
Triage: Intercepted → overlay/spinner; fix close/scroll/wait. Anti: sleep-click.

## 13.5 sendKeys — Refined
Theory: Types appends + Keys.ENTER/TAB/CONTROL chords; file path to file-input; clear first; autocomplete pauses/Actions.
Enterprise: search `Deloitte SDET + ENTER`.
```java
WebElement s = driver.findElement(By.name("q")); s.clear(); s.sendKeys("Deloitte SDET" + Keys.ENTER);
```
Triage: concatenated → missing clear; upload fails → non-input custom. Anti: no clear.

## 13.6 clear — Refined
Theory: Removes input/textarea text; essential before type; fails read-only/disabled/dropdowns; React stubborn Ctrl+A/Delete/JS; assert value empty.
Enterprise: edit-profile/search flows.
```java
email.clear(); Assertions.assertTrue(email.getAttribute("value").isEmpty()); email.sendKeys("test@deloitte.com");
```
Triage: still text → JS/keys fallback. Anti: clear dropdown/checkbox.

## 13.7 getText — Refined
Theory: Visible inner text excl hidden/trim; reflow cache; hidden/value → getAttribute textContent/value. Dynamic banners wait + contains.
Enterprise: headers/errors/cells/toasts asserts.
```java
WebElement m = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("success")));
Assertions.assertTrue(m.getText().contains("created successfully"));
```
Triage: empty → hidden (use attr) or timing. Anti: getText for value.

## 13.8 getAttribute — Refined
Theory: HTML attrs value/href/src/placeholder/disabled/data-* null if absent; Sel4 getDomProperty (JS props) + getAriaRole. Vs getText/getCssValue.
Enterprise: typed value, link URLs, disabled state, validation msgs.
```java
String typed = input.getAttribute("value"); String href = driver.findElement(By.linkText("Docs")).getAttribute("href");
```
Triage: null → absent vs property (use DomProperty). Anti: getText for value.

## 13.9 isDisplayed — Refined
Theory: Rendered visible (not display:none/hidden/zero); not viewport (scroll may need); throws NoSuch if absent → findElements/visibilityOf safe.
Enterprise: banners/modals/toggles asserts.
```java
if (banner.isDisplayed()) banner.click();
```
Triage: NoSuch → presence first. Anti: displayed = viewport.

## 13.10 isEnabled — Refined
Theory: Interactive (not disabled attr); grey submit; combine getAttribute disabled + aria/CSS cross-browser; invalid→disabled→valid→enabled wait.
Enterprise: form validation flows.
```java
Assertions.assertFalse(submit.isEnabled()); driver.findElement(By.id("age")).sendKeys("30"); Assertions.assertTrue(submit.isEnabled());
```
Triage: CSS-only disabled miss → aria/class check. Anti: enabled = visible.

## 13.11 isSelected — Refined
Theory: Checkbox/radio/option selected; custom div → aria-checked; idempotent `if(!selected)click` + assert.
Enterprise: terms/gender flows.
```java
if (!check.isSelected()) check.click(); Assertions.assertTrue(check.isSelected());
```
Triage: custom styled → attr not isSelected. Anti: blind click toggle.

## 13.12 Radio Buttons — Refined
Theory: Single group same name; locate id/value/label; isSelected exclusivity + siblings deselected; waits dynamic; custom label/JS if hidden.
Enterprise: gender/plan selection.
```java
for (WebElement r : driver.findElements(By.name("gender")))
  if (r.getAttribute("value").equals("male") && !r.isSelected()) r.click();
```
Triage: both selected → not same group/name. Anti: index click.

## 13.13 Checkboxes — Refined
Theory: Independent multi; click toggle + isSelected verify + enabled/displayed first (NotInteractable); bulk common locator iterate; conditional set not blind.
Enterprise: terms/bulk select.
```java
driver.findElements(By.cssSelector("input[type='checkbox']")).forEach(e -> { if (!e.isSelected()) e.click(); });
```
Triage: toggle flake → conditional. Anti: blind click.

## 13.14 Dropdowns with Select — Refined
Theory: Native `<select>` Select class single/multi; byVisibleText readable, byValue stable, never index; getFirst/Options + isMultiple + AJAX wait.
Enterprise: country/state forms.
```java
Select dd = new Select(driver.findElement(By.id("country"))); dd.selectByVisibleText("India");
```
Triage: not select tag → custom path; stale options → wait. Anti: index.

## 13.15 Custom Dropdowns — Refined
Theory: Div/React/autosuggest no select → Select fails. Click trigger → wait options → click text; searchable sendKeys filter; scrollIntoView overlays.
Enterprise: modern apps.
```java
driver.findElement(By.id("custom-dd")).click();
wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".dd-option")));
driver.findElements(By.cssSelector(".dd-option")).stream().filter(e -> e.getText().equals("Deloitte")).findFirst().orElseThrow().click();
```
Triage: option not clickable → scroll/wait. Anti: Select on div.

## 13.16 Web Tables — Refined
Theory: `<table/thead/tbody/tr/td>`; rows `//table/tbody/tr`, cells `./td[n]`; iterate validate/count/row-action by text; relative from row; Page methods.
Enterprise: emp/order grids.
```java
for (WebElement row : driver.findElements(By.xpath("//table[@id='emp']/tbody/tr"))) {
  if (row.findElement(By.xpath("./td[2]")).getText().equals("John")) { row.findElement(By.xpath("./td[5]/button")).click(); break; }
}
```
Triage: brittle absolute → relative `./`. Anti: index-only.

## 13.17 Dynamic Tables — Refined
Theory: Pagination/sort/filter/infinite → Stale. Re-locate per page + spinner invis + staleness loop + footer counts; stable over index.
Enterprise: INV grids.
```java
while (true) {
  for (WebElement row : driver.findElements(By.cssSelector("#grid tbody tr")))
    if (row.getText().contains("INV-1024")) return;
  WebElement next = driver.findElement(By.id("nextPage")); if (!next.isEnabled()) break;
  next.click(); wait.until(ExpectedConditions.stalenessOf(next));
}
```
Triage: Stale loop → re-query. Anti: cached rows.

## 13.18 Iframes — Refined
Theory: Isolated context; switchTo frame(index/name/element) chained nested + default/parent exit + frameAvailable wait. No-switch → NoSuch silent.
Enterprise: payment/widgets.
```java
wait.until(ExpectedConditions.frameToBeAvailableAndSwitchToIt("payment-frame"));
driver.findElement(By.id("card")).sendKeys("4111111111111111"); driver.switchTo().defaultContent();
```
Triage: NoSuch in frame → context wrong. Anti: no switch-back.

## 13.19 Windows/Tabs — Refined
Theory: New handles; parent handle + count wait + iterate switch + actions + close child + back parent (order nondet) + URL/title validate.
Enterprise: reports/popups.
```java
String parent = driver.getWindowHandle(); driver.findElement(By.linkText("Open Report")).click();
wait.until(d -> d.getWindowHandles().size() > 1);
for (String h : driver.getWindowHandles()) if (!h.equals(parent)) driver.switchTo().window(h);
driver.close(); driver.switchTo().window(parent);
```
Triage: no new handle → popup blocked/timing. Anti: index assume.

## 13.20 Alerts — Refined
Theory: JS alert/confirm/prompt block DOM → Alert accept/dismiss/text/sendKeys + alertIsPresent wait (NoAlert). Auth/HTML modals not alerts.
Enterprise: delete confirms.
```java
driver.findElement(By.id("delete")).click();
Alert a = wait.until(ExpectedConditions.alertIsPresent()); Assertions.assertEquals(a.getText(), "Are you sure?"); a.accept();
```
Triage: NoAlert → timing/modal confusion. Anti: Alert for HTML modal.

## 13.21 JavaScriptExecutor — Refined
Theory: JS browser context when locators/clicks fail overlays/hidden/complex DOM. `executeScript(arguments[0])` sync / Async AJAX waits; safe element passing. forced click/scrollIntoView/innerText/value/readyState. Native first, JS fallback + log audit.
Enterprise: last-resort stability.
```java
JavascriptExecutor js = (JavascriptExecutor) driver;
js.executeScript("arguments[0].scrollIntoView(true); arguments[0].click();", btn);
```
Triage: JS hides real issue → prefer waits first. Anti: JS everything.

## 13.22 Actions API — Refined
Theory: Low-level mouse/key/pen/touch/wheel hover/sliders/chords: move/click/double/context/clickHold/keyDown/sendKeys/keyUp + perform (Sel4 direct W3C, build optional) + pause timing + reset.
Enterprise: menus/sliders.
```java
new Actions(driver).moveToElement(menu).pause(Duration.ofMillis(500)).click(driver.findElement(By.id("item"))).perform();
```
Triage: chain stale → rebuild per use. Anti: no perform.

## 13.23 Scroll — Refined
Theory: Outside viewport unreliable → scroll explicit before assert. JS scrollIntoView/scrollBy/scrollTo vs Sel4.2 wheel scrollToElement/ByAmount/FromOrigin (lazy-load user-like) + visibility after infinite.
Enterprise: footers/lazy lists.
```java
new Actions(driver).scrollToElement(footer).perform();
((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView(true);", footer);
```
Triage: lazy not loaded → wheel + wait. Anti: no scroll click intercept.

## 13.24 Drag and Drop — Refined
Theory: Source→target/offset Kanban/sliders: dragAndDrop/dragBy + perform; flaky HTML5 → clickHold-move-release pauses; synthetic ignored → JS dragstart/drop/dragend fallback + assert post-drop text/count/attr.
Enterprise: boards/sliders.
```java
new Actions(driver).dragAndDrop(src, dst).perform();
new Actions(driver).clickAndHold(src).moveByOffset(100, 0).release().perform();
```
Triage: HTML5 no-op → JS events. Anti: no assert.

## 13.25 File Upload — Refined
Theory: `<input type=file>` sendKeys abs path bypass OS picker; `src/test/resources` + Paths abs CI portable; custom unhide JS or Robot/AutoIt last; downloads ChromeOptions prefs dir no prompts.
Enterprise: resume/docs flows.
```java
upload.sendKeys(Paths.get("src/test/resources/sample.pdf").toAbsolutePath().toString());
```
Triage: custom button → input hidden; remote Grid → LocalFileDetector. Anti: OS dialog automation first.

## 13.26 Screenshots — Refined
Theory: Failure evidence audit/defects: TakesScreenshot FILE/BYTES/BASE64 + FileUtils/Files + element/full-page FF + listener timestamp + Extent/Allure traceability.
Enterprise: mandatory CI artifacts.
```java
File src = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
FileUtils.copyFile(src, new File("target/screenshots/" + System.currentTimeMillis() + ".png"));
```
Triage: blank shots → headless size; null driver → guard. Anti: on-demand only.

## 13.27 Snippets — Refined
Theory: Waits+Actions+Select+JS reusable safeClick/hover-double/Ctrl-click/toggle/dropdown/slider in InteractionUtils/BasePage + wait not sleep + log maintainable review-ready.
Enterprise: flake reduction library.
```java
public static void safeClick(WebDriver d, By loc) {
  WebElement e = new WebDriverWait(d, Duration.ofSeconds(10)).until(ExpectedConditions.elementToBeClickable(loc));
  new Actions(d).moveToElement(e).click().perform();
}
```
Triage: dup helpers → centralize. Anti: sleep + copy-paste.

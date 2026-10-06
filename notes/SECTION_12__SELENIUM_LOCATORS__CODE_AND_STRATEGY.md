# SECTION 12 — SELENIUM LOCATORS — CODE AND STRATEGY (Refined)

## Topics Covered

- 12.1 Locator Strategy
- 12.2 ID
- 12.3 Name
- 12.4 Class Name
- 12.5 Tag Name
- 12.6 Link Text
- 12.7 Partial Link Text
- 12.8 CSS Selectors
- 12.9 XPath
- 12.10 Relative XPath
- 12.11 XPath Axes
- 12.12 Parent / Child / Ancestor / Descendant
- 12.13 Following / Preceding
- 12.14 Text-Based XPath
- 12.15 Dynamic XPath
- 12.16 Dynamic Attributes
- 12.17 CSS vs XPath
- 12.18 Stable Locator Design
- 12.19 `data-testid` Strategy
- 12.20 Locator Code Snippets
- 12.21 Locator Anti-Patterns
- 12.22 Locator Interview Questions

*Refined header-by-header — full contract (web search API 401, validated from prior 2025-2026 pass)*

---

## 12.1 Locator Strategy — Refined
Theory: 8 strategies + Relative. Priority unique id > name/CSS/data-testid > XPath last. POM-centralized, never absolute.
Enterprise 5000+: stable attrs cut flake 80%; review/lint + `1/1` uniqueness + strict single-match.
```java
private final By loginBtn = By.cssSelector("[data-testid='login']");
wait.until(ExpectedConditions.elementToBeClickable(loginBtn)).click();
```
Triage: post-deploy NoSuch → structure/class/auto-ID tied; fix stable parent + partial/text/axes. Anti: absolute XPath, index chains, locators in @Test. Qs: priority + proof?

## 12.2 ID — Refined
Theory: `By.id()` unique, fastest getElementById. Stable only; dynamic `ext-123` fails.
Enterprise: stable IDs + testid contract; `1/1` check.
```java
wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("lname")));
```
Triage: yesterday-pass today-fail → dynamic; switch partial/text. Anti: assume unique/stable. Qs: why fastest? detect dynamic?

## 12.3 Name — Refined
Theory: `By.name()` forms; less unique (radios share) → findElements + value filter.
Enterprise: `form#login [name='email']` precision.
```java
driver.findElements(By.name("gender")).stream()
  .filter(r -> r.getAttribute("value").equals("male")).findFirst().orElseThrow().click();
```
Triage: first-only wrong → scope parent. Anti: single-assume. Qs: radio handling?

## 12.4 Class Name — Refined
Theory: `By.className()` groups → findElements. One token; compound → CSS `.btn.btn-primary`.
Enterprise: lists/cards; styling churn → testid/role.
```java
driver.findElements(By.className("information"));
```
Triage: compound error → CSS; redesign fail → stable attr. Anti: compound, styling-as-functional.

## 12.5 Tag Name — Refined
Theory: `By.tagName()` rarely unique; count/scope links/rows/inputs + parent scope.
Enterprise: link health, row counts.
```java
WebElement table = driver.findElement(By.id("emp"));
List<WebElement> rows = table.findElements(By.tagName("tr"));
```
Triage: huge slow → scope; hidden included → filter. Anti: bare global div.

## 12.6 Link Text — Refined
Theory: `By.linkText()` exact `<a>` text, readable, case/space sensitive, stable unique only.
Enterprise: nav smoke; i18n → testid.
```java
driver.findElement(By.linkText("Selenium Official Page")).click();
```
Triage: slight change → partial/CSS. Anti: dynamic/long exact.

## 12.7 Partial Link Text — Refined
Theory: `By.partialLinkText()` substring; long/dynamic links; multi-match → first only → findElements.
Enterprise: prefix/suffix changing links.
```java
driver.findElements(By.partialLinkText("Official")).stream()
  .filter(e -> e.getText().contains("Selenium")).findFirst().orElseThrow().click();
```
Triage: short substring multi → lengthen + scope. Anti: overly short substrings.

## 12.8 CSS Selectors — Refined
Theory: `#id/.class/[attr=val]/tag>child/:first-child/:nth-of-type`. 2nd after id, faster than XPath, native, pseudo-classes. No up/text.
Enterprise: classes/attrs/hierarchy `input[name='lname']`, `[data-testid]`.
```java
driver.findElement(By.cssSelector("input[name='lname']"));
driver.findElement(By.cssSelector("#fname"));
```
Triage: need parent/text → XPath/role. Anti: `>`/`nth-child` brittle chains.

## 12.9 XPath — Refined
Theory: Traverse DOM when id/name/CSS fail. `//input[@id]` anywhere vs `/html` root absolute (brittle). Attr/index/predicate/functions. `$x()` validate.
Enterprise: complex axes/text only; relative always.
```java
driver.findElement(By.xpath("//input[@name='email']"));
```
Triage: absolute breaks CI → rewrite relative. Anti: DevTools Copy-XPath commit.

## 12.10 Relative XPath — Refined
Theory: `//tag[@attr]` anywhere resilient; scoped `//form[@id]//input[@type]`. No `//div[3]/span[2]` unless stable. Prefer id/name/testid/aria over hashed classes.
Enterprise: short unique `1/1` + assert.
```java
driver.findElement(By.xpath("//form[@id='login']//input[@type='password']"));
```
Triage: index shift → anchor stable parent. Anti: absolute + indexes.

## 12.11 XPath Axes — Refined
Theory: 13 axes; SDET child/parent/ancestor/descendant/following/preceding/siblings/self/attribute. `//base/axis::target`.
Enterprise: dynamic tables, label→input mapping over positional.
```java
driver.findElement(By.xpath("//label[text()='Email']/following-sibling::input"));
driver.findElement(By.xpath("//span[text()='Price']/ancestor::div[@class='product']"));
```
Triage: direct attrs unstable → axes anchor. Anti: positional XPath.

## 12.12 Parent/Child/Ancestor/Descendant — Refined
Theory: Vertical: parent immediate (`/..` shorthand), child direct (default), ancestor to root, descendant any depth.
Enterprise: stable child anchors container over absolute chains.
```java
driver.findElement(By.xpath("//input[@id='email']/parent::div"));
driver.findElement(By.xpath("//td[text()='John']/ancestor::table"));
driver.findElement(By.xpath("//table[@id='t1']/descendant::td"));
```
Triage: long chain → ancestor form/div. Anti: absolute chains.

## 12.13 Following/Preceding — Refined
Theory: Horizontal/document order: following after excl descendants, following-sibling same-parent later, preceding before excl ancestors, preceding-sibling earlier. Same level → *-sibling.
Enterprise: unlabeled inputs `//label/following-sibling::input`.
```java
driver.findElement(By.xpath("//label[text()='Password']/following-sibling::input"));
driver.findElement(By.xpath("//td[text()='Jason']/following-sibling::td[1]"));
```
Triage: wrong node → sibling vs global confusion. Anti: `following` for same-level (use sibling).

## 12.14 Text-Based XPath — Refined
Theory: Stable text w/o attrs: exact `text()='Login'`, `normalize-space(.)`, partial `contains/startswith`. Prefer `.` nested over `text()`; combine `contains(text)+contains(@href)`; avoid `//*[contains]` matching html/body.
Enterprise: no-attribute buttons/links.
```java
By.xpath("//button[contains(.,'Add to cart')]"); By.xpath("//h3[normalize-space(.)='Aurora']");
```
Triage: whitespace fail → normalize; nested markup miss → `.` not text(). Anti: `//*` broad.

## 12.15 Dynamic XPath — Refined
Theory: Partial/predicate/relationship not fixed: `contains(@attr)/starts-with/normalize/text + and/or/not/last/position`.
Enterprise: shortest resilient; stable parent + partial over auto absolute.
```java
By.xpath("//button[contains(@id,'submit')]"); By.xpath("//div[contains(@class,'card')][.//h3[normalize-space(.)='Laptop']]//button");
```
Triage: auto-ID churn → partial anchor. Anti: fixed auto values.

## 12.16 Dynamic Attributes — Refined
Theory: Volatile `user_83491/u_0_2`: `starts-with(@id,'user_')` prefix stable, `contains(@id,'username')` middle, combined `[@type and contains]`. XPath1.0 no `ends-with` → `substring()`. Else pivot text/axes.
Enterprise: framework-generated IDs.
```java
By.xpath("//input[starts-with(@id,'user_')]"); By.xpath("//input[@type='text' and contains(@id,'user')]");
```
Triage: no stable substring → abandon attrs. Anti: ends-with in browser XPath.

## 12.17 CSS vs XPath — Refined
Theory: Playwright auto-detect `css=` vs `//`. CSS faster/readable/pierces open shadow + `:visible/:has-text/:has/:is` (scope `article:has-text("Pay")`); XPath up/parent/text/axes/unions, no shadow, slower brittle. Both last behind Role/TestId.
Enterprise: role/testid first; CSS fallback; XPath parent/text only.
```java
page.locator("css=button:visible"); page.locator("xpath=//button[@type='submit']");
```
Triage: shadow fail XPath → CSS piercing; parent needed → XPath. Anti: bare `:has-text` (body).

## 12.18 Stable Locator Design — Refined
Theory: Priority Role>Label>Placeholder>Text>Alt/Title>TestId>CSS>XPath. User perception not DOM, a11y-enforcing. Strict single-match; scope chaining/filter.
Enterprise: survives class/layout churn; `nth/first` hides ambiguity → fix not index.
```js
const row = page.getByRole('row').filter({hasText: 'monserrat44@example.com'});
await row.getByRole('checkbox', {name: 'Select row'}).check();
```
Triage: multi-match strict throw → narrow name/filter/chain. Anti: nth/first default.

## 12.19 data-testid — Refined
Theory: Most resilient non-user: survives text/role/style via dev-QA contract. No role/label, canvas/third-party, repeated cards.
Enterprise: kebab/BEM stable/short unique/scoped, never style/logic; `testIdAttribute:'data-qa'`; overuse loses behavior → role when name matters.
```html
<button data-testid="checkout-submit">Place order</button>
```
```js
await page.getByTestId('checkout-submit').click();
```
Triage: missing → request contract; dup → container-scope. Anti: testIds everywhere.

## 12.20 Locator Code Snippets — Refined
Theory: Standard Role/Label/Placeholder/Alt/TestId/Text/frame/CSS set; codegen then edit; Locator + web-first `toHaveText`, never `page.$` Handle + snapshot assert.
Enterprise: copy-paste library in POMs, pick-locator validated.
```js
await page.getByRole('button', {name: 'Sign in'}).click();
await page.getByLabel('Password').fill('secret');
await page.frameLocator('#my-frame').getByRole('button').click();
await expect(locator).toHaveText('Hi'); // retries, not textContent+toBe
```
Triage: `page.$` stale → Locator. Anti: snapshot asserts.

## 12.21 Locator Anti-Patterns — Refined
Theory: BAD structural `#tsf>div:nth-child`, `//*[@id]/div[2]`, `.btn-primary`, `nth(1)`, bare `:has-text("Pay")` body, snapshot `textContent→toBe` no retry. Tied structure/classes/IDs, index shifts, broad matches, races.
Enterprise: fix Role/Label/scoped filter/TestId/exact/regex + locator asserts.
```js
// BAD → GOOD:
page.locator('.btn-primary') → page.getByRole('button', {name: 'Pay'});
await locator.textContent() + toBe → await expect(locator).toHaveText('Hi');
```
Triage: DevTools XPath + `>`/`nth-child` → rewrite. Anti: listed BADs.

## 12.22 Locator Interview Questions — Refined
1. Locator vs Handle? Lazy re-query auto-wait never stale vs snapshot. 2. Why Role first? Resilient + a11y. 3. Strict? Single-action multi-match throws; filter/exact/scope. 4. Fix 2 matches? Narrow/filter/chain, first/last intentional only. 5. CSS vs XPath? Shadow+fast vs parent/text no-shadow last. 6. When TestId? No semantic hook contract. Trap testIds-always-best (loses behavior).

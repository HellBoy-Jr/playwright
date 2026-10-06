# SECTION 19 — PLAYWRIGHT WITH TYPESCRIPT (Refined)

## Topics Covered

- 19.1-19.57 (57 headers)

*Refined header-by-header — full contract (search API 401, prior 2025-2026 pass)*

---

## 19.1-19.14 Core/Fixtures/Locators — Refined
Why cross-browser single API auto-wait/web-first cuts flake vs sleeps parallel/shard/trace Codegen/UI-mode API/network mock shift-left TS/JS/Py/Java/.NET HTML/Allure mobile emu. Arch Client Node+test → Transport WS/pipe → Server Driver+patched CDP/Juggler instrumented auto-wait/network/trace; `install`; local/remote/headed/Sauce/Docker consistent.
Model Browser process expensive shared/worker; Context incognito isolated cookies/storage/viewport cheap parallel; Page tab. Runner 1 ctx+page/test isolation no relaunch; newContext multi-user/auth/emu.
Projects named groups config shared use differing browser/device/env/match/retries/dependencies; `--project`; matrix Desktop/Mobile/staging/prod/smoke/setup chains.
Runner bundles runner+expect+workers/retries/shard/reporters/UI/Trace; describe/test/step/hooks/skip/fixme/only/use; CLI headed/project/grep/workers/retries/ui; web-first auto-retry no manual.
Fixtures `extend()` setup `use` teardown lazy composable isolated vs beforeEach globals; typing. Built-in page/context/browser/browserName/request/testInfo/workerInfo/baseURL/storageState/viewport via args/use. Custom `fixtures.ts` extended test+expect import instead; scope test/worker auto/option/timeout/box/title; override page auto-goto; mergeTests.
Isolation fresh ctx+page zero shared; browser reused speed ctx cheap; workers files parallel fullyParallel/workers/retries; no order; seed fixtures/API teardown; storageState auth reuse no leak.
Locators lazy strict auto-wait re-resolve every action/assert retry; user-facing Role/Label/Text/Placeholder/Alt/Title/TestId; no CSS/XPath chains; chain/filter has/hasNot/and/or/first/nth; Codegen/pause.
Role ARIA users/AT most resilient + name strict single + Shadow; Label `<label>/aria` inputs/selects whitespace + fill/select/check (fix a11y); Placeholder hint no-label search (vanishes poor) + fill/press/toHaveValue; TestId `data-testid` (testIdAttribute) stable contract immune text/i18n/ARIA non-user lists/i18n dev-QA kebab/BEM unique/scoped overuse loses behavior → role.
Triage: flaky locators → role/testid + strict + `1/1`; shared state → fresh ctx. Anti: CSS/XPath chains, `page.$` Handle, nth default, testIds everywhere.

## 19.15-19.28 Locator/Actions/Media — Refined
Locator central lazy vs Handle snapshot re-resolves survives re-render; role/text/label priority page.locator fallback. Chaining parent scope cards/tables/dialogs filter hasText/has/hasNot + nested (same frame relative no `>>`/xpath `..`). Strict default single else violation catches ambiguity; first/last/nth/filter/or+first intentional; FrameLocator/contentFrame same; enforce on.
Auto-wait actionability every action no sleeps: click/check/dbl visible+stable+receives+enabled; fill visible/enabled/editable; hover/drag skip enabled; press/focus minimal; TimeoutError; force bypass hit trial dry-run.
Asserts generic Jest sync no-retry unsafe vs Locator/Page/API auto-retry poll 5s; user-observable retrying after actions sync pure JS; timeout per/global expect.timeout. expect Locator/Page/APIResponse; await async (missing top flake); Visible/Enabled/Checked/ContainsText/Attribute/Title/URL + exact/innerText/timeout; not sparingly.
Web-first re-query+retry mirroring user polls until timeout; strict+auto+poll; prefer over waitForSelector+sync; trigger then web-first next; default 5s extend batch never waitForTimeout.
Nav `goto` load incl redirects; SPA continues fetch → interact immediate auto-wait; no networkidle except legacy; waitForURL routing + waitForLoadState domcontentloaded/load popups; Promise.all click+wait no race; BFCache skips network.
Tabs Context multi Pages shared cookies/viewport/routes focused no bringToFront; blank `waitForEvent(page)` before click + popup `waitForEvent(popup)` Promise.all + loadState + titles parallel trace.
Frames main+iframe; declarative `frameLocator(class).getByLabel` auto strict over frame(name/url)+fill; contentFrame/owner; nested chain; no-selector any; first disambiguate.
Dialogs alert/confirm/prompt/beforeunload auto-dismiss w/o listener stalls; `on(dialog→accept/dismiss)` before trigger + type/message/promptText; beforeunload close runBeforeUnload; print stub promise+waitForFunction no native.
Uploads `setInputFiles` file input paths/array/empty/in-mem buffer (cwd); dynamic `waitForEvent(filechooser)` before click then setFiles; buffer hermetic CI real large only assert filename.
Downloads `on(download)` temp deleted ctx close; `waitForEvent` before click Promise.all; suggestedFilename/url/path + saveAs; downloadsPath/acceptDownloads; passive + explicit await.
Screenshots page full + locator visible+stable; path/fullPage/clip/mask/animations disabled/caret hide; visual `toHaveScreenshot` Test baselines diff CI; failure auto + mask + Allure/JUnit audit.
Triage: snapshot `textContent+toBe` race → web-first; multi-match strict → scope; stale Handle → Locator. Anti: waitForTimeout, `isVisible` manual, `page.$`.

## 19.29-19.42 Traces/Network/Auth/Scale — Refined
Traces DOM/actions/network/console/errors post-mortem; `trace:on-first-retry` CI storage vs on; HTML/show-trace; mandatory flaky/audit. Videos WebM per ctx test-results close; `retain-on-failure`/`on-first-retry` storage; size/annotations; `video().path()` after close + traces.
Network request/response/XHR/fetch/WS + waitForRequest/Response glob/RegExp/predicate sync not sleeps after click; block ServiceWorkers/MSW missing; contract/perf/race. Route mock page/context abort/continue/fulfill JSON/errors/timeouts/block images-CSS/headers; fetch mutate real; beforeEach ctx broad; hermetic edge/frontend isolation.
APIRequestContext Node direct no browser `request.newContext`/`request` fixture get/post/put/delete baseURL/headers/proxy; ok/status/json; dispose; fast service/setup/teardown/health.
API+UI fixtures pre/post + UI journeys: API beforeAll create → UI render → GET after; one apiContext/file dispose; storageState shared no duplicate logins; hybrid cuts runtime enterprise E2E.
Auth once setup project reuse dependencies: UI/API/multi-role/worker accounts; `.auth/` gitignore cookies/tokens; UI Mode rerun; minutes→seconds realistic.
Storage cookies/local/IndexedDB/WebAuthn JSON reusable newContext/request; global/file `test.use`/clear logged-out; save context/request; sessionStorage addInitScript manual; never commit expire regenerate.
Isolation fresh incognito per test no carry/order; no module state; fixtures/testId/outputPath unique; multi-ctx one test chat/admin-user; safe parallel/shard/retry.
Parallel files default; fullyParallel test-level balanced shard; describe parallel/serial dependent/lock resource shared; independent unique IDs; workers1 alpha else nondet speed.
Workers isolated OS processes own browser no comm; reuse restart failures pristine; `--workers`/CI2/1 disable; workerIndex/parallelIndex + scope worker unique DB/users.
Sharding `--shard=x/y` linear CI matrices; fullyParallel per-test else per-file keep small even; blob per shard + merge-reports html; tag multi-env; Actions matrix + merge needs.
Retries failed independent fresh workers flaky-if-pass vs failed-exhausted; `--retries`/retries/describe + testInfo.retry reset caches; serial together; trace/video on-first-retry stability but fix root.
Timeouts layered test30/expect5/action/nav/fixture/global; timeout/expect.timeout/globalTimeout/use action/navigation; setTimeout/slow 3x/per-assert/testInfo hooks; expect slow raise actions tight fail-fast.
Triage: trace/video bloat → on-first-retry; cross-talk → fresh ctx + unique IDs; queue pile → workers/shards. Anti: `trace:on` everywhere, shared mutable, order deps.

## 19.43-19.57 Config/POM/Debug — Refined
Config central testDir/timeouts/retries/workers/reporters/use/projects/webServer; defineConfig/devices/forbidOnly CI/trace on-first-retry/baseURL portability; Chromium/FF/WebKit cross + shard artifacts; top vs use projects vs sharding.
Env dotenv/process.env/use.baseURL validation + CI secrets; never commit .env + example; globalSetup once fail-fast missing + CLI pipelines.
Data isolated parallel JSON/faker/API seed/cleanup fixtures not shared static; workerIndex unique delete teardown; staging/light/trace naming; no prod hardcode/order deps.
Dynamic `for...of` JSON/CSV/arrays distinct titles + describe parallel + per-case fixtures isolation; small deterministic unique reporting; option fixtures/test.use roles/locales.
POM TS typed classes Page + Locator fields async actions; getByRole/Text/TestId resilient not CSS/XPath; tests instantiate assert readable maintenance centralized.
Components reusable fragments headers/dialogs/tables/carts Page/parent Locator scoping chaining/filter no dup; compose inside pages modular; design-system/micro-frontend independent; composition vs inherit.
Fixtures+POM `base.extend` inject pages/data/auth on-demand auto setup/teardown use; replaces beforeEach login worker accounts/option/mergeTests/global auto; declare needed isolated.
Interfaces/types users/products/payloads/fixture/options/config autocomplete safety; readonly/unions/optional/generics/MyFixtures/MyOptions extend; centralize types/factories.
Safety strict/noImplicitAny + `tsc --noEmit` + no-floating-promises missing await/signatures/nullable early; type Page/Locator/APIRequest/fixture generics no any/casts; web-first typed helpers.
Structure tests/pages/components/fixtures/data/utils/types/config ownership parallel; selectors POMs seeding factories secrets .env setup global-setup; feature folders large + mergeTests base.
Snippets navigation/login/API seed/mock/download/soft asserts utils/ explicit returns + codegen/VSCode resilient Role; version lint prod.
Debug VSCode breakpoints/highlight/Pick/`--debug` Inspector/pause/headed slowMo/PWDEBUG console; CI Trace/HTML/shots/videos/DEBUG pw:api no guessing; trace on-first-retry insight/perf.
Vs Sel: Playwright auto/web-first/Context isolation/parallel/trace/codegen/mock/TS native faster reliable SPA; Sel explicit waits/grids/external; legacy lang/grid adoption.
Qs config/fixtures/POM/locators/waits/workers/shard/retries/auth/API/report/CI; user behavior/isolation/tooling rationale + concise TS; STAR flake/coverage/defect structured measurable.
Anti waitForTimeout/brittle XPath-CSS/isVisible manual/shared mutable/order deps/third parties/overgrown POM/hardcoded sleeps-data/trace:on everywhere; auto/web-first/isolated fixtures/API seed/components/selective trace; lint/review.

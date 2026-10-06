# SECTION 29 — FLAKY TEST MANAGEMENT (Refined)

## Topics Covered

- 29.1-29.15 (15 headers)

*First pass — 2 parallel batch subagents (websearch 401 fallback webfetch docs)*

---

## 29.1 What Is a Flaky Test — Refined
Theory: A flaky test is non-deterministic: it both passes and fails on identical code without changes to test or application logic. It erodes CI trust because one result cannot prove correctness or regression — hiding real bugs and wasting triage time. Research finds ~59% of developers hit flakiness monthly or more. Detection requires repeat runs and history comparison, not a single retry (a single pass proves nothing; 50 stable runs prove stability).
Enterprise Relevance: Flaky tests are a delivery tax: every flake costs triage time + erodes gate trust until teams ship red. Flake rate (<1-2% healthy, >5% quarantine) is a release metric alongside pass rate.
```bash
npx playwright test --repeat-each=50 --retries=0  # stable (50/50) vs flaky (47/50)
# flake rate = (failed-then-passed / total) × 100
```
High-Stakes Scenario: Suite 85% pass with 12% flake — reported as "85% pass" (looks like product quality issue) when real product pass is 97%. Triage: split passed / flaky / failed reporting; flake-rate dashboard; quarantine >5%; fix in cause-priority order.
Anti-Patterns: Single rerun as verdict; lumping flaky with failed (hides product signal); no flake tracking; "flaky test" label without ticket/owner.
Qs: How do you prove stable vs flaky? Why is flake rate a release metric?

## 29.2 Causes of Flakiness — Refined
Theory: Luo et al.'s landmark 201-commit Apache study defines ten root causes: async-wait, concurrency, order-dependency, resource leak, network, time, I/O, randomness, floating-point, unordered collections. Later work adds platform dependency, timeouts, too-restrictive ranges. They cluster into intra-test (within one test: async, time, randomness), inter-test (between tests: order, shared state, leaks), and external (env, network, platform) families. Async-wait dominates at 37-78% in most datasets, with concurrency and order-dependency next.
Enterprise Relevance: Cause taxonomy directs fixes: async → waits; concurrency/order → isolation; external → quarantine/mocks. Without classification, teams apply wrong fixes (retries for order bugs).
```js
// cause family determines fix family:
// intra-test (async/time/random) → waits/clocks/seeds
// inter-test (order/shared/leak) → isolation/cleanup
// external (network/platform) → mocks/quarantine/contracts
```
High-Stakes Scenario: "Flaky" bucket of 50 with mixed causes — team retries all (helps async, hides order bugs, wastes on external). Triage: classify each (repeat-alone vs shuffled vs network pattern), route to fix family, track cause distribution over quarters.
Anti-Patterns: Single "flaky" label (no cause); retries for all causes; fixing tests for platform bugs (vs pinning env).
Qs: Three cause families + example each? Which cause dominates and what fixes it?

## 29.3 Timing Issues — Refined
Theory: The leading flake cause: asserting before async work completes. Fixed sleeps assume an operation finishes in N ms — passing locally, failing under CI load, animations, API latency, eventual consistency. Playwright auto-waits for actionability but cannot know post-click business effects (order status update, search index). Fix: wait on deterministic state, not time — web-first assertions, `waitForResponse`, `expect().toPass()`.
Enterprise Relevance: Timing flakes are environment-amplified (fast laptop vs loaded CI agent) — the classic "works locally". State-based waits eliminate the entire class.
```js
// flaky: await page.waitForTimeout(2000);
// stable:
await expect(page.getByRole('row')).toBeVisible();
await page.waitForResponse(r => r.url().includes('/api/orders') && r.ok());
```
Triage: sleep-removal lint; trace timeline (action → gap → assert too early); state signal identification per flow. Anti: sleeps, `waitForLoadState` for business state, arbitrary timeout raises. Qs: Why can't auto-wait cover business effects? State vs time synchronization?

## 29.4 Shared State — Refined
Theory: Shared state creates order-dependent tests: Test B passes only if Test A left the right DB row, file, cookie, or global behind. Symptoms: passes alone (`--testNamePattern='^X$'`), fails in full suite or shuffled order. Resource leaks and missing cleanup are common variants. Fix: isolation — fresh fixtures in `beforeEach`, explicit teardown, unique accounts, never rely on execution order.
Enterprise Relevance: Order-dependence makes suites unshardable, unparallelizable, and unretryable. Shuffled-order CI job catches new dependencies automatically.
```js
test.beforeEach(async ({ request }) => { user = await createTestUser(); });
test.afterEach(async () => { await deleteTestUser(user.id); });
// never: test B reads test A's leftover row
```
Triage: alone-pass/suite-fail differential → shared-state hunt (DB/files/cookies/globals); shuffled-order reproduction; ownership fix per test. Anti: cross-test data reuse, missing teardown, order-assumed suites. Qs: How do you prove order dependence? What setup/teardown contract prevents it?

## 29.5 Unstable Test Data — Refined
Theory: Unstable data = tests reading mutable, time-sensitive, or shared datasets: "latest record", `today()`, leftover rows, environment-specific seeds. Result varies by order, date, timezone, locale (midnight UTC rollover, leap-day failures). Retries only reshuffle luck. Fix: own data (fresh records per test), freeze clocks (`clock.install`), pin `TZ=UTC`, avoid `SELECT` without `ORDER BY`, explicit disposal.
Enterprise Relevance: Date/timezone flakes are calendar-driven (month-end, DST, leap day) — invisible most days, red on specific dates. Clock control + UTC pinning eliminates the class.
```js
await page.clock.install({ time: new Date('2026-01-15T12:00:00Z') }); // frozen
// + TZ=UTC in CI + ORDER BY in queries + owned rows per test
```
Triage: fails on specific dates/times → clock/tz; order-varying → shared/leftover data; locale CI runners → locale pinning. Anti: `today()`/`now()` in assertions, latest-row queries, shared datasets. Qs: How do you test time-dependent logic deterministically?

## 29.6 Randomness — Refined
Theory: Unseeded randomness generates values the test doesn't handle: Faker strings overflowing layout, random IDs colliding, ML nondeterminism falling outside too-restrictive assertion ranges. Failures vanish on retry because the combination is gone. Fix: control entropy — seed RNGs, persist seed in CI logs (reproducible failure), property-based ranges with `approx` matchers, treat reproducible random failure as real edge-case bug (it found something).
Enterprise Relevance: Seeded randomness gives coverage breadth + reproducibility — the best of both. Unseeded randomness gives breadth with mystery failures.
```js
import { faker } from '@faker-js/faker'; faker.seed(42); // logged per run
// assert ranges, not exact: expect(width).toBeLessThanOrEqual(MAX);
```
Triage: different value each failure → randomness; fix seed to reproduce, then widen assertion or constrain generator. Anti: unseeded Faker in CI, exact asserts on random data, ignoring seed in logs. Qs: How do you keep random coverage but deterministic repro?

## 29.7 External Dependencies — Refined
Theory: Tests calling live APIs, third-party services, message brokers, or real networks inherit their uptime, latency, rate limits, and bandwidth. Signals: `ETIMEDOUT`, `ECONNRESET`, failures clustered on tests hitting one URL or after sibling-service deploy. Fix: stub at the boundary for unit/component tests (`page.route()`, MSW); reserve one quarantined contract test for the real integration (drift detection without blocking).
Enterprise Relevance: Third-party dependence makes your pipeline availability the product of all dependencies' availability (99% × 99% × 99% = 97%). Stub-by-default contains blast radius.
```js
await page.route('**/api/**', r => r.fulfill({ json: fixture })); // hermetic
// + 1 nightly contract test against live sandbox (quarantined on sandbox outage)
```
Triage: clustered URL/outage-correlated → external; stub-mismatch vs real outage (Sec 28.12); sandbox status check in setup. Anti: live third-party in PR suites; no contract test (drift undetected); no quarantine (sandbox outage blocks all). Qs: Stub vs contract test — what does each prove?

## 29.8 Parallelism — Refined
Theory: Tests pass with `-j 1` but fail as workers increase: two workers write the same DB row, file path, port, or rate-limited account → duplicate-key, `EADDRINUSE`, race errors. Thread-scheduling and event races appear only at certain speeds. Fix: namespace resources per worker (`workerIndex` schemas, unique users/ports), or serialize unavoidable shared access; verify at maximum concurrency (not just 2 workers).
Enterprise Relevance: Parallelism flakes are isolation bugs wearing a concurrency mask — the fix is namespacing (Sec 22-23), not fewer workers (surrendering speed).
```js
const schema = `test_${test.info().parallelIndex}`; // per-worker namespace
// + unique users/ports per worker; lock for unavoidable shared (Sec 22.3)
```
Triage: `-j1` green / `-j4` red → parallelism class; group by error (duplicate-key = data, EADDRINUSE = ports, 429 = rate limit); max-concurrency verification. Anti: reducing workers as "fix" (hides bug, loses speed); shared resources under parallel. Qs: How do you prove parallelism (not timing) is the cause?

## 29.9 Environment Instability — Refined
Theory: Environment instability = flakiness from outside test logic: overloaded CI agents, CPU throttling, parallel workers competing for resources, ephemeral staging data, third-party APIs, CDN latency, browser version drift, shared DB state. Symptoms: timeouts and random 500s across unrelated specs (no single test pattern). Mitigate: pin browsers, containerize CI, isolate test data per worker, mock third-party calls (`page.route()`), Linux + sharding for consistency.
Enterprise Relevance: Environment flakes are infrastructure bugs charged to QA credibility. Separating env failures (infra dashboard) from test failures (quality dashboard) protects both teams' metrics.
```ts
await page.route('**/api/third-party/**', r => r.fulfill({ status: 200, body: JSON.stringify(mock) }));
// + pinned browsers (playwright install --with-deps + version lock)
// + per-worker data isolation (no shared staging rows)
```
Triage: unrelated-specs failing together → env (check agent CPU, staging deploy window, third-party status); pin + containerize + isolate; env-health pre-flight (fail fast with "env down", not 100 test failures).
Anti: debugging tests for env outages; unpinned browsers (auto-update breaks weekly); shared staging data; live third-party in PR suites. Qs: Env vs test failure — what pattern distinguishes?

## 29.10 Detecting Flakiness — Refined
Theory: Detect flakiness by rerunning suspects repeatedly, not by single pass. Playwright's `retries` categorization: `passed` (first-try), `flaky` (failed-then-passed), `failed` (always-failed). Enable HTML reporter + trace on first retry, track history in CI dashboards, use `testInfo.retry` to log retry-only state, run `--repeat-each=10` or nightly stability builds to surface order-dependent and timing-dependent failures before they block merges.
Enterprise Relevance: Detection pipeline (repeat + categorize + dashboard) turns anecdotes ("I think it's flaky") into data (flake rate 8%, rising). Every quarantined test must have detection evidence attached.
```ts
// playwright.config.ts — detection config:
export default defineConfig({ retries: 2, reporter: [['html'], ['list']] });
// stability job: --repeat-each=10 nightly; dashboard tracks flaky-rate trend
```
Triage: suspect → repeat 10x isolated → categorize (pass/flaky/fail) → trace on flaky runs → root-cause family (29.2) → fix or quarantine with evidence. Anti: single rerun verdicts, no history (same test "fixed" 5 times), retries without categorization. Qs: passed vs flaky vs failed — what does each prove?

## 29.11 Measuring Flake Rate — Refined
Theory: Flake rate quantifies instability: `flakeRate = flakyRuns / totalRuns × 100` per test over rolling window (50-100 runs). Track pass-on-retry %, mean-time-to-flake, per-branch vs main variance. Healthy suite: <1-2%; >5% = quarantine. Export reporter JSON to Datadog/Grafana, alert on new flaky tests, prioritize fixes by failure frequency × pipeline blocking time × rerun compute cost.
Enterprise Relevance: Flake rate is the quality metric that justifies flake-fixing sprints to management ("8% flake = 12 dev-hours/week triage + 2 delayed releases/quarter"). Trend it quarterly; celebrate drops.
```ts
// flakeRate = (failedThenPassed / totalExecutions) * 100
if (flakeRate > 5) quarantine(testId);       // auto-ticket + owner + SLA
if (isNewFlaky(testId)) alert('#qa-flake');   // new flakes page immediately
```
Triage: top-flake list by (rate × blocking impact); fix top-5 monthly; new-flake gate on PRs (no new flakes without ticket). Anti: suite-average flake (hides worst tests); no rolling window (stale numbers); measuring without acting. Qs: How do you prioritize 50 flaky tests? What gates new flakes?

## 29.12 Retry Strategy — Refined
Theory: Use retries as diagnostic buffer, not fix. Standard: `retries: 2` on CI, `0` locally (expose bugs fast). Playwright discards worker + browser on failure and retries in fresh worker with `beforeAll` rerun. Use `test.describe.configure({ retries: 2 })` for known-unstable suites, `testInfo.retry` to reset server state, never infinite retries or long `actionTimeout` inflation (hides deadlocks, inflates CI time).
Enterprise Relevance: Retry policy is declared in config and visible to all — not tribal knowledge. `testInfo.retry` awareness in fixtures (reset server caches on retry) prevents retry-inherited corruption.
```ts
export default defineConfig({ retries: process.env.CI ? 2 : 0 });
test('t', async ({ page }, testInfo) => { if (testInfo.retry) await cleanCaches(); });
test.describe.configure({ retries: 2, mode: 'serial' });
```
Triage: retry-success pattern = flaky (ticket); retry-fail = real (block); no-retry-needed streak = candidate to reduce retries. Anti: infinite retries, long actionTimeout instead of fix, retries locally, no state reset between attempts. Qs: What does testInfo.retry enable? When do retries hide deadlocks?

## 29.13 Quarantine Strategy — Refined
Theory: Quarantine isolates persistently flaky tests so main pipeline stays green while fix is owned. Mark with `test.fixme()`, `test.skip()`, or `test.describe.configure({ retries })` in separate `quarantine` project excluded from merge gates but run nightly. Auto-file Jira with trace + owner + SLA (7-14 days); require root-cause before reinstating; monitor quarantine size — if >5% of suite, freeze features and hold flakiness hackathon.
Enterprise Relevance: Quarantine is honesty infrastructure: red main helps nobody, deleted tests lose coverage, quarantine preserves both signal (nightly) and velocity (green main). Size and age of quarantine are quality KPIs.
```ts
test.fixme('FLAKE-123 quarantined: payment webhook race', async ({ page }) => { /* runs nightly, not on merge */ });
// quarantine project: testMatch: '**/*.quarantine.spec.ts', retries: 2, scheduled nightly
```
Triage: quarantine entry requires ticket + owner + SLA + nightly signal; reinstatement requires root-cause + 10 green runs; >5% triggers feature freeze + hackathon. Anti: quarantine without ticket (forgotten), no SLA (permanent), merge-gate inclusion (blocks all), silent deletion. Qs: Quarantine vs skip vs delete? What triggers a flakiness freeze?

## 29.14 Root Cause Fix — Refined
Theory: Fix root cause by replacing sleeps and brittle selectors with deterministic waits: `getByRole()` locators with auto-waiting (visible/stable/enabled/receives-events checks), web-first assertions (`await expect(loc).toBeVisible()`), isolated `browserContext` per test, seeded DB fixtures, `clock` mocking, `page.waitForResponse()` for network. Reproduce with trace viewer, then assert state rather than timing; never `waitForTimeout()` or `force: true` clicks (both mask the real condition).
Enterprise Relevance: Root-cause fixes compound (each eliminates a flake family); workarounds compound debt (each adds maintenance + hides signal). Fix-rate per sprint is a quality KPI.
```ts
await expect(page.getByText('welcome')).toBeVisible(); // auto-retries to stability
// avoid:
expect(await page.getByText('x').isVisible()).toBe(true); // snapshot, no retry — flaky
await page.getByRole('button').click({ force: true });      // bypasses actionability — masks overlays
```
Triage: trace filmstrip (what changed between pass/fail runs?) → cause family (29.2) → deterministic fix → repeat-20 verification → remove retry/quarantine. Anti: waitForTimeout, force clicks, sync sleep helpers, "fixed" without repeat verification. Qs: How do you verify a fix (not just hope)? Why are force clicks dangerous?

## 29.15 Flaky Test Interview Scenarios — Refined
Deloitte SDET interviews probe process, not just fixes: "Suite passes locally but fails on Jenkins — what do you do?" Answer: check resource contention (CPU/throttle), rerun with trace, diff env versions, isolate data. "Client demands zero retries?" Explain cost vs signal (zero retries = honest but red main; 2 retries + quarantine = green main + tracked debt). "How to convince dev it's app race not test bug?" Show trace timeline + minimal repro + `testInfo.retry` logs (deterministic pattern, not test noise). Always mention: measure flake rate, quarantine with ticket, fix waits/locators, add regression guard.
```ts
test('order-dependent repro', async ({ page }, testInfo) => {
  console.log(`attempt ${testInfo.retry}`); // prove pattern: fails 1st, passes 2nd — then fix cause
});
```
Answer template: classify (timing/order/env/product) → evidence (trace/repeat/data) → contain (quarantine) → fix (deterministic) → guard (regression + gate). Metrics: flake rate before/after, triage time saved.
Anti: "add sleep/retry and move on"; blaming devs without evidence; no metrics. Qs: Walk me through your last flaky test end-to-end?

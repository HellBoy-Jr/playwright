# SECTION 32 — SYSTEM DESIGN FOR SDET (Refined)

## Topics Covered

- 32.1-32.14 (14 headers)

*First pass — 2 parallel batch subagents*

---

## 32.1 Design a Scalable Automation Framework — Refined
Theory: Design layered, modular framework separating tests, page objects, core utilities, config, data, reporting — for growth to 1000+ tests. Apply POM or Screenplay pattern with reusable components and DRY utilities. Externalize config via YAML/env with factory for driver/API clients and ThreadLocal safety. Enforce coding standards, code review, versioning, dependency management (Maven/Gradle/npm). Plan for parallel, cross-browser, CI, observability from day one — not retrofit (retrofit costs 3x).
Enterprise Relevance: Scalability is designed, not added. Day-one decisions (layering, ThreadLocal, config externalization, CI-ready reporting) determine whether 100 tests scale to 5000 or collapse at 300.
```text
Layers: tests → pages/components → core (driver/waits/config) → data → reporting
Rules: downward-only deps; ThreadLocal drivers; env config; JUnit/Allure out of box
Day-one checklist: parallel run green + sharded CI + flake dashboard + onboarding <1 day
```
Triage: 300-test collapse (god classes, static drivers, hardcoded env) → re-layer (strangler: new tests in new structure, migrate hot spots). Anti: monolith test classes; retrofit parallelism (redesign instead); no standards/versioning. Qs: What day-one decisions determine scalability? How do you rescue a collapsed framework?

## 32.2 Design a Multi-Browser Test Platform — Refined
Theory: Design abstraction over Chromium, Firefox, WebKit with browser factory, capabilities, centralized driver lifecycle. Use Selenium Grid 4, Playwright Test, or cloud (BrowserStack/SauceLabs) for OS-browser matrix. Parameterize browser, viewport, headless, version via config/TestNG XML/CLI tags. Isolate browser state per test (fresh context, cookies cleanup, auto-waiting locators). Add retry for flaky launches, video/trace on failure, capability-based skips (feature X only on Chrome → skip elsewhere with reason).
Enterprise Relevance: Clients use all browsers; matrix coverage is contractual for many Deloitte engagements. Factory + config matrix makes new browser = 1 config line.
```java
// TestNG matrix: mvn test -Dbrowser=firefox -Dheadless=true
// Playwright: --project=chromium/firefox/webkit (config projects)
```
Triage: matrix explosion (3×3×2=18 jobs) → tier (Chromium PR, full matrix nightly); browser-only failures → per-engine quarantine (not suite ignore). Anti: Chromium-only development; hardcoded browser; no capability skips (false failures). Qs: How do you bound matrix cost while keeping coverage?

## 32.3 Design Parallel Test Execution — Refined
Theory: Design for thread-safe parallel execution at method/class/shard level to cut feedback from hours to minutes. Use TestNG parallel, JUnit 5, Playwright workers, pytest-xdist with independent atomic tests. Store driver, context, test data in ThreadLocal; avoid static shared state. Shard by file/tag/historical duration for balanced distribution across containers. Aggregate reports safely; quarantine flaky; enforce idempotency with isolated test data.
Enterprise Relevance: Parallel design is a system property (isolation + ThreadLocal + sharding + aggregation), not a flag. Design review checklist: independence? ThreadLocal? shard balance? report merge? quarantine?
```xml
<suite parallel="methods" thread-count="4"> <!-- threads ≤ Grid slots -->
```
```bash
npx playwright test --shard=1/4 --workers=4  # shards × workers = total parallelism
```
Triage: parallel-only failures → isolation audit (Sec 22); unbalanced shards → duration-based split; unmerged reports → blob merge job. Anti: `parallel` flag on shared-state suite; static driver; file-count sharding. Qs: What are the 4 parallel design pillars? How do you verify each?

## 32.4 Design Test Data Service — Refined
Theory: Design centralized test-data service decoupling tests from hardcoded data with on-demand creation + teardown. Strategies: seeded DB, API factories, Faker synthetic data, masked production clones. Expose REST/helper APIs (`createUser()` returning JSON) backed by pools + reservation (checkout/return). Ensure isolation via unique emails/IDs, transactional rollback, parallel-safe cleanup hooks. Version datasets; audit PII/GDPR compliance; support data-driven CSV/JSON/Excel providers.
Enterprise Relevance: Data service turns data from per-test burden into shared infrastructure with SLAs (creation latency, isolation guarantees, cleanup). Pools (pre-created users) cut setup time for heavy entities.
```java
// service API: POST /test-data/users → {id, email} (reserved, auto-cleanup on TTL)
User u = dataService.createUser("admin"); // unique, isolated, tracked
// pool variant: dataService.checkout("premium-account") → use → release
```
Triage: setup slowness → pools for heavy entities; leakage → reservation/TTL + sweeper; PII risk → synthetic/masked only. Anti: per-test inline creation of heavy entities (slow); unreserved pools (collisions); prod clones unmasked. Qs: Pool vs on-demand creation? How do you guarantee cleanup?

## 32.5 Design Test Reporting System — Refined
Theory: Design real-time, actionable reporting linking results to requirements, defects, and CI builds for triage. Use Allure, ExtentReports, or ReportPortal with steps, screenshots, video, logs, history trends. Classify failures: assertion (product) vs environment vs flaky — with auto-retries and quarantine dashboards. Push metrics to ELK/Grafana: pass rate, MTTR, duration, flakiness, coverage by suite. Integrate with Jira, TestRail, Slack/Teams alerts; retain artifacts by retention policy.
Enterprise Relevance: Reporting is how quality becomes visible to non-technical stakeholders. Failure taxonomy (product/env/flaky) prevents every red build from becoming a war room.
```text
Dashboard: pass 96% (product-fail 2%, env 1%, flaky 1%) | MTTR 3h | p95 duration 22min | flake trend ↓
Alert: new product-failure → Slack #qa + Jira auto-file with trace; env failures → infra channel
```
Triage: unactionable red (no taxonomy) → classify; history missing → persist Allure history; alert fatigue → alert on new-product-failures only. Anti: pass/fail only; no history; screenshots without context; infinite retention. Qs: What taxonomy makes red builds actionable? What metrics prove quality trend?

## 32.6 Design CI Test Orchestration — Refined
Theory: Design pipeline orchestration triggering smoke, regression, and nightly suites on code, schedule, or tag. Model Jenkins, GitHub Actions, GitLab CI, Azure DevOps stages: build → test shards → report → gate. Containerize with Docker, cache dependencies, parallelize matrix jobs, fail-fast quality gates. Manage secrets, environments, ephemeral test envs via IaC and promotion pipelines. Publish JUnit XML, block merges on thresholds, auto-file bugs with logs.
Enterprise Relevance: Orchestration turns suites into gates (blocking) vs signals (informational). Every suite needs: trigger (when), gate status (blocking?), owner, SLA. Unowned nightly suites rot red-ignored.
```yaml
# orchestration map:
# PR → smoke (blocking, 8min) → merge
# merge → selective regression (blocking, 30min) → staging
# nightly → full + contract + perf-smoke (informational + quarantine) → dashboard
# tag → pre-release risk slice (blocking release)
```
Triage: gate confusion (is nightly blocking?) → gate matrix documented; orphan suites (no owner) → ownership audit quarterly. Anti: everything blocking (gridlock) or nothing blocking (gates ignored); cron without triage rotation. Qs: Which suites block which transitions? Who owns each?

## 32.7 Design API Automation Framework — Refined
Theory: Design layered API framework separating specs, clients, models, validators, and tests — for contract and integration coverage. Use RestAssured, Playwright APIRequest, SuperTest, or Karate with centralized request builder + auth handling. Model POJOs with Jackson/Pydantic; validate status, schema JSON, business rules. Externalize baseURL/env; support OAuth2/API keys, logging, retries, chaining IDs. Add contract tests (Pact), mock with WireMock, run in CI parallel to UI.
Enterprise Relevance: API framework is the highest-ROI test layer (fast, stable, precise). Layering (specs → clients → models → validators → tests) mirrors UI's POM discipline for APIs.
```java
// layers: spec (auth/base) → client (UserClient.create) → model (User POJO) → validator (schema + rules) → test (orchestrate + assert)
given().spec(ApiSpecs.authedSpec()).body(user).when().post("/users")
  .then().statusCode(201).body(matchesJsonSchemaInClasspath("user.json"));
```
Triage: contract drift → schema + Pact per endpoint; auth sprawl → TokenManager; suite slowness → parallel + WireMock third-party. Anti: inline RestAssured soup (no layers); no contract tests; Map payloads. Qs: What are the API framework layers? How do contract tests fit?

## 32.8 Design UI + API + DB Validation — Refined
Theory: Design layered validation so UI proves UX, API proves contract, DB proves persistence. Avoid UI-only end-to-end for everything. Pattern: create test data via API/factory with `UUID`/worker prefix → drive action in UI → assert API response then DB row. Keep layers decoupled: Page Objects never query DB; API clients never assert DOM. Use test-scoped fixtures with explicit teardown or transactional rollback per worker namespace. Handle eventual consistency with polling/explicit waits, not `sleep`. Deloitte lens: map requirement → UI check → API schema → DB assertion for audit traceability.
Enterprise Relevance: Layered validation localizes failures (UI fail + API pass = render bug; API fail = backend bug; DB mismatch = persistence bug) — triage in minutes, not hours.
```java
UUID id = api.createOrder(...);       // API setup
ui.checkout(id);                       // UI action
assertEquals(api.getOrder(id).status(), "PAID");  // API verify
assertEquals(db.queryStatus(id), "PAID");         // DB verify
```
Triage: layer-skipping (UI-only asserting backend logic — slow/flaky) → push down; coupled layers (Page queries DB) → decouple. Anti: UI-only E2E for API-testable logic; cross-layer imports; sleep for eventual consistency. Qs: What does each layer prove? How do you trace a requirement through layers?

## 32.9 Design for 10,000+ Tests — Refined
Theory: Design for sub-linear runtime: isolation first, then parallelism, then selection. Naive scale compounds interference faster than count. Enforce stateless, independent tests; unique users, tenants, files, queues per test/worker. Parallelize incrementally: workers on one machine → `--shard`/matrix across CI agents → dynamic timing-based balancing. Cut setup tax: reuse auth via storageState, worker-scoped clients, API seeding (not UI logins). Tier execution: `@smoke` on PR, full regression nightly; tag by risk/domain. Monitor shard balance, CPU/memory, queue time; review worker count quarterly.
Enterprise Relevance: 10k design is organizational (data architecture + tiering + selection), not just technical. Google/Doctolib/QALadder cases (Sec 22.17) prove the sequence: isolate → bin-pack → scale.
```bash
# tier: PR smoke (200 tests, 8min) → merge selective (2000, 30min) → nightly full (10000, 2h sharded 42x)
npx playwright test --shard=$I/$N --project=chromium
```
Triage: interference at scale → data architecture first (not more shards); slowest-shard dominance → duration balancing; setup tax → storageState + API seeding. Anti: scaling shared-state suites; file-count sharding; unowned runtime growth. Qs: What are the scaling stages in order? How do tiers keep PR fast at 10k?

## 32.10 Failure Isolation — Refined
Theory: Isolate failures so one break never cascades and retries never mask bugs. Treat flakiness as architecture signal (not bad luck). Guarantee clean state per attempt: fresh browser context, rebuilt fixtures; discard failed-attempt data. Conditional retries only for transient infra faults; mark pass-on-retry as `flaky` (fail build on flaky if strict). Quarantine known-flakes to non-blocking job with owner, ticket, SLA; keep running for signal. Prefer `serial` only for intentionally coupled flows; otherwise isolate. Root-cause with DB sanity checks, order-shuffle reruns, history-based flake rate `(failures + flakyPasses) / runs`.
Enterprise Relevance: Isolation design decides whether 1 failure = 1 ticket or 1 failure = 50 cascading reds + lost day. Clean-state-per-attempt is the mechanism; flake-rate metric is the proof.
```text
Per-attempt: fresh context + rebuilt fixtures + discard failed data
Retry rule: transient-infra only; pass-on-retry → flaky bucket (strict: fail build)
Quarantine: owner + ticket + SLA + nightly signal; serial only for coupled flows
```
Triage: cascading failures → shared state between attempts (not cleaned); masked bugs → retries without classification. Anti: retries for deterministic failures; shared fixtures across attempts; serial-by-default. Qs: How do you stop one failure from cascading? When is `serial` justified?

## 32.11 Observability — Refined
Theory: Make every failure explainable without blind rerun. Evidence is a first-class layer, not console logs. Capture per-test: steps, screenshots on failure, video/trace, console/network logs, correlation IDs, seed data IDs. Publish JUnit/Allure/ReportPortal dashboards with pass/flaky/quarantined buckets; trend P95 duration and flake rate. Propagate `testId/workerIndex` into API headers and DB audit fields for end-to-end tracing. Merge sharded reports in CI with explicit merge job; retain artifacts with TTL. Alert on thresholds: failure spike, slowest-shard drift, quarantine bucket >1% (severity-weighted).
Enterprise Relevance: Observability turns triage from archaeology ("rerun and hope") into reading ("trace shows payment 500 at step 7"). Correlation IDs across test→API→DB→logs make distributed failures traceable.
```text
Per-test evidence: steps + shot/video/trace + console/network + corrID + seed IDs
Dashboards: pass/flaky/quarantined + P95/flake trends + slowest-shard
Alerts: failure spike | slowest drift | quarantine >1% weighted
```
Triage: untriagable failure → missing evidence class (add it globally, not per test); cross-service mystery → corrID propagation gap. Anti: console-only evidence; no correlation IDs; unmerged sharded reports; infinite retention. Qs: What evidence answers what failure class? How do you trace across test→API→DB?

## 32.12 Scalability Trade-Offs — Refined
Theory: Every scale choice trades speed for cost, complexity, or realism. Benchmark bottleneck before buying infrastructure. Workers vs shards: workers scale to CPU/RAM ceiling; shards scale past one machine but need orchestration + report merging. Self-hosted Grid/K8s vs cloud: self-hosted wins for predictable high volume; cloud wins for burst matrix + device breadth. UI vs API shift: moving 1500 browser checks to API cuts cost more than 40 extra workers; preserve UI for critical paths. Balance Amdahl overhead: global setup, slowest test, reporting caps max speedup — reduce serial fraction first. Watch contention: DB locks, rate limits, shared accounts bound useful concurrency.
Enterprise Relevance: Trade-off analysis is what separates architecture from shopping ("we need 100 workers" vs "our bottleneck is DB pool at 8 workers; API-shift saves $X"). Every scale proposal needs bottleneck evidence + cost math.
```text
Decision matrix: bottleneck? → cheapest fix first (index > cache > API-shift > workers > shards > infra)
Workers ≤ cores/RAM; shards past one machine; cloud for burst/matrix; self-hosted for steady volume
UI→API shift: 1500 checks × 30s → 1500 × 200ms = 12.5h saved daily
```
Triage: scale spend without speedup → wrong bottleneck (measure first); cloud bill shock → steady-vs-burst analysis. Anti: scaling before profiling; workers past contention ceiling; ignoring serial fraction. Qs: How do you choose workers vs shards vs API-shift? What proves the real bottleneck?

## 32.13 Security Considerations — Refined
Theory: Treat test framework as production code with secrets, PII, and network access. Never trade debuggability for exposure. Externalize config: `BASE_URL`, credentials in vault/CI secrets; never hardcode or commit traces with tokens. Mask PII in logs/videos; use synthetic/HIPAA-safe staging data, worker-scoped accounts with least privilege. Isolate execution: ephemeral containers, separate test tenants, no prod DB writes; sanitize cleanup. Secure grids: authenticated endpoints, TLS, short-lived tokens, allowlisted mocks for payments/email. Scan test dependencies, pin browser/driver versions, rotate seeded secrets; audit who can quarantine/gate merges.
Enterprise Relevance: Test infrastructure is an attractive attack surface (broad access, weaker controls, secrets everywhere). Least-privilege + ephemeral + audited is the bar — same as production, scoped to testing.
```text
Secrets: vault/CI only, short-lived, masked, rotated; never in code/logs/traces/videos
Data: synthetic/masked staging, least-privilege worker accounts, tenant isolation, no prod writes
Infra: ephemeral containers, TLS grids, allowlisted mocks, pinned deps, quarantine/gate audit
```
Triage: secret in repo → rotate + purge + gate (Gitleaks); PII in staging → masking pipeline; prod write from tests → guard rails (read-only tags + approval). Anti: hardcoded secrets; prod data in tests; permanent Grid tokens; unauthenticated Grid endpoints. Qs: How is test infra secured like prod? What breaks if test secrets leak?

## 32.14 Senior-Level Architecture Questions — Refined
Answer as system design with principles, metrics, and business impact — not tool config. "Scale 100→10k?": isolation by construction, adaptive timing-based sharding, stateless workers, risk-based selection, cost-per-run dashboard. "UI/API/DB pyramid imbalance?": shift stable logic down, keep UI thin; measure escape vs false-positive rate per layer. "Flaky at scale?": quarantine SLA by severity/centrality/capacity, weighted cap, auto re-baseline timing weekly. "Grid vs Playwright native?": existing Java/legacy/iOS needs Grid; greenfield TypeScript/ephemeral CI favors workers+shards. Always cite Amdahl's Law, SLOs, and commit-to-prod time saved.
Enterprise Relevance: Architecture answers prove seniority: trade-offs with numbers, phased plans with gates, business impact (cost, velocity, risk) alongside technical design.
```text
Answer frame: principle → design → metrics → trade-off → phased plan → business impact
Example: "10k: isolate (per-worker data) → bin-pack (duration) → shard (42x) → tier (smoke/nightly); cost $X/run; PR 8min; flake <2%"
Always: Amdahl ceiling, SLOs, cost-per-run, commit-to-prod delta
```
Triage: tool-reciting answer → redirect to trade-offs/metrics; no numbers → ask for them; no phases → demand staged plan. Anti: single-tool dogma; no cost awareness; "automate everything" (no prioritization). Qs: Pick any two questions above and answer in 3 minutes with numbers?

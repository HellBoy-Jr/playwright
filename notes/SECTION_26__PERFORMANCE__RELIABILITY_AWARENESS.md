# SECTION 26 — PERFORMANCE / RELIABILITY AWARENESS (Refined)

## Topics Covered

- 26.1-26.13 (13 headers)

*First pass — 2 parallel batch subagents*

---

## 26.1 Performance Testing Fundamentals — Refined
Theory: Performance testing validates speed, stability, scalability, and resource usage under expected workload — finding and removing bottlenecks before release, not functional bugs. SDET scope covers load, stress, endurance, spike, volume, scalability types. Process: identify environment → define acceptance criteria (response time + throughput) → design realistic scenarios → configure prod-like env → execute → analyze → tune → retest. Interview focus: why prod-like data, baselines, early CI integration, clear stakeholder reporting on speed vs capacity risks.
Enterprise Relevance: Perf is a release gate for customer-facing flows, not an afterthought. Deloitte pattern: perf smoke on every merge (5min, tight SLA), full load nightly/weekly, results trended (not one-off numbers).
```text
Gate: assert p95 < 2000ms && errorRate < 1% (smoke); full: p95/p99 + throughput + saturation
```
High-Stakes Scenario: Launch day: 10x traffic, checkout p95 12s, timeouts cascade — never load-tested beyond 100 users. Triage: prod-like dataset (10M rows, not 1k), realistic journey mix (not single endpoint hammer), baseline established pre-launch, capacity headroom 2x proven.
Anti-Patterns: Perf testing only before launch (too late); toy datasets; single-endpoint hammering (misses journey bottlenecks); averages without percentiles; no baseline (numbers meaningless).
Qs: Load/stress/spike/endurance — which answers which risk? Why prod-like data?

## 26.2 Response Time — Refined
Theory: Response time = elapsed time from user request to first or full response, measured as average, median, p90/p95/p99, min/max. Averages hide tail latency — SDETs assert on percentiles against SLA (e.g., p95 under 2s for 1000 concurrent users). Factors: server processing, DB queries, network latency, rendering, queuing under load. Monitor via JMeter Aggregate Report, APM tools, browser timings. Define acceptable/heavy/peak thresholds precisely; test slow networks; correlate spikes with CPU, GC, or lock waits.
Enterprise Relevance: p95/p99 are the user-experience SLA; average is vanity. Averages pass while 5% of users (often paying/enterprise) suffer 10s loads.
```text
ResponseTime = TimeToFirstByte + ContentTransfer + Rendering
Gate: p50 < 500ms && p95 < 2000ms && p99 < 5000ms (per-endpoint, not global)
```
High-Stakes Scenario: Average 800ms green, p99 15s — checkout for users with large carts times out; support tickets spike. Triage: percentile assertions per endpoint, tail analysis (which queries/users are slow), slow-network profiles (3G), GC/lock correlation during spikes.
Anti-Patterns: Average-only assertions; global percentiles (hide slow endpoints); localhost timings as SLA; ignoring TTFB vs transfer vs render split.
Qs: Why do averages lie? What does p99 tell you that p50 cannot?

## 26.3 Throughput — Refined
Theory: Throughput = rate of processed requests/transactions/data per second (requests/sec, TPS, hits/sec, bytes/sec). Rises with load until saturation, then plateaus or drops as bottlenecks, errors, and queues grow. Validate throughput SLAs alongside response time and error rate (JMeter Summary Report, server counters). Key relations: throughput vs concurrent users, bandwidth, connection pooling, cache hit ratio. Report throughput at p95-SLA pass point, not just peak — peak with 20% errors is not capacity.
Enterprise Relevance: Throughput answers "how many users can we serve?" — the capacity-planning number. Launch decisions (marketing campaign, sale event) depend on proven throughput, not hopes.
```text
Throughput = CompletedRequests / TotalTime_sec
Gate: 500 RPS @ p95<2s, error<1% (not: 900 RPS @ p95 8s, error 15%)
```
High-Stakes Scenario: "Supports 1000 users" claimed from 1000 threads with 40% errors and 8s p95 — launch crashes. Triage: throughput at SLA (all three: RPS + latency + errors together), saturation point identified (plateau/drop inflection), headroom 2x for spikes.
Anti-Patterns: Peak RPS without latency/errors; throughput from tiny payloads extrapolated to large; cache-cold vs warm confusion; ignoring DB lock/thread saturation signals.
Qs: Why must throughput always pair with latency + errors? How do you find the saturation point?

## 26.4 Concurrency — Refined
Theory: Concurrency = number of simultaneous active users, threads, sessions, or connections exercising the system — simulated with virtual users plus think time. Differs from parallelism and TPS: same TPS can come from few fast or many slow users (Little's Law: TPS = users / response-time). Design mixes of concurrent scenarios with ramp-up, steady state, ramp-down; monitor max active sessions, thread counts, pooled connections, queue lengths. High concurrency exposes race conditions, deadlocks, session leaks, CPU context switching. Model realistic user journeys, not just API hammering.
Enterprise Relevance: Concurrency model determines whether load test resembles production. 500 threads hammering one endpoint ≠ 500 users browsing; the latter has think time, varied journeys, session state.
```text
ThreadGroup: users=500, rampUp=100s, loop=forever + think time 2-5s
# Little's Law check: 500 users / 2s avg response ≈ 250 TPS expected
```
High-Stakes Scenario: Load test with zero think time (500 threads, no pauses) melts staging — declared "fails at 500 users" though real 500 users (with think time) = 1/5th the load. Triage: think times from prod analytics, journey mix (70% browse/20% cart/10% checkout), ramp to find inflection honestly.
Anti-Patterns: No think time; single-endpoint hammer; instant 500-thread spike (no ramp — misses warm-up effects); concurrency confused with TPS.
Qs: Users vs TPS vs parallelism? Why is think time mandatory for realism?

## 26.5 Load vs Stress vs Spike — Refined
Theory: Load testing checks behavior under anticipated peak user load to find bottlenecks before go-live and validate SLAs. Stress testing pushes beyond capacity to breaking point to observe failure mode, error handling, and recovery (graceful degradation vs crash). Spike testing applies sudden sharp surges and drops to check auto-scaling, queuing, and graceful recovery. Endurance (soak: hours/days for leaks), volume (data size), scalability (capacity planning) complement them. Select type per risk question. Interview line: load = will it meet SLA, stress = where does it break, spike = will it survive flash sales.
Enterprise Relevance: Each type gates a different decision: load → launch approval; stress → capacity limits + runbooks; spike → autoscale config for sale events. Running only load leaves breaking-point and recovery unknown.
```text
load: 1x peak (1000 users) 1h → assert SLA
stress: ramp to 2x until break → record breaking point + recovery
spike: 0 → 2000 in 30s → hold 2min → drop → assert recovery <5min
```
High-Stakes Scenario: Flash sale: traffic 10x in 2min, autoscale too slow (5min warm-up), checkout down 20min ($200k lost). Triage: spike test pre-sale (found 5min scale lag), pre-warmed capacity + queue (accept orders, fulfill async), circuit breakers, load shedding for browse (protect checkout).
Anti-Patterns: Only load testing; stress without recovery verification; spike without autoscale metrics; endurance skipped (leaks found in prod week 3).
Qs: Which test for SLA vs breaking point vs flash sale? What does each gate?

## 26.6 Bottleneck Identification — Refined
Theory: Bottlenecks are single constrained resources degrading overall throughput — often one faulty code path, slow query, or saturated hardware. Method: baseline (no load metrics) → increment load stepwise → correlate response-time inflection with saturated metric → profile → fix → retest. Monitor CPU utilization, memory, disk time/queue, network bytes/queue, GC pauses, top DB waits, hit ratios, thread interrupts. Common fixes: index queries, cache, pool tuning, async processing, scale out. Stop tuning when CPU-bound (need more capacity, not code). Show evidence chain from metric to root cause.
Enterprise Relevance: Bottleneck analysis turns "slow" into an actionable item with owner (DBA for query, dev for code, infra for capacity). Without the chain, tuning is guessing.
```text
Evidence chain: p95 inflection @400 users ↔ CPU 92% + DB wait 70% on orders_seq scan
→ missing index → CREATE INDEX → retest: p95 3.1s→400ms @800 users
Rule: if CPU>85% && DiskQueue>2 → suspect CPU/slow IO; if DB waits dominate → query/index
```
High-Stakes Scenario: Team scales out (adds 4 servers, $5k/mo) for a missing-index bottleneck fixable in 1 line. Triage: profile before scaling (APM + DB waits first), fix code/query/cache (cheap), scale only CPU-bound proven by metrics.
Anti-Patterns: Scaling before profiling; tuning without baseline (can't prove improvement); single metric (CPU only, missing DB waits); optimizing non-bottleneck (Amdahl — 10x on 5% path = nothing).
Qs: Walk through bottleneck method steps? When do you stop tuning and start scaling?

## 26.7 JMeter Basics — Refined
Theory: Apache JMeter is the leading open-source load tool for HTTP, JDBC, JMS, FTP. Building blocks: Test Plan > Thread Group (virtual users, ramp-up, loops) > Samplers (requests) > Config Elements (defaults/CSV data) > Timers (think time) > Assertions > Listeners (View Results Tree for debug, Aggregate Report/Summary for results). Workflow: build in GUI → debug small run → execute real load in CLI non-GUI mode → generate HTML dashboard. Must know CLI flags, distributed mode (master/slaves), correlation, parameterization. GUI only for scripting, never for full load (GUI consumes the load capacity).
Enterprise Relevance: JMeter is the lingua franca of perf evidence — HTML dashboards attach to release gates. SDET must produce CLI-driven, versioned (`test.jmx` in Git) runs, not GUI screenshots.
```bash
jmeter -n -t test.jmx -l result.jtl -e -o ./report
# -n non-GUI, -t plan, -l log, -e -o HTML dashboard
# distributed: jmeter -n -t test.jmx -R host1,host2 -l result.jtl
```
High-Stakes Scenario: GUI-mode full load (500 threads in GUI) — JMeter itself OOMs, results garbage. Triage: CLI always for load; GUI `View Results Tree` disabled during load (memory); Listeners minimal (Aggregate + Backend); distributed for >1000 threads.
Anti-Patterns: GUI full load; `View Results Tree` during load; unversioned `test.jmx` on someone's laptop; no think times; Listeners writing per-sample files at scale.
Qs: GUI vs CLI — when each? What are the essential JMeter elements in order?

## 26.8 Correlation — Refined
Theory: Correlation captures dynamic server-generated values (session IDs, tokens, timestamps) and reuses them in subsequent requests — preventing replay failures in JMeter, LoadRunner, k6, Gatling. Identify candidates by recording twice and diffing; extract via Regex, JSONPath, XPath, or boundary extractors; parameterize follow-up calls. Validate with single-user replay and logs. Auto-correlation speeds work but manual review avoids false positives/missed values. Essential for login flows, CSRF handling, realistic load; uncorrelated scripts underestimate server work and produce false errors.
Enterprise Relevance: Uncorrelated scripts test the login page repeatedly, never the authenticated flows — false capacity numbers. Every recorded script needs a correlate-then-validate pass before scaling.
```jmeter
Regular Expression Extractor: authToken:"(.+?)" -> ${authToken}
# follow-up: Authorization: Bearer ${authToken}
```
High-Stakes Scenario: Load test shows 0% errors but prod login fails under load — script replayed recorded token (single static session, no real logins). Triage: record twice, diff dynamic values, extract + parameterize all, single-user replay verification, CSRF/token coverage checklist.
Anti-Patterns: Replaying recorded tokens; auto-correlation without review (false positives); hardcoded session IDs; no single-user validation before full load.
Qs: How do you find correlation candidates? Correlation vs parameterization?

## 26.9 Parameterization — Refined
Theory: Parameterization replaces hard-coded test data with external/generated datasets so virtual users act uniquely — avoiding cache hits, session collisions, and false throughput. Use CSV Data Set Config, SharedArray, JDBC, faker, or Data Entities with recycle/sharing-mode/unique-iteration settings. Size datasets for VUs × iterations + 25% padding. Correlation handles outputs (server-generated), parameterization supplies inputs (test-driven) — together they make realistic, data-driven performance tests. Validate uniqueness, encoding, delimiters, loop/stop-on-EOF behavior before full load.
Enterprise Relevance: 500 VUs sharing 10 logins = cache-hit fantasy throughput + session thrash. Unique data per VU is what makes load numbers believable to capacity planners.
```jmeter
CSV Data Set Config: users.csv -> ${username},${password}; SharingMode: Current thread
# Recycle on EOF: false (fail loudly, don't loop); Stop thread on EOF: true
```
High-Stakes Scenario: Load test reuses 50 users across 500 VUs — 90% requests hit warm cache (inflated throughput 3x), plus session-eviction errors. Triage: dataset ≥ VUs × iterations, unique constraint verification pre-run, sharing mode per-thread, EOF behavior explicit.
Anti-Patterns: Hardcoded single user; dataset smaller than total iterations (silent recycle); shared mode across threads (collisions); comma/encoding issues (corrupt payloads at scale).
Qs: Correlation vs parameterization — inputs vs outputs? How do you size datasets?

## 26.10 Performance Results Interpretation — Refined
Theory: Interpret via distributions, not averages: p50 typical experience, p95/p99 tail latency, plus throughput (RPS), error rate, saturation signals. Look for linear scaling, then plateau/decline indicating bottleneck; correlate latency spikes with VU ramp and server metrics (CPU, DB, GC, pool exhaustion). Compare against baseline/SLOs, inspect per-endpoint breakdowns and time-series charts to find hockey-stick inflection and outliers before tuning. Zero errors with high latency still fails UX — judge capacity holistically.
Enterprise Relevance: Results interpretation is the deliverable stakeholders pay for — a verdict (ship/scale-fix/block) with evidence, not raw numbers. Every perf run ends with: SLO met? bottleneck location? headroom? recommendation?
```text
p50=210ms p95=1840ms p99=4320ms RPS=612 errors=2.3% → tail + plateau = saturated
Verdict: FAIL p95 SLA (1840 > 1000ms); bottleneck: DB waits 65% @600 VUs; headroom: none; action: index + retest
```
High-Stakes Scenario: "Average 300ms, ship it" — p99 9s for checkout, 2% errors hidden in average. Triage: percentile + error + throughput triple per endpoint, hockey-stick chart (inflection VU count), baseline delta (regression vs improvement), per-endpoint table (which endpoint broke first).
Anti-Patterns: Average-only verdicts; single-run numbers (noise); no baseline comparison; global metrics hiding endpoint failures; ignoring errors when latency passes.
Qs: What does the hockey-stick inflection tell you? How do you write a perf verdict?

## 26.11 Automation Performance — Refined
Theory: Automation performance = fast, stable test execution (distinct from product perf). Prefer API/component checks over full E2E where possible; cache auth with session/storageState; stub slow third parties; efficient locators + auto-waiting instead of fixed sleeps. Minimize video, HAR, console logs in CI; block analytics/ads; right-size timeouts, retries, worker resources. Measure slowest specs; fix flaky retries compounding runtime; profile login, navigation, setup hotspots. Upgrading frameworks, programmatic test-data setup, and lean fixtures yield largest savings quickly.
Enterprise Relevance: This is SDET's own perf discipline — a 60min suite that could be 15min wastes more engineering time annually than most product perf wins. Profile the suite like production: slowest specs first.
```ts
// cut third-party waits + heavy artifacts in CI
await page.route("**/analytics*", r => r.abort());
use: { video: 'retain-on-failure', trace: 'on-first-retry' }  // not always
// auth once: storageState reuse vs login per test (14s → 0s)
```
High-Stakes Scenario: Suite 55min: 20min UI logins + 15min video encoding + 10min third-party waits + 10min tests. Triage: storageState (20→1), video failure-only (15→2), stub third-party (10→1), API seeding. Total 55→14min touching zero test logic.
Anti-Patterns: Video/HAR always-on; UI login per test; real third-party calls; sleeps; unprofiled "tests are slow" complaints.
Qs: Where does suite time actually go? What are the top-3 suite-speed levers?

## 26.12 Suite Runtime Optimization — Refined
Theory: Optimize suite runtime via parallelism and sharding: split by historical duration or dynamic queue, balance spec sizes, enable fullyParallel, Playwright shards, pytest-xdist, CI matrix jobs. Cache dependencies by lockfile, reuse auth once, mock heavy APIs, tier runs (smoke vs full regression) with auto-cancel and prioritization. Monitor: slowest shard defines total time; add machines until setup overhead dominates, then fix caching and data isolation. Isolate test data per worker to prevent collisions and flaky parallel failures.
Enterprise Relevance: Runtime optimization directly buys developer velocity — every 10min saved × 50 runs/day = 8 dev-hours/day. Track wall-clock trend; alert on 20% regression (new slow test merged).
```bash
npx playwright test --shard=1/4 --workers=4; npm ci --cache ~/.npm
# tier: smoke 8min PR gate; full 40min nightly; slowest-shard dashboard
```
High-Stakes Scenario: Suite grows 15→45min over 6 months (no one owns runtime). Triage: slowest-10 specs list (fix or split top-3 = -15min), smoke/full tiering (-20min PR), sharding 1→4 (-50% wall), auth reuse + API seeding. Runtime budget per new test (e.g., +30s max) enforced in review.
Anti-Patterns: No runtime owner; full suite on every PR; slowest file ignored; setup repeated per test; no tiering (all-or-nothing).
Qs: What defines sharded total time? How do you budget runtime for new tests?

## 26.13 Reliability / Resilience Testing — Awareness — Refined
Theory: SDETs validate resilience beyond happy paths: fault injection, chaos experiments, retry/timeout behavior, circuit-breaker, failover, and recovery testing under load. Define steady state first (TPS, error budget, p99), hypothesize mitigation ("if 20% pods die, p99 stays <100ms via autoscale"), inject CPU/latency/pod-kill/dependency failures in non-prod first with blast-radius limits and stop conditions, then observe via metrics/traces/logs. Automate regressions in CI/chaos pipelines, replay past incidents, verify RTO/RPO, graceful degradation, and alerts. Combine load + chaos to expose issues invisible to isolated functional or performance runs.
Enterprise Relevance: Resilience tests prove the system meets its SLOs when things break — the difference between claimed HA and demonstrated HA. Deloitte regulated clients require chaos evidence for resilience sign-off.
```gherkin
Hypothesis: If 20% pods die, p99 <100ms via autoscale; rollback if error-budget burn >2%
Experiment: kill 20% pods in staging → assert p99 + error rate + recovery time
Steady state: TPS 500, error <0.5%, p99 <100ms (pre-injection baseline)
```
High-Stakes Scenario: AZ failure in prod — no chaos testing ever done, failover takes 25min (DNS TTL + cold caches), SLA breached. Triage: game-day AZ-kill in staging quarterly, RTO/RPO measured (not assumed), runbooks tested (not just written), past incidents replayed as regression chaos tests.
Anti-Patterns: Chaos in prod first; no steady-state baseline (can't tell if experiment broke anything); no blast limits/stop conditions; one-off chaos day (not CI regression); testing happy-path resilience only.
Qs: Steady state → hypothesis → inject → observe — what goes in each? How do you bound blast radius?

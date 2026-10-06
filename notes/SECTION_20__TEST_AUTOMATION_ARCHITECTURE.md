# SECTION 20 — TEST AUTOMATION ARCHITECTURE (Refined)

## Topics Covered

- 20.1 Framework Layers through 20.26 GenAI Copilot Integration (26 headers)

*Refined header-by-header — full contract*

---

## 20.1-20.13 Layers/Core — Refined
Layers downward-only Test intent/assert → Business/Pages → Core driver/waits/config/log → Execution local/Grid/cloud parallel → Reporting; gTAA generation/definition/execution/adaptation; swap execution no test edit. Tests know pages, pages core, core driver; never upward.
SoC one knowledge/reason: config env, pages UI, tests requirements, utils infra; SOLID SRP + lint ban raw selectors/URLs tests + Tests→Modules→Pages→Utils→Config; 80% less maint deterministic CI.
POM per page hides locators exposes intent `loginAs`; COM per reusable Header/Modal/Table scoped root composed; <10 pages POM else COM 20-40; no asserts in pages, no driver expose, root.locator not page.locator.
Service/API typed clients per resource BaseApi GET/POST/PUT/PATCH/DELETE auth/retry/log + UsersApi extends; tests never raw; payloads/models central; hybrid seed API fast verify UI assert API/DB; SpecBuilder + ResponseValidator schema + refresh interceptor.
Config single truth env URLs/creds/timeouts/browser/flags `.env/dev/staging/prod.json` vars typed Settings; no hardcode; DriverFactory BROWSER/HEADLESS/BASE_URL; Strategy `-Denv=qa`; vault secrets not git.
Data creation/provision/cleanup: static JSON/CSV stable, factories Faker unique per-test build vs create, API seeding speed; UUID/timestamp per worker, seeded reproducible, masked prod E2E, versioned seeds git, rollback/`created_by:automation` teardown.
Driver lifecycle DriverFactory+fixtures create/config/destroy; Sel ThreadLocal parallel local/Grid/BrowserStack; Playwright isolated newContext per test auto-closed; never globals; headless/viewport/shot/video/trace config.
Deps reproducible pom/gradle/package pinned scopes testImplementation/test transitive BOM/catalog central lock cache scan; upgrade one file; no local JARs Central/npm; `dependency:tree` verify.
Utils framework helpers not app: Wait/Assertion/Date/File-CSV-JSON/Retry/Generator static stateless unit-tested; no sleep scatter/dup; 5 calls/test → push facades/pages.
Logs structured Log4j/Logback/Winston levels corr/thread/env/build + OTel/ELK appenders; req/res/driver/steps failure-only; trace/span MDC distributed; answer env/data/commit w/o rerun.
Reports decisions: Playwright HTML, Allure history/categories/env/steps/attach, JUnit/JSON gates; config reporter html never + allure; CI artifact traces/videos inline + owner/risk smoke/regression; taxonomy/flake/duration not counts.
Diagnostics auto failure shot only-failure video retain/trace on-first-retry HAR/network/console/DOM Trace Viewer `show-trace`; listener/fixture on_failure save+logs `test-results` CI; no local repro triage artifacts+env/seed/IDs.
Isolation hermetic order-independent parallel/shard: fresh Context/DB per test unique worker no globals/statics; fullyParallel/workers2, Isolated exceptions, Testcontainers/ephemeral per run; own API seed + cleanup; prior-output dependence future flake.
Triage: layered violation (locators in tests) → review/lint; flaky shared → isolation. Anti: monolith scripts, god utils, hardcoded env.

## 20.14-20.26 Scale/Strategy — Refined
Parallel TestNG methods/classes/tests thread-count + Grid Router/Distributor/Map/Queue distribution; stateless independent shard class CI merge blob/Allure; Docker/K8s/cloud cross; workers CPU 4-6.
Safety driver not thread-safe static clash → ThreadLocal get/set/remove Before/After; pass get() to Pages never store TL pages; ThreadGuard cross-thread fail-fast; isolate data.
Envs DEV/QA/Int/Staging/UAT/Perf/Sandbox gates; staging prod-mirror masked rollback; no single bottleneck; Compose local + ephemeral PR Terraform/Octopus TTL cleanup; IaC seed branch DB flags isolation.
Monorepo atomic code+tests shared fixtures single gate needs Nx/Turborepo/Bazel affected or CI explodes; multi-repo QA autonomy versioning access but E2E drift; hybrid unit/integration collocated + cross-E2E dedicated pinned package.
UI+API+DB right layer: API setup/contracts/logic, UI render/journey, DB JDBC persistence; hybrid create API act UI verify API/DB; shared config/auth/factories no drift; assert once; async polling not sleeps.
Pyramid Cohn 70% unit fast /20% service/API /10% UI E2E slow; push down; API contracts UI critical only; contract/component modern; inverted brittle slow CI; coverage gates selective regression.
Shift-left BDD grooming/TDD/lint-SAST commit/unit build/API-contract merge/E2E pre-deploy gates block promotion; Sonar/ESLint/JUnit/TestNG/RestAssured/Actions; 60-90% fewer prod 100x cheaper early.
Risk Likelihood×Impact prod/usage/complex/history; tag critical/high/low smoke PR nightly full; payment/login/checkout first defer edge; escaped/flake re-rank quarterly.
Maintain POM per page/component locators central asserts out nav returns next; layered Wait/File/Browser/Api/Db + Providers + env config; DRY fixtures/components; fix one place; review flake remove redundant version helpers package.
Scale vertical workers horizontal shards/Grid nodes; Grid standalone→hub→distributed; Docker+Helm K8s; KEDA queue autoscale grace drain; 4 workers 22→6min; queue/artifacts S3/meta Postgres monitor.
Security no hardcode Vault/AWS/env masked CI; pre-commit TruffleHog + SAST Sonar/Checkmarx + DAST ZAP; auth-matrix/IDOR/SQLi/XSS/JWT none/CSRF pipeline; rotate dynamic encrypt backups mask prod UAT.
Trade-offs speed/coverage, quarantine/block flaky, mock/real; numbers/ownership/blast; critical smoke pass, new fail block, known non-critical quarantine owner+expiry nightly; silent retries erode; pass/p95/flake/escaped track.
GenAI Copilot/MCP planner/generator/healer scaffold POM/data/API English then human-review asserts; explore snapshot generate run iterate; critical manual review measure saving; scaffolding/self-heal not unsupervised.
Triage: scale stall → workers/shards/queue/artifacts; security leak → vault/scan/rotate. Anti: inverted pyramid, shared env bottleneck, secrets repo.

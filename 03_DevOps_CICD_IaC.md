# 3. DEVOPS, CI/CD & INFRASTRUCTURE AS CODE

# 3.1 CI/CD Mental Model

A CI pipeline is a **quality decision engine**, not merely a test launcher.

```text
Commit
 ↓
Build
 ↓
Static checks
 ↓
Unit
 ↓
Component / Contract
 ↓
API smoke
 ↓
Deploy test environment
 ↓
UI smoke
 ↓
Regression
 ↓
Quality gate
 ↓
Deploy
 ↓
Post-deploy validation
```

Senior SDET ownership includes:

- pipeline topology;
- dependency caching;
- parallelization;
- secrets;
- test selection;
- reports;
- artifacts;
- environment lifecycle;
- failure classification;
- quality gates.

---

# 3.2 Fast vs Expensive Tests

### PR

```text
Unit
Component
Contract
Small API smoke
```

### Merge

```text
API integration
Critical UI smoke
```

### Scheduled / release

```text
Full regression
Cross-browser
Performance
Resilience
```

---

# 3.3 GitHub Actions — Parallel Tests + Cache + Artifacts + Allure

Pin action versions and runtime versions according to organizational policy.

```yaml
name: sdet-tests

on:
  pull_request:
  push:
    branches: [ main ]

jobs:
  api:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Java
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'
          cache: maven

      - name: Run API tests
        run: mvn -B test -Dgroups=api

      - name: Upload API results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: api-results
          path: |
            target/surefire-reports/
            target/allure-results/

  playwright:
    runs-on: ubuntu-latest

    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install browser
        run: npx playwright install --with-deps chromium

      - name: Run shard
        run: npx playwright test --shard=${{ matrix.shard }}/4

      - name: Upload Playwright artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-${{ matrix.shard }}
          path: |
            test-results/
            playwright-report/
            blob-report/

  report:
    if: always()
    needs: [api, playwright]
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Java
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'
          cache: maven

      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          path: artifacts

      - name: Merge Allure results
        run: |
          mkdir -p target/allure-results
          find artifacts -type f -path "*/allure-results/*" \
            -exec cp {} target/allure-results/ \;

      - name: Generate Allure report
        run: mvn -B allure:report

      - name: Upload Allure report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: allure-report
          path: target/site/allure-maven-plugin/
```

GitHub documents dependency caching for Maven/npm and distinguishes caches from artifacts: caches accelerate reusable dependencies; artifacts persist outputs such as logs, results, screenshots, and reports. citeturn325406search0turn325406search12

---

# 3.4 Cache vs Artifact

## Cache

Good for:

- Maven dependencies;
- npm dependency cache;
- expensive-to-regenerate intermediate dependencies.

## Artifact

Good for:

- test reports;
- logs;
- screenshots;
- traces;
- videos;
- JUnit XML;
- performance results.

Security principle:

> Do not put credentials or sensitive data in a cache.

GitHub documents cache-poisoning and sensitive-data considerations explicitly. citeturn325406search0

---

# 3.5 Workers vs Shards

Workers:

```text
single CI job
 ↓
worker 1
worker 2
worker 3
```

Shards:

```text
CI
 +-- shard 1
 +-- shard 2
 +-- shard 3
 +-- shard 4
```

Combined:

```text
shards × workers
```

Scaling should be based on:

- queue time;
- runner CPU;
- browser capacity;
- application capacity;
- DB capacity;
- network;
- failure rate.

---

# 3.6 Dockerization

A test container should include:

- runtime;
- dependencies;
- browsers where required;
- test source;
- configuration.

Do not bake secrets into images.

---

# 3.7 Playwright Dockerfile

```dockerfile
FROM mcr.microsoft.com/playwright:<approved-version>

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV CI=true

CMD ["npx", "playwright", "test"]
```

Use approved image/version.

---

# 3.8 Docker Compose — App + DB + Tests

```yaml
services:

  app:
    build:
      context: ./app
    ports:
      - "8080:8080"
    environment:
      DB_HOST: db
      DB_PORT: 5432
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16
    environment:
      POSTGRES_DB: testdb
      POSTGRES_USER: testuser
      POSTGRES_PASSWORD: testpass
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "pg_isready -U testuser -d testdb"
        ]
      interval: 5s
      timeout: 3s
      retries: 20

  tests:
    build:
      context: ./automation
    environment:
      BASE_URL: http://app:8080
      DB_HOST: db
    depends_on:
      app:
        condition: service_started
      db:
        condition: service_healthy
```

Important:

> Startup ordering is not equivalent to application readiness.

Use health checks and, where needed, application readiness endpoints or polling.

---

# 3.9 Infrastructure as Code

Preferred model:

```text
Code
 ↓
Provision
 ↓
Deploy
 ↓
Test
 ↓
Collect
 ↓
Destroy
```

Concepts to know:

- immutable infrastructure;
- ephemeral environments;
- configuration drift;
- reproducibility;
- secrets injection;
- network isolation;
- cleanup.

---

# 3.10 Ephemeral Environments

```text
PR
 ↓
Provision isolated environment
 ↓
Deploy branch
 ↓
Run tests
 ↓
Publish diagnostics
 ↓
Destroy
```

Advantages:

- isolation;
- reproducibility;
- parallel development.

Trade-off:

- cloud/infrastructure cost;
- provisioning latency;
- operational complexity.

---

# 3.11 Selenium Grid in CI

```text
CI
 ↓
Grid router
 ↓
+-------------------+
| Chrome node(s)    |
| Firefox node(s)   |
| Edge node(s)      |
+-------------------+
```

Monitor:

- sessions;
- queue time;
- node utilization;
- browser versions;
- CPU/memory;
- network latency.

---

# 3.12 Playwright CI Model

Use:

- projects;
- workers;
- shards;
- retries;
- traces;
- test result artifacts.

Playwright's worker and fixture model provides a natural basis for isolated parallel execution. citeturn325406search13turn325406search7

---

# 3.13 Performance Testing at Scale

## JMeter

Strong where:

- enterprise teams already have JMeter expertise;
- GUI-created test plans are useful;
- distributed test engines are required;
- legacy performance assets exist.

JMeter documents remote/distributed execution with controller and remote engine processes. A key nuance is that the same test plan is run by each remote server rather than a single global thread count automatically being partitioned across nodes. citeturn325406search2turn325406search4

## Gatling

Strong where:

- test-as-code is preferred;
- teams want strong CI workflows;
- Java or JavaScript/TypeScript fits the team.

Gatling's current documentation emphasizes test-as-code and provides Java and JavaScript/TypeScript approaches. citeturn325406search10

## Locust

Strong where:

- Python is preferred;
- test behavior needs to be highly programmable;
- distributed execution is needed.

Locust supports master/worker distributed execution and scaling to additional processes or machines. citeturn325406search5turn325406search9

### Comparison

| Criterion | JMeter | Gatling | Locust |
|---|---|---|---|
| Enterprise familiarity | Very high | High | High in Python teams |
| Test-as-code | Moderate | Strong | Strong |
| GUI | Strong | Available in enterprise tooling | Web UI |
| Language | Java ecosystem/tool | Java / JS / TS | Python |
| Distributed | Mature | Strong | Native master/worker |
| CI/CD | Strong | Strong | Strong |
| Best fit | Existing enterprise performance practice | Engineering-centric load testing | Programmable Python load models |

---

# 3.14 Performance Metrics

Never report only average response time.

Capture:

- p50;
- p90;
- p95;
- p99;
- throughput;
- error rate;
- active users;
- CPU;
- memory;
- database connections;
- queue depth.

Example:

```text
Average = 180 ms
p95     = 420 ms
p99     = 2.4 s
```

The average can look acceptable while the tail is unacceptable.

---

# 3.15 CI Optimization for 10,000 Tests

```text
Baseline
 ↓
Remove redundant coverage
 ↓
Shift checks downward
 ↓
Parallelize independent tests
 ↓
Shard
 ↓
Optimize setup
 ↓
Cache dependencies
 ↓
Tune workers
 ↓
Measure bottlenecks
```

Do not answer:

> Increase workers.

Answer:

> I would increase concurrency gradually while monitoring runner utilization, browser capacity, database contention, application saturation, queue time, and failure rate.

---

# 3.16 CI/CD Interview Questions

1. What should block a pull request?
2. Cache versus artifact?
3. How would you shard 10,000 tests?
4. How do you prevent retries hiding defects?
5. How do you publish traces/screenshots?
6. How do you provision test environments?
7. How do you secure secrets?
8. Why can more workers make a suite slower?
9. How do you choose worker counts?
10. How do you implement deployment validation?
11. How do you classify environment failure versus product failure?

## 3.17 References

- https://docs.github.com/en/actions/concepts/workflows-and-actions/dependency-caching
- https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts
- https://docs.docker.com/compose/
- https://jmeter.apache.org/usermanual/remote-test.html
- https://docs.gatling.io/
- https://docs.locust.io/

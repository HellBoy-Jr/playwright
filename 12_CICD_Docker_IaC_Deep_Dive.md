# CI/CD, Docker and IaC Deep Dive — Senior SDET Interview

## 1. Pipeline Architecture

```text
Commit
 ↓
Build
 ↓
Unit
 ↓
Component / Contract
 ↓
API
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

---

# 2. GitHub Actions — Parallelization

```yaml
jobs:

  api:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'
          cache: maven

      - run: mvn -B test -Dgroups=api

  ui:
    runs-on: ubuntu-latest

    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm

      - run: npm ci

      - run: npx playwright install --with-deps chromium

      - run: |
          npx playwright test \
            --shard=${{ matrix.shard }}/4

      - if: always()
        uses: actions/upload-artifact@v4
        with:
          name: ui-${{ matrix.shard }}
          path: |
            test-results/
            playwright-report/
```

GitHub's documentation distinguishes dependency caches from workflow artifacts: caches accelerate reusable inputs; artifacts persist outputs of a run and can move outputs between jobs. citeturn325406search0turn325406search12

---

# 3. Quality Gate

Example:

```text
PR
 ├── unit
 ├── contract
 ├── security
 └── critical API smoke

merge
 ├── integration
 └── critical UI smoke

release
 ├── regression
 ├── cross-browser
 └── performance
```

A quality gate should be tied to explicit risk policy.

---

# 4. Cache vs Artifact

### Cache

For:

- Maven dependencies;
- npm cache;
- other regenerable inputs.

### Artifact

For:

- Allure;
- JUnit XML;
- screenshots;
- trace;
- video;
- logs.

Never use caches as secret storage. GitHub warns that cache contents can be restored by workflows and should be treated as untrusted input. citeturn325406search0

---

# 5. Sharding

```text
10,000 tests
 ↓
Shard 1
Shard 2
Shard 3
Shard 4
```

Balance by expected runtime rather than only test count.

A 2,500-test shard can still run twice as long as another shard if its tests are heavier.

---

# 6. Dockerfile

```dockerfile
FROM mcr.microsoft.com/playwright:<approved-version>

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV CI=true

CMD ["npx", "playwright", "test"]
```

Do not hard-code:

```text
password
token
client secret
production URL
```

---

# 7. Docker Compose

```yaml
services:

  app:
    build:
      context: ./app

    environment:
      DB_HOST: db

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

    depends_on:
      app:
        condition: service_started
```

Important distinction:

```text
service_started
      ≠
application_ready
```

Use health checks and readiness endpoints.

---

# 8. Ephemeral Environment Model

```text
PR
 ↓
Provision
 ↓
Deploy branch
 ↓
Seed data
 ↓
Test
 ↓
Collect diagnostics
 ↓
Destroy
```

Benefits:

- isolation;
- reproducibility;
- parallelism.

Costs:

- infrastructure;
- startup time;
- lifecycle complexity.

---

# 9. CI Flaky Test Policy

```text
failure
 ↓
classify
 ├── product defect
 ├── test defect
 ├── infrastructure
 └── transient
```

Only some transient categories should be retried.

Every retry should be observable.

---

# 10. Pipeline Observability

Record:

```text
job queue time
execution time
worker count
shard
test count
pass/fail
retry count
artifact time
environment
commit
```

Then analyze:

```text
pipeline duration
test duration
infrastructure delay
```

---

# 11. Performance Testing Integration

### JMeter

Mature enterprise ecosystem; remote engines can be controlled from a client. JMeter's remote test semantics require understanding that each remote server runs the plan rather than automatically dividing a global thread count. citeturn325406search2

### Gatling

Code-centric load testing, with Java and JavaScript/TypeScript approaches. citeturn325406search10

### Locust

Python-based distributed master/worker model. citeturn325406search5turn325406search9

---

# 12. Infrastructure as Code

Know:

- immutable infrastructure;
- environment reproducibility;
- configuration drift;
- ephemeral environments;
- secret injection;
- network isolation.

Senior answer:

> I want the test environment to be reproducible from code. If the environment cannot be recreated deterministically, test results cannot be trusted as strongly.

---

# 13. Deployment Validation

After deployment:

```text
health check
 ↓
smoke API
 ↓
critical UI
 ↓
metrics
 ↓
logs
 ↓
rollback decision
```

Do not validate a deployment only through functional UI tests.

---

# 14. CI/CD Interview Questions

1. What should block a PR?
2. Cache versus artifact?
3. How do you shard 10,000 tests?
4. Why can more workers make tests slower?
5. How do you handle flaky tests?
6. How do you secure CI secrets?
7. How do you build an ephemeral environment?
8. How do you publish Allure?
9. How do you run Playwright in CI?
10. How would you integrate Selenium Grid?
11. How do you add deployment validation?
12. How do you measure pipeline efficiency?

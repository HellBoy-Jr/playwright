# 1. CORE TEST ARCHITECTURE & STRATEGY — Senior / Staff Level

## 1.0 Purpose and Interview Standard

A Senior SDET answer should demonstrate ownership of **quality as an engineering system**, not merely knowledge of test tools.

The architecture must optimize simultaneously for:

- Feedback speed
- Reliability
- Isolation
- Maintainability
- Scalability
- Observability
- Security
- Cost efficiency

A strong architecture discussion connects:

```text
test design → execution model → CI topology → application architecture → diagnostics
```

---

## 1.1 Scalable Automation Framework From Scratch

### 1.1.1 Architectural Layers

```text
                    CI / CD Orchestrator
                           |
                +----------+----------+
                |                     |
          Test Selection          Environment
          / Sharding               Provisioning
                |                     |
        +-------+-------+             |
        |               |             |
      API              UI          Test Data
        |               |             |
        +-------+-------+-------------+
                |
        Domain / Service Clients
                |
        Framework Infrastructure
        +--------------------------+
        | Config                   |
        | Authentication           |
        | Browser / HTTP lifecycle |
        | Fixtures / Context       |
        | Logging                  |
        | Reporting                |
        | Diagnostics              |
        +--------------------------+
```

The central principle is **separation of concerns**.

Tests should express:

> What business behavior am I validating?

Framework code should handle:

> How do I interact with the browser, API, database, or environment?

### 1.1.2 Repository Shape

```text
automation/
├── tests/
│   ├── ui/
│   ├── api/
│   ├── integration/
│   └── contract/
├── pages/
├── components/
├── clients/
├── fixtures/
├── data/
├── config/
├── utils/
├── listeners/
├── assertions/
├── schemas/
├── resources/
│   ├── environments/
│   └── test-data/
├── scripts/
├── docker/
├── .github/workflows/
└── reports/
```

### 1.1.3 Dependency Direction

Preferred:

```text
Tests
 ↓
Domain actions / Page Objects / API Clients
 ↓
Framework services
 ↓
Infrastructure adapters
```

Avoid embedding all of this in one test:

```text
WebDriver + SQL + HTTP + configuration + reporting
```

### 1.1.4 Configuration

Externalize:

```text
BASE_URL
API_URL
BROWSER
HEADLESS
GRID_URL
DB_URL
TEST_ENV
WORKERS
```

Keep secrets in CI/secret-management infrastructure.

### 1.1.5 Lifecycle

```text
Resolve config
      ↓
Provision/acquire environment
      ↓
Prepare test data
      ↓
Create browser/API context
      ↓
Execute test
      ↓
Collect diagnostics
      ↓
Validate/classify result
      ↓
Cleanup
      ↓
Publish artifacts
```

Global setup should be used only for genuinely shareable state. Test-owned state should remain test-scoped.

---

## 1.2 Playwright vs Selenium vs Cypress — Enterprise Comparison

| Area | Playwright | Selenium | Cypress |
|---|---|---|---|
| Architecture | Browser automation + integrated runner | WebDriver protocol ecosystem | Browser-centric test runner |
| Browser coverage | Chromium, Firefox, WebKit | Broad WebDriver-compatible ecosystem | Web application focused |
| Test isolation | BrowserContext model | Explicit driver/session lifecycle | Opinionated test lifecycle |
| Synchronization | Strong action/locator waiting | Explicit conditions commonly used | Automatic command retryability |
| Parallelism | Worker/shard model | Runner + Grid/orchestrator | CI/cloud-oriented strategies |
| API testing | APIRequestContext | Usually paired with REST library | `cy.request()` |
| Network control | Strong routing/interception | DevTools/proxy approaches | Strong request interception |
| Multiple browser control | Strong context/page model | Strong | More constrained by architecture |
| Language | TypeScript/JavaScript plus other bindings | Multi-language | JS/TS |
| Diagnostics | Trace/screenshot/video | Framework/tooling dependent | Excellent interactive runner |
| Enterprise fit | Excellent for modern web systems | Excellent for existing WebDriver estates | Excellent for web-centric teams |
| Migration cost | Depends on existing stack | Lowest where already standardized | Separate model/skills |

### Interview-ready comparison

Do not say:

> Playwright is better than Selenium.

Say:

> The correct tool depends on browser coverage, application architecture, team language, existing infrastructure, debugging needs, test isolation, and migration cost. Playwright is particularly attractive for modern web systems that benefit from browser-context isolation, integrated API/network tooling, strong diagnostics, and worker-oriented parallelism. Selenium remains compelling for broad WebDriver ecosystem compatibility and established enterprise Grid infrastructure. Cypress is strong for web-centric E2E/component testing, but its browser-centric architecture creates explicit trade-offs for some multi-browser and backend-driven workflows.

Cypress documents trade-offs including its browser-centric architecture and limits around simultaneously controlling multiple browsers and direct backend access from test code. citeturn264812search0turn264812search6

Playwright's fixture model is explicitly designed around isolated test fixtures and worker-scoped fixtures. citeturn325406search13

---

## 1.3 Flaky Test Epidemic in Large Microservice CI/CD

### 1.3.1 Principle

Flakiness is a **signal-quality problem**. If engineers stop trusting a red build, the automation platform has failed.

Target state:

```text
Detect
 ↓
Classify
 ↓
Contain
 ↓
Root-cause
 ↓
Prevent recurrence
```

### 1.3.2 Flake Taxonomy

#### Timing
- async UI update
- AJAX
- eventual consistency
- delayed event

#### Shared data
- reused users
- same order
- same account
- database collisions

#### Shared framework state
- static driver
- static mutable token
- global mutable context
- singleton containing mutable state

#### Environment
- resource starvation
- dependency outage
- deployment during test
- network instability

#### External dependency
- third-party API
- email/SMS provider
- payment sandbox

#### Genuine application defect

A failure occurring intermittently is not automatically a flaky test.

---

## 1.4 Triage Workflow

```text
Failure
 ↓
Deterministic?
 ├── Yes → Reproduce → likely test/product defect
 └── No
      ↓
Historical analysis
      ↓
Parallelism analysis
      ↓
Data collision analysis
      ↓
Timing analysis
      ↓
Environment/dependency analysis
      ↓
Classification
```

Capture:

- test ID
- commit SHA
- environment
- browser
- worker
- retry attempt
- test-data ID
- correlation ID
- screenshot
- trace/video
- API requests
- console errors
- network failures
- infrastructure events

### 1.4.1 Flake Rate

```text
flakeRate =
  testsPassedOnlyAfterRetry / testsExecuted
```

A test that passes on retry should still be recorded as a degraded signal.

---

## 1.5 Retry Patterns

### Bad

```text
any failure
 → retry 5 times
 → build passes if one attempt passes
```

### Better

```text
Attempt 1
 ↓
Classify
 ↓
Retry only plausibly transient failures
 ↓
If retry passes:
    report "passed with retry"
    emit flake metric
```

Retries are containment.

They are not root-cause correction.

---

## 1.6 Dynamic Waiting

Bad:

```java
Thread.sleep(5000);
```

Better:

```java
wait.until(
    ExpectedConditions.elementToBeClickable(loginButton)
);
```

For asynchronous business state:

```text
Trigger action
 ↓
Poll observable state
 ↓
Terminal condition?
 ├── yes → continue
 └── no → bounded retry
```

Example:

```java
public <T> T pollUntil(
        Supplier<T> supplier,
        Predicate<T> condition,
        Duration timeout,
        Duration interval) {

    Instant deadline = Instant.now().plus(timeout);

    while (Instant.now().isBefore(deadline)) {
        T value = supplier.get();

        if (condition.test(value)) {
            return value;
        }

        try {
            Thread.sleep(interval);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Polling interrupted", e);
        }
    }

    throw new AssertionError(
            "Condition not met within " + timeout
    );
}
```

The key question is:

> What observable condition proves the system is ready?

Selenium identifies race conditions and dynamically changing application state as major causes of flaky browser automation. citeturn325406search1

---

## 1.7 Isolation Tactics

### Browser

```text
Test A → Context A → Page A
Test B → Context B → Page B
```

### Data

```text
Worker 1 → User 101
Worker 2 → User 102
Worker 3 → User 103
```

### API

Each test should own:

- payload;
- generated IDs;
- authentication context where necessary;
- cleanup.

Playwright documents one-account-per-worker as an approach for tests that modify shared server-side state. citeturn325406search7

---

## 1.8 Shift-Left Testing

### 1.8.1 Pyramid

```text
             UI / E2E
           /-----------\
          / Integration \
         /--------------\
        /   Component    \
       /------------------\
      /      Unit          \
     /----------------------\
```

Use the cheapest layer that can reliably prove the behavior.

### Unit

Best for:

- business rules;
- pure transformations;
- validation;
- algorithms;
- edge cases.

### Component

Examples:

- controller + service;
- UI component with mocked backend;
- service handler with fake downstream.

### Integration

Examples:

```text
Service → PostgreSQL
Service → Kafka
Service → Service B
```

### Contract

Pact supports contract testing of HTTP and message integrations by validating a shared understanding between consumer and provider. citeturn264812search3

Consumer-driven process:

```text
Consumer test
 ↓
Contract generated
 ↓
Contract published
 ↓
Provider verification
 ↓
Deploy decision
```

Pact documentation describes contracts as interaction examples and provider verification as replaying those interactions against the provider. citeturn264812search4turn264812search9

### Important rule

Contract testing is not a replacement for provider functional testing.

---

## 1.9 Test Selection Strategy

Do not run every test for every event.

### Pull request

```text
Unit
 ↓
Lint/static analysis
 ↓
Component
 ↓
Contract
 ↓
Critical API smoke
```

### Merge

```text
API integration
 ↓
Critical UI smoke
```

### Scheduled/release

```text
Full regression
Cross-browser
Performance checks
Resilience checks
```

Selection can be based on:

- changed service;
- changed API;
- changed UI area;
- risk;
- ownership;
- historical failures;
- dependency graph.

---

## 1.10 Quality Gates

### PR gate

- unit pass;
- contract pass;
- critical API smoke;
- critical security checks;
- no unexplained critical failure.

### Release gate

- regression;
- critical business flows;
- deployment health;
- no unacceptable new flake rate;
- operational monitoring enabled.

---

## 1.11 Senior-Level Architecture Questions

1. How would you design automation for 10,000 tests?
2. What belongs in UI versus API versus unit tests?
3. How do you attack a flaky-test epidemic?
4. How do you make parallel execution safe?
5. How do you avoid test-data collisions?
6. How do you measure automation ROI?
7. How would you migrate a Selenium estate to Playwright?
8. How would you introduce contract testing across microservices?
9. What should block a PR?
10. How do you make CI failures trustworthy?

## 1.12 References

- https://www.selenium.dev/documentation/webdriver/waits/
- https://playwright.dev/docs/test-fixtures
- https://playwright.dev/docs/auth
- https://docs.cypress.io/app/references/trade-offs
- https://docs.pact.io/

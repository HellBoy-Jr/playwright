# 5. SYSTEM DESIGN & ARCHITECTURE — TESTING THE UN-TESTABLE

# 5.1 System Design Method

```text
Clarify system
 ↓
Identify risk
 ↓
Define test boundaries
 ↓
Design data
 ↓
Design observability
 ↓
Design execution
 ↓
Design failure handling
 ↓
Scale and trade-offs
```

Do not start with tool names.

---

# 5.2 Event-Driven System Scenario

Assume:

```text
Web UI
  |
API Gateway
  |
Order Service
  |
Kafka
  |
+-------------------------+
| Payment Service         |
| Inventory Service       |
| Notification Service    |
+-------------------------+
       |
    WebSocket
       |
     Browser
```

Business flow:

```text
ORDER_CREATED
→ PAYMENT_CONFIRMED
→ INVENTORY_RESERVED
→ ORDER_COMPLETED
```

---

# 5.3 Why Immediate E2E Assertions Fail

Bad:

```text
click Place Order
immediately assert Order Completed
```

The system is asynchronous.

Correct:

```text
trigger action
 ↓
wait for terminal domain state
 ↓
bounded timeout
 ↓
capture state if timeout occurs
```

---

# 5.4 Layered Test Architecture

```text
E2E
 |
 +-- API workflow
 |
 +-- WebSocket validation
 |
 +-- Event verification
 |
 +-- Integration tests
 |
 +-- Contract tests
 |
 +-- Unit tests
```

Use E2E selectively.

---

# 5.5 Contract Testing for Events

Validate:

```text
Order Service
   produces
ORDER_CREATED
```

and:

```text
Inventory Service
   consumes
ORDER_CREATED
```

Validate:

- event schema;
- required fields;
- semantics;
- compatibility;
- versioning.

Pact supports HTTP and message contract testing and is designed around testing integration boundaries without requiring a full deployed ecosystem. citeturn264812search3

---

# 5.6 Kafka Test Strategy

## Producer

Validate:

- topic;
- key;
- payload;
- headers;
- partitioning when relevant.

## Consumer

Validate:

- event processed;
- business side effect;
- offset behavior;
- retry;
- dead-letter behavior.

## Idempotency

Send same event twice:

```text
Event 1 → state change
Event 2 → no duplicate business effect
```

This is critical because distributed event systems commonly need duplicate-safe business handling.

---

# 5.7 Correlation ID

Generate:

```java
String correlationId =
        UUID.randomUUID().toString();
```

Propagate through:

```text
HTTP request
 ↓
service logs
 ↓
Kafka headers
 ↓
consumer logs
 ↓
WebSocket message
```

Result:

```text
one user action
→ one trace
→ one test
→ one diagnostic chain
```

---

# 5.8 Eventual Consistency Utility

```java
public static <T> T awaitState(
        Supplier<T> supplier,
        Predicate<T> success,
        Duration timeout,
        Duration interval) {

    Instant deadline =
            Instant.now().plus(timeout);

    while (Instant.now().isBefore(deadline)) {

        T value = supplier.get();

        if (success.test(value)) {
            return value;
        }

        try {
            Thread.sleep(interval);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();

            throw new AssertionError(
                    "Polling interrupted",
                    e
            );
        }
    }

    throw new AssertionError(
            "Expected state was not reached"
    );
}
```

A production implementation can improve this with:

- backoff;
- jitter;
- diagnostic snapshots;
- correlation IDs;
- structured logging.

---

# 5.9 RabbitMQ Testing

Key concepts:

- consumer acknowledgements;
- publisher confirms;
- prefetch;
- redelivery;
- requeue;
- dead-letter handling.

RabbitMQ documents consumer acknowledgements and publisher confirms as separate mechanisms addressing different sides of delivery safety. citeturn264812search1turn264812search5

### Scenarios

1. Publish valid message.
2. Verify processing.
3. Fail consumer before acknowledgement.
4. Verify redelivery.
5. Verify duplicate-safe handling.
6. Verify retry/dead-letter behavior.
7. Verify monitoring.

---

# 5.10 WebSocket Testing

Validate:

- connection;
- authentication;
- subscription;
- message format;
- ordering where guaranteed;
- duplicate delivery handling;
- reconnect;
- heartbeat;
- timeout;
- backpressure.

Do not test all WebSocket semantics exclusively through UI E2E tests.

---

# 5.11 End-to-End Event Flow

```text
1. Create customer via API
2. Create order via API
3. Generate correlation ID
4. Subscribe WebSocket
5. Trigger business action
6. Wait for ORDER_CREATED
7. Wait for PAYMENT_CONFIRMED
8. Wait for INVENTORY_RESERVED
9. Wait for ORDER_COMPLETED
10. Validate DB projection
11. Validate audit log
12. Cleanup
```

This is faster and more diagnosable than driving the entire process from the UI.

---

# 5.12 Failure Classification

If completion times out:

```text
Timeout
 |
 +-- event never published
 +-- event published but not consumed
 +-- consumer failed
 +-- DB projection delayed
 +-- WebSocket disconnected
 +-- subscription happened too late
 +-- correlation ID mismatch
```

Bad:

```text
Expected completed but timed out.
```

Good:

```text
correlationId: R100
expected: ORDER_COMPLETED
lastObserved: PAYMENT_CONFIRMED
consumer: inventory-service
elapsed: 28.4s
```

---

# 5.13 Centralized QA Metrics Dashboard

## Data sources

```text
Jenkins
GitHub Actions
GitLab
Playwright
Selenium
REST Assured
Application logs
Infrastructure logs
```

## Collection

```text
Sources
 ↓
Collectors
 ↓
Normalization
 ↓
Elasticsearch / Loki
 ↓
Grafana / Kibana
 ↓
Engineering users
```

---

# 5.14 Canonical Test Result Schema

```json
{
  "testId": "LOGIN-001",
  "suite": "smoke",
  "framework": "playwright",
  "language": "typescript",
  "status": "FAILED",
  "durationMs": 4820,
  "commitSha": "abc123",
  "branch": "main",
  "environment": "qa",
  "browser": "chromium",
  "worker": 3,
  "retryAttempt": 0,
  "correlationId": "R100",
  "failureCategory": "APPLICATION",
  "errorMessage": "Payment service returned 503"
}
```

Normalize all frameworks into a common event schema.

---

# 5.15 Dashboard Views

## Executive

- pass rate;
- failure rate;
- flake rate;
- duration;
- critical defects.

## Engineering

- top failing tests;
- top flaky tests;
- top slow tests;
- failure by service;
- failure by environment;
- failure by browser.

## Pipeline

- queue time;
- runtime;
- artifact time;
- worker utilization.

---

# 5.16 Searchable Dimensions

Use:

```text
testId
suite
service
environment
branch
commit
framework
browser
worker
failureCategory
correlationId
```

This enables questions such as:

> Show all payment-service failures for commit X in QA during the last seven days.

---

# 5.17 Observability

Connect:

```text
Test
 ↓
CI job
 ↓
Correlation ID
 ↓
Application logs
 ↓
Trace
 ↓
Messaging
 ↓
Database
```

This is particularly important for microservice failures where the first visible error is not necessarily the root cause.

---

# 5.18 System Design Trade-Offs

## Real services vs mocks

Real:

- realistic;
- expensive;
- potentially less deterministic.

Mocks:

- fast;
- deterministic;
- can hide integration defects.

## Full E2E vs layered tests

Full E2E:

- high realism;
- slow;
- harder to diagnose.

Layered:

- fast;
- localized;
- more engineering work at lower layers.

## Shared vs ephemeral environments

Shared:

- cheaper;
- collision risk.

Ephemeral:

- isolated;
- higher cost.

---

# 5.19 Senior System Design Prompts

1. Design automation for 50 microservices.
2. Test Kafka-based order processing.
3. Test a RabbitMQ workflow.
4. Validate WebSocket-driven UI state.
5. Design a distributed test runner.
6. Design a central QA metrics platform.
7. Design flaky-test detection.
8. Design ephemeral test environments.
9. Design UI + API + DB validation.
10. Design testing for 10,000+ tests.

---

# 5.20 Interview-Ready Answer

> I would first identify the consistency model and failure boundaries. Because the system is asynchronous, I would not use immediate UI assertions as my primary synchronization mechanism. I would combine contract tests for service boundaries, API and service-level integration tests for business transitions, message assertions for Kafka or RabbitMQ, and bounded polling for critical end-to-end state. I would propagate correlation IDs across HTTP, messaging, WebSocket, and application logs so a timeout identifies where the workflow stopped.

## 5.21 References

- https://docs.pact.io/
- https://www.rabbitmq.com/docs/reliability
- https://www.rabbitmq.com/docs/next/confirms
- https://kafka.apache.org/documentation/

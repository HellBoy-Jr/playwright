# SECTION 17 — TESTNG — COMPLETE INTERVIEW SECTION (Refined)

## Topics Covered

- 17.1 Why TestNG through 17.41 Common Mistakes (41 headers)

*Refined header-by-header — full contract*

---

## 17.1-17.5 Basics
Why: JUnit/NUnit-inspired integration/E2E/Selenium; no TestSuite, XML-driven, grouping/parallel/data/depends, `test-output/emailable`; regression/Grid/CI reports; annotations/priority/depends/retries/parallel.
Annotations mark test vs config replacing naming/inherit; inherited order; XML suite/test/classes selective parallel parameterized.
@Test any name void + groups/priority/enabled/timeOut/invocation/expected/dataProvider/depends/description; class-level all; smoke/regression/sanity CI/Jira.
BeforeMethod per-test browser/URL/data/login isolation + Params/groups/onlyForGroups/alwaysRun + DriverFactory. AfterMethod after each even fail/skip alwaysRun + screenshot ITestResult + cookies + quit (no leaks). Symmetric setup/teardown parallel stable.

## 17.6-17.11 Class/Test/Suite
BeforeClass once after BeforeTest expensive shared (browser/DB/props/Pages/token) runtime saver but parallel methods thread-safe else method driver. AfterClass once after all reverse inherit + quit/DB/flush/logs alwaysRun orphans Grid/Jenkins.
BeforeTest before XML `<test>` classes (not Java @Test) params/browser/env/Grid once multi-class (XML vs method trap). AfterTest after XML test shared pool/report/data/env boundary Smoke vs Regression.
BeforeSuite once all suite global props/Grid-Docker/Extent/folders/DB-seed/token BaseTest. AfterSuite once all flush/zip/email/Slack/Grid/Xray/cleanup alwaysRun CI audit.

## 17.12-17.15 Order/Depends
Order Suite>Test>Class>Method>Test>Method>Class>Test>Suite + BeforeGroups first; superclass Before before sub After reversed; alpha unless priority/preserve-order. Essential diagram.
priority lower first negatives/dups alpha (login>search>checkout) ordering not dependency (fail no skip → depends). dependsOnMethods hard skips fail workflow login→order + alwaysRun cleanup; no over-chain (hides cause kills parallel → independent + API preconditions). dependsOnGroups phased gates regression depends sanity/login-group + XML run/include avoids Grid waste.

## 17.16-17.22 Attrs
groups smoke/regression/sanity class/method accumulative + XML run/include/exclude/-groups + regex/meta. enabled toggle true default false SKIPPED clean vs comment/XML but JIRA re-enable. timeOut ms per Test FAILED ThreadTimeout SLA API/load vs invocationTimeOut total; realistic slow env. expectedExceptions pass only if thrown (+MessageRegExp) negative 400/NoSuch/Illegal no try. invocationCount N repeats stability/flake/data + successPercentage tolerance stress. threadPoolSize pool for invocationCount multi-thread safety/load (10/3) vs suite XML methods/thread-count. alwaysRun force despite fail/skip Test cleanup + Before/After setup/teardown quit/rollback/flush no leaks.

## 17.23-17.28 Asserts/Data/Params
Asserts Assert actual/expected FAILED stops + message belongs test not page. Hard immediate blocker vs Soft collect assertAll form/dashboard/schema; forgetting assertAll false pass trap; one per test no static.
DataProvider Object[][]/Iterator per-row decoupled vs hardcoded + dataProviderClass external. parallel=true concurrent large Excel/DB + suite parallel methods + dp-thread-count + ThreadLocal no cross-talk.
Parameters inject XML simple browser/URL/env/creds no recompile + Optional default CI; names/order match. XML scoped suite>test>class>methods narrower overrides + QA/UAT/Prod Maven + secrets CI not committed.

## 17.29-17.33 Listeners/Retry
Listeners intercept no pollution ITest/ISuite/Invoked/IReporter/Transformer via @Listeners/XML/ServiceLoader/CLI; central shots/Extent.
ITest Start/Success/Failure/Skipped/Start/Finish + shots/Jira/Xray thread-safe + Adapter partial. ISuite Start/Finish once per suite global Extent/DB/env/email/Slack + ExecutionListener JVM timing. Invoked before/after every incl configs timing/retry/ThreadLocal/mask + isTestMethod guard.
Retry IRetryAnalyzer counter 2-3 flaky UI/network only never assert + Transformer global + log reports.

## 17.34-17.41 XML/Parallel/Context
XML suites/tests/classes/methods/groups/params/parallel/listeners preserve-order/thread-count/dp-count/Params; separate smoke/regression/parallel-grid CI.
Parallel methods fastest isolation / classes same thread / tests per tag / instances per factory + DP parallel; CI methods 8 + Grid.
Safety shared JVM static/driver/collections/listeners → ThreadLocal/local/sync/CHM + no shared + pool stress.
Context ITestContext per test + ISuite suite set/get token vs statics + ITestResult per-method + ThreadLocal cleanup AfterMethod.
Reporting IReporter/ITestListener steps/shots/Reporter.log + SuiteListener flush + Jenkins/Allure emailable + suite/browser/env tags.
Snippets registration 3 ways + ThreadLocal factory + retry+transformer global + context handoff + Surefire suiteXmlFiles minimal.
Scenarios shots-failure? retry 2x? smoke vs regression? parallel solo-pass? → listener+XML+ThreadLocal + shared/dependency/order + audit logs/evidence/quarantine.
Mistakes static parallel, retry real bugs, heavy listeners slow, no remove leak, hardcode XML not Params, preserve false dependents, swallow throwable. Fix isolate/limit/lightweight/null-safe + cleanup quit+remove.

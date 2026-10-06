# SECTION 7 — EXCEPTIONS AND ERROR HANDLING

## Topics Covered
- 7.1 Checked, 7.2 Unchecked, 7.3 try/catch/finally, 7.4 throw, 7.5 throws, 7.6 Custom, 7.7 Chaining, 7.8 Multi-Catch, 7.9 Try-with-Resources, 7.10 Handling in Automation, 7.11 Framework Strategy, 7.12 Bad Patterns, 7.13 Interview Qs

*Built with dedicated subagent, internet-validated*

---
## 7.1 Checked
Compile-time, must handle/throws: IOException, SQLException, InterruptedException. Excel/props/DB/sleep. Handle once at utils, wrap to unchecked. No empty catch.
## 7.2 Unchecked
RuntimeException no declare: NPE, NoSuchElement, Stale, IllegalArg. Selenium almost all unchecked → waits/retries. Validate `requireNonNull`, fail-fast.
## 7.3 try/catch/finally
Try risky, catch specific→generic order, finally always runs cleanup (quit driver). Log with context, not printStackTrace. Prefer try-with-resources.
## 7.4 throw
Throws single instance for validation/fail-fast/wrap. `throw new FrameworkException("click:"+b,e)`. throw=action vs throws=declaration.
## 7.5 throws
Declares checked to caller `throws IOException`. Avoid `throws Exception` on Page methods. Override cannot broaden checked.
## 7.6 Custom — Production Base
```java
public class FrameworkException extends RuntimeException {
  private final String errorCode;
  public FrameworkException(String code, String msg) { super("[" + code + "] " + msg); this.errorCode = code; }
  public FrameworkException(String code, String msg, Throwable cause) { super("[" + code + "] " + msg, cause); this.errorCode = code; }
  public String errorCode() { return errorCode; }
}
// Use: throw new FrameworkException("ELEM-001", "Click failed: " + by + " @ " + driver.getCurrentUrl(), e);
```
Enterprise: single unchecked type → uniform listener/retry/JIRA categorization at 5000+ scale. Triage: missing cause → check wrapper; wrong code → ErrorCodes enum audit.
## 7.7 Chaining
`new FrameworkException(ctx,e)` preserves root. log.error(msg,e), getCause for JIRA. Never `new Exception(e.getMessage())`.
## 7.8 Multi-Catch
`catch(Timeout|NoSuch e)` same recovery, types unrelated, e final. DRY screenshot+retry+fail. Separate when recovery differs.
## 7.9 Try-with-Resources
AutoCloseable reverse close, suppressed via getSuppressed. POI/props/DB/logs. `try(InputStream is=...;BufferedReader br=...)`.
## 7.10 Automation
NoSuch=bad locator, Stale=DOM refresh, ClickIntercepted=overlay, Timeout=short wait, SessionNotFound=quit. Wait+retry stale once, wrap to FrameworkException with locator+URL+screenshot.
## 7.11 Strategy — Centralized (Utils throw, Listener handles, Retry flaky only)
```java
public class TestListener implements ITestListener {
  @Override public void onTestFailure(ITestResult r) {
    Throwable t = r.getThrowable();
    String code = (t instanceof FrameworkException fe) ? fe.errorCode() : "UNKNOWN";
    LoggerFactory.getLogger(TestListener.class)
      .error("FAIL {} [{}]: {}", r.getName(), code, t.getMessage(), t);
    Allure.addAttachment("screenshot", "image/png", screenshotBytes(), "fail");
  }
}
public class FlakyRetry implements IRetryAnalyzer {
  private int count = 0; private static final int MAX = 1;
  @Override public boolean retry(ITestResult r) {
    Throwable t = r.getThrowable();
    boolean flaky = t instanceof FrameworkException fe &&
      Set.of("STALE-01", "TIMEOUT-01").contains(fe.errorCode());
    return flaky && count++ < MAX;
  }
}
```
Rules: never try/catch in @Test except assertThrows; fail-fast config errors; ErrorCodes enum for JIRA. Triage: retrying asserts → check allowlist; duplicate screenshots → move to listener only.
## 7.12 Bad
Empty catch, catch Exception, printStackTrace, throws Exception, System.exit, catch Throwable, return null, sleep+ignore Interrupt, log then rethrow no chain, screenshot everywhere.
## 7.13 Qs
checked vs unchecked Selenium ex? throw vs throws? final/finally/finalize? try without catch? catch order? chaining/suppressed? Stale handling? Custom design? expectedExceptions/assertThrows + retry stale snippet.

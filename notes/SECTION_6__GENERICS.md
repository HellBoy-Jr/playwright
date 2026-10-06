# SECTION 6 — GENERICS

## Topics Covered
- 6.1 Why Generics, 6.2 Generic Classes, 6.3 Generic Methods, 6.4 Bounded Type Parameters, 6.5 ?, 6.6 ? extends, 6.7 ? super, 6.8 PECS, 6.9 Generic Collections in Framework, 6.10 Generic Utility Methods, 6.11 Interview Qs

*Built with dedicated subagent, internet-validated*

---
## 6.1 Why
Compile-time safety, no casts, reuse. One BasePage/ApiClient/JsonUtils for all types. `List<String>` catches mismatch early, erasure single bytecode.
## 6.2 Classes + 6.10 Utils — Production Skeleton
```java
public abstract class BasePage<T extends BasePage<T>> {
  protected final WebDriver driver; protected final WebDriverWait wait;
  protected BasePage(WebDriver d) {
    this.driver = Objects.requireNonNull(d);
    this.wait = new WebDriverWait(d, Duration.ofSeconds(10));
  }
  @SuppressWarnings("unchecked") protected T self() { return (T) this; }
  public T click(By by) {
    try { wait.until(ExpectedConditions.elementToBeClickable(by)).click(); }
    catch (TimeoutException e) { throw new FrameworkException("TIMEOUT-01", "Click " + by, e); }
    return self();
  }
}
public class ApiClient {
  private final RequestSpecification spec;
  public ApiClient(RequestSpecification s) { this.spec = s; }
  public <T> T get(String path, Class<T> clazz) {
    return given().spec(spec).when().get(path)
      .then().statusCode(200).extract().as(clazz); // Class<T> token: T.class illegal after erasure
  }
  public static <T> void copyResults(List<? extends T> src, List<? super T> dest) { dest.addAll(src); } // PECS
}
```
Triage: `ClassCastException` self-type → subclass must `extends BasePage<LoginPage>`; `T.class` compile error → pass `Class<T>`. Anti: raw `List`, `new T()`, overload `foo(List<String>)/foo(List<Integer>)` same erasure.
## 6.3 Methods
`<T>` before return independent of class: `waitFor(Supplier<T>)`, `fromJson(json,Class<T>)`. Inferred or `Utils.<User>parse`.
## 6.4 Bounded
`<T extends Bound>` unlocks methods, multi `<T extends Number & Comparable<T>>`. `<T extends BaseDTO>` enforces validate(), `<T extends BasePage<T>>` navigation.
## 6.5 ?
`List<?>` unknown read-only Object get, no add except null. Accepts List<User>/Integer (invariant). For logging/size/reporters.
## 6.6 ? extends
Covariant read: `List<? extends Number>` get as Number, no add. Producer: test data read, assert lists.
## 6.7 ? super
Contravariant write: `List<? super Integer>` add Integer, get Object. Consumer: sink, copy dest, Comparator.
## 6.8 PECS
Producer Extends Consumer Super (Bloch). `copy(src extends T, dest super T)`. Read src write dest.
## 6.9 Collections
`List<User>`, `Map<String,String>`, `Queue<ITestResult>`. No raw types. JSON list via `jsonPath().getList("",User.class)` (erasure needs token). Diamond, List.of.
## 6.10 Utils
`<T> T get(path,Class<T>)`, `<T extends BasePage<T>> T open(Class<T>)` via reflection. Pass Class<T> because T.class illegal.
## 6.11 Qs
Erasure? List<Object> vs List<?>? <T> vs <?>? PECS example? Overload List<String>/Integer? No same erasure. extends write fail, Class token.

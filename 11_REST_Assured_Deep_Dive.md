# REST Assured Deep Dive — Senior SDET Interview

## 1. API Automation Architecture

```text
Tests
 ↓
API Clients
 ↓
Request Specification
 ↓
Authentication Provider
 ↓
REST Assured
 ↓
Service
```

Avoid putting raw REST Assured calls in every test.

---

# 2. Request Specification

```java
public final class RequestSpecFactory {

    private RequestSpecFactory() {}

    public static RequestSpecification create(
            String baseUri,
            AuthProvider authProvider) {

        return new RequestSpecBuilder()
                .setBaseUri(baseUri)
                .setContentType(ContentType.JSON)
                .setAccept(ContentType.JSON)
                .addHeader(
                        "Authorization",
                        "Bearer " +
                        authProvider.token()
                )
                .build();
    }
}
```

---

# 3. OAuth2 Token Provider

```java
public interface AuthProvider {
    String token();
}
```

```java
public final class OAuthTokenProvider
        implements AuthProvider {

    @Override
    public String token() {

        return given()
                .contentType(ContentType.URLENC)
                .formParam(
                        "grant_type",
                        "client_credentials"
                )
                .formParam(
                        "client_id",
                        clientId
                )
                .formParam(
                        "client_secret",
                        clientSecret
                )
        .when()
                .post(tokenUrl)
        .then()
                .statusCode(200)
        .extract()
                .path("access_token");
    }
}
```

Production concerns:

- token expiry;
- concurrent refresh;
- secret management;
- no token logging;
- environment switching.

---

# 4. Token Cache Design

Do not request a new token for every API test if tokens are safely reusable.

Concept:

```text
token cache
 ↓
valid?
 ├── yes → reuse
 └── no  → refresh
```

For parallel tests:

```text
synchronized refresh
+
double-check expiry
```

This prevents a token-refresh stampede.

---

# 5. API Client

```java
public final class UserApi {

    private final RequestSpecification spec;

    public UserApi(
            RequestSpecification spec) {

        this.spec = spec;
    }

    public Response createUser(
            CreateUserRequest request) {

        return given()
                .spec(spec)
                .body(request)
        .when()
                .post("/users");
    }

    public Response getUser(String id) {

        return given()
                .spec(spec)
        .when()
                .get("/users/{id}", id);
    }
}
```

---

# 6. Response Validation

```java
Response response =
        userApi.createUser(request);

response.then()
        .statusCode(201)
        .body(
                "email",
                equalTo(request.email())
        );
```

Validate:

```text
status
headers
schema
business fields
invariants
```

---

# 7. JSON Schema Validation

REST Assured provides a dedicated JSON schema validator module. citeturn264812search10turn264812search11

```java
response.then()
        .assertThat()
        .body(
            matchesJsonSchemaInClasspath(
                "schemas/user.json"
            )
        );
```

Schema + business assertions are complementary.

---

# 8. Serialization / Deserialization

POJO request:

```java
public record CreateUserRequest(
        String name,
        String email) {
}
```

Use:

```java
given()
    .spec(spec)
    .body(request)
.when()
    .post("/users");
```

Deserialize:

```java
UserResponse response =
        given()
                .spec(spec)
        .when()
                .get("/users/{id}", id)
        .then()
                .statusCode(200)
                .extract()
                .as(UserResponse.class);
```

This avoids scattered JSON string manipulation.

---

# 9. JSONPath

```java
String id =
        response.jsonPath()
                .getString("user.id");
```

Nested:

```java
String city =
        response.jsonPath()
                .getString(
                    "user.address.city"
                );
```

For arrays:

```java
List<String> ids =
        response.jsonPath()
                .getList(
                    "users.id"
                );
```

---

# 10. ResponseSpecification

```java
ResponseSpecification common =
        new ResponseSpecBuilder()
                .expectContentType(
                        ContentType.JSON
                )
                .build();
```

Use for common expectations.

Do not put every business assertion into a global response specification.

---

# 11. Idempotency

Understand:

```text
GET → safe/read
PUT → generally idempotent
DELETE → generally idempotent
POST → generally non-idempotent
```

Always qualify with the actual API contract.

A retry is safe only when the operation's semantics tolerate retrying.

---

# 12. Parallel REST Assured

Parallel safety requires:

- immutable request specs where possible;
- isolated request data;
- thread-safe test context;
- safe token handling;
- no mutable static state.

Example TestNG:

```java
@DataProvider(
        name = "requests",
        parallel = true
)
public Object[][] requests() {
    return ...
}
```

---

# 13. API Test Layering

```text
HTTP contract
 ↓
schema
 ↓
business rule
 ↓
service integration
 ↓
UI workflow
```

Don't validate every API behavior only through UI.

---

# 14. API Test Data

Prefer API setup:

```text
create user
create order
create payment
```

Then drive UI with prepared state.

This reduces E2E runtime and improves failure diagnostics.

---

# 15. API Debugging

Capture safely:

- endpoint;
- method;
- status;
- sanitized headers;
- correlation ID;
- sanitized payload;
- response body;
- latency.

Never log:

- client secrets;
- passwords;
- authorization headers;
- sensitive customer data.

---

# 16. REST Assured Interview Questions

1. RequestSpecification vs ResponseSpecification?
2. How do you manage OAuth2?
3. How do you avoid requesting a token for every test?
4. How do you validate JSON schema?
5. How do you build reusable API clients?
6. How do you handle parallel tests?
7. How do you handle retries?
8. Explain idempotency.
9. Serialization vs deserialization?
10. How would you combine API and UI testing?

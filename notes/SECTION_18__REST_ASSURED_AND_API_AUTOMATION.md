# SECTION 18 — REST ASSURED AND API AUTOMATION (Refined)

## Topics Covered

- 18.1-18.42 (42 headers)

*Refined header-by-header — full contract*

---

## 18.1-18.14 Basics
API contract client-server HTTP JSON/XML; REST Fielding stateless/cacheable/layered/uniform resources URIs + HATEOAS independent evolution. CRUD safety/idem/cache: GET/HEAD/OPTIONS safe+idem, PUT/DELETE idem, POST/PATCH not; Allow + 405 + PUT/DELETE retry safe.
Codes 2xx/3xx/4xx/5xx 200/201/204/400/401 vs 403/404/409/422/429/500; never 500 invalid; exact not just 200. Headers Auth/Content-Type/Accept/If-None-Match + Location/ETag/Retry-After/WWW-Auth; json + Location 201 + 415; stateless per-msg.
Query filter/sort/page optional visible cache-key; defaults/invalid/bounds/combined/encoding/unknown 400-or-ignore; never secrets. Path `/{id}` mandatory identity 404 not 500, type/auth IDOR; identity path vs filter query.
Body POST/PUT/PATCH JSON + Content-Type; schema/required/types/bounds/null/malformed 400; GET/DELETE no body; PUT full vs PATCH partial; large/UTF-8. Response representation+metadata/links; schema/types/required/values/empty-vs-null/error code/msg; 204/304 no body; pagination; 200 never success:false → 4xx.
Auth identity vs authz: Basic Base64, API key, Bearer JWT, OAuth2 delegated, cookies; Basic/keys weak w/o HTTPS/rotation/scopes; missing/invalid/expired 401 low-priv 403 no leak. Bearer holder-gets RFC6750; OAuth2 creds/code/refresh short scopes; expiry/refresh/scope 403/missing 401 WWW-Auth + HTTPS. Cookies Set-Cookie auto JSESSIONID HttpOnly/Secure/SameSite violates stateless; login sets expiry/tamper 401 CSRF.
RA Java DSL TestNG/JUnit/Hamcrest/JSONPath BDD auth/specs/logging/schema; baseURI/path + specs; fluent/extract/data/CI not Postman. Given preconds → When method → Then status/headers/body/time/extract + log/Hamcrest; setup-exec-verify + negative.

## 18.15-18.28 Specs/POJO/Token
RequestSpec central baseURI/path/headers/auth/type/filters once Builder shared spec/global per-domain immutable no hardcode timeouts/logging parallel-safe. ResponseSpec common status/type/headers/time/schema Builder layered 200/201/4xx; business tests not specs.
Builders parameterized query/path/headers/cookies/multipart/auth/bodies fluent `list(status,page)` over dup; validate early default JSON encode externalize secrets; readable data maint version/auth rotate.
Client domain Auth/Order/Payment business Response/POJO hiding DSL; own paths/specs/ser/errormap; tests orchestrate/assert; ctor spec + refresh/retries/corrID; scales/mocks/parallel/Allure.
Response return then validate/extract/map: status/type first jsonPath/as/TypeRef empty/error extract.response chaining no double-call corrID log 4xx/5xx custom error code/msg raw debug reuse.
Ser POJO/record→JSON Jackson/Gson `.body(obj)` + Property/Include/IgnoreProperties/formats/builders; pin Mapper central no Map contracts required pre-validate Faker/Instancio reviews. Deser JSON→POJO `.as/TypeRef/JsonPath` separate DTOs tolerant ignoreUnknown unless strict naming/JavaTimeModule status/type before map key asserts dump wrap; typed chaining IDs/tokens.
JSONPath/GPath filter/project/agg w/o deser `findAll{price<10}.title/getList/getInt` root-path Groovy over Jayway float/BigDecimal null-safe; inline contract/dynamic/chaining/negative.
Schema `matchesJsonSchemaInClasspath` types/required/enums/formats/ranges Draft4/7 checkedValidation + status/critical; schemas/ versioned fail-fast strict provider vs lenient consumer CI.
Asserts layered protocol status/headers/type/time + contract schema/required + business values/transitions/DB/events; Hamcrest equalTo/hasItems/contains/lessThan multi-body soft independent one concept/test descriptive no conditionals time lessThan error positive no false-green.
Logging `log().all/ifValidationFails` + Request/ResponseFilter specs central audit; failure default DEBUG/failed-listener; blacklist Auth/cookies LogConfig persist Allure/Extent; never secrets/PII/prod.
Token OAuth2/creds fetch/cache expiry buffer/attach/401-refresh-once-retry; synchronized cache scopes/rotation/service-accts per env; vault/env blacklist logs; expiry/invalid/missing/scope explicit parallel-stable.
Config central timeouts/URIs/ports/proxy/SSL/encodings/mapper/JSON `RestAssured.config()` + TestConfig props/YAML typed getters defaults fail-fast; JsonConfig BIG_DECIMAL/Encoder/HttpClient timeouts once; code-free versioned DI/props containers.
Env dev/qa/stage/prod ENV prop/profiles `application-{env}.properties` baseUri/creds/flags/seeds runtime `forEnv` no URL branch parallel matrix; prod read-only smoke approval; log env/build traceability.

## 18.29-18.42 Advanced/Events/Sandbox
Data isolated repeatable not shared static: factory+faker+API seed before + cleanup after unique emails/IDs parallel-safe version JSON mask PII.
Idempotency repeat same effect once: GET/PUT/DELETE natural; POST Idempotency-Key → double one same ID no duplicate charges.
Retry client backoff 502/503/timeout vs idempotency server harmless; never blind POST w/o key; only idem/keyed max3 jitter.
Safety shared JVM static Response/Map/specs flaky → immutable clients no statics locals sync minimal parallel methods 4 validate.
ThreadLocal per-thread token/spec/data Before set After remove no leaks; parallel API+UI essential.
Hybrid fast API setup/teardown + UI true E2E 70% cut: API create → Playwright checkout + DB API; token storage-state share.
Contract consumer-provider schema w/o integration: Pact/Spring/Schemathesis provider verify CI fail breaking + E2E complement.
Structure Maven config/clients/models/tests/utils + resources/testdata/schemas/wiremock parallel CI review reuse squads.
Snippets spec/auth/schema/retry BaseTest/fixtures not copy; probe logging/assert quality.
Qs flaky/data-cleanup/idempotency/parallel/contract vs E2E STAR metrics flake-30% time-50% + logs/Allure/gate; POST payment unique key double same-ID DB.
Debug reproduce + req/res logs + status vs schema vs business + env/data/auth; 401 expired/409 dup/429 throttle/stale stub.
GraphQL single `/graphql` query/mutation data/errors[]; schema/vars/unauth field; REST auth+ThreadLocal reuse.
Events async eventual: Testcontainers/Awaitility poll consumer payload/headers + DLQ/retry poison.
WireMock downstream payments/CRM isolated CI chaos/contract-free frontend; Docker/Testcontainers version mappings Git + verify interactions.

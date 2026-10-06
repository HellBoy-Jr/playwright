# SECTION 0 — INTERVIEW STRATEGY

## Topics Covered

- 0.1 Deloitte Role Expectations
- 0.2 Senior SDET Competency Matrix
- 0.3 Interview-Round Strategy
- 0.4 Technical vs Scenario-Based Questions
- 0.5 Project Deep-Dive Strategy
- 0.6 Coding-Round Strategy
- 0.7 Automation Architecture Strategy
- 0.8 Behavioral / Leadership Questions
- 0.9 STAR Answer Structure
- 0.10 Questions to Ask the Interviewer
- 0.11 Final Interview Checklist
- 0.12 Current Baseline and Gaps

*Generated from Deloitte Senior SDET Modular Prompts file — Section 0 built one-header-at-a-time with parallel subagent research + internet validation*

---

## 0.1 Deloitte Role Expectations

Deloitte hires Senior SDET / Senior Test Automation Engineer typically at **Senior Consultant / Specialist Senior** level — a billable, client-facing engineering owner, not a back-office tester. You are expected to deliver automation outcomes on client engagements while upholding Deloitte engineering and consulting standards.

- **Consulting mindset + client delivery ownership:** own workstream delivery — scope, plan, estimate, report status, manage risks/issues, and adapt to client processes. *Why it matters:* interview probes whether you can operate without hand-holding in ambiguous client environments.
- **Automation architecture, not just scripts:** design scalable Playwright / Selenium / RestAssured frameworks (Page Objects, fixtures, data/test management, parallelization, reporting) with code quality (SOLID, linting, reviews). *Why it matters:* separates Senior from mid-level script writer.
- **Shift-left + CI/CD integration:** embed quality into pipelines (GitHub Actions / Jenkins / Azure DevOps), quality gates, flaky-test triage, environments/test data strategy. *Why it matters:* Deloitte sells engineering excellence and delivery velocity, not manual regression.
- **Stakeholder communication & eminence:** translate technical risk into business impact for Product Owners, dev leads, and client leadership; mentor juniors, contribute to CoPs, reusable assets, and proposals. *Why it matters:* Senior Consultants are judged on influence and leverage.
- **Delivery rigor (billable + compliance):** timesheet discipline, SOW alignment, audit-friendly documentation, defect SLA governance, Agile ceremonies (Jira/Xray/Zephyr). *Why it matters:* proves you understand consulting economics vs. product-company QA.

**What interviewers listen for:** end-to-end ownership stories ("client had X, I proposed Y, delivered Z with metrics"); framework design trade-offs; CI stability practices; how you pushed back on / influenced devs and clients; mentoring and review rigor.

**Trap points / anti-patterns to avoid:**
1. **"I only automate what devs/QA lead tell me"** — signals lack of consulting proactivity; instead show you defined strategy, ROI, and coverage priorities.
2. **"100% automation / zero defects" claims** — naive and non-credible in large client programs; talk risk-based coverage, flakiness budgets, and escaped-defect analysis.
3. **Bad-mouthing clients or blaming devs for quality** — Deloitte values client-centricity; frame conflicts as alignment, trade-offs, and joint quality ownership.

---

## 0.2 Senior SDET Competency Matrix

Senior at Deloitte = independent automation owner who can design frameworks, debug CI failures, and mentor juniors — not just write scripts.

| Competency | Expected Senior Level | How Deloitte Tests It |
|---|---|---|
| Java + DSA | OOP, collections, strings, exception handling; Easy-Medium DSA | Live coding: reverse string, duplicates, wait-retry logic |
| Selenium / Playwright | Waits, locators, windows/frames, parallel runs | Design POM + explain flakiness fixes; 100-page scaling Q |
| Framework Design | POM, TestNG, Maven/Gradle, config, reporting, utilities from scratch | "Explain your framework end-to-end" + whiteboard it |
| API Testing | REST Assured, auth, schema/status validation, chaining | Code GET/POST + validate JSON; API vs UI coverage tradeoff |
| TestNG + Reporting | Annotations, groups, parallel, retry, Extent/Allure | `staleElement`, parallel failure debugging scenario |
| CI/CD | Git, Jenkins/GitHub Actions, Docker basics, pipeline ownership | "Pipeline is red — walk me through triage" |
| SQL | Joins, aggregates, test-data setup/verification | Write join + verify UI/API vs DB |
| Debugging + System Design | Logs, root-cause, env/test-data isolation, microservice awareness | Techno-managerial: flaky suite + defect leakage case |
| Leadership / Agile | Mentoring, estimation, client communication, Jira/TestRail | Behavioral: conflict, missed deadline, mentoring example |

**Must-have (screen-out if weak):** Java OOP + Selenium/Playwright fluency, POM + TestNG framework built hands-on, API testing, Git + Jenkins, SQL joins, defect lifecycle/Agile.

**Differentiators (Senior → Lead signal):** Playwright + API + DB integrated framework, CI pipeline ownership + Docker, performance/security basics (JMeter, OWASP), BDD/Cucumber with client-facing communication, mentoring and test-strategy decisions.

**Anti-patterns to avoid:**
1. **Tool-only knowledge:** Can click/record in Selenium or Postman but cannot code framework utilities, waits, or retry logic in Java from scratch.
2. **No debugging narrative:** Blames "environment issue / flaky test" without logs, root-cause analysis, quarantine strategy, or CI triage steps.

---

## 0.3 Interview-Round Strategy

Typical Deloitte Senior SDET loop has **4–5 rounds over 2–3 weeks**:

| Round | Focus | Duration | Evaluator lens |
|---|---|---|---|
| 1. HR / Recruiter screen | Fit, notice period, CTC, Selenium/Java years, Agile exposure | 15–20 min | Filter: communication + must-have keywords |
| 2. Online assessment (often AMCAT/HackerRank) | Aptitude, Java output, SQL, 1–2 coding Qs, Selenium/API MCQs | 60–90 min | Baseline coding + automation literacy |
| 3. Technical R1 – Coding + Core automation | Java/DSA (Strings, Collections), Selenium waits/handles, TestNG, REST Assured, SQL joins | 45–60 min | Can you code live and debug flaky tests? |
| 4. Technical R2 – Framework deep-dive | Framework architecture you built, POM/BDD, CI/CD (Jenkins/Azure), parallelization, defect triage, performance basics | 45–60 min | Senior signal: design decisions, scalability, metrics |
| 5. Managerial + Behavioral / Partner | Leadership, estimation, stakeholder handling, Deloitte values, situational judgment | 30–45 min | Client-readiness + ownership |

### Strategy per round

- **R1–R2:** Emphasize live coding fluency (Java 8+, locators, waits), API + DB validation, and one framework story end-to-end. Avoid tool-listing without depth; always add *why* (e.g., why FluentWait over sleep, why RestAssured over Postman for CI).
- **R3–R4 (Deep-dive):** Emphasize architecture diagram, parallel execution, reporting (Extent/Allure), and quality metrics (flaky-rate, coverage). Avoid blaming devs/QA; show triage process and prevention.
- **Managerial:** Emphasize Agile ceremonies, effort estimation, mentoring juniors, and a conflict-resolution STAR story. Avoid salary/role negotiation here — redirect to HR.

### Time allocation tip

Split prep **40% Technical R1 (coding + Selenium/API live practice), 35% Framework deep-dive (your project story + CI/CD), 15% Managerial STAR stories, 10% HR pitch + Deloitte research**. In each answer, use 60/30/10: 60% solution, 30% trade-off, 10% result/metric.

---

## 0.4 Technical vs Scenario-Based Questions

**How to distinguish:** Technical Qs test *knowledge* — `workers vs sharding`, `retry logic`, `Page Object vs fixtures`. They want a precise definition + command/config. Scenario Qs test *judgment* — "suite was green, now 12% flaky under release pressure, what do you do?" They want triage under constraints, not a textbook answer.

**Answer structures:**
- *Technical:* Definition in 1 line → concrete syntax/config → constraint/trade-off. E.g. "Sharding splits tests across CI runners (`--shard=1/4`); workers parallelize within one runner. Total parallelism = shards × workers; limit workers by CPU/RAM."
- *Scenario:* Clarify scope → Triage (reproduce, isolate, quarantine) → Root-cause categories (test, data, infra, app) → Fix + prevention with metrics. Always quote numbers: flake rate, runtime, retries.

**3 Example scenarios + skeletons:**

1. *"Test passes locally, fails 1-in-8 in CI — how do you handle it?"* Check history/traces to confirm flakiness, quarantine + file ticket so main stays green. Then classify: async wait, shared state, or infra drift; fix with auto-wait/locator, isolated test data, track retry rate.
2. *"Tests pass serially but fail with 4 workers — why?"* Suspect shared state: same user/data, global token, file/DB collision. Fix: each test creates/owns its data (API setup + teardown), remove order dependencies, add tagging to separate stateful/slow tests.
3. *"800-test suite takes 90 min — scale it without losing signal?"* Profile first, then split: API for setup + critical-path UI only, shard across runners + merge blob reports. Add flake-detection pipeline (per-test failure rate over rolling 14d) with auto-quarantine and <2% flake SLO.

**Common mistake:** Reciting definitions ("flaky means unstable") vs showing triage. Seniors must narrate: *signal protection first, root cause second, systemic prevention third* — quarantine, isolate, measure, then fix.

---

## 0.5 Project Deep-Dive Strategy

Pick **one** Playwright + TypeScript project you owned end-to-end. Deloitte Senior SDET deep-dive tests ownership, architecture reasoning, and quantified impact — not tool listing.

**5-Minute Narrative Template (C-A-S-C-I):**

1.  **Context (45s):** Business problem + your role. *E.g., "Regression for claims portal took 3 days manual; I owned automation for 4 scrum teams as SDET lead."*
2.  **Architecture (90s):** Draw it verbally: `Playwright + POM + fixtures -> API helpers (Axios) -> Test data (Faker/DB seeds) -> CI (Jenkins/GitHub Actions, sharded) -> Reports (Allure + Teams/Slack)`. Call out design choices: POM vs. App Actions, `storageState` for auth, env-based `playwright.config.ts`, parallel workers + retries.
3.  **Scale (45s):** Quantify: apps, envs, browsers, integrations.
4.  **Challenge (60s):** One hard problem + root cause + fix. *E.g., "35% flake from dynamic locators + shared env data → moved to `getByRole`, auto-wait, isolated API-seeded data + tagged smoke/regression."*
5.  **Impact (30s):** Before → After with numbers + lesson.

**Metrics to Quote (have 4-5 ready):**
* Suite size: `# specs / # tests, % API vs UI vs contract`
* Runtime: `e.g., 4h serial → 25 min on 8 shards in CI`
* Flake rate: `e.g., 30% → <2% over 30 runs` + quarantine policy
* Coverage / Quality: `% regression automated, defect escape rate, MTTR, P1 leakage`
* Efficiency: `manual effort saved (hrs/sprint), CI pass rate >95%`

**Follow-up Traps to Prepare:**
* "Why Playwright over Selenium/Cypress?" → auto-wait, tracing, network interception, multi-tab/API in one runner.
* "How do you handle flaky tests?" → quarantine, retry with evidence (trace/video), root-cause buckets, delete don't ignore.
* "Parallel + data collision?" → unique users per worker, API setup/teardown, no shared state.
* "What would you do for 10x scale?" → sharding + container grid, contract tests to cut E2E, visual + accessibility layer, SLI: pipeline duration / flake budget.

---

## 0.6 Coding-Round Strategy

Deloitte Senior SDET coding rounds are typically 1-2 Java problems in 30-45 mins on strings, arrays, and HashMap logic — not hard LeetCode, but clean code + Big-O narration under pressure.

### Problem-Solving Framework: C-E-B-O-T

1. **Clarify (2 mins):** Restate the problem. Ask: input size? null/empty allowed? case-sensitive? sorted? duplicates? mutable? Confirm examples.
2. **Edge Cases:** List null, empty, single element, all duplicates, large n, special chars. State how you will handle them.
3. **Brute Force First:** State naive solution explicitly. E.g., "Brute is nested loops, O(n²) time, O(1) space." Code it mentally but don't write yet.
4. **Optimize:** Identify bottleneck — repeated lookup? re-scanning? Replace with HashMap/Set or two-pointers/sliding window. State new complexity before coding.
5. **Test Dry-Run:** Trace with 2 examples: happy path + edge case. Check off-by-one, NPE, integer overflow.

### How to Narrate Big-O and Trade-offs Aloud

> "I'll use a HashMap to store char counts — that trades O(n) space for O(n) time instead of O(n²). For 10^5 inputs that's worth it; for embedded/low-memory I'd sort in O(n log n) with O(1) space."

Always state: time, space, why this trade-off fits test-automation scale (large logs, datasets). If asked to improve, name the alternative and when you'd pick it.

### 3 Frequent SDET Coding Patterns to Master

1. **HashMap Frequency Counting:** Two Sum, valid anagram, first non-repeating char, duplicate detection, group anagrams. Know `getOrDefault()`, `merge()`. Core for log/data validation problems.
2. **Two-Pointers + Sliding Window:** Reverse string/array in-place, palindrome check, remove duplicates from sorted array, longest substring without repeats, container / pair sum in sorted array. Master `left/right` movement and while-condition.
3. **String/Array Parsing & Manipulation:** Reverse words, compress string, missing number, rotate array, second largest, count vowels/consonants. Practice `StringBuilder`, `toCharArray()`, in-place swaps, null/empty guards. Write JUnit-style test inputs without prompting.

---

## 0.7 Automation Architecture Strategy

**How to whiteboard it (5-min draw — top-down, left to right):**
```
[Test Layer: TestNG/JUnit + Cucumber/REST]
   ↓ calls
[Business/Page Layer: POM Page Objects + API Clients + Reusable Flows]
   ↓ uses
[Core Framework: DriverFactory(ThreadLocal) | ConfigReader | WaitUtils | TestDataFactory | Logger]
   ↓ produces
[Support Infra: Extent/Allure Report + Screenshots/Videos → Jenkins/GitHub Actions → Selenium Grid / Docker / Cloud]
```

**Narration script (60 sec):** "Tests contain zero locators or driver calls. Page/API layer encapsulates locators and actions. Core handles cross-cutting concerns. Infra handles parallel execution and reporting. Config via `.properties/.yaml + env vars` for env/browser/grid URL — no hardcoding."

**Key talking points:**
* **Isolation:** Stateless, independent tests — own setup/teardown via `@Before/AfterMethod`, unique test data per run (Faker/API-seeded DB, no shared users), no order dependency, retry only on infra flakes.
* **Thread-safety:** `private static ThreadLocal<WebDriver> tl = new ThreadLocal<>()`; Factory does `create() → get() → quit()+remove()`. Forgetting `remove()` leaks dead sessions on thread-pool reuse. Pair with `parallel="methods" thread-count=6` matched to agent cores.
* **Scale to 5000+:** Shard by historical duration (not alphabetically) across CI matrix/Docker agents; Selenium Grid auto-scale; merge Allure/ReportPortal dashboards; tag `@smoke/@regression/@flaky` for selective runs; fail-fast + quarantine flaky bucket.

**Trade-off Qs to invite (shows Senior thinking):**
* "I used classic POM over PageFactory — `@FindBy` + implicit caching causes `StaleElementException`; do you want me to contrast with Screenplay for >5k tests?"
* "Monorepo vs multi-repo for framework + tests? I prefer versioned core lib + per-service test repos for independent CI."

---

## 0.8 Behavioral / Leadership Questions

Deloitte Senior SDET behavioral rounds test **consulting leadership**: influence without authority, client empathy, and quality ownership under delivery pressure. Expect STAR format, 2–3 min per answer with metrics.

### Top 6 Themes + What Evaluator Scores

**1. Mentoring / Growing QA talent**
*Q: "Tell me about mentoring a junior who struggled with automation."*
Scores: coaching structure, delegation, measurable uplift (e.g., PR rejection rate down 40%).
Anti-pattern: *"I just fixed their code myself to save time."*

**2. Conflict with dev on defect validity / severity**
*Q: "Dev rejected your P1 bug — what did you do?"*
Scores: data-driven persuasion (logs, repro, impact), respect for engineering, win-win resolution.
Anti-pattern: *"I escalated to the manager immediately."*

**3. Tight deadline / release-at-risk call**
*Q: "Describe pushing back on a release under deadline pressure."*
Scores: risk quantification, options offered (scope cut vs. hotfix plan), client-first judgment.
Anti-pattern: *"We tested overnight and hoped for the best."*

**4. Quality advocacy / Shift-left influence**
*Q: "How did you improve quality in a team that neglected testing?"*
Scores: systemic change (CI gates, contract tests, DoD), adoption metrics, persistence.
Anti-pattern: *"I complained quality was not my fault."*

**5. Client / stakeholder communication**
*Q: "Explain a complex quality risk to a non-technical client."*
Scores: clarity, business-impact framing ($, SLA, UX), trust built.
Anti-pattern: *"I sent them the stack trace and test report."*

**6. Failure / Escaped defect ownership**
*Q: "Tell me about a bug that escaped to prod on your watch."*
Scores: accountability, RCA + preventive action (missing coverage, alerting), no blame.
Anti-pattern: *"It was a dev / requirements issue, not QA."*

### Leadership-Without-Authority Framing (Consulting Context)
- **Frame as advisor, not owner:** "As embedded QA in client pod, I had no direct authority over devs, so I led via..."
- **Anchor to client value:** tie every action to velocity, cost of rework, or CSAT — Deloitte scores business impact over test counts.
- **Show enablement:** templates, guild sessions, and self-serve pipelines beat heroics.

---

## 0.9 STAR Answer Structure

Use **STARI** (Situation-Task-Action-Result-Insight) for all Deloitte Senior SDET behavioral answers. Keep to **90 seconds**, end with metrics.

### SDET-Tuned STARI Template

- **S — Situation (15s):** 1-2 sentences. System + scale + stakes. *e.g., "Playwright suite, 800 tests, 3 teams, release blocked."*
- **T — Task (15s):** Your ownership. *e.g., "I owned reducing flakiness and CI time without losing coverage."*
- **A — Action (35s):** 3 steps max, technical + leadership. Tools, root-cause, process change. *e.g., "Quarantined flakes, replaced sleeps with web-first assertions, sharded workers, added trace-on-retry + dashboard."*
- **R — Result (20s):** Quantify with **scale/cost metrics**: flaky % → %, p90 runtime min → min, MTTR, defects escaped, infra cost / developer-hours saved. *e.g., "Flaky 12%→1.5%, p90 45→18 min."*
- **I — Insight (5s):** Transferable principle. *e.g., "Now I gate merges on flaky-budget and auto-quarantine."*

> Formula: *I did X by doing Y, measured by Z.*

### 90-Second Timing Guide

| 0-15s | 15-30s | 30-65s | 65-85s | 85-90s |
|---|---|---|---|---|
| S | T | A (what + why) | R (numbers) | I |
| Don't ramble context | State responsibility | No tool list dump | 2-3 metrics min | Link to Deloitte value |

If interrupted: skip to R.

### Mini Example Outline — Flaky-Test Story

- **S:** E-commerce checkout suite, 500 Playwright tests, 20% nightly failures, team ignoring signals.
- **T:** Cut noise to restore trust before peak release.
- **A:** (1) Tagged + quarantined top-20 flakes via retry analytics (2) Fixed root causes: race conditions, test-data collision, missing network-idle waits (3) Added flaky-budget gate + Slack report + owner rotation.
- **R:** Flaky 20%→2% in 3 weeks, true bugs found +6, CI p90 38→16 min, unblocked daily releases.
- **I:** Flakiness is a process problem — visibility + ownership beats reruns.

---

## 0.10 Questions to Ask the Interviewer

> Always close with 2-3 questions — it signals ownership, not just test execution.

**For Technical Lead / SDET Panel**

1. **How do you triage flaky tests today — quarantine policy, retry budget, and who owns the fix?**
   *Why:* Shows you protect pipeline trust instead of normalizing re-runs.
2. **What does the CI pipeline look like — PR vs nightly gates, parallelization/sharding, and average E2E runtime?**
   *Why:* Shows you optimize for fast feedback and quality gates, not just test count.
3. **What is your test pyramid balance — % unit / API / UI — and where is the biggest gap?**
   *Why:* Shows you think in risk-based strategy and cost-of-testing trade-offs.

**For Engineering Manager**

4. **Is quality owned by SDETs, shared with devs, or embedded — what is the SDET:dev ratio and on-call expectation?**
   *Why:* Shows you probe team topology and accountability before committing.
5. **What does success look like in 90 days — flake rate, coverage, release confidence — and what blocked the last person?**
   *Why:* Shows you target measurable outcomes and learn from prior failures.
6. **How are production defects fed back — do you track escaped-defect rate and do postmortems change test strategy?**
   *Why:* Shows you close the quality loop beyond pre-release testing.

**For HR / Hiring Manager**

7. **What is the automation-first culture here — do devs write tests, and is testability part of Definition of Done?**
   *Why:* Shows you value shift-left culture over a siloed QA team.
8. **What is the growth path — Senior SDET to Lead/Architect — and what learning budget or client exposure does Deloitte offer?**
   *Why:* Shows long-term intent and consulting mindset, not just offer-shopping.

---

## 0.11 Final Interview Checklist

> Goal: walk in calm, tell one strong project story, prove framework + coding depth, close with senior-level questions.

### 24h Before
- [ ] Lock 2-min project story: Domain → Scale (tests, apps, envs) → Your role → Framework built → Impact (time, coverage, flakiness %, release confidence).
- [ ] Redraw framework diagram from memory (Runner → Config → Pages/APIs → Utilities → Reporting → CI) in <5 min.
- [ ] Coding warmup: String/API-hashmap, arrays/two-pointer, OOP + Selenium wait snippet, 1 REST-Assured + 1 Playwright script.
- [ ] Prep 3 STAR stories: flaky-test fix, production bug caught, framework migration / CI integration.
- [ ] Research interviewers on LinkedIn; prepare 3 role-specific questions.

### 1h Before
- [ ] Test audio/video, screen-share, IDE + GitHub ready; keep water + notes handy.
- [ ] Review resume line-by-line — every tool claimed must have a 30-sec example.
- [ ] Rehearse metrics out loud: execution time before/after, parallelization, pass rate.

### During
- [ ] STAR + metrics for every behavioral answer; draw diagram when asked about framework.
- [ ] Think aloud in coding: clarify → edge cases → brute force → optimize → test.
- [ ] Ask clarifying questions for system design (scale, NFRs, environments, test data strategy).

### Closing (Last 5 Min)
- [ ] Ask: QA challenges in current sprint? Automation coverage vs. tech debt? Definition of success in 90 days?
- [ ] Summarize fit in 30 sec + ask next steps and timeline.

### Must-Carry Artifacts
- **Metrics one-pager:** suite size, runtime, flake rate, coverage, defects leaked.
- **Diagrams:** framework architecture, CI/CD pipeline, defect lifecycle.
- **Code links:** GitHub (framework core, custom utils, API + UI samples), sanitized reports (Allure/Extent).

---

## 0.12 Current Baseline and Gaps

Rate 1=aware, 3=project-ready, 5=can teach / design. Fill evidence column before interview.

| Skill | Score (1-5) | Evidence | Deloitte Senior Bar | Gap → Action |
|---|---|---|---|---|
| Java (OOP, exceptions) |  | e.g., POM + utils built | Clean OOP, SOLID, handles edge cases live |  |
| Collections |  | e.g., Map for test data, Set for dedup | Chooses optimal structure + states Big-O |  |
| Selenium |  | e.g., waits, frames, windows | Flaky-proof waits, framework design |  |
| TestNG |  | e.g., parallel, listeners, retry | Custom listener + parallel strategy |  |
| API (RestAssured) |  | e.g., GET/POST, auth, schema check | Auth, chaining, negative + contract tests |  |
| Playwright (TS) |  | e.g., locators, fixtures | Auto-wait, tracing, API+UI in one run |  |
| CI/CD (Jenkins/GitHub) |  | e.g., ran pipeline, reports | Designs pipeline, parallel + env strategy |  |
| SQL |  | e.g., joins, validation queries | Joins + aggregations for test validation |  |
| Debugging / RCA |  | e.g., logs, root-caused flake | Structured RCA: logs → repro → fix → guardrail |  |
| Leadership / Mentoring |  | e.g., reviews, onboarding | Reviews, estimation, stakeholder pushback |  |

**Turn gaps into 2-week plan:**
1. Pick 2 lowest scores only — e.g., Playwright (2→3) + SQL (3→4).
2. Week 1: 30 min/day code reps — 5 Playwright locator/trace labs + 10 SQL joins on sample DB.
3. Week 2: Build proof — push 1 Playwright PR with trace + 1 API+DB validation test to GitHub; add links to resume.
4. Daily: 1 mock Q per gap, STAR format, 2-min limit. Re-score Friday; stop at 3+, don't chase 5.

**Honest gap-framing line:**
> "My depth is Selenium+Java+API; Playwright TypeScript is at 3 — I've built fixtures and trace-enabled suites, and I'm closing to Senior bar with a 2-week shipping plan."

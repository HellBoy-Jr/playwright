# Playwright + TypeScript Deep Dive — Senior SDET Interview

## 1. Browser Model

```text
Browser
  ↓
BrowserContext
  ↓
Page
  ↓
Locator
```

A browser can contain multiple isolated contexts.

A context can contain pages/tabs.

This is a useful mental model for isolation and parallel execution.

---

# 2. Test Fixtures

Playwright Test is built around fixtures. Built-in `page` and `context` fixtures are isolated, and worker-scoped fixtures can provision resources once per worker. citeturn325406search13

Example:

```typescript
import { test, expect } from '@playwright/test';

test('login works', async ({ page }) => {
  await page.goto('/login');

  await page.getByTestId('username').fill('qa-user');
  await page.getByTestId('password').fill('secret');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveURL(/dashboard/);
});
```

---

# 3. Locator Strategy

Preferred:

```text
getByRole
getByLabel
getByPlaceholder
getByTestId
locator
```

Example:

```typescript
const submit =
  page.getByRole('button', {
    name: 'Submit'
  });

await submit.click();
```

Use `data-testid` where the team has explicitly designed stable test hooks.

---

# 4. Locator Chaining

```typescript
const row =
  page.locator('tr', {
    hasText: 'ORD-1001'
  });

await row
  .getByRole('button', { name: 'View' })
  .click();
```

This is often more robust than long XPath expressions.

---

# 5. Auto-Waiting

Playwright actions and web-first assertions incorporate waiting behavior.

Prefer:

```typescript
await expect(page.getByTestId('status'))
  .toHaveText('Completed');
```

over:

```typescript
await new Promise(r => setTimeout(r, 5000));
```

The expectation describes the required state.

---

# 6. Web-First Assertions

```typescript
await expect(locator)
  .toBeVisible();

await expect(locator)
  .toHaveText('Success');

await expect(page)
  .toHaveURL(/dashboard/);
```

Avoid reading a value manually and then sleeping before asserting.

---

# 7. Page Object

```typescript
import { Page, Locator } from '@playwright/test';

export class LoginPage {

  readonly username: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;

  constructor(private readonly page: Page) {
    this.username =
      page.getByTestId('username');

    this.password =
      page.getByTestId('password');

    this.loginButton =
      page.getByRole('button', {
        name: 'Login'
      });
  }

  async open(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(
      username: string,
      password: string
  ): Promise<void> {

    await this.username.fill(username);
    await this.password.fill(password);
    await this.loginButton.click();
  }
}
```

---

# 8. Fixtures + POM

```typescript
import {
  test as base
} from '@playwright/test';

import { LoginPage } from './pages/LoginPage';

type Fixtures = {
  loginPage: LoginPage;
};

export const test =
  base.extend<Fixtures>({
    loginPage: async ({ page }, use) => {
      await use(
        new LoginPage(page)
      );
    }
  });
```

Now the test:

```typescript
test('valid login', async ({
  loginPage,
  page
}) => {

  await loginPage.open();
  await loginPage.login(
    'qa-user',
    'secret'
  );

  await expect(page)
    .toHaveURL(/dashboard/);
});
```

---

# 9. Authentication State

For stateful tests, use a storage-state strategy.

Playwright documents a one-account-per-worker model for tests that modify server-side state. citeturn325406search7

Concept:

```text
worker 1 → account 1 → auth state 1
worker 2 → account 2 → auth state 2
worker 3 → account 3 → auth state 3
```

Avoid one mutable account across parallel tests when tests change server-side state.

---

# 10. Worker Fixtures

Use worker scope for expensive worker-owned resources:

```typescript
type WorkerFixtures = {
  account: string;
};

export const test =
  base.extend<
    {},
    WorkerFixtures
  >({

    account: [
      async ({}, use, workerInfo) => {

        const account =
          await createAccount(
            workerInfo.workerIndex
          );

        await use(account);

        await deleteAccount(account);
      },
      { scope: 'worker' }
    ]
  });
```

---

# 11. APIRequestContext

```typescript
const response =
  await request.post(
    '/api/users',
    {
      data: {
        name: 'John',
        role: 'QA'
      }
    }
  );

expect(response.ok()).toBeTruthy();

const body =
  await response.json();
```

Use API setup to create state instead of driving every setup step through UI.

---

# 12. Network Interception

```typescript
await page.route(
  '**/api/products',
  async route => {

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        products: []
      })
    });
  }
);
```

Use mocking to isolate UI behavior.

Do not mock the complete application and call it E2E.

---

# 13. WebSocket

Design tests around observable message/state transitions.

```text
connect
 ↓
authenticate
 ↓
subscribe
 ↓
trigger event
 ↓
receive expected message
 ↓
validate payload
```

Keep message protocol tests separate from full UI journeys.

---

# 14. Trace

Capture traces on failure:

```typescript
use: {
  trace: 'on-first-retry'
}
```

This creates a diagnostic artifact containing execution information useful for debugging.

---

# 15. Playwright Config

```typescript
import {
  defineConfig
} from '@playwright/test';

export default defineConfig({

  testDir: './tests',

  timeout: 30_000,

  expect: {
    timeout: 5_000
  },

  fullyParallel: true,

  retries: process.env.CI ? 1 : 0,

  workers: process.env.CI ? 4 : undefined,

  use: {
    baseURL:
      process.env.BASE_URL ??
      'http://localhost:3000',

    trace: 'on-first-retry',

    screenshot: 'only-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium'
      }
    }
  ]
});
```

---

# 16. Projects

Use projects to model:

- browsers;
- environments;
- mobile emulation;
- authentication profiles;
- logical suites.

Example:

```typescript
projects: [
  {
    name: 'chromium'
  },
  {
    name: 'firefox'
  }
]
```

Avoid multiplying every test across every project unless the risk justifies the cost.

---

# 17. Sharding

```bash
npx playwright test --shard=1/4
```

Then:

```text
CI
 +-- shard 1
 +-- shard 2
 +-- shard 3
 +-- shard 4
```

Balance shard duration; four equal test counts do not guarantee four equal runtimes.

---

# 18. Dynamic Test Generation

TypeScript:

```typescript
const invalidUsers = [
  { username: 'unknown', password: 'secret' },
  { username: '', password: 'secret' },
  { username: 'locked', password: 'secret' }
];

for (const user of invalidUsers) {

  test(
    `invalid login: ${user.username || 'empty'}`,
    async ({ page }) => {

      ...
    }
  );
}
```

Use data-driven generation only when test identities remain meaningful and diagnosable.

---

# 19. Type Safety

```typescript
interface User {
  username: string;
  password: string;
  role: 'admin' | 'user';
}
```

This is preferable to untyped test data because the compiler catches malformed data structures.

---

# 20. Playwright vs Selenium — Interview Answer

> Playwright provides a browser-context model, integrated fixtures, automatic action/locator waiting, network and API capabilities, and strong execution diagnostics. Selenium provides a long-established WebDriver ecosystem, broad language/tool integration, and strong enterprise/Grid adoption. I would choose based on browser requirements, application architecture, existing investment, team skills, test isolation, CI topology, and migration cost.

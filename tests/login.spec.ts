import { test, expect } from '../fixtures/test-fixtures';
import { LoginPage } from '../pages/LoginPage';
import {
  validUser,
  wrongPasswordUser,
  wrongEmail,
  User
} from '../test-data/users';

test.describe('Login Tests', () => {

  const invalidUsers: User[] = [wrongEmail, wrongPasswordUser];
  test.beforeEach(async ({ page }) => {
await page.goto('/login');
  });

  test('Successful Login', async ({ page, loginPage }) => {
    await test.step('Login with valid credentials', async () => {
      await loginPage.login(validUser.emailId, validUser.password);
    });

    await test.step('Verify successful login', async () => {
      await expect(page.locator('#desktop-user-menu')).toBeVisible();
    });
  });


  invalidUsers.forEach((user) => {

    test(`Login :${user.scenario}`, async ({ page, loginPage }) => {
        await test.step(`Login  with ${user.scenario}`, async () => {
        await loginPage.login(user.emailId, user.password);
      })
      await test.step('Verifying that the error banner shows', async () => {
        await expect(page.getByText(user.expectedError)).toBeVisible();
      })


    });
  });
});
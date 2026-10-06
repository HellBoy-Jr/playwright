import { test, expect } from '../fixtures/test-fixtures';
import { validUser } from '../test-data/users';

test('Authenticate', async ({ page, loginPage }) => {

    await page.goto('/login');

    await test.step('Login with valid credentials', async () => {
        await loginPage.login(validUser.emailId, validUser.password);
    });

    await test.step('Verify successful login', async () => {
        await expect(page).toHaveURL(/\/$/);
        await expect(page.locator('#desktop-user-menu')).toBeVisible();
    });

    await page.context().storageState({
        path: 'playwright/.auth/user.json'
    });
});
import { test, expect } from '../fixtures/test-fixtures';
import { uniqueEmail } from '../test-data/users';

test.describe('Registration', () => {
    test('TC12 Registration happy path + field errors', async ({ page, registerPage }) => {
        await registerPage.goto();

        await test.step('Field errors on bad input', async () => {
            await registerPage.age.fill('10');
            await registerPage.password.fill('short');
            await registerPage.confirmPassword.fill('short');
            await registerPage.form.getByRole('button', { name: 'Create Account' }).click();
            await expect(registerPage.errorFor('age')).toContainText('13 and 120');
            await expect(registerPage.errorFor('password')).toContainText('at least 8');
        });

        await test.step('Successful registration navigates to login', async () => {
            const email = uniqueEmail();
            const username = `tu${Date.now().toString().slice(-8)}`;
            const [resp] = await Promise.all([
                page.waitForResponse((r) => r.url().includes('/api/auth/register') && r.request().method() === 'POST'),
                registerPage.register({
                    username,
                    displayName: 'E2E User',
                    email,
                    age: '25',
                    address: '123 Main St, Cairo',
                    password: 'E2Epass123!',
                }),
            ]);
            expect(resp.ok()).toBeTruthy();
            await expect(page.locator('div.fixed', { hasText: /Registration successful/i }).first()).toBeVisible({
                timeout: 8000,
            });
            await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
        });
    });
});

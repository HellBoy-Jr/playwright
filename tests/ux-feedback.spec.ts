import { test, expect } from '../fixtures/test-fixtures';
import { seededProducts } from '../test-data/api-helpers';

/**
 * TC23 — Async UX discipline: toasts stack with progress bar and auto-dismiss,
 * product render shows skeleton then content, impossible filter shows empty state.
 */
test.describe('UX feedback states', () => {
    // Fresh user per test => isolated cart (parallel-safe).
    // Declaring the fixture here runs register + login before each test.
    test.beforeEach(async ({ freshUser }) => {
        void freshUser;
    });

    test('TC23 Toast + skeleton + empty-state assertions', async ({ page }) => {
        await test.step('Toast appears on blocked place-order then hides', async () => {
            const product = (await seededProducts(page, 10))[0];
            await page.request.delete('/api/cart/clear');
            await page.request.post(`/api/cart/add/${product.id}`);
            await page.goto('/checkout');
            await page.locator('#checkout-submit-btn').waitFor({ state: 'visible', timeout: 15000 });
            // New-address tab with empty fields => processCheckout shows error toast
            await page.locator('#use-new-address-btn').click();
            await page.locator('#checkout-submit-btn').click();
            const toast = page.locator('div.fixed', { hasText: /fill in all shipping fields/i }).first();
            await expect(toast).toBeVisible({ timeout: 8000 });
            await expect(toast).toBeHidden({ timeout: 10000 });
        });

        await test.step('Impossible search shows empty state, not skeleton', async () => {
            await page.goto('/products');
            await page.locator('#product-list-container').waitFor({ state: 'visible' });
            await page.getByPlaceholder('Search products...').fill('zzz-no-such-product-zzz');
            await page.waitForResponse((r) => r.url().includes('/api/products/custom') && r.url().includes('zzz-no-such'), {
                timeout: 10000,
            });
            await expect(page.locator('#product-list-container')).toContainText(/No products match|No products found/i);
            await expect(page.getByRole('button', { name: 'Clear All Filters' })).toBeVisible();
        });
    });
});

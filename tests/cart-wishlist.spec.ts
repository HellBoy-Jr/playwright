import { test, expect } from '../fixtures/test-fixtures';
import { authHeaders, seededProducts } from '../test-data/api-helpers';

test.describe('Cart and wishlist drawers', () => {
    // Fresh user per test => isolated cart + wishlist (parallel-safe).
    // Declaring the fixture here runs register + login before each test.
    test.beforeEach(async ({ freshUser }) => {
        void freshUser;
    });

    test('TC13 Cart drawer: remove + clear with confirm modal', async ({ page }) => {
        const products = (await seededProducts(page)).slice(0, 2);
        expect(products.length).toBe(2);

        for (const p of products) {
            const r = await page.request.post(`/api/cart/add/${p.id}`);
            expect(r.ok()).toBeTruthy();
        }
        await page.reload();
        await page.evaluate(() => (window as any).cartManager.open());
        const drawer = page.locator('#cart-drawer');
        await expect(drawer).not.toHaveClass(/translate-x-full/);
        await expect(page.locator('#cart-items-list')).toContainText(products[0].name);

        await test.step('Remove one item via drawer trash button', async () => {
            const target = products[0].name;
            // Scoped locator: remove button inside this product's row only
            const row = page.locator('#cart-items-list > div', { hasText: target }).first();
            const del = page.waitForResponse((r) => r.url().includes('/api/cart/remove/'));
            await row.locator('button[onclick*="removeItem"]').click();
            await del;
            await expect(page.locator('#cart-items-list')).not.toContainText(target);
            await expect(page.locator('#cart-items-list')).toContainText(products[1].name);
        });

        await test.step('Clear remaining cart with confirm accept', async () => {
            await page.locator('#cart-drawer button', { hasText: 'Clear Shopping Cart' }).click();
            const overlay = page.locator('#confirmation-overlay');
            await expect(overlay).toBeVisible();
            await expect(overlay).toContainText('Clear Cart');
            const cleared = page.waitForResponse((r) => r.url().includes('/api/cart/clear'));
            await overlay.getByRole('button', { name: 'Yes' }).click();
            await cleared;
            await expect(page.locator('#cart-items-list')).toContainText(/lonely|empty/i);
            await expect(page.locator('#cart-total')).toContainText('$0.00');
        });
    });

    test('TC14 Wishlist toggle + drawer persistence', async ({ page }) => {
        const product = (await seededProducts(page, 10))[0];

        await test.step('Toggle wishlist from product detail', async () => {
            await page.goto(`/product/${product.id}`);
            const toggle = page.waitForResponse((r) => r.url().includes('/api/wishlist'));
            await page.locator('button[data-product-id]').first().click();
            await toggle;
        });

        await test.step('Drawer lists item and survives reload', async () => {
            await page.evaluate(() => (window as any).wishlistManager.toggleDrawer());
            await expect(page.locator('#wishlist-items-list')).toContainText(product.name, {
                timeout: 10000,
            });
            await page.reload();
            await page.locator('#desktop-user-menu').waitFor({ state: 'visible', timeout: 10000 });
            await page.evaluate(() => (window as any).wishlistManager.toggleDrawer());
            await expect(page.locator('#wishlist-items-list')).toContainText(product.name, {
                timeout: 10000,
            });
        });
    });
});

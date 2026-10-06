import { test, expect } from '../fixtures/test-fixtures';
import { authHeaders, seededProducts } from '../test-data/api-helpers';

test.describe('Product detail and reviews', () => {
    test('TC10 Product detail → Add to Cart → drawer', async ({
        page,
        freshUser,
        productDetailPage,
    }) => {
        void freshUser; // isolated cart (parallel-safe)

        const list = await page.request.get('/api/products/custom?page=0&size=1');
        expect(list.ok()).toBeTruthy();
        const body = await list.json();
        const product = (await seededProducts(page, 10))[0];
        expect(product?.id).toBeTruthy();

        await test.step('Open product detail', async () => {
            await productDetailPage.goto(product.id);
            await expect(productDetailPage.title).toContainText(product.name);
            await expect(productDetailPage.addToCartBtn).toBeVisible();
        });

        await test.step('Add to cart and assert drawer', async () => {
            await productDetailPage.addToCartBtn.click();
            const drawer = page.locator('#cart-drawer');
            await expect(drawer).not.toHaveClass(/translate-x-full/);
            await expect(page.locator('#cart-items-list')).toContainText(product.name);
            const total = await page.locator('#cart-total').textContent();
            expect(total).not.toBe('$0.00');
        });
    });

    test('TC11 Review submit + non-buyer rejected', async ({
        page,
        freshUser,
        productDetailPage,
    }) => {
        void freshUser; // never purchased => guarded API rule triggers

        const list = await page.request.get('/api/products/custom?page=0&size=1');
        const product = (await seededProducts(page, 10))[0];

        await productDetailPage.goto(product.id);
        await expect(productDetailPage.reviewComment).toBeHidden();

        await test.step('API rejects review from non-buyer', async () => {
            const resp = await page.request.post(`/api/reviews/${product.id}`, {
                headers: await authHeaders(page),
                data: { rating: 5, comment: 'E2E probe review - should be rejected' },
            });
            expect(resp.status()).toBe(400);
            expect(await resp.text()).toContain('purchased');
        });

        await test.step('Assert UI hides review form (guarded rule)', async () => {
            await expect(page.locator('#review-form-container')).toBeHidden();
            await expect(productDetailPage.reviewsList).toBeVisible();
        });
    });
});

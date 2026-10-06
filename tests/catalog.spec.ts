import { test, expect } from '../fixtures/test-fixtures'


test.describe('Product Search Tests', () => {

    test('Search Product', async ({ page, productPage }) => {
        await page.goto('/products');

        await test.step('Searching the product', async () => {
            await productPage.searchProduct('Yoga Mat');
        });

        await test.step('Verify search returns results', async () => {
            const productCount = await productPage.getProductCount();
            expect(productCount).toBe(1);
        });

        await test.step('Verify searched product', async () => {
            await expect(
                page.getByRole('heading', { name: 'Yoga Mat' })
            ).toBeVisible();
        });

    });

    test('Filter Products by Rating', async ({ page, productPage }) => {

        await page.goto('/products');

        await test.step('Filter products by 4 star rating', async () => {
            await productPage.filterByRating(4);
        });
        console.log(
            '4-star selected:',
            await page.locator('input[name="rating-filter"][value="4"]').isChecked()
        );
        await test.step('Verify filtered products', async () => {
            const productCount = await productPage.getProductCount();
            console.log('Products after rating filter:', productCount);

            expect(productCount).toBeGreaterThan(0);
        });
    });

});
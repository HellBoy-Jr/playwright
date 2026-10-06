import { test, expect } from '../fixtures/test-fixtures';

test.describe('Catalog filters and sorting', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/products');
        await page.locator('#product-list-container').waitFor({ state: 'visible', timeout: 15000 });
    });

    test('TC05 Sort by price_asc validates ordering', async ({ page, productPage }) => {
        await test.step('Select Price Low to High', async () => {
            const resp = await productPage.sortBy('price_asc');
            expect(resp.ok()).toBeTruthy();
            expect(resp.url()).toContain('sort=price_asc');
        });

        await test.step('Assert prices ascending and URL synced', async () => {
            await expect(page).toHaveURL(/sort=price_asc/);
            const prices = await productPage.getVisiblePrices();
            expect(prices.length).toBeGreaterThan(1);
            const sorted = [...prices].sort((a, b) => a - b);
            expect(prices).toEqual(sorted);
        });
    });

    test('TC06 Category multi-filter + URL sync', async ({ page, productPage }) => {
        const before = await productPage.getProductCount();

        await test.step('Select two categories', async () => {
            const first = page.waitForResponse((r) => r.url().includes('/api/products/custom'));
            await productPage.categoryPill('Electronics').click();
            await first;
            const second = page.waitForResponse((r) => r.url().includes('/api/products/custom'));
            await productPage.categoryPill('Clothing').click();
            const resp = await second;
            expect(resp.url()).toContain('category=');
        });

        await test.step('Assert URL has repeated category params and chips shown', async () => {
            await expect(page).toHaveURL(/category=Electronics/);
            await expect(page).toHaveURL(/category=Clothing/);
            await expect(page.locator('#active-filters-container')).toBeVisible();
            await expect(page.locator('#active-filters')).toContainText('Electronics');
            const after = await productPage.getProductCount();
            expect(after).toBeLessThanOrEqual(before);
            expect(after).toBeGreaterThan(0);
        });
    });

    test('TC07 Rating radio + in-stock check/uncheck', async ({ page, productPage }) => {
        await test.step('Apply 4-star rating filter', async () => {
            const respPromise = page.waitForResponse((r) => r.url().includes('/api/products/custom'));
            await productPage.filterByRating(4);
            await respPromise;
            await expect(productPage.ratingFilter(4)).toBeChecked();
            expect(await productPage.getProductCount()).toBeGreaterThan(0);
        });

        await test.step('Check in-stock narrows or keeps list, uncheck restores', async () => {
            const countBeforeStock = await productPage.getProductCount();
            await productPage.inStockCheckbox.check();
            await expect(productPage.inStockCheckbox).toBeChecked();
            // client-side only: no new API call required, assert list still rendered
            await expect(page.locator('#product-list-container')).toBeVisible();
            const countInStock = await productPage.getProductCount();
            expect(countInStock).toBeLessThanOrEqual(countBeforeStock);

            await productPage.inStockCheckbox.uncheck();
            await expect(productPage.inStockCheckbox).not.toBeChecked();
            expect(await productPage.getProductCount()).toBe(countBeforeStock);
        });
    });

    test('TC08 Custom price slider drag filters results', async ({ page, productPage }) => {
        await test.step('Drag min thumb right via mouse events', async () => {
            const container = page.locator('#price-slider-container');
            const box = await container.boundingBox();
            expect(box).not.toBeNull();
            const thumbBox = await productPage.minThumb.boundingBox();
            expect(thumbBox).not.toBeNull();

            const startX = thumbBox!.x + thumbBox!.width / 2;
            const startY = thumbBox!.y + thumbBox!.height / 2;
            const targetX = box!.x + box!.width * 0.3;

            const respPromise = page.waitForResponse(
                (r) => r.url().includes('/api/products/custom') && r.url().includes('minPrice='),
                { timeout: 10000 },
            );
            await page.mouse.move(startX, startY);
            await page.mouse.down();
            await page.mouse.move(targetX, startY, { steps: 10 });
            await page.mouse.up();
            const resp = await respPromise;
            expect(resp.url()).toContain('minPrice=');
        });

        await test.step('Assert display updated and URL synced', async () => {
            await expect(page).toHaveURL(/minPrice=/);
            const minText = await productPage.minPriceDisplay.textContent();
            expect(minText).not.toBe('$0');
        });
    });

    test('TC09 Pagination Prev/Next + disabled states', async ({ page, productPage }) => {
        await test.step('Assert first page state', async () => {
            await expect(productPage.pageInfo).toContainText('Page 1 of');
            await expect(productPage.prevBtn).toBeDisabled();
        });

        await test.step('Next advances page, Prev re-enabled', async () => {
            // 72 products / 12 per page => multiple pages guaranteed
            const respPromise = page.waitForResponse((r) => r.url().includes('/api/products/custom'));
            await productPage.nextBtn.click();
            await respPromise;
            await expect(productPage.pageInfo).toContainText('Page 2 of');
            await expect(productPage.prevBtn).toBeEnabled();
        });
    });
});

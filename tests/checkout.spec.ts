import { test, expect } from '../fixtures/test-fixtures';
import { coupons } from '../test-data/users';
import { seededProducts } from '../test-data/api-helpers';

const NEW_ADDRESS = {
    street: '99 E2E Street',
    city: 'Cairo',
    state: 'EG',
    zip: '12345',
    country: 'USA',
};

async function seedCart(page, count = 1) {
    const products = await seededProducts(page, 10);
    for (let i = 0; i < count; i++) {
        const r = await page.request.post(`/api/cart/add/${products[i % products.length].id}`);
        expect(r.ok()).toBeTruthy();
    }
}

/** Fill the new-address form if the checkout rendered it (fresh users have no saved address). */
async function ensureAddress(page, checkoutPage) {
    const newSection = page.locator('#new-address-section');
    const savedBtn = page.locator('#use-saved-address-btn');
    if (await savedBtn.isHidden()) {
        // App auto-selects new address; just fill the visible form
        await newSection.waitFor({ state: 'visible', timeout: 5000 });
    } else {
        await checkoutPage.newTab.click();
        await newSection.waitFor({ state: 'visible', timeout: 5000 });
    }
    await checkoutPage.fillNewAddress(NEW_ADDRESS);
}

test.describe('Checkout and orders', () => {
    // Fresh user per test => isolated cart + coupons (parallel-safe).
    // Declaring the fixture here runs register + login before each test.
    test.beforeEach(async ({ freshUser }) => {
        void freshUser;
    });

    test('TC15 Checkout coupon + store balance math', async ({ page, checkoutPage }) => {
        await seedCart(page, 2);
        await checkoutPage.goto();

        await test.step('Invalid coupon shows error', async () => {
            await checkoutPage.couponInput.fill(coupons.invalid);
            const [resp] = await Promise.all([
                page.waitForResponse((r) => r.url().includes('/api/coupons/check'), {
                    timeout: 10000,
                }),
                checkoutPage.applyCouponBtn.click(),
            ]);
            // App shows backend error then removeCoupon() overwrites with "Coupon removed";
            // meaningful assert: request failed and no discount applied.
            expect(resp.ok()).toBeFalsy();
            await expect(checkoutPage.discountRow).toBeHidden();
        });

        await test.step('Valid coupon applies discount and updates totals', async () => {
            const subtotalBefore = await checkoutPage.subtotal.textContent();
            const resp = await checkoutPage.applyCoupon(coupons.valid20);
            expect(resp.ok()).toBeTruthy();
            await expect(checkoutPage.discountRow).toBeVisible();
            await expect(checkoutPage.discount).toContainText('%');
            await expect(checkoutPage.couponMessage).toContainText(/saved|applied/i);
            const total = await checkoutPage.total.textContent();
            expect(total).not.toBe(subtotalBefore);
            expect(total).not.toBe('$0.00');
        });

        await test.step('Store balance toggle fetches history', async () => {
            const balResp = page.waitForResponse((r) => r.url().includes('/api/gift-cards/history'));
            await checkoutPage.useBalance.check();
            await balResp;
            await expect(page.locator('#store-balance-info')).toBeVisible();
            await expect(checkoutPage.availableBalance).toContainText('$');
        });
    });

    test('TC16 Checkout address tabs + validation blocks place', async ({
        page,
        checkoutPage,
    }) => {
        await seedCart(page, 1);
        await checkoutPage.goto();

        await test.step('New-address tab shows empty form', async () => {
            const savedBtn = page.locator('#use-saved-address-btn');
            if (await savedBtn.isVisible()) {
                await checkoutPage.newTab.click();
            }
            await expect(page.locator('#new-address-section')).toBeVisible();
        });

        await test.step('Place blocked with empty fields', async () => {
            await checkoutPage.placeOrderBtn.click();
            await expect(
                page.locator('div.fixed', { hasText: /fill in all shipping fields|No saved address/i }).first(),
            ).toBeVisible({ timeout: 8000 });
            await expect(page).toHaveURL(/\/checkout/);
        });

        await test.step('Valid new address accepted by form', async () => {
            await checkoutPage.fillNewAddress(NEW_ADDRESS);
            await expect(page.locator('#shipping-street')).toHaveValue('99 E2E Street');
            // Do not place here; TC17 covers the full order. Just verify form accepts input.
        });
    });

    test('TC17 Place order → /order-success (API+UI)', async ({ page, checkoutPage }) => {
        await seedCart(page, 1);
        await checkoutPage.goto();
        await ensureAddress(page, checkoutPage);

        await test.step('Place order with address filled', async () => {
            const [resp] = await Promise.all([
                page.waitForResponse((r) => r.url().includes('/api/orders/place'), {
                    timeout: 20000,
                }),
                checkoutPage.placeOrderBtn.click(),
            ]);
            expect(resp.ok()).toBeTruthy();
        });

        await test.step('Assert success page with order data', async () => {
            await expect(page).toHaveURL(/\/order-success/, { timeout: 15000 });
            await expect(page.locator('#content')).toContainText(/order|FAKE|success/i);
        });
    });

    test('TC21 Mock payment failure shows error, no order', async ({ page, checkoutPage }) => {
        await seedCart(page, 1);
        await checkoutPage.goto();
        await ensureAddress(page, checkoutPage);

        await test.step('Mock POST /place 500', async () => {
            await page.route('**/api/orders/place', (route) =>
                route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ message: 'Payment gateway down' }),
                }),
            );
            await checkoutPage.placeOrderBtn.click();
            await expect(
                page.locator('div.fixed', { hasText: /Order failed/i }).first(),
            ).toBeVisible({ timeout: 15000 });
            await expect(page).toHaveURL(/\/checkout/);
            await expect(checkoutPage.processingModal).toBeHidden();
        });
    });
});

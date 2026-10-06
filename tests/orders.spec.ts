import { test, expect } from '../fixtures/test-fixtures';
import { seededProducts } from '../test-data/api-helpers';

test.describe('Orders and invoice', () => {
    test('TC18 Orders list + Download invoice PDF', async ({ page, ordersPage }) => {
        // Consumes the standard-user storageState (seeded hassan: JSON default
        // address required by InvoiceService). No login: the context arrives
        // authenticated and any re-login would rotate the shared DB token.
        // No other test mutates hassan's cart, so this stays parallel-safe.

        // Setup: ensure at least one order exists (API setup + UI verify pattern)
        const product = (await seededProducts(page, 10))[0];
        await page.request.post(`/api/cart/add/${product.id}`);
        const place = await page.request.post('/api/orders/place', {
            data: {
                couponCode: null,
                giftCards: [],
                useStoreBalance: false,
                storeBalanceAmount: 0,
                shippingAddress: JSON.stringify({
                    street: '99 E2E Street',
                    city: 'Cairo',
                    state: 'EG',
                    zipCode: '12345',
                    country: 'USA',
                }),
            },
        });
        expect(place.ok()).toBeTruthy();

        await test.step('Orders list shows the placed order', async () => {
            await ordersPage.goto();
            await expect(ordersPage.container).toContainText(/ORD-|TX:/);
        });

        await test.step('Download invoice PDF with correct filename', async () => {
            // Extract order id from rendered card header #ORD-<id>
            const header = await ordersPage.container.locator('text=/ORD-\\d+/').first().textContent();
            const orderId = header?.match(/ORD-(\d+)/)?.[1];
            expect(orderId).toBeTruthy();

            // Invoice links use target=_blank; Playwright attributes the download to this page
            const [download] = await Promise.all([
                page.waitForEvent('download', { timeout: 15000 }),
                ordersPage.invoiceLink(Number(orderId)).click(),
            ]);
            expect(download.suggestedFilename()).toBe(`invoice_order_${orderId}.pdf`);
            const path = await download.path();
            expect(path).toBeTruthy();
        });
    });
});

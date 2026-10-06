import { test, expect } from '../fixtures/test-fixtures';
import { uniqueProductName } from '../test-data/users';

test.describe('Admin product management', () => {
    // Seeded admin per test (test-scoped login, never shared across workers).
    // Declaring the fixture here runs the admin login before each test.
    test.beforeEach(async ({ adminUser }) => {
        void adminUser;
    });

    test('TC19 Admin add product with image upload', async ({ page, adminPage, adminUser }) => {
        const name = uniqueProductName('PW-ADD');
        await adminPage.gotoAddProduct();

        await test.step('Fill form + attach image', async () => {
            await page.locator('#add-product-form input[name="name"]').fill(name);
            await page.locator('#add-product-form input[name="price"]').fill('49.99');
            await page.locator('#add-product-form input[name="stock"]').fill('10');
            await page
                .locator('#add-product-form textarea[name="description"]')
                .fill('E2E created product for upload coverage');
            await page.locator('#add-product-form select[name="categoryName"]').selectOption('Electronics');
            // Upload demo: hidden file input accept=image/*
            await page.locator('#product-image-input').setInputFiles('test-data/fixture.png');
            await expect(page.locator('#image-preview-container')).toBeVisible();
        });

        await test.step('Submit multipart and verify in admin table', async () => {
            const [resp] = await Promise.all([
                page.waitForResponse((r) => r.url().includes('/api/admin/products') && r.request().method() === 'POST'),
                page.locator('#add-product-form button[type="submit"]').click(),
            ]);
            expect(resp.ok()).toBeTruthy();
            await expect(adminPage.productTable).toContainText(name, { timeout: 15000 });
        });

        // Cleanup for parallel safety
        await test.step('Cleanup created product', async () => {
            const row = adminPage.rowFor(name);
            const idMatch = await row.getAttribute('id');
            const id = idMatch?.match(/delete-product-(\d+)/)?.[1];
            if (id) await page.request.delete(`/api/admin/products/${id}`, { headers: await adminUser.authHeaders() });
        });
    });

    test('TC20 Admin products table edit/delete via scoped row', async ({ page, adminPage, adminUser }) => {
        // Setup via API (fast, parallel-safe unique name)
        const name = uniqueProductName('PW-TBL');
        const headers = await adminUser.authHeaders();
        const created = await page.request.post('/api/admin/products', {
            headers,
            multipart: {
                product: {
                    name: 'product.json',
                    mimeType: 'application/json',
                    buffer: Buffer.from(
                        JSON.stringify({
                            name,
                            description: 'table pattern product',
                            price: 25.0,
                            stock: 5,
                            categoryName: 'Books',
                        }),
                    ),
                },
            },
        });
        expect(created.ok()).toBeTruthy();
        const createdBody = await created.json();

        await adminPage.gotoDashboard();

        await test.step('Edit price via scoped row action', async () => {
            const row = adminPage.rowFor(name);
            await expect(row).toBeVisible({ timeout: 15000 });
            // Scoped locator: edit button inside this row only (no positional selector)
            const editBtn = row.locator('button', { hasText: '' }).first();
            await editBtn.click();
            await expect(page).toHaveURL(/\/admin\/edit-product\/\d+/);
            const priceInput = page.locator('input[name="price"]');
            await expect(priceInput).toHaveValue(/25/);
            await priceInput.fill('35.50');
            const [put] = await Promise.all([
                page.waitForResponse((r) => r.url().includes('/api/admin/products/') && r.request().method() === 'PUT'),
                page.locator('form button[type="submit"]').click(),
            ]);
            expect(put.ok()).toBeTruthy();
            await expect(adminPage.productTable).toContainText(name, { timeout: 15000 });
            expect(createdBody.id).toBeTruthy();
        });

        await test.step('Delete row via scoped delete + confirm', async () => {
            const row = adminPage.rowFor(name);
            await expect(row).toBeVisible({ timeout: 15000 });
            const deleteBtn = row.locator('button').nth(1);
            await deleteBtn.click();
            const overlay = page.locator('#confirmation-overlay');
            await expect(overlay).toContainText('Delete Product');
            const headers = await adminUser.authHeaders();
            const del = page.waitForResponse(
                (r) => r.url().includes('/api/admin/products/') && r.request().method() === 'DELETE',
            );
            await overlay.locator('#confirm-yes').click();
            await del;
            await expect(page.locator('div.fixed', { hasText: /deleted successfully/i }).first()).toBeVisible({
                timeout: 8000,
            });
            await expect(adminPage.rowFor(name)).toHaveCount(0);
        });
    });

    test('TC22 API+UI: create product via API, verify in UI search', async ({
        page,
        adminUser,
        productPage,
    }) => {
        const name = uniqueProductName('PW-API');
        const headers = await adminUser.authHeaders();
        await test.step('Create via APIRequestContext', async () => {
            const resp = await page.request.post('/api/admin/products', {
                headers,
                multipart: {
                    product: {
                        name: 'product.json',
                        mimeType: 'application/json',
                        buffer: Buffer.from(
                            JSON.stringify({
                                name,
                                description: 'api+ui dual layer product',
                                price: 15.5,
                                stock: 7,
                                categoryName: 'Sports',
                            }),
                        ),
                    },
                },
            });
            expect(resp.status()).toBe(201);
        });

        await test.step('Verify in UI search (dual-layer trust)', async () => {
            await page.goto('/products');
            await page.locator('#product-list-container').waitFor({ state: 'visible', timeout: 15000 });
            await productPage.searchProduct(name);
            await expect(page.getByRole('heading', { name })).toBeVisible({ timeout: 10000 });
            expect(await productPage.getProductCount()).toBe(1);
        });

        await test.step('Cleanup via API', async () => {
            const headers = await adminUser.authHeaders();
            const q = await page.request.get(`/api/products/custom?search=${encodeURIComponent(name)}&size=5`, {
                headers,
            });
            const id = (await q.json()).content[0]?.id;
            if (id) await page.request.delete(`/api/admin/products/${id}`, { headers });
        });
    });
});

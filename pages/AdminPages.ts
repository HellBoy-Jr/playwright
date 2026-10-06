import { Page, Locator } from '@playwright/test';

export class OrdersPage {
    constructor(private page: Page) {}

    get container(): Locator {
        return this.page.locator('#orders-container');
    }

    async goto() {
        await this.page.goto('/orders');
        await this.container.waitFor({ state: 'visible', timeout: 15000 });
    }

    invoiceLink(orderId: number): Locator {
        return this.page.locator(`a[href="/api/orders/${orderId}/download-invoice"]`).first();
    }
}

export class AdminPage {
    constructor(private page: Page) {}

    get productTable(): Locator {
        return this.page.locator('#admin-product-table');
    }
    get addForm(): Locator {
        return this.page.locator('#add-product-form');
    }

    async gotoDashboard() {
        await this.page.goto('/admin');
        await this.productTable.waitFor({ state: 'visible', timeout: 15000 });
    }

    async gotoAddProduct() {
        await this.page.goto('/admin/add-product');
        await this.addForm.waitFor({ state: 'visible', timeout: 15000 });
    }

    rowFor(name: string): Locator {
        return this.productTable.locator('tr', { hasText: name }).first();
    }
}

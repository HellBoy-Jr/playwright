import { Page, Locator } from '@playwright/test';

/** Slide-in drawers from templates/index.html (no dedicated /cart or /wishlist pages). */
export class CartDrawer {
    constructor(private page: Page) {}

    get drawer(): Locator {
        return this.page.locator('#cart-drawer');
    }
    get itemsList(): Locator {
        return this.page.locator('#cart-items-list');
    }
    get total(): Locator {
        return this.page.locator('#cart-total');
    }
    get checkoutBtn(): Locator {
        return this.page.locator('#checkout-btn');
    }
    get confirmOverlay(): Locator {
        return this.page.locator('#confirmation-overlay');
    }

    async open() {
        const cls = await this.drawer.getAttribute('class');
        if (cls?.includes('translate-x-full')) {
            await this.page.evaluate(() => (window as any).cartManager.toggle());
        }
        await this.drawer.waitFor({ state: 'visible' });
    }

    async clearViaUI() {
        await this.page.evaluate(() => (window as any).cartManager.open?.() ?? (window as any).cartManager.toggle());
        const clearBtn = this.page.locator('#cart-drawer button', { hasText: 'Clear Shopping Cart' });
        await clearBtn.click();
        await this.confirmOverlay.waitFor({ state: 'visible', timeout: 5000 });
    }

    itemRemoveButton(itemId: number): Locator {
        // CartManager renders remove buttons calling removeItem(event, itemId)
        return this.itemsList.locator(`button[onclick*="removeItem"][onclick*="${itemId}"]`).first();
    }
}

export class WishlistDrawer {
    constructor(private page: Page) {}

    get drawer(): Locator {
        return this.page.locator('#wishlist-drawer');
    }
    get itemsList(): Locator {
        return this.page.locator('#wishlist-items-list');
    }
    get badge(): Locator {
        return this.page.locator('#wishlist-count-desktop');
    }

    async open() {
        await this.page.evaluate(() => (window as any).wishlistManager.toggleDrawer());
        // drawer slides in; items load async
        await this.page.waitForTimeout(300);
    }
}

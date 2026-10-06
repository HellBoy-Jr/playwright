import { Page, Locator } from '@playwright/test';

export class CheckoutPage {
    constructor(private page: Page) {}

    get email(): Locator {
        return this.page.locator('#checkout-email');
    }
    get savedTab(): Locator {
        return this.page.locator('#use-saved-address-btn');
    }
    get newTab(): Locator {
        return this.page.locator('#use-new-address-btn');
    }
    get couponInput(): Locator {
        return this.page.locator('#coupon-code');
    }
    get applyCouponBtn(): Locator {
        return this.page.locator('#apply-coupon-btn');
    }
    get couponMessage(): Locator {
        return this.page.locator('#coupon-message');
    }
    get couponDetails(): Locator {
        return this.page.locator('#coupon-details');
    }
    get useBalance(): Locator {
        return this.page.locator('#use-store-balance');
    }
    get availableBalance(): Locator {
        return this.page.locator('#available-balance');
    }
    get appliedBalance(): Locator {
        return this.page.locator('#applied-balance');
    }
    get subtotal(): Locator {
        return this.page.locator('#summary-subtotal');
    }
    get discountRow(): Locator {
        return this.page.locator('#summary-discount-row');
    }
    get discount(): Locator {
        return this.page.locator('#summary-discount');
    }
    get total(): Locator {
        return this.page.locator('#summary-total');
    }
    get placeOrderBtn(): Locator {
        return this.page.locator('#checkout-submit-btn');
    }
    get processingModal(): Locator {
        return this.page.locator('#payment-processing-modal');
    }

    async goto() {
        await this.page.goto('/checkout');
        await this.placeOrderBtn.waitFor({ state: 'visible', timeout: 15000 });
    }

    async applyCoupon(code: string) {
        await this.couponInput.fill(code);
        const [resp] = await Promise.all([
            this.page.waitForResponse((r) => r.url().includes('/api/coupons/check'), {
                timeout: 10000,
            }),
            this.applyCouponBtn.click(),
        ]);
        return resp;
    }

    async fillNewAddress(a: { street: string; city: string; state: string; zip: string; country: string }) {
        await this.newTab.click();
        await this.page.locator('#shipping-street').fill(a.street);
        await this.page.locator('#shipping-city').fill(a.city);
        await this.page.locator('#shipping-state').fill(a.state);
        await this.page.locator('#shipping-zip').fill(a.zip);
        await this.page.locator('#shipping-country').fill(a.country);
    }
}

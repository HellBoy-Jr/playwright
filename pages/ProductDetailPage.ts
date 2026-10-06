import { Page, Locator } from '@playwright/test';

export class ProductDetailPage {
    constructor(private page: Page) {}

    get title() {
        return this.page.locator('#content h1');
    }
    get addToCartBtn() {
        return this.page.locator('#content button.bg-blue-600', { hasText: 'Add to Cart' }).first();
    }
    get wishlistBtn() {
        return this.page.locator('button[data-product-id]').first();
    }
    get starButtons() {
        return this.page.locator('#star-rating-input button');
    }
    get reviewComment() {
        return this.page.locator('#review-comment');
    }
    get postReviewBtn() {
        return this.page.getByRole('button', { name: 'Post Review' });
    }
    get reviewsList() {
        return this.page.locator('#reviews-list');
    }

    async goto(id: number | string) {
        await this.page.goto(`/product/${id}`);
    }

    async rate(stars: number) {
        await this.starButtons.nth(stars - 1).click();
    }
}

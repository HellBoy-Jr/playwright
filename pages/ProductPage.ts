import { Page, Locator, Response } from '@playwright/test';

/**
 * Catalog (/products) page object. Mirrors real CommerceLab DOM:
 * products.html + ProductManager.js (server-driven /api/products/custom).
 */
export class ProductPage {
    readonly searchInput: Locator;
    readonly productCards: Locator;
    readonly sortSelect: Locator;
    readonly categoryList: Locator;
    readonly inStockCheckbox: Locator;
    readonly prevBtn: Locator;
    readonly nextBtn: Locator;
    readonly pageInfo: Locator;
    readonly resultsCount: Locator;
    readonly minThumb: Locator;
    readonly maxThumb: Locator;
    readonly minPriceDisplay: Locator;
    readonly maxPriceDisplay: Locator;

    constructor(private page: Page) {
        this.searchInput = this.page.getByPlaceholder('Search products...');
        this.productCards = this.page.locator('#product-list-container > div');
        this.sortSelect = this.page.locator('#products-filter');
        this.categoryList = this.page.locator('#category-list');
        this.inStockCheckbox = this.page.locator('#in-stock-filter');
        this.prevBtn = this.page.locator('#prev-btn');
        this.nextBtn = this.page.locator('#next-btn');
        this.pageInfo = this.page.locator('#page-info');
        this.minThumb = this.page.locator('#min-thumb');
        this.maxThumb = this.page.locator('#max-thumb');
        this.minPriceDisplay = this.page.locator('#min-price-display');
        this.maxPriceDisplay = this.page.locator('#max-price-display');
    }

    ratingFilter = (rating: number) =>
        this.page.locator(`input[name="rating-filter"][value="${rating}"]`);

    categoryPill = (name: string) =>
        this.categoryList.locator('div', { hasText: name }).first();

    /** Fill search and wait for the debounced server request (replaces waitForTimeout). */
    async searchProduct(searchTerm: string): Promise<Response> {
        const [resp] = await Promise.all([
            this.page.waitForResponse(
                (r) =>
                    r.url().includes('/api/products/custom') &&
                    r.url().includes(`search=${encodeURIComponent(searchTerm)}`) &&
                    r.request().method() === 'GET',
                { timeout: 10000 },
            ),
            this.searchInput.fill(searchTerm),
        ]);
        return resp;
    }

    async getProductCount(): Promise<number> {
        return await this.productCards.count();
    }

    async filterByRating(rating: number) {
        await this.ratingFilter(rating).check();
    }

    /** Select sort option and wait for the resulting server fetch. */
    async sortBy(value: string): Promise<Response> {
        const [resp] = await Promise.all([
            this.page.waitForResponse(
                (r) => r.url().includes('/api/products/custom') && r.url().includes(`sort=${value}`),
                { timeout: 10000 },
            ),
            this.sortSelect.selectOption(value),
        ]);
        return resp;
    }

    /** Extract visible card prices as numbers (parses $xx.xx). */
    async getVisiblePrices(): Promise<number[]> {
        const texts = await this.page
            .locator('#product-list-container span.text-2xl')
            .allTextContents();
        return texts
            .map((t) => parseFloat(t.replace(/[^0-9.]/g, '')))
            .filter((n) => !Number.isNaN(n));
    }

    async getProductNames(): Promise<string[]> {
        return await this.page.locator('#product-list-container h3').allTextContents();
    }
}

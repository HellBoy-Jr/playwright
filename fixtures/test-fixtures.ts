import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ProductPage } from '../pages/ProductPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { CartDrawer, WishlistDrawer } from '../pages/Drawers';
import { CheckoutPage } from '../pages/CheckoutPage';
import { OrdersPage, AdminPage } from '../pages/AdminPages';
import { registerFreshUser } from '../test-data/api-helpers';
import { authHeaders } from '../test-data/api-helpers';
import { adminUser as adminCredentials } from '../test-data/users';

export type FreshUser = {
    email: string;
    password: string;
};

export type AdminUser = {
    email: string;
    authHeaders: () => Promise<Record<string, string>>;
};

type TestFixtures = {
    loginPage: LoginPage;
    productPage: ProductPage;
    registerPage: RegisterPage;
    productDetailPage: ProductDetailPage;
    cartDrawer: CartDrawer;
    wishlistDrawer: WishlistDrawer;
    checkoutPage: CheckoutPage;
    ordersPage: OrdersPage;
    adminPage: AdminPage;
    /** Test-scoped: registers a unique user via API and logs in via UI. */
    freshUser: FreshUser;
    /** Test-scoped: logs in the seeded admin via UI. No shared page/token. */
    adminUser: AdminUser;
};

export const test = base.extend<TestFixtures>({
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },
    productPage: async ({ page }, use) => {
        await use(new ProductPage(page));
    },
    registerPage: async ({ page }, use) => {
        await use(new RegisterPage(page));
    },
    productDetailPage: async ({ page }, use) => {
        await use(new ProductDetailPage(page));
    },
    cartDrawer: async ({ page }, use) => {
        await use(new CartDrawer(page));
    },
    wishlistDrawer: async ({ page }, use) => {
        await use(new WishlistDrawer(page));
    },
    checkoutPage: async ({ page }, use) => {
        await use(new CheckoutPage(page));
    },
    ordersPage: async ({ page }, use) => {
        await use(new OrdersPage(page));
    },
    adminPage: async ({ page }, use) => {
        await use(new AdminPage(page));
    },
    freshUser: async ({ page, loginPage }, use) => {
        // Default Playwright fixture scope is test-scoped: fresh identity per test.
        // The authenticated project preloads user.json, but the app redirects
        // authenticated contexts away from /login, so drop the setup session
        // first and then reuse the existing register + UI-login flow.
        await page.context().clearCookies();
        const creds = await registerFreshUser(page);
        await loginPage.loginAndWait(creds.email, creds.password);
        await use(creds);
    },
    adminUser: async ({ page, loginPage }, use) => {
        // Test-scoped: each test performs its own admin login, so no admin
        // page or token is ever shared across workers (one-valid-JWT-per-user).
        await page.context().clearCookies();
        await loginPage.loginAndWait(adminCredentials.emailId, adminCredentials.password);
        await use({
            email: adminCredentials.emailId,
            authHeaders: () => authHeaders(page),
        });
    },
});

export { expect } from '@playwright/test';

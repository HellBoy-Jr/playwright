import { Page, Locator } from '@playwright/test';

export class LoginPage {
    readonly email: Locator;
    readonly password: Locator;
    readonly signInButton: Locator;

    constructor(private page: Page) {
        this.email = this.page.locator('#login-email');
        this.password = this.page.locator('#login-password');
        this.signInButton = this.page.locator('#login-btn');
    }

    async login(username: string, password: string) {
        await this.email.fill(username);
        await this.password.fill(password);
        await this.signInButton.click();
    }

    /** Login via UI and wait until the user menu is visible (auth success). */
    async loginAndWait(username: string, password: string) {
        await this.page.goto('/login');
        await this.login(username, password);
        await this.page.locator('#desktop-user-menu').waitFor({ state: 'visible', timeout: 10000 });
    }
}

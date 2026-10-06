import { Page, Locator } from '@playwright/test';

export class RegisterPage {
    readonly form: Locator;
    readonly username: Locator;
    readonly displayName: Locator;
    readonly email: Locator;
    readonly age: Locator;
    readonly address: Locator;
    readonly password: Locator;
    readonly confirmPassword: Locator;
    readonly terms: Locator;

    constructor(private page: Page) {
        this.form = this.page.locator('#register-form');
        this.username = this.page.locator('#username');
        this.displayName = this.page.locator('#displayName');
        this.email = this.page.locator('#email');
        this.age = this.page.locator('#age');
        this.address = this.page.locator('#address');
        this.password = this.page.locator('#password');
        this.confirmPassword = this.page.locator('#confirmPassword');
        this.terms = this.page.locator('#terms');
    }

    async goto() {
        await this.page.goto('/register');
        await this.form.waitFor({ state: 'visible' });
    }

    async register(data: {
        username: string;
        displayName: string;
        email: string;
        age: string;
        address: string;
        password: string;
    }) {
        await this.username.fill(data.username);
        await this.displayName.fill(data.displayName);
        await this.email.fill(data.email);
        await this.age.fill(data.age);
        await this.address.fill(data.address);
        await this.password.fill(data.password);
        await this.confirmPassword.fill(data.password);
        await this.terms.check();
        await this.form.getByRole('button', { name: 'Create Account' }).click();
    }

    errorFor(fieldId: string): Locator {
        return this.page.locator(`#${fieldId}-error`);
    }
}

import { Page, Locator } from '@playwright/test';


export class LoginPage {
    private loginEmail: Locator;
    private passwordInput: Locator;
    private signInButton:Locator;

    constructor(private page: Page) {
        
        this.loginEmail = this.page.locator('#login-email');
        this.passwordInput = this.page.locator('#login-password');;
        this.signInButton = this.page.locator('#login-btn');
    }

    async login(username: string , password: string){
        await this.loginEmail.fill(username);
        await this.passwordInput.fill(password);
        await this.signInButton.click();
    }

}
import { By, Locator, WebElement } from 'selenium-webdriver';
import { SeleniumComponent } from 'aft-ui-selenium';

export class HerokuContentWidget extends SeleniumComponent {
    /**
     * this Facet sets a static locator instead of using a passed
     * in value on the constructor
     */
    override get locator(): Locator {
        return By.id('content');
    }

    private async usernameInput(): Promise<WebElement> {
        return this.getRoot()
            .then(r => r.findElement(By.id("username")))
            .catch((err) => null);
    }
    private async passwordInput(): Promise<WebElement> {
        return this.getRoot()
            .then(r => r.findElement(By.id('password')))
            .catch((err) => null);
    }
    private async loginButton(): Promise<WebElement> {
        return this.getRoot()
            .then(r => r.findElement(By.css('button.radius')))
            .catch((err) => null);
    }

    async login(username: string, password: string): Promise<void> {
        let ui: WebElement = await this.usernameInput();
        await this.reporter.info(`sending ${username} to the Username Input`);
        await ui.sendKeys(username);
        await this.reporter.info('username entered');
        let pi: WebElement = await this.passwordInput();
        await this.reporter.info(`sending ${password} to the Password Input`);
        await pi.sendKeys(password);
        await this.reporter.info('password entered');
        await this.clickLoginButton();
    }

    async clickLoginButton(): Promise<void> {
        await this.reporter.info('clicking Login Button...');
        let lb: WebElement = await this.loginButton();
        await lb.click();
        await this.reporter.info('Login Button clicked');
    }

    async getLoginButton(): Promise<WebElement> {
        return await this.loginButton();
    }
}
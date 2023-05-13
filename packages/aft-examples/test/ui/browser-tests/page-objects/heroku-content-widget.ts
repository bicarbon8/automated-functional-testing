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
        return await (await this.getRoot()).findElement(By.id("username"));
    }
    private async passwordInput(): Promise<WebElement> {
        return await (await this.getRoot()).findElement(By.id('password'));
    }
    private async loginButton(): Promise<WebElement> {
        return await (await this.getRoot()).findElement(By.css('button.radius'));
    }

    async login(username: string, password: string): Promise<void> {
        let ui: WebElement = await this.usernameInput();
        await this.logMgr.info(`sending ${username} to the Username Input`);
        await ui.sendKeys(username);
        await this.logMgr.info('username entered');
        let pi: WebElement = await this.passwordInput();
        await this.logMgr.info(`sending ${password} to the Password Input`);
        await pi.sendKeys(password);
        await this.logMgr.info('password entered');
        await this.clickLoginButton();
    }

    async clickLoginButton(): Promise<void> {
        await this.logMgr.info('clicking Login Button...');
        let lb: WebElement = await this.loginButton();
        await lb.click();
        await this.logMgr.info('Login Button clicked');
    }

    async getLoginButton(): Promise<WebElement> {
        return await this.loginButton();
    }
}
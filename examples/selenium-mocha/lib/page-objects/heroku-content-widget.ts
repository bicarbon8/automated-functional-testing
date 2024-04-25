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
            .catch(async (err) => {
                await this.reporter.error(`unable to locate username input`)
                return null;
            });
    }
    private async passwordInput(): Promise<WebElement> {
        return this.getRoot()
            .then(r => r.findElement(By.id('password')))
            .catch(async (err) => {
                await this.reporter.error(`unable to locate password input`)
                return null;
            });
    }
    private async loginButton(): Promise<WebElement> {
        return this.getRoot()
            .then(r => r.findElement(By.css('button.radius')))
            .catch(async (err) => {
                await this.reporter.error(`unable to locate login button`)
                return null;
            });
    }

    async login(username: string, password: string): Promise<void> {
        const ui: WebElement = await this.usernameInput();
        await this.reporter.info(`sending ${username} to the Username Input`);
        await ui.sendKeys(username);
        await this.reporter.info('username entered');
        const pi: WebElement = await this.passwordInput();
        await this.reporter.info(`sending ${password} to the Password Input`);
        await pi.sendKeys(password);
        await this.reporter.info('password entered');
        await this.clickLoginButton();
    }

    async clickLoginButton(): Promise<void> {
        await this.reporter.info('clicking Login Button...');
        const lb: WebElement = await this.loginButton();
        await lb.click();
        await this.reporter.info('Login Button clicked');
    }

    async getLoginButton(): Promise<WebElement> {
        return this.loginButton();
    }
}
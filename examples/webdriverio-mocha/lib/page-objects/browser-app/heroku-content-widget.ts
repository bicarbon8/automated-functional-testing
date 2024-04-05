import { WebdriverIoComponent } from 'aft-ui-webdriverio';

export class HerokuContentWidget extends WebdriverIoComponent {
    /**
     * this Facet sets a static locator instead of using a passed
     * in value on the constructor
     */
    override get locator(): string {
        return '#content';
    }

    private async usernameInput(): Promise<WebdriverIO.Element> {
        return this.getRoot()
            .then(r => r.$("#username"))
            .catch((err) => null);
    }
    private async passwordInput(): Promise<WebdriverIO.Element> {
        return this.getRoot()
            .then(r => r.$('#password'))
            .catch((err) => null);
    }
    private async loginButton(): Promise<WebdriverIO.Element> {
        return this.getRoot()
            .then(r => r.$('button.radius'))
            .catch((err) => null);
    }

    async login(username: string, password: string): Promise<void> {
        let ui: WebdriverIO.Element = await this.usernameInput();
        await this.reporter.info(`sending ${username} to the Username Input`);
        await ui.addValue(username);
        await this.reporter.info('username entered');
        let pi: WebdriverIO.Element = await this.passwordInput();
        await this.reporter.info(`sending ${password} to the Password Input`);
        await pi.addValue(password);
        await this.reporter.info('password entered');
        await this.clickLoginButton();
    }

    async clickLoginButton(): Promise<void> {
        await this.reporter.info('clicking Login Button...');
        let lb: WebdriverIO.Element = await this.loginButton();
        await lb.click();
        await this.reporter.info('Login Button clicked');
    }

    async getLoginButton(): Promise<WebdriverIO.Element> {
        return await this.loginButton();
    }
}
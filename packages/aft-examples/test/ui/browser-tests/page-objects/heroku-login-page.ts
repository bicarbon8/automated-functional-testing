import { By, Locator } from 'selenium-webdriver';
import { HerokuContentWidget } from './heroku-content-widget';
import { HerokuMessagesWidget } from './heroku-messages-widget';
import { SeleniumComponent } from 'aft-ui-selenium';

export class HerokuLoginPage extends SeleniumComponent {
    /**
     * this Facet sets a static locator instead of using a passed
     * in value on the constructor
     */
    override get locator(): Locator {
        return By.css('html');
    }

    /* begin: widgets */
    async content(): Promise<HerokuContentWidget> {
        return await this.getComponent(HerokuContentWidget);
    }
    async messages(): Promise<HerokuMessagesWidget> {
        return await this.getComponent(HerokuMessagesWidget);
    }
    /* end: widgets */

    async navigateTo(): Promise<void> {
        try {
            await this.driver.navigate().to('https://the-internet.herokuapp.com/login');
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /* begin: page actions */
    async login(username: string, password: string): Promise<void> {
        let hc: HerokuContentWidget = await this.content();
        return hc.login(username, password);
    }

    async hasMessage(): Promise<boolean> {
        let hm: HerokuMessagesWidget = await this.messages();
        return hm.hasMessage();
    }

    async getMessage(): Promise<string> {
        let hm: HerokuMessagesWidget = await this.messages();
        return hm.getMessage();
    }
    /* end: page actions */
}
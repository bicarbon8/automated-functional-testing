import { By, Locator } from 'selenium-webdriver';
import { SeleniumFacet } from 'aft-ui-selenium';
import { HerokuContentWidget } from './heroku-content-widget';
import { HerokuMessagesWidget } from './heroku-messages-widget';

export class HerokuLoginPage extends SeleniumFacet {
    /**
     * this Facet sets a static locator instead of using a passed
     * in value on the constructor
     */
    readonly locator: Locator = By.css('html');

    /* begin: widgets */
    async content(): Promise<HerokuContentWidget> {
        return await this.getFacet(HerokuContentWidget);
    }
    async messages(): Promise<HerokuMessagesWidget> {
        return await this.getFacet(HerokuMessagesWidget, {maxWaitMs: 20000});
    }
    /* end: widgets */

    async navigateTo(): Promise<void> {
        try {
            await this.session.goTo('https://the-internet.herokuapp.com/login');
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
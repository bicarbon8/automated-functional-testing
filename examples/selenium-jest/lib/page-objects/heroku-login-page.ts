import { By, Locator } from 'selenium-webdriver';
import { HerokuContentWidget } from './heroku-content-widget';
import { HerokuMessagesWidget } from './heroku-messages-widget';
import { SeleniumComponent } from 'aft-ui-selenium';
import { Err } from 'aft-core';

export class HerokuLoginPage extends SeleniumComponent {
    /**
     * this Facet sets a static locator instead of using a passed
     * in value on the constructor
     */
    override get locator(): Locator {
        return By.css('html');
    }

    /* begin: widgets */
    get content(): HerokuContentWidget {
        return this.getComponent(HerokuContentWidget);
    }
    get messages(): HerokuMessagesWidget {
        return this.getComponent(HerokuMessagesWidget);
    }
    /* end: widgets */

    async navigateTo(): Promise<void> {
        const handled = await Err.handleAsync(() => this.driver.navigate().to('https://the-internet.herokuapp.com/login'));
        if (handled.message) {
            await this.reporter.error(handled.message);
        }
    }

    /* begin: page actions */
    async login(username: string, password: string): Promise<void> {
        return this.content.login(username, password);
    }

    async hasMessage(): Promise<boolean> {
        return this.messages.hasMessage();
    }

    async getMessage(): Promise<string> {
        return this.messages.getMessage();
    }
    /* end: page actions */
}
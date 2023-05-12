import { By, Locator, WebElement } from "selenium-webdriver";
import { BrowserFacet } from "../../../../../aft-ui-browsers/src";

export class HerokuMessagesWidget extends BrowserFacet {
    /**
     * this Facet sets a static locator instead of using a passed
     * in value on the constructor
     */
    override get locator(): Locator {
        return By.id('flash-messages');
    }

    private async message(): Promise<WebElement> {
        let elements: WebElement[] = await this.getElements({ locator: By.id('flash') });
        return elements[0];
    }
    
    async hasMessage(): Promise<boolean> {
        return await this.message()
        .then((message) => {
            return message !== undefined;
        }).catch((err: Error) => {
            return false;
        });
    }

    async getMessage(): Promise<string> {
        if (await this.hasMessage()) {
            return await this.message()
            .then(message => {
                return message.getText();
            }).catch((err) => {
                return null;
            });
        }
        return null;
    }
}
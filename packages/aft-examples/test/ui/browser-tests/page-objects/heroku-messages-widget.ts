import { By, Locator, WebElement } from "selenium-webdriver";
import { SeleniumFacet } from "aft-ui-selenium";

export class HerokuMessagesWidget extends SeleniumFacet {
    /**
     * this Facet sets a static locator instead of using a passed
     * in value on the constructor
     */
    readonly locator: Locator = By.id('flash-messages');

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
            .then((message) => {
                return message.getText();
            });
        }
        return null;
    }
}
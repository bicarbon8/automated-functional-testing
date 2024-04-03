import { SeleniumComponent } from "aft-ui-selenium";
import { By, Locator, WebElement } from "selenium-webdriver";

export class HerokuMessagesWidget extends SeleniumComponent {
    /**
     * this Facet sets a static locator instead of using a passed
     * in value on the constructor
     */
    override get locator(): Locator {
        return By.id('flash-messages');
    }

    private async message(): Promise<WebElement> {
        let elements: WebElement[];
        try {
            elements = await this.getRoot()
                .then(r => r.findElements(By.id('flash')))
                .catch((err) => []);
        } catch (e) {
            return null;
        }
        if (elements.length > 0) {
            return elements[0];
        }
        return null;
    }
    
    async hasMessage(): Promise<boolean> {
        const message = await this.message();
        if (message != null) {
            return true;
        }
        return false;
    }

    async getMessage(): Promise<string> {
        if (await this.hasMessage()) {
            const messageEl = await this.message();
            return await messageEl.getText();
        }
        return null;
    }
}
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
        let elements: WebElement[] = await (await this.getRoot()).findElements(By.id('flash'));
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
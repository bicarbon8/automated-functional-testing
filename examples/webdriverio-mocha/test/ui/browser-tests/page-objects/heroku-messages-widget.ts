import { WebdriverIoComponent } from "aft-ui-webdriverio";

export class HerokuMessagesWidget extends WebdriverIoComponent {
    /**
     * this Facet sets a static locator instead of using a passed
     * in value on the constructor
     */
    override get locator(): string {
        return '#flash-messages';
    }

    private async message(): Promise<WebdriverIO.Element> {
        let elements: WebdriverIO.ElementArray | any[];
        try {
            elements = await this.getRoot()
                .then(r => r.$$('#flash'))
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
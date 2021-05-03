import { FakeLocator } from "./fake-locator";

export class FakeWebElement {
    locator: FakeLocator;
    enabled: boolean = false;
    displayed: boolean = false;
    text: string;
    elements: FakeWebElement[] = [];
    clicks: number = 0;
    attributes: Map<string, string> = new Map<string, string>();
    async isEnabled(): Promise<boolean> {
        return this.enabled;
    }
    async isDisplayed(): Promise<boolean> {
        return this.displayed;
    }
    async getText(): Promise<string> {
        return this.text;
    }
    async sendKeys(input: string): Promise<void> {
        this.text = input;
    }
    async findElements(locator: FakeLocator): Promise<FakeWebElement[]> {
        let elements: FakeWebElement[] = [];
        for (var i=0; i<this.elements.length; i++) {
            let element: FakeWebElement = this.elements[i];
            if (locator.using == element.locator.using && locator.value == element.locator.value) {
                elements.push(element);
            }
        }
        return elements;
    }
    async findElement(locator: FakeLocator): Promise<FakeWebElement> {
        let elements: FakeWebElement[] = await this.findElements(locator);
        if (elements?.length) {
            return elements[0];
        }
        return Promise.reject('element not found');
    }
    async click(): Promise<void> {
        this.clicks++;
    }
    async getAttribute(name: string): Promise<string> {
        if (this.attributes.has(name)) {
            return this.attributes.get(name);
        }
        return null;
    }
}
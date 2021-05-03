import { FakeWebElement } from "../facets/fake-web-element";
import { FakeLocator } from "../facets/fake-locator";

export class FakeDriver {
    elements: FakeWebElement[] = [];
    async findElements(locator: FakeLocator): Promise<FakeWebElement[]> {
        let elements: FakeWebElement[] = [];
        for (var i=0; i<this.elements.length; i++) {
            let el: FakeWebElement = this.elements[i];
            if (el.locator.using == locator.using && el.locator.value == locator.value) {
                elements.push(el);
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
    async refresh(): Promise<void> {
        return Promise.resolve();
    }
    async resize(width: number, height: number): Promise<void> {
        return Promise.resolve();
    }
    async get(): Promise<void> {
        return Promise.resolve();
    }
}
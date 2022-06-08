import { FakeDriver } from "./fake-driver";
import { FakeWebElement } from "../facets/fake-web-element";
import { FakeLocator } from "../facets/fake-locator";
import { FakeSessionGeneratorPlugin } from "./fake-session-generator-plugin";
import { FakeSession } from "./fake-session";

describe('UiSessionGeneratorPlugin', () => {
    it('can return specified type of driver from the driver plugin', async () => {
        let fwe: FakeWebElement = new FakeWebElement();
        fwe.locator = FakeLocator.css('fake');
        let fd: FakeDriver = new FakeDriver();
        fd.elements.push(fwe);
        let fsp: FakeSessionGeneratorPlugin = new FakeSessionGeneratorPlugin();

        let actual: FakeSession = await fsp.newUiSession();
        let elements: FakeWebElement[] = await actual.driver.findElements(fwe.locator);

        expect(actual).toBeDefined();
        expect(actual.driver.constructor.name).toEqual('FakeDriver');
        expect(elements).toBeDefined();
        expect(elements.length).toBe(0);
    });
});
import { FakeSession } from "./fake-session";
import { FakeDriver } from "./fake-driver";
import { FakeWebElement } from "../facets/fake-web-element";
import { FakeLocator } from "../facets/fake-locator";
import { FakeSessionGeneratorPlugin } from "./fake-session-generator-plugin";

describe('AbstractSessionGeneratorPlugin', () => {
    it('can return specified type of session from the session plugin', async () => {
        let fwe: FakeWebElement = new FakeWebElement();
        fwe.locator = FakeLocator.css('fake');
        let fd: FakeDriver = new FakeDriver();
        fd.elements.push(fwe);
        let findElementsSpy = spyOn(fd, 'findElements').and.callThrough();
        let fsp: FakeSessionGeneratorPlugin = new FakeSessionGeneratorPlugin({enabled: true});

        let actual: FakeSession = await fsp.newSession({driver: fd});
        let elements: FakeWebElement[] = await actual.driver.findElements(fwe.locator);

        expect(actual).toBeDefined();
        expect(elements).toBeDefined();
        expect(elements.length).toBeGreaterThan(0);
        expect(findElementsSpy).toHaveBeenCalledTimes(1);
    });
});
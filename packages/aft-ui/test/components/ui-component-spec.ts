import { LogManager, rand } from "aft-core";
import { UiComponentOptions } from "../../src";
import { FakeComponent } from "./fake-component";
import { FakeElement } from "./fake-element";
import { FakeDriver } from "./fake-driver";
import { FakeLocator } from "./fake-locator";

describe('UiComponent', () => {
    it('can be extended to return specific UiComponent types', async () => {
        const mockElement = new FakeElement();
        spyOn(mockElement, 'findFakeElement').and.callFake((l: FakeLocator) => Promise.resolve(mockElement));
        const mockDriver = new FakeDriver();
        spyOn(mockDriver, 'findFakeElement').and.callFake((l: FakeLocator) => Promise.resolve(mockElement));
        const options: UiComponentOptions = {
            driver: mockDriver,
            locator: FakeLocator.fakeLocType('fake:loc'),
            logMgr: new LogManager(rand.getString(15))
        };
        const compo = new FakeComponent(options);

        const actual = await compo.getFacet(FakeComponent, {locator: FakeLocator.fakeLocType('new:loc')});

        expect(actual).toBeDefined();
        expect(actual.locator.input).toEqual('new:loc');
        expect(await actual.parent()).toBe(await compo.getRoot());
        expect(actual.logMgr).toBe(compo.logMgr);
    });
});
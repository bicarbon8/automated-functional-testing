import { LoggingPluginManager, rand } from "aft-core";
import { Browser, Element, ElementArray } from "webdriverio";
import { MobileAppFacet, MobileAppSession } from "../../src";

describe('MobileAppFacet', () => {
    beforeEach(() => {
        jasmine.getEnv().allowRespy(true);
    });

    it('can auto-refresh from Driver on Error in getRoot', async () => {
        let element: Element<'async'> = jasmine.createSpyObj('Element<"async">', {
            'isDisplayed': Promise.resolve(true), 
            'isEnabled': Promise.resolve(true), 
            'click': Promise.resolve(), 
            'sendKeys': Promise.resolve(), 
            'getAttribute': Promise.resolve('foo'),
            '$$': Promise.resolve([] as ElementArray)
        });
        let driver: Browser<'async'> = jasmine.createSpyObj('Browser<"async">', {
            '$$': Promise.resolve([element]),
            'closeApp': Promise.resolve(),
            'destroySession': Promise.resolve(),
            'sessionId': rand.guid
        });
        spyOn(driver, '$$').and.returnValues(Promise.reject('no element'), Promise.resolve([element] as ElementArray));
        let session: MobileAppSession = new MobileAppSession({
            driver: driver, 
            logMgr: new LoggingPluginManager({logName: 'can auto-refresh from Driver on Error in getRoot'})
        });
        let facet: MobileAppFacet = await session.getFacet(MobileAppFacet, {
            locator: 'div.fake',
            maxWaitMs: 4000
        });
        let actual: Element<'async'> = await facet.getRoot();

        expect(actual).toBeDefined();
        expect(await actual.isDisplayed()).toBe(true);
        expect(driver.$$).toHaveBeenCalledTimes(2);
    });
});
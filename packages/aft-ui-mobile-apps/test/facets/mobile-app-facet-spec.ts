import { AftLog, rand } from "aft-core";
import { Browser, Element, ElementArray, ChainablePromiseArray } from "webdriverio";
import { MobileAppFacet, MobileAppFacetOptions, MobileAppSession } from "../../src";

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
        spyOn(driver, '$$').and.returnValues(Promise.reject('no element') as ChainablePromiseArray<ElementArray>, Promise.resolve([element] as ElementArray) as ChainablePromiseArray<ElementArray>);
        let session = new MobileAppSession<any>({
            driver: driver, 
            logMgr: new AftLog({logName: 'can auto-refresh from Driver on Error in getRoot'})
        });
        let facet: MobileAppFacet = await session.getFacet<MobileAppFacet, MobileAppFacetOptions>(MobileAppFacet, {
            locator: 'div.fake',
            maxWaitMs: 4000
        });
        let actual: Element<'async'> = await facet.getRoot();

        expect(actual).toBeDefined();
        expect(await actual.isDisplayed()).toBe(true);
        expect(driver.$$).toHaveBeenCalledTimes(2);
    });
});
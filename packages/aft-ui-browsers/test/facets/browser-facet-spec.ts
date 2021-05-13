import { By, WebDriver, WebElement, Session } from "selenium-webdriver";
import { LoggingPluginManager, rand } from "aft-core";
import { BrowserSession, BrowserFacet } from "../../src";

describe('BrowserFacet', () => {
    beforeEach(() => {
        jasmine.getEnv().allowRespy(true);
    });

    it('can auto-refresh from WebDriver on Error in getRoot', async () => {
        let element: WebElement = jasmine.createSpyObj('WebElement', {
            'isDisplayed': Promise.resolve(true), 
            'isEnabled': Promise.resolve(true), 
            'click': Promise.resolve(), 
            'sendKeys': Promise.resolve(), 
            'getAttribute': Promise.resolve('foo'),
            'findElements': Promise.resolve([])
        });
        let sesh: Session = jasmine.createSpyObj('Session', {
            'getId': rand.guid
        });
        let driver: WebDriver = jasmine.createSpyObj('WebDriver', {
            'findElements': Promise.resolve([element]),
            'close': Promise.resolve(),
            'quit': Promise.resolve(),
            'getSession': Promise.resolve(sesh)
        });
        spyOn(driver, 'findElements').and.returnValues(Promise.reject('no element'), Promise.resolve([element]));
        let session: BrowserSession = new BrowserSession({
            driver: driver, 
            logMgr: new LoggingPluginManager({logName: 'can auto-refresh from WebDriver on Error in getRoot'})
        });
        let facet: BrowserFacet = await session.getFacet(BrowserFacet, {
            locator: By.css('div.fake'),
            maxWaitMs: 4000
        });
        let actual: WebElement = await facet.getRoot();

        expect(actual).toBeDefined();
        expect(await actual.isDisplayed()).toBe(true);
        expect(driver.findElements).toHaveBeenCalledTimes(2);
    });
});
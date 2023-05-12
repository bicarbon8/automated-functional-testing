import { LogManager, rand } from "aft-core";
import { UiComponentOptions } from "../../src";
import { By, Locator, WebDriver, WebElement } from "selenium-webdriver";
import { FakeComponent } from "./fake-component";

describe('UiComponent', () => {
    it('can be extended to return specific UiComponent types', async () => {
        const mockElement1: WebElement = {} as WebElement;
        const mockElement2: WebElement = {} as WebElement;
        const mockDriver: WebDriver = {
            findElement: (l: Locator): Promise<WebElement> => {
                if (l.toString().includes('fake:loc')) {
                    return Promise.resolve(mockElement1)
                }
                return Promise.resolve(mockElement2);
            },
        } as WebDriver;
        const options: UiComponentOptions = {
            driver: mockDriver,
            locator: By.css('fake:loc'),
            logMgr: new LogManager(rand.getString(15))
        };
        const compo = new FakeComponent(options);

        const actual = await compo.getFacet(FakeComponent, {locator: By.css('new:loc')});

        expect(actual).toBeDefined();
        expect(actual.locator).toEqual(By.css('new:loc'));
        expect(await actual.parent()).toBe(await compo.getRoot());
        expect(actual.logMgr).toBe(compo.logMgr);
    });
});
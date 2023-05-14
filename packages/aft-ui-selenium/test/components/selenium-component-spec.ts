import { By, WebDriver, WebElement, WebElementPromise } from "selenium-webdriver"
import { SeleniumComponent } from "../../src/components/selenium-component";

describe('SeleniumComponent', () => {
    it('uses the driver if no parent present', async () => {
        let mockElement: WebElement;
        mockElement = jasmine.createSpyObj<WebElement>({
            findElement: Promise.resolve(mockElement) as WebElementPromise
        });
        const mockDriver = jasmine.createSpyObj<WebDriver>({
            findElement: Promise.resolve(mockElement) as WebElementPromise
        });
        const compo = new SeleniumComponent({
            driver: mockDriver,
            locator: By.css('fake.css')
        });

        const root = await compo.getRoot();

        expect(mockDriver.findElement).toHaveBeenCalledTimes(1);
    })

    it('uses the parent if parent present', async () => {
        let mockElement: WebElement;
        mockElement = jasmine.createSpyObj<WebElement>({
            findElement: Promise.resolve(mockElement) as WebElementPromise
        });
        const mockDriver = jasmine.createSpyObj<WebDriver>({
            findElement: Promise.resolve(mockElement) as WebElementPromise
        });
        const compo = new SeleniumComponent({
            driver: mockDriver,
            locator: By.css('fake.css'),
            parent: () => Promise.resolve(mockElement)
        });

        const root = await compo.getRoot();

        expect(mockDriver.findElement).not.toHaveBeenCalled();
        expect(mockElement.findElement).toHaveBeenCalledTimes(1);
    })
})
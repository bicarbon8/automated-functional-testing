import { ChainablePromiseElement } from "webdriverio";
import { WebdriverIoComponent } from "../../src/components/webdriverio-component";

describe('WebdriverIoComponent', () => {
    it('uses the driver if no parent present', async () => {
        let mockElement: WebdriverIO.Element;
        mockElement = jasmine.createSpyObj<WebdriverIO.Element>({
            $: Promise.resolve(mockElement) as ChainablePromiseElement<WebdriverIO.Element>
        });
        const mockDriver = jasmine.createSpyObj<WebdriverIO.Browser>({
            $: Promise.resolve(mockElement) as ChainablePromiseElement<WebdriverIO.Element>
        });
        const compo = new WebdriverIoComponent({
            driver: mockDriver,
            locator: '.fake_css'
        });

        const root = await compo.getRoot();

        expect(mockDriver.$).toHaveBeenCalledTimes(1);
    })

    it('uses the parent if parent present', async () => {
        let mockElement: WebdriverIO.Element;
        mockElement = jasmine.createSpyObj<WebdriverIO.Element>({
            $: Promise.resolve(mockElement) as ChainablePromiseElement<WebdriverIO.Element>
        });
        const mockDriver = jasmine.createSpyObj<WebdriverIO.Element>({
            $: Promise.resolve(mockElement) as ChainablePromiseElement<WebdriverIO.Element>
        });
        const compo = new WebdriverIoComponent({
            driver: mockDriver,
            locator: '.fake_css',
            parent: () => Promise.resolve(mockElement)
        });

        const root = await compo.getRoot();

        expect(mockDriver.$).not.toHaveBeenCalled();
        expect(mockElement.$).toHaveBeenCalledTimes(1);
    })
})
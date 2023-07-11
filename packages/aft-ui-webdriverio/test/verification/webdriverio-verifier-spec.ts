import { AftConfig, TestExecutionPolicyManager } from "aft-core";
import { UiSessionGeneratorManager } from "aft-ui";
import { Browser, ChainablePromiseElement, Element } from "webdriverio";
import { WebdriverIoVerifier, verifyWithWebdriverIO } from "../../src";

describe('WebdriverIoVerifier', () => {
    it('can create a MobileAppSession', async () => {
        let mockElement: Element;
        mockElement = jasmine.createSpyObj<Element>({
            "$": Promise.resolve(mockElement) as ChainablePromiseElement<Element>
        });
        const mockBrowser: Browser = jasmine.createSpyObj<Browser>({
            "$": Promise.resolve(mockElement) as ChainablePromiseElement<Element>
        })
        const sessionMgr = new UiSessionGeneratorManager(new AftConfig({}));
        spyOn(sessionMgr, 'getSession').and.callFake((options?: Record<string, any>): Promise<unknown> => {
            return Promise.resolve(mockBrowser);
        });

        await verifyWithWebdriverIO(async (mav: WebdriverIoVerifier) => {
            expect(mav.browser).toBeDefined();
        }).internals.usingUiSessionGeneratorManager(sessionMgr);

        expect(sessionMgr.getSession).toHaveBeenCalledTimes(1);
    });

    it('can create a MobileAppSession using specific MobileAppSessionOptions', async () => {
        let mockElement: Element;
        mockElement = jasmine.createSpyObj<Element>({
            "$": Promise.resolve(mockElement) as ChainablePromiseElement<Element>
        });
        const mockBrowser: Browser = jasmine.createSpyObj<Browser>({
            "$": Promise.resolve(mockElement) as ChainablePromiseElement<Element>
        })
        const sessionMgr = new UiSessionGeneratorManager(new AftConfig({}));
        spyOn(sessionMgr, 'getSession').and.callFake((options?: Record<string, any>): Promise<unknown> => {
            expect(options['foo']).toEqual('bar');
            expect(options['baz']).toBe(1);
            return Promise.resolve(mockBrowser);
        });

        const opts = {
            foo: 'bar',
            baz: 1
        };
        await verifyWithWebdriverIO(async (mav: WebdriverIoVerifier) => {
            expect(mav.browser).toBeDefined();
        }).withAdditionalSessionOptions(opts)
        .internals.usingUiSessionGeneratorManager(sessionMgr);

        expect(sessionMgr.getSession).toHaveBeenCalledTimes(1);
    });

    it('disposes of MobileAppSession on completion', async () => {
        let mockElement: Element;
        mockElement = jasmine.createSpyObj<Element>({
            "$": Promise.resolve(mockElement) as ChainablePromiseElement<Element>
        });
        const mockBrowser: Browser = jasmine.createSpyObj<Browser>({
            "$": Promise.resolve(mockElement) as ChainablePromiseElement<Element>,
            "deleteSession": Promise.resolve()
        });
        const sessionMgr = new UiSessionGeneratorManager(new AftConfig({}));
        spyOn(sessionMgr, 'getSession').and.callFake((options?: Record<string, any>): Promise<unknown> => {
            return Promise.resolve(mockBrowser);
        });

        await verifyWithWebdriverIO(async (mav: WebdriverIoVerifier) => {
            expect(mav.browser).toBeDefined();
        }).internals.usingUiSessionGeneratorManager(sessionMgr);

        expect(sessionMgr.getSession).toHaveBeenCalledTimes(1);
        expect(mockBrowser.deleteSession).toHaveBeenCalledTimes(1);
    });

    it('no MobileAppSession is created if assertion should not be run', async () => {
        let mockElement: Element;
        mockElement = jasmine.createSpyObj<Element>({
            "$": Promise.resolve(mockElement) as ChainablePromiseElement<Element>
        });
        const mockBrowser: Browser = jasmine.createSpyObj<Browser>({
            "$": Promise.resolve(mockElement) as ChainablePromiseElement<Element>
        })
        const sessionMgr = new UiSessionGeneratorManager(new AftConfig({}));
        spyOn(sessionMgr, 'getSession').and.callFake((options?: Record<string, any>): Promise<unknown> => {
            return Promise.resolve(mockBrowser);
        });
        const peMgr: TestExecutionPolicyManager = new TestExecutionPolicyManager();
        spyOn(peMgr, 'shouldRun').and.callFake((testId: string) => Promise.resolve({result: false}));
        
        await verifyWithWebdriverIO((mav: WebdriverIoVerifier) => {
            expect(true).toBeFalse();
        }).withTestIds('C1234')
        .internals.usingUiSessionGeneratorManager(sessionMgr)
        .internals.usingTestExecutionPolicyManager(peMgr);

        expect(sessionMgr.getSession).not.toHaveBeenCalled();
    });
});
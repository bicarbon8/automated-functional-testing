import { TestCasePluginManager } from "aft-core";
import { WebDriver } from "selenium-webdriver";
import { BrowserSession, BrowserSessionGeneratorPluginManager, BrowserSessionOptions, browserVerifier, BrowserVerifier } from "../../src";

describe('BrowserVerifier', () => {
    it('can create a BrowserSession', async () => {
        let sessionMgr: BrowserSessionGeneratorPluginManager = new BrowserSessionGeneratorPluginManager();
        spyOn(sessionMgr, 'newSession').and.callFake((options?: BrowserSessionOptions): Promise<BrowserSession> => {
            return Promise.resolve(new BrowserSession(options));
        });

        await browserVerifier((bv: BrowserVerifier) => {
            expect(bv.session).toBeDefined();
            expect(bv.session.logMgr).toBe(bv.logMgr);
        })
        .withBrowserSessionGeneratorPluginManager(sessionMgr);

        expect(sessionMgr.newSession).toHaveBeenCalledTimes(1);
    });

    it('can create a BrowserSession using specific BrowserSessionOptions', async () => {
        let sessionMgr: BrowserSessionGeneratorPluginManager = new BrowserSessionGeneratorPluginManager();
        spyOn(sessionMgr, 'newSession').and.callFake((options?: BrowserSessionOptions): Promise<BrowserSession> => {
            expect(options.platform).toEqual('windows_8.1_firefox');
            return Promise.resolve(new BrowserSession(options));
        });

        await browserVerifier((bv: BrowserVerifier) => {
            expect(bv.session).toBeDefined();
            expect(bv.session.platform.toString()).toEqual('windows_8.1_firefox_+_+');
            expect(bv.session.logMgr).toBe(bv.logMgr);
        })
        .withBrowserSessionGeneratorPluginManager(sessionMgr)
        .and.withBrowserFrom({
            platform: 'windows_8.1_firefox'
        });

        expect(sessionMgr.newSession).toHaveBeenCalledTimes(1);
    });

    it('disposes of BrowserSession on completion', async () => {
        let sessionMgr: BrowserSessionGeneratorPluginManager = new BrowserSessionGeneratorPluginManager();
        spyOn(sessionMgr, 'newSession').and.callFake((options?: BrowserSessionOptions): Promise<BrowserSession> => {
            return Promise.resolve(new BrowserSession(options));
        });
        let driver: WebDriver = jasmine.createSpyObj('WebDriver', {
            'quit': Promise.resolve()
        });

        await browserVerifier((bv: BrowserVerifier) => {
            expect(bv.session).toBeDefined();
            expect(bv.session.logMgr).toBe(bv.logMgr);
        })
        .withBrowserFrom({driver: driver})
        .and.withBrowserSessionGeneratorPluginManager(sessionMgr);

        expect(sessionMgr.newSession).toHaveBeenCalledTimes(1);
        expect(driver.quit).toHaveBeenCalledTimes(1);
    });

    it('no BrowserSession is created if assertion should not be run', async () => {
        let sessionMgr: BrowserSessionGeneratorPluginManager = new BrowserSessionGeneratorPluginManager();
        spyOn(sessionMgr, 'newSession').and.callFake((options?: BrowserSessionOptions): Promise<BrowserSession> => {
            return Promise.resolve(new BrowserSession(options));
        });
        let tcMgr: TestCasePluginManager = new TestCasePluginManager();
        spyOn(tcMgr, 'shouldRun').and.callFake((testId: string) => Promise.resolve({success: false, message: 'no'}));
        
        await browserVerifier((bv: BrowserVerifier) => {
            expect(true).toBeFalse();
        })
        .withBrowserSessionGeneratorPluginManager(sessionMgr)
        .and.withTests('C1234')
        .and.withTestCasePluginManager(tcMgr);

        expect(sessionMgr.newSession).not.toHaveBeenCalled();
    });
});
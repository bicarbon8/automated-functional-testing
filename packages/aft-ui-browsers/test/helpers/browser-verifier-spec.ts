import { rand, TestCasePluginManager } from "aft-core";
import { Session, WebDriver } from "selenium-webdriver";
import { BrowserSession, BrowserSessionGeneratorPluginManager, BrowserSessionOptions, verifyWithBrowser, BrowserVerifier } from "../../src";

describe('BrowserVerifier', () => {
    it('can create a BrowserSession', async () => {
        let sessionMgr: BrowserSessionGeneratorPluginManager = new BrowserSessionGeneratorPluginManager();
        spyOn(sessionMgr, 'newSession').and.callFake((options?: BrowserSessionOptions): Promise<BrowserSession> => {
            return Promise.resolve(new BrowserSession(options));
        });

        await verifyWithBrowser(async (bv: BrowserVerifier) => {
            expect(bv.session).toBeDefined();
            expect(await bv.session.logMgr.logName()).toBe(await bv.logMgr.logName());
        }).and.withBrowserSessionGeneratorPluginManager(sessionMgr);

        expect(sessionMgr.newSession).toHaveBeenCalledTimes(1);
    });

    it('can create a BrowserSession using specific BrowserSessionOptions', async () => {
        let sessionMgr: BrowserSessionGeneratorPluginManager = new BrowserSessionGeneratorPluginManager();
        spyOn(sessionMgr, 'newSession').and.callFake((options?: BrowserSessionOptions): Promise<BrowserSession> => {
            expect(options.platform).toEqual('windows_8.1_firefox');
            return Promise.resolve(new BrowserSession(options));
        });

        await verifyWithBrowser((bv: BrowserVerifier) => {
            expect(bv.session).toBeDefined();
            expect(bv.session.platform.toString()).toEqual('windows_8.1_firefox_+_+');
        }).and.withBrowserSessionGeneratorPluginManager(sessionMgr)
        .and.withBrowserSessionOptions({
            platform: 'windows_8.1_firefox'
        });

        expect(sessionMgr.newSession).toHaveBeenCalledTimes(1);
    });

    it('disposes of BrowserSession on completion', async () => {
        let sessionMgr: BrowserSessionGeneratorPluginManager = new BrowserSessionGeneratorPluginManager();
        spyOn(sessionMgr, 'newSession').and.callFake((options?: BrowserSessionOptions): Promise<BrowserSession> => {
            return Promise.resolve(new BrowserSession(options));
        });
        let sesh: Session = jasmine.createSpyObj('Session', {
            'getId': rand.guid
        });
        let driver: WebDriver = jasmine.createSpyObj('WebDriver', {
            'quit': Promise.resolve(),
            'getSession': Promise.resolve(sesh)
        });

        await verifyWithBrowser((bv: BrowserVerifier) => {
            expect(bv.session).toBeDefined();
        }).and.withBrowserSessionOptions({driver: driver})
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
        
        await verifyWithBrowser((bv: BrowserVerifier) => {
            expect(true).toBeFalse();
        }).and.withBrowserSessionGeneratorPluginManager(sessionMgr)
        .and.withTests('C1234')
        .and.withTestCasePluginManager(tcMgr);

        expect(sessionMgr.newSession).not.toHaveBeenCalled();
    });
});
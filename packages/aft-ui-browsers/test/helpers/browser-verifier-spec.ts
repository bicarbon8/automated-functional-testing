import { rand, TestCaseManager } from "aft-core";
import { Session, WebDriver } from "selenium-webdriver";
import { BrowserSession, BrowserSessionOptions, verifyWithBrowser, BrowserVerifier } from "../../src";
import { BrowserSessionGeneratorManager } from "../../src/sessions/browser-session-generator-manager";

describe('BrowserVerifier', () => {
    it('can create a BrowserSession', async () => {
        let sessionMgr: BrowserSessionGeneratorManager = new BrowserSessionGeneratorManager();
        spyOn(sessionMgr, 'newUiSession').and.callFake((options?: BrowserSessionOptions): Promise<BrowserSession<any>> => {
            return Promise.resolve(new BrowserSession<any>(options));
        });

        await verifyWithBrowser(async (bv: BrowserVerifier) => {
            expect(bv.session).withContext('BrowserVerifier should create a new session').toBeDefined();
            expect(bv.session.logMgr.logName).withContext('the new session should use the same logger as the verifier').toBe(bv.logger.logName);
        }).and.withBrowserSessionGeneratorManager(sessionMgr);

        expect(sessionMgr.newUiSession).toHaveBeenCalledTimes(1);
    });

    it('can create a BrowserSession using specific BrowserSessionOptions', async () => {
        let sessionMgr: BrowserSessionGeneratorManager = new BrowserSessionGeneratorManager();
        spyOn(sessionMgr, 'newUiSession').and.callFake((options?: BrowserSessionOptions): Promise<BrowserSession<any>> => {
            expect(options.uiplatform).toEqual('windows_8.1_firefox');
            return Promise.resolve(new BrowserSession<any>(options));
        });

        await verifyWithBrowser((bv: BrowserVerifier) => {
            expect(bv.session).toBeDefined();
            expect(bv.session.platform.toString()).toEqual('windows_8.1_firefox_+_+');
        }).and.withBrowserSessionGeneratorManager(sessionMgr)
        .and.withBrowserSessionOptions({
            uiplatform: 'windows_8.1_firefox'
        });

        expect(sessionMgr.newUiSession).toHaveBeenCalledTimes(1);
    });

    it('disposes of BrowserSession on completion', async () => {
        let sessionMgr: BrowserSessionGeneratorManager = new BrowserSessionGeneratorManager();
        spyOn(sessionMgr, 'newUiSession').and.callFake((options?: BrowserSessionOptions): Promise<BrowserSession<any>> => {
            return Promise.resolve(new BrowserSession<any>(options));
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
        .and.withBrowserSessionGeneratorManager(sessionMgr);

        expect(sessionMgr.newUiSession).toHaveBeenCalledTimes(1);
        expect(driver.quit).toHaveBeenCalledTimes(1);
    });

    it('no BrowserSession is created if assertion should not be run', async () => {
        let sessionMgr: BrowserSessionGeneratorManager = new BrowserSessionGeneratorManager();
        spyOn(sessionMgr, 'newUiSession').and.callFake((options?: BrowserSessionOptions): Promise<BrowserSession<any>> => {
            return Promise.resolve(new BrowserSession<any>(options));
        });
        let tcMgr: TestCaseManager = new TestCaseManager();
        spyOn(tcMgr, 'shouldRun').and.callFake((testId: string) => Promise.resolve(false));
        
        await verifyWithBrowser((bv: BrowserVerifier) => {
            expect(true).toBeFalse();
        }).and.withBrowserSessionGeneratorManager(sessionMgr)
        .and.withTestIds('C1234')
        .and.withTestCaseManager(tcMgr);

        expect(sessionMgr.newUiSession).not.toHaveBeenCalled();
    });
});
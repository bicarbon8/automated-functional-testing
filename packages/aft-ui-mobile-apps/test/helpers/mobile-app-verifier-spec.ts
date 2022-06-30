import { TestCaseManager } from "aft-core";
import { Browser } from "webdriverio";
import { MobileAppSession, MobileAppSessionOptions, MobileAppVerifier, verifyWithMobileApp } from "../../src";
import { MobileAppSessionGeneratorManager } from "../../src/sessions/mobile-app-session-generator-manager";

describe('MobileAppVerifier', () => {
    it('can create a MobileAppSession', async () => {
        let sessionMgr: MobileAppSessionGeneratorManager = new MobileAppSessionGeneratorManager({plugins: []});
        spyOn(sessionMgr, 'newUiSession').and.callFake((options?: MobileAppSessionOptions): Promise<MobileAppSession<any>> => {
            return Promise.resolve(new MobileAppSession<any>(options));
        });

        await verifyWithMobileApp(async (mav: MobileAppVerifier) => {
            expect(mav.session).toBeDefined();
            expect(mav.session.logMgr.logName).toBe(mav.logMgr.logName);
        }).and.withMobileAppSessionGeneratorManager(sessionMgr);

        expect(sessionMgr.newUiSession).toHaveBeenCalledTimes(1);
    });

    it('can create a MobileAppSession using specific MobileAppSessionOptions', async () => {
        let sessionMgr: MobileAppSessionGeneratorManager = new MobileAppSessionGeneratorManager({plugins: []});
        spyOn(sessionMgr, 'newUiSession').and.callFake((options?: MobileAppSessionOptions): Promise<MobileAppSession<any>> => {
            expect(options.uiplatform).toEqual('android_11_+_+_Google Pixel 5');
            return Promise.resolve(new MobileAppSession<any>(options));
        });

        await verifyWithMobileApp((mav: MobileAppVerifier) => {
            expect(mav.session).toBeDefined();
            expect(mav.session.platform.toString()).toEqual('android_11_+_+_Google Pixel 5');
        }).and.withMobileAppSessionOptions({
            uiplatform: 'android_11_+_+_Google Pixel 5'
        }).and.withMobileAppSessionGeneratorManager(sessionMgr);

        expect(sessionMgr.newUiSession).toHaveBeenCalledTimes(1);
    });

    it('disposes of MobileAppSession on completion', async () => {
        let sessionMgr: MobileAppSessionGeneratorManager = new MobileAppSessionGeneratorManager({plugins: []});
        spyOn(sessionMgr, 'newUiSession').and.callFake((options?: MobileAppSessionOptions): Promise<MobileAppSession<any>> => {
            return Promise.resolve(new MobileAppSession<any>(options));
        });
        let driver: Browser<'async'> = jasmine.createSpyObj('Browser<"async">', {
            'deleteSession': Promise.resolve()
        });

        await verifyWithMobileApp((mav: MobileAppVerifier) => {
            expect(mav.session).toBeDefined();
        }).and.withMobileAppSessionOptions({driver: driver})
        .and.withMobileAppSessionGeneratorManager(sessionMgr);

        expect(sessionMgr.newUiSession).toHaveBeenCalledTimes(1);
        expect(driver.deleteSession).toHaveBeenCalledTimes(1);
    });

    it('no MobileAppSession is created if assertion should not be run', async () => {
        let sessionMgr: MobileAppSessionGeneratorManager = new MobileAppSessionGeneratorManager({plugins: []});
        spyOn(sessionMgr, 'newUiSession').and.callFake((options?: MobileAppSessionOptions): Promise<MobileAppSession<any>> => {
            return Promise.resolve(new MobileAppSession<any>(options));
        });
        let tcMgr: TestCaseManager = new TestCaseManager();
        spyOn(tcMgr, 'shouldRun').and.callFake((testId: string) => Promise.resolve(false));
        
        await verifyWithMobileApp((mav: MobileAppVerifier) => {
            expect(true).toBeFalse();
        }).withTestId('C1234')
        .and.withMobileAppSessionGeneratorManager(sessionMgr)
        .and.withTestCaseManager(tcMgr);

        expect(sessionMgr.newUiSession).not.toHaveBeenCalled();
    });
});
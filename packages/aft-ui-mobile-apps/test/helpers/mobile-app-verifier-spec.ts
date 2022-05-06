import { TestCaseManager } from "aft-core";
import { Browser } from "webdriverio";
import { MobileAppSession, MobileAppSessionGeneratorPluginManager, MobileAppSessionOptions, MobileAppVerifier, verifyWithMobileApp } from "../../src";

describe('MobileAppVerifier', () => {
    it('can create a MobileAppSession', async () => {
        let sessionMgr: MobileAppSessionGeneratorPluginManager = new MobileAppSessionGeneratorPluginManager({pluginNames: []});
        spyOn(sessionMgr, 'newSession').and.callFake((options?: MobileAppSessionOptions): Promise<MobileAppSession> => {
            return Promise.resolve(new MobileAppSession(options));
        });

        await verifyWithMobileApp(async (mav: MobileAppVerifier) => {
            expect(mav.session).toBeDefined();
            expect(await mav.session.logMgr.logName()).toBe(await mav.logMgr.logName());
        }).and.withMobileAppSessionGeneratorPluginManager(sessionMgr);

        expect(sessionMgr.newSession).toHaveBeenCalledTimes(1);
    });

    it('can create a MobileAppSession using specific MobileAppSessionOptions', async () => {
        let sessionMgr: MobileAppSessionGeneratorPluginManager = new MobileAppSessionGeneratorPluginManager({pluginNames: []});
        spyOn(sessionMgr, 'newSession').and.callFake((options?: MobileAppSessionOptions): Promise<MobileAppSession> => {
            expect(options.platform).toEqual('android_11_+_+_Google Pixel 5');
            return Promise.resolve(new MobileAppSession(options));
        });

        await verifyWithMobileApp((mav: MobileAppVerifier) => {
            expect(mav.session).toBeDefined();
            expect(mav.session.platform.toString()).toEqual('android_11_+_+_Google Pixel 5');
        }).and.withMobileAppSessionOptions({
            platform: 'android_11_+_+_Google Pixel 5'
        }).and.withMobileAppSessionGeneratorPluginManager(sessionMgr);

        expect(sessionMgr.newSession).toHaveBeenCalledTimes(1);
    });

    it('disposes of MobileAppSession on completion', async () => {
        let sessionMgr: MobileAppSessionGeneratorPluginManager = new MobileAppSessionGeneratorPluginManager({pluginNames: []});
        spyOn(sessionMgr, 'newSession').and.callFake((options?: MobileAppSessionOptions): Promise<MobileAppSession> => {
            return Promise.resolve(new MobileAppSession(options));
        });
        let driver: Browser<'async'> = jasmine.createSpyObj('Browser<"async">', {
            'deleteSession': Promise.resolve()
        });

        await verifyWithMobileApp((mav: MobileAppVerifier) => {
            expect(mav.session).toBeDefined();
        }).and.withMobileAppSessionOptions({driver: driver})
        .and.withMobileAppSessionGeneratorPluginManager(sessionMgr);

        expect(sessionMgr.newSession).toHaveBeenCalledTimes(1);
        expect(driver.deleteSession).toHaveBeenCalledTimes(1);
    });

    it('no MobileAppSession is created if assertion should not be run', async () => {
        let sessionMgr: MobileAppSessionGeneratorPluginManager = new MobileAppSessionGeneratorPluginManager({pluginNames: []});
        spyOn(sessionMgr, 'newSession').and.callFake((options?: MobileAppSessionOptions): Promise<MobileAppSession> => {
            return Promise.resolve(new MobileAppSession(options));
        });
        let tcMgr: TestCaseManager = new TestCaseManager();
        spyOn(tcMgr, 'shouldRun').and.callFake((testId: string) => Promise.resolve({success: false, message: 'no'}));
        
        await verifyWithMobileApp((mav: MobileAppVerifier) => {
            expect(true).toBeFalse();
        }).withTestId('C1234')
        .and.withMobileAppSessionGeneratorPluginManager(sessionMgr)
        .and.withTestCasePluginManager(tcMgr);

        expect(sessionMgr.newSession).not.toHaveBeenCalled();
    });
});
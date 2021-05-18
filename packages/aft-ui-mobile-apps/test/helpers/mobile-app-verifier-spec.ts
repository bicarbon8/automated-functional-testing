import { TestCasePluginManager } from "aft-core";
import { Browser } from "webdriverio";
import { MobileAppSession, MobileAppSessionGeneratorPluginManager, MobileAppSessionOptions, MobileAppVerifier, mobileAppVerifier } from "../../src";

describe('MobileAppVerifier', () => {
    it('can create a MobileAppSession', async () => {
        let sessionMgr: MobileAppSessionGeneratorPluginManager = new MobileAppSessionGeneratorPluginManager({pluginNames: []});
        spyOn(sessionMgr, 'newSession').and.callFake((options?: MobileAppSessionOptions): Promise<MobileAppSession> => {
            return Promise.resolve(new MobileAppSession(options));
        });

        await mobileAppVerifier(async (mav: MobileAppVerifier) => {
            expect(mav.session).toBeDefined();
            expect(await mav.session.logMgr.logName()).toBe(await mav.logMgr.logName());
        })
        .withMobileAppSessionGeneratorPluginManager(sessionMgr);

        expect(sessionMgr.newSession).toHaveBeenCalledTimes(1);
    });

    it('can create a MobileAppSession using specific MobileAppSessionOptions', async () => {
        let sessionMgr: MobileAppSessionGeneratorPluginManager = new MobileAppSessionGeneratorPluginManager({pluginNames: []});
        spyOn(sessionMgr, 'newSession').and.callFake((options?: MobileAppSessionOptions): Promise<MobileAppSession> => {
            expect(options.platform).toEqual('android_11_+_+_Google Pixel 5');
            return Promise.resolve(new MobileAppSession(options));
        });

        await mobileAppVerifier((mav: MobileAppVerifier) => {
            expect(mav.session).toBeDefined();
            expect(mav.session.platform.toString()).toEqual('android_11_+_+_Google Pixel 5');
        })
        .withMobileAppFrom({
            platform: 'android_11_+_+_Google Pixel 5'
        })
        .and.withMobileAppSessionGeneratorPluginManager(sessionMgr);

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

        await mobileAppVerifier((mav: MobileAppVerifier) => {
            expect(mav.session).toBeDefined();
        })
        .withMobileAppFrom({driver: driver})
        .and.withMobileAppSessionGeneratorPluginManager(sessionMgr);

        expect(sessionMgr.newSession).toHaveBeenCalledTimes(1);
        expect(driver.deleteSession).toHaveBeenCalledTimes(1);
    });

    it('no MobileAppSession is created if assertion should not be run', async () => {
        let sessionMgr: MobileAppSessionGeneratorPluginManager = new MobileAppSessionGeneratorPluginManager({pluginNames: []});
        spyOn(sessionMgr, 'newSession').and.callFake((options?: MobileAppSessionOptions): Promise<MobileAppSession> => {
            return Promise.resolve(new MobileAppSession(options));
        });
        let tcMgr: TestCasePluginManager = new TestCasePluginManager();
        spyOn(tcMgr, 'shouldRun').and.callFake((testId: string) => Promise.resolve({success: false, message: 'no'}));
        
        await mobileAppVerifier((mav: MobileAppVerifier) => {
            expect(true).toBeFalse();
        })
        .withMobileAppSessionGeneratorPluginManager(sessionMgr)
        .and.withTests('C1234')
        .and.withTestCasePluginManager(tcMgr);

        expect(sessionMgr.newSession).not.toHaveBeenCalled();
    });
});
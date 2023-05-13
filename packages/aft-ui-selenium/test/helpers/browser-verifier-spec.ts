import { PolicyEngineManager, AftConfig } from "aft-core";
import { UiSessionGeneratorManager } from "aft-ui";
import { WebDriver } from "selenium-webdriver";
import { SeleniumVerifier, verifyWithSelenium } from "../../src";

describe('BrowserVerifier', () => {
    it('calls UiSessionGeneratorManager.getSession when run', async () => {
        const sessionMgr = new UiSessionGeneratorManager();
        spyOn(sessionMgr, 'getSession').and.callFake((id: string, aftCfg?: AftConfig) => Promise.resolve({}));
        await verifyWithSelenium(async (bv: SeleniumVerifier) => {
            expect(bv.driver).withContext('BrowserVerifier should create a new driver').toBeDefined();
        }).internals.usingUiSessionGeneratorManager(sessionMgr);

        expect(sessionMgr.getSession).toHaveBeenCalledTimes(1);
    });

    it('can create a BrowserSession using specific BrowserSessionOptions', async () => {
        const sessionMgr = new UiSessionGeneratorManager(new AftConfig({
            UiSessionConfig: {
                uiplatform: {
                    os: 'windows',
                    osVersion: '8.1',
                    browser: 'firefox'
                }
            }
        }));
        spyOn(sessionMgr, 'getSession').and.callFake((id: string, aftCfg?: AftConfig) => Promise.resolve({}));

        await verifyWithSelenium((bv: SeleniumVerifier) => {
            expect(bv.driver).toBeDefined();
            expect(bv.uiPlatform.toString()).toEqual('windows_8.1_firefox_+_+');
        }).internals.usingUiSessionGeneratorManager(sessionMgr);

        expect(sessionMgr.getSession).toHaveBeenCalledTimes(1);
    });

    it('disposes of BrowserSession on completion', async () => {
        const sessionMgr = new UiSessionGeneratorManager();
        let driver: WebDriver = jasmine.createSpyObj('WebDriver', {
            'quit': Promise.resolve()
        });
        spyOn(sessionMgr, 'getSession').and.callFake((id: string, aftCfg?: AftConfig) => Promise.resolve(driver));
        
        await verifyWithSelenium((bv: SeleniumVerifier) => {
            expect(bv.driver).toBeDefined();
        }).internals.usingUiSessionGeneratorManager(sessionMgr);

        expect(sessionMgr.getSession).toHaveBeenCalledTimes(1);
        expect(driver.quit).toHaveBeenCalledTimes(1);
    });

    it('no BrowserSession is created if assertion should not be run', async () => {
        const sessionMgr = new UiSessionGeneratorManager();
        spyOn(sessionMgr, 'getSession').and.callFake((id: string, aftCfg?: AftConfig) => Promise.resolve({}));
        let tcMgr: PolicyEngineManager = new PolicyEngineManager();
        spyOn(tcMgr, 'shouldRun').and.callFake((testId: string) => Promise.resolve({result: false}));
        
        await verifyWithSelenium((bv: SeleniumVerifier) => {
            expect(true).toBeFalse();
        }).internals.usingUiSessionGeneratorManager(sessionMgr)
        .internals.usingPolicyEngineManager(tcMgr)
        .and.withTestIds('C1234')

        expect(sessionMgr.getSession).not.toHaveBeenCalled();
    });
});
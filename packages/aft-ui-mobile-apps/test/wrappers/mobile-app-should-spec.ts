import { ProcessingResult, rand } from "aft-core";
import { Session, WebDriver } from "selenium-webdriver";
import { Browser } from "webdriverio";
import { MobileAppSessionGeneratorPluginManager, mobileAppShould, MobileAppTestWrapperOptions } from "../../src";

let consoleLog = console.log;
describe('mobileAppShould', () => {
    beforeAll(() => {
        console.log = function(){};
    });

    afterAll(() => {
        console.log = consoleLog;
    });
    
    it('returns an IProcessingResult', async () => {
        let driver: Browser<'async'> = jasmine.createSpyObj('Browser<"async">', {
            "findElements": Promise.resolve([]),
            "sessionId": rand.guid,
            "closeApp": Promise.resolve(),
            "deleteSession": Promise.resolve()
        });
        let expected: ProcessingResult = await mobileAppShould({
            expect: () => expect(true).toBeTruthy(), 
            _sessionGenPluginMgr: new MobileAppSessionGeneratorPluginManager({pluginNames: ['appium-grid-session-generator-plugin']}),
            driver: driver
        });

        expect(expected).toBeDefined();
        expect(expected.success).toBeTruthy();
    });
    
    it('supports passing in MobileAppTestWrapperOptions', async () => {
        let driver: Browser<'async'> = jasmine.createSpyObj('Browser<"async">', {
            "findElements": Promise.resolve([]),
            "sessionId": rand.guid,
            "closeApp": Promise.resolve(),
            "deleteSession": Promise.resolve()
        });
        let options: MobileAppTestWrapperOptions = {
            expect: () => expect(false).toBeFalsy(),
            testCases: ['C1234'],
            defects: ['AUTO-123'],
            description: 'false should always be falsy',
            _sessionGenPluginMgr: new MobileAppSessionGeneratorPluginManager({pluginNames: ['appium-grid-session-generator-plugin']}),
            driver: driver
        };
        let expected: ProcessingResult = await mobileAppShould(options);

        expect(expected).toBeDefined();
        expect(expected).toBeTruthy();
    });
});
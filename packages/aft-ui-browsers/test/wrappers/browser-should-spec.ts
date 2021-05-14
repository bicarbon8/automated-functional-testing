import { ProcessingResult, rand } from "aft-core";
import { Session, WebDriver } from "selenium-webdriver";
import { BrowserSessionGeneratorPluginManager, browserShould, BrowserTestWrapperOptions } from "../../src";

let consoleLog = console.log;
describe('browserShould', () => {
    beforeAll(() => {
        console.log = function(){};
    });

    afterAll(() => {
        console.log = consoleLog;
    });
    
    it('returns an IProcessingResult', async () => {
        let sesh: Session = jasmine.createSpyObj('Session', {
            "getId": rand.guid
        });
        let driver: WebDriver = jasmine.createSpyObj('WebDriver', {
            "findElements": Promise.resolve([]),
            "getSession": Promise.resolve(sesh),
            "quit": Promise.resolve()
        });
        let expected: ProcessingResult = await browserShould({
            expectation: () => expect(true).toBeTruthy(), 
            _sessionGenPluginMgr: new BrowserSessionGeneratorPluginManager({pluginNames: ['selenium-grid-session-generator-plugin']}),
            driver: driver
        });

        expect(expected).toBeDefined();
        expect(expected.success).toBeTruthy();
    });
    
    it('supports passing in BrowserTestWrapperOptions', async () => {
        let sesh: Session = jasmine.createSpyObj('Session', {
            "getId": rand.guid
        });
        let driver: WebDriver = jasmine.createSpyObj('WebDriver', {
            "findElements": Promise.resolve([]),
            "getSession": Promise.resolve(sesh),
            "quit": Promise.resolve()
        });
        let options: BrowserTestWrapperOptions = {
            expectation: () => expect(false).toBeFalsy(),
            testCases: ['C1234'],
            defects: ['AUTO-123'],
            description: 'false should always be falsy',
            _sessionGenPluginMgr: new BrowserSessionGeneratorPluginManager({pluginNames: ['selenium-grid-session-generator-plugin']}),
            driver: driver
        };
        let expected: ProcessingResult = await browserShould(options);

        expect(expected).toBeDefined();
        expect(expected).toBeTruthy();
    });
});
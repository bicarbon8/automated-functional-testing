import { LoggingPluginStore } from "./logging-plugin-store";
import { ITestResult, LogManager, LogManagerOptions, rand, TestStatus } from "../../../src";

let consoleLog = console.log;
describe('LogManager', () => {
    beforeAll(() => {
        console.log = function(){};
    });

    afterAll(() => {
        console.log = consoleLog;
    });

    it('will send logs to any registered LoggingPlugin implementations', async () => {
        const lps: LoggingPluginStore = {
            logs: [],
            results: []
        };
        let opts: LogManagerOptions = {
            logName: 'will send logs to any registered LoggingPlugin implementations',
            pluginNames: ['mock-logging-plugin'],
            lps: lps
        } as LogManagerOptions;
        let logMgr: LogManager = new LogManager(opts);

        let messages: string[] = [];
        for (var i=0; i<5; i++) {
            messages.push(rand.getString(rand.getInt(10, 30)));
        }

        for (var i=0; i<messages.length; i++) {
            await logMgr.trace(messages[i]);
            await logMgr.debug(messages[i]);
            await logMgr.step(messages[i]);
            await logMgr.info(messages[i]);
            await logMgr.warn(messages[i]);
            await logMgr.error(messages[i]);
        }
        expect(lps.logs.length).toEqual(5 * 6);
        expect(lps.results.length).toEqual(0);
        expect(lps.logs[0].message).toEqual(messages[0]);
        expect(lps.logs[lps.logs.length - 1].message).toEqual(messages[messages.length - 1]);
    });

    it('will send cloned TestResult to any registered LoggingPlugin implementations', async () => {
        const lps: LoggingPluginStore = {
            logs: [],
            results: []
        };
        let opts: LogManagerOptions = {
            logName: 'will send cloned TestResult to any registered LoggingPlugin implementations',
            pluginNames: ['mock-logging-plugin'],
            lps: lps
        } as LogManagerOptions;
        let logMgr: LogManager = new LogManager(opts);

        let result: ITestResult = {
            testId: 'C' + rand.getInt(1000, 999999),
            created: new Date(),
            resultId: rand.guid,
            status: TestStatus.Untested,
            resultMessage: rand.getString(100)
        };

        await logMgr.logResult(result);

        expect(lps.logs.length).toEqual(0);
        expect(lps.results.length).toEqual(1);
        expect(lps.results[0]).not.toBe(result);
        expect(lps.results[0].testId).toEqual(result.testId);
        expect(lps.results[0].created).toEqual(result.created);
    });

    it('calls LoggingPlugin.dispose on LoggingPluginManager.dispose', async () => {
        const lps: LoggingPluginStore = {
            logs: [],
            results: []
        };
        let opts: LogManagerOptions = {
            logName: 'calls LoggingPlugin.dispose on LoggingPluginManager.dispose',
            pluginNames: ['mock-logging-plugin'],
            lps: lps
        } as LogManagerOptions;
        let logMgr: LogManager = new LogManager(opts);

        await logMgr.info(rand.getString(18));

        expect(lps.disposed).toBeFalsy();

        await logMgr.dispose();

        expect(lps.disposed).toEqual(true);
    });
});
import { LoggingPluginStore } from "./logging-plugin-store";
import { ITestResult, LoggingPlugin, LogLevel, LogManager, LogManagerOptions, rand, TestStatus } from "../../../src";
import { MockLoggingPlugin } from "./mock-logging-plugin";

const consoleLog = console.log;
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
            level: 'trace',
            lps: lps
        } as LogManagerOptions;
        let logMgr: LogManager = new LogManager(opts);

        let messages: string[] = [];

        for (var i=0; i<5; i++) {
            let message: string = rand.getString(rand.getInt(10, 30));
            messages.push(message);
            await logMgr.trace(message);
            await logMgr.debug(message);
            await logMgr.step(message);
            await logMgr.info(message);
            await logMgr.warn(message);
            await logMgr.pass(message);
            await logMgr.fail(message);
            await logMgr.error(message);
            await logMgr.log(LogLevel.none, message);
        }
        expect(lps.logs.length).toEqual(5 * 9);
        expect(lps.results.length).toEqual(0);
        expect(lps.logs[0].message).toEqual(messages[0]);
        expect(lps.logs[lps.logs.length - 1].message).toEqual(messages[messages.length - 1]);
    });

    it('sets the same logName on any loaded LoggingPlugin implementations', async () => {
        const lps: LoggingPluginStore = {
            logs: [],
            results: []
        };
        const opts: LogManagerOptions = {
            logName: rand.getString(rand.getInt(10, 20)),
            pluginNames: ['mock-logging-plugin'],
            lps: lps
        } as LogManagerOptions;
        const logMgr: LogManager = new LogManager(opts);
        const plugin: LoggingPlugin = await logMgr.getFirstEnabledPlugin();

        expect(await plugin.logName()).toEqual(await logMgr.logName());
    });

    it('will not output if level set to LoggingLevel.none', async () => {
        const opts: LogManagerOptions = {
            logName: 'will not output if level set to LoggingLevel.none',
            level: 'none'
        };
        const logMgr: LogManager = new LogManager(opts);
        const consoleSpy = spyOn(console, 'log').and.callThrough();

        await logMgr.error('fake error');
        await logMgr.log(LogLevel.none, 'will not be logged');

        expect(consoleSpy).not.toHaveBeenCalled();
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

    it('calls LoggingPlugin.dispose on LogManager.dispose', async () => {
        const lps: LoggingPluginStore = {
            logs: [],
            results: []
        };
        let opts: LogManagerOptions = {
            logName: 'calls LoggingPlugin.dispose on LogManager.dispose',
            pluginNames: ['mock-logging-plugin'],
            lps: lps
        } as LogManagerOptions;
        let logMgr: LogManager = new LogManager(opts);

        await logMgr.info(rand.getString(18));

        expect(lps.disposed).toBeFalsy();

        await logMgr.dispose();

        expect(lps.disposed).toEqual(true);
    });

    it('handles exceptions thrown by loaded plugins', async () => {
        const opts: LogManagerOptions = {
            logName: 'handles exceptions thrown by loaded plugins',
            pluginNames: ['throws-logging-plugin']
        };
        const logMgr: LogManager = new LogManager(opts);

        expect(async () => { await logMgr.log(LogLevel.error, rand.guid); }).withContext('log').not.toThrow();
        expect(async () => { await logMgr.logResult({created: new Date(), resultId: rand.guid, status: TestStatus.Passed}); }).withContext('logResult').not.toThrow();
        expect(async () => { await logMgr.dispose(); }).withContext('dispose').not.toThrow();
    });
});
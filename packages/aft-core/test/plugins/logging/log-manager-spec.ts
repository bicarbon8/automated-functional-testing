import { TestResult, LogManager, rand, LogMessageData, pluginloader } from "../../../src";
import { MockLoggingPlugin } from "./mock-logging-plugin";

const consoleLog = console.log;
describe('LogManager', () => {
    beforeAll(() => {
        console.log = function(){};
    });

    beforeEach(() => {
        pluginloader.clear();
    });

    afterAll(() => {
        console.log = consoleLog;
    });

    it('will send logs to any registered LoggingPlugin implementations', async () => {
        const logName = 'will send logs to any registered LoggingPlugin implementations';
        const logMgr: LogManager = new LogManager({
            logName: logName,
            level: 'trace',
            plugins: ['mock-logging-plugin']
        });
        const plugin = await logMgr.first();
        const logs = new Array<LogMessageData>();
        const logSpy = spyOn(plugin, 'log').and.callFake((message: LogMessageData) => {
            logs.push(message);
            return Promise.resolve();
        });
        const resultSpy = spyOn(plugin, 'logResult').and.callThrough();
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
            await logMgr.log('none', message);
        }
        expect(logSpy).toHaveBeenCalledTimes(5 * 9);
        expect(resultSpy).not.toHaveBeenCalled();
        expect(logs[0].message).toEqual(messages[0]);
        expect(logs[logs.length - 1].message).toEqual(messages[messages.length - 1]);
    });

    it('will not output if level set to LogLevel of none', async () => {
        const logName = 'will not output if level set to LogLevel of none';
        const logMgr: LogManager = new LogManager({
            logName: logName,
            level: 'none',
            plugins: []
        });
        const consoleSpy = spyOn(console, 'log').and.callThrough();

        await logMgr.error('fake error');
        await logMgr.log('none', 'will not be logged');

        expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('will send cloned LogMessageData to any registered LoggingPlugin implementations', async () => {
        const logName = 'will send cloned LogMessageData to any registered LoggingPlugin implementations';
        const logMgr: LogManager = new LogManager({
            logName: logName,
            plugins: ['mock-logging-plugin']
        });
        const plugin = await logMgr.first() as MockLoggingPlugin;
        const logs: LogMessageData[] = [];
        const logSpy = spyOn(plugin, 'log').and.callFake((message: LogMessageData): Promise<void> => {
            logs.push(message);
            return Promise.resolve();
        })
        const expected: string = rand.getString(25, true, true, true, true);
        await logMgr.log('trace', expected);

        expect(logSpy).toHaveBeenCalledTimes(1);
        expect(logs[0].message).toBe(expected);
    });

    it('will send cloned TestResult to any registered LoggingPlugin implementations', async () => {
        const logName = 'will send cloned TestResult to any registered LoggingPlugin implementations';
        const logMgr: LogManager = new LogManager({
            logName: logName,
            plugins: ['mock-logging-plugin']
        });
        const plugin = await logMgr.first();
        const logSpy = spyOn(plugin, 'log').and.callThrough();
        const results = new Array<TestResult>();
        const names = new Array<string>();
        const resultSpy = spyOn(plugin, 'logResult').and.callFake((logName: string, result: TestResult) => {
            names.push(logName);
            results.push(result);
            return Promise.resolve();
        });
        let result: TestResult = {
            testId: 'C' + rand.getInt(1000, 999999),
            created: Date.now(),
            resultId: rand.guid,
            status: 'Untested',
            resultMessage: rand.getString(100)
        };

        await logMgr.logResult(result);

        expect(logSpy).not.toHaveBeenCalled();
        expect(resultSpy).toHaveBeenCalledTimes(1);
        expect(names[0]).toEqual(logName);
        expect(results.length).toEqual(1);
        expect(results[0]).not.toBe(result);
        expect(results[0].testId).toEqual(result.testId);
        expect(results[0].created).toEqual(result.created);
    });

    it('calls LoggingPlugin.dispose on LogManager.dispose', async () => {
        const logName = 'calls LoggingPlugin.dispose on LogManager.dispose';
        const logMgr: LogManager = new LogManager({
            logName: logName,
            plugins: ['mock-logging-plugin']
        });
        const plugin = await logMgr.first();
        const errors = new Array<LogMessageData>();
        const names = new Array<string>();
        const disposeSpy = spyOn(plugin, 'dispose').and.callFake((logName: string, message: LogMessageData) => {
            names.push(logName);
            errors.push(message);
            return Promise.resolve();
        });
        await logMgr.info(rand.getString(18));

        expect(disposeSpy).not.toHaveBeenCalled();

        const expectedErr = new Error(rand.getString(10, false, false, false, true));
        await logMgr.dispose(expectedErr);

        expect(disposeSpy).toHaveBeenCalledTimes(1);
        expect(names[0]).toEqual(logName);
        expect(errors[0].message).toEqual(expectedErr.message);
    });

    it('handles exceptions thrown by loaded plugins', async () => {
        const logName = 'handles exceptions thrown by loaded plugins';
        const logMgr: LogManager = new LogManager({
            logName: logName,
            plugins: ['throws-logging-plugin']
        });

        expect((await logMgr.first()).constructor.name).toEqual('ThrowsLoggingPlugin');
        expect(async () => await logMgr.log('error', rand.guid)).withContext('log').not.toThrow();
        expect(async () => await logMgr.logResult({created: Date.now(), resultId: rand.guid, status: 'Passed'})).withContext('logResult').not.toThrow();
        expect(async () => await logMgr.dispose()).withContext('dispose').not.toThrow();
    });

    it('passes manager LogLevel to plugins if not set in PluginConfig', async () => {
        const logName = 'passes manager LogLevel to plugins if not set in PluginConfig';
        const logMgr: LogManager = new LogManager({
            logName: logName,
            level: 'error',
            plugins: ['mock-logging-plugin']
        });

        const plugin = await logMgr.first();

        expect(plugin.level).toEqual(logMgr.option('level'));
        expect(plugin.enabled).toBe(true);
    });

    it('allows setting config for plugins in their PluginConfig', async () => {
        const logName = 'passes manager LogLevel to plugins if not set in PluginConfig';
        const logMgr: LogManager = new LogManager({
            logName: logName,
            level: 'error',
            plugins: [{
                name: 'mock-logging-plugin', 
                options: {
                    level: 'trace', 
                    enabled: false
                }
            }]
        });

        const plugin = (await logMgr.plugins())[0];

        expect(plugin.level).toEqual('trace');
        expect(plugin.enabled).toBe(false);
    });
});
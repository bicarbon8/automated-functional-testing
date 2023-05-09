import { TestResult, LogManager, rand, LogMessageData, pluginLoader, AftConfig } from "../../../src";
import { MockLoggingPlugin } from "./mock-logging-plugin";

const consoleLog = console.log;
describe('LogManager', () => {
    beforeAll(() => {
        console.log = function(){};
    });

    beforeEach(() => {
        pluginLoader.reset();
    });

    afterEach(() => {
        pluginLoader.reset();
    });

    afterAll(() => {
        console.log = consoleLog;
    });

    it('will send logs to any registered LoggingPlugin implementations', async () => {
        const logName = 'will send logs to any registered LoggingPlugin implementations';
        const logMgr: LogManager = new LogManager(logName, new AftConfig({
            logLevel: 'trace',
            pluginNames: ['mock-logging-plugin']
        }));
        const plugin = logMgr.plugins.find(p => p?.enabled);
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
        const logger: LogManager = new LogManager(logName, new AftConfig({
            logLevel: 'none',
            pluginNames: []
        }));
        const consoleSpy = spyOn(console, 'log').and.callThrough();

        await logger.error('fake error');
        await logger.log('none', 'will not be logged');

        expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('will send cloned LogMessageData to any registered LoggingPlugin implementations', async () => {
        const logName = 'will send cloned LogMessageData to any registered LoggingPlugin implementations';
        const logger = new LogManager(logName, new AftConfig({
            pluginNames: ['mock-logging-plugin']
        }));
        const plugin = logger.plugins.find(p => p.enabled) as MockLoggingPlugin;
        const logs: LogMessageData[] = [];
        const logSpy = spyOn(plugin, 'log').and.callFake((message: LogMessageData): Promise<void> => {
            logs.push(message);
            return Promise.resolve();
        })
        const expected: string = rand.getString(25, true, true, true, true);
        await logger.log('trace', expected);

        expect(logSpy).toHaveBeenCalledTimes(1);
        expect(logs[0].message).toBe(expected);
    });

    it('will send cloned TestResult to any registered LoggingPlugin implementations', async () => {
        const logName = 'will send cloned TestResult to any registered LoggingPlugin implementations';
        const logger = new LogManager(logName, new AftConfig({
            pluginNames: ['mock-logging-plugin']
        }));
        const plugin = logger.plugins.find(p => p.enabled);
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
            status: 'untested',
            resultMessage: rand.getString(100)
        };

        await logger.logResult(result);

        expect(logSpy).not.toHaveBeenCalled();
        expect(resultSpy).toHaveBeenCalledTimes(1);
        expect(names[0]).toEqual(logName);
        expect(results.length).toEqual(1);
        expect(results[0]).not.toBe(result);
        expect(results[0].testId).toEqual(result.testId);
        expect(results[0].created).toEqual(result.created);
    });

    it('calls ILoggingPlugin.finalise on logger.dispose', async () => {
        const logName = 'calls ILoggingPlugin.finalise on logger.dispose';
        const logger = new LogManager(logName, new AftConfig({
            pluginNames: ['mock-logging-plugin']
        }));
        const plugin = logger.plugins.find(p => p.enabled);
        const errors = new Array<LogMessageData>();
        const names = new Array<string>();
        const disposeSpy = spyOn(plugin, 'finalise').and.callFake((logName: string) => {
            names.push(logName);
            return Promise.resolve();
        });
        await logger.info(rand.getString(18));

        expect(disposeSpy).not.toHaveBeenCalled();

        const expectedErr = new Error(rand.getString(10, false, false, false, true));
        await logger.dispose(expectedErr);

        expect(disposeSpy).toHaveBeenCalledTimes(1);
        expect(names[0]).toEqual(logName);
        expect(errors[0].message).toEqual(expectedErr.message);
    });

    it('handles exceptions thrown by loaded plugins', async () => {
        const logName = 'handles exceptions thrown by loaded plugins';
        const logger = new LogManager(logName, new AftConfig({
            pluginNames: ['mock-logging-plugin', 'throws-logging-plugin']
        }));

        expect((logger.plugins.find(p => p.enabled).constructor.name)).toEqual('ThrowsLoggingPlugin');
        expect(async () => await logger.log('error', rand.guid)).withContext('log').not.toThrow();
        expect(async () => await logger.logResult({created: Date.now(), resultId: rand.guid, status: 'passed'})).withContext('logResult').not.toThrow();
        expect(async () => await logger.dispose()).withContext('dispose').not.toThrow();
    });

    it('passes manager LogLevel to plugins if not set in PluginConfig', async () => {
        const logName = 'passes manager LogLevel to plugins if not set in PluginConfig';
        const logger: LogManager = new LogManager(logName, new AftConfig({
            logLevel: 'error',
            pluginNames: ['mock-logging-plugin']
        }));

        const plugin = logger.plugins.find(p => p.enabled);

        expect(plugin.logLevel).toEqual(logger.logLevel);
        expect(plugin.enabled).toBe(true);
    });

    it('allows setting config for plugins in their PluginConfig', async () => {
        const logName = 'passes manager LogLevel to plugins if not set in PluginConfig';
        const logger: LogManager = new LogManager(logName, new AftConfig({
            logLevel: 'error',
            pluginNames: ['mock-logging-plugin'], 
            MockLoggingPluginConfig: {
                logLevel: 'trace'
            }
        }));

        const plugin = logger.plugins[0];

        expect(plugin.logLevel).toEqual('trace');
        expect(plugin.enabled).toBe(false);
    });

    it('will not call any plugin methods if plugin is not enabled', async () => {
        const logName = 'will not call any plugin methods if plugin is not enabled';
        const logger: LogManager = new LogManager(logName, new AftConfig({
            pluginNames: ['mock-logging-plugin'], 
            MockLoggingPluginConfig: {
                logLevel: 'none'
            }
        }));

        const plugin = logger.plugins[0];
        const initSpy = spyOn(plugin, 'initialise');
        const logSpy = spyOn(plugin, 'log');
        const logResSpy = spyOn(plugin, 'logResult');
        const finSpy = spyOn(plugin, 'finalise');

        await logger.log('error', rand.getString(33));
        await logger.logResult({
            created: Date.now(),
            resultId: rand.guid,
            status: 'failed'
        });
        logger.dispose();

        expect(initSpy).not.toHaveBeenCalled();
        expect(logSpy).not.toHaveBeenCalled();
        expect(logResSpy).not.toHaveBeenCalled();
        expect(finSpy).not.toHaveBeenCalled();
    })
});
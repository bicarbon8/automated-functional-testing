import { Reporter, rand, LogMessageData, pluginLoader, AftConfig, LogLevel, TestResult } from "../../../src";
import { MockReportingPlugin } from "./mock-reporting-plugin";

const mockReportingPluginName = 'mock-reporting-plugin';
const consoleLog = console.log;
describe('Reporter', () => {
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

    it('will send logs to any registered ReportingPlugin implementations', async () => {
        const reporterName = 'will send logs to any registered ReportingPlugin implementations';
        const reporter: Reporter = new Reporter(reporterName, new AftConfig({
            logLevel: 'trace',
            pluginNames: [mockReportingPluginName]
        }));
        const plugin = reporter.plugins.find(p => p?.enabled);
        const logs = new Array<LogMessageData>();
        const logSpy = spyOn(plugin, 'log').and.callFake((name: string, level: LogLevel, message: string, ...data: any[]) => {
            logs.push({name, level, message});
            return Promise.resolve();
        });
        const messages: string[] = [];

        for (let i=0; i<5; i++) {
            const message: string = rand.getString(rand.getInt(10, 30));
            messages.push(message);
            await reporter.trace(message);
            await reporter.debug(message);
            await reporter.step(message);
            await reporter.info(message);
            await reporter.warn(message);
            await reporter.pass(message);
            await reporter.fail(message);
            await reporter.error(message);
            await reporter.out('none', message);
        }
        expect(logSpy).toHaveBeenCalledTimes(5 * 9);
        expect(logs[0].message).toEqual(messages[0]);
        expect(logs[logs.length - 1].message).toEqual(messages[messages.length - 1]);
    });

    it('will not output if level set to LogLevel of none', async () => {
        const reporterName = 'will not output if level set to LogLevel of none';
        const reporter: Reporter = new Reporter(reporterName, new AftConfig({
            logLevel: 'none',
            pluginNames: []
        }));
        const consoleSpy = spyOn(console, 'log').and.callThrough();

        await reporter.error('fake error');
        await reporter.out('none', 'will not be logged');

        expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('will send cloned LogMessageData to any registered ReportingPlugin implementations', async () => {
        const reporterName = 'will send cloned LogMessageData to any registered ReportingPlugin implementations';
        const reporter = new Reporter(reporterName, new AftConfig({
            pluginNames: [mockReportingPluginName],
            logLevel: 'trace'
        }));
        const plugin = reporter.plugins.find(p => p.enabled) as MockReportingPlugin;
        const logs: LogMessageData[] = [];
        const logSpy = spyOn(plugin, 'log').and.callFake((name: string, level: LogLevel, message: string, ...data: any[]): Promise<void> => {
            logs.push({name, level, message, args: data});
            return Promise.resolve();
        })
        const expected: string = rand.getString(25, true, true, true, true);
        await reporter.out('trace', expected);

        expect(logSpy).toHaveBeenCalledTimes(1);
        expect(logs[0].message).toBe(expected);
    });

    it('calls ReportingPlugin.finalise on reporter.finalise', async () => {
        const reporterName = 'calls ReportingPlugin.finalise on reporter.finalise';
        const reporter = new Reporter(reporterName, new AftConfig({
            pluginNames: [mockReportingPluginName],
            logLevel: 'trace'
        }));
        const plugin = reporter.plugins.find(p => p.enabled);
        const names = new Array<string>();
        const disposeSpy = spyOn(plugin, 'finalise').and.callFake((logName: string) => {
            names.push(logName);
            return Promise.resolve();
        });
        await reporter.info(rand.getString(18));

        expect(disposeSpy).not.toHaveBeenCalled();

        await reporter.finalise();

        expect(disposeSpy).toHaveBeenCalledTimes(1);
        expect(names[0]).toEqual(reporterName);
    });

    it('handles exceptions thrown by loaded plugins', async () => {
        const reporterName = 'handles exceptions thrown by loaded plugins';
        const reporter = new Reporter(reporterName, new AftConfig({
            pluginNames: ['mock-reporting-plugin', 'throws-reporting-plugin']
        }));

        expect(async () => await reporter.out('error', rand.guid)).withContext('log').not.toThrow();
        expect(async () => await reporter.finalise()).withContext('dispose').not.toThrow();
    });

    it('passes manager LogLevel to plugins if not set in PluginConfig', () => {
        const reporterName = 'passes manager LogLevel to plugins if not set in PluginConfig';
        const reporter: Reporter = new Reporter(reporterName, new AftConfig({
            logLevel: 'error',
            pluginNames: [mockReportingPluginName]
        }));

        expect(reporter.plugins.length).withContext('expect at least 1 loaded plugin').toBeGreaterThan(0);
        const plugin = reporter.plugins[0];

        expect(plugin.logLevel).toEqual(reporter.logLevel);
        expect(plugin.enabled).withContext('expect plugin to be enabled').toBe(true);
    });

    it('allows setting config for plugins in their PluginConfig', async () => {
        const reporterName = 'passes manager LogLevel to plugins if not set in PluginConfig';
        const reporter: Reporter = new Reporter(reporterName, new AftConfig({
            logLevel: 'error',
            pluginNames: [mockReportingPluginName], 
            MockReportingPluginConfig: {
                logLevel: 'trace'
            }
        }));

        const plugin = reporter.plugins[0];

        expect(plugin.logLevel).toEqual('trace');
        expect(plugin.enabled).toBe(true);
    });

    it('will not call any plugin methods if plugin is not enabled', async () => {
        const logName = 'will not call any plugin methods if plugin is not enabled';
        const reporter: Reporter = new Reporter(logName, new AftConfig({
            pluginNames: [mockReportingPluginName], 
            MockReportingPluginConfig: {
                logLevel: 'none'
            }
        }));

        const plugin = reporter.plugins[0];
        const initSpy = spyOn(plugin, 'initialise');
        const logSpy = spyOn(plugin, 'log');
        const finSpy = spyOn(plugin, 'finalise');

        await reporter.out('error', rand.getString(33));
        reporter.finalise();

        expect(initSpy).not.toHaveBeenCalled();
        expect(logSpy).not.toHaveBeenCalled();
        expect(finSpy).not.toHaveBeenCalled();
    })

    it('sends cloned results to all loaded and enabled plugins', () => {
        const name = rand.getString(12);
        const reporter = new Reporter(name, new AftConfig({
            pluginNames: [mockReportingPluginName],
            MockReportingPluginConfig: {
                logLevel: 'trace'
            }
        }));
        const result: TestResult = {
            created: Date.now(),
            resultId: rand.guid,
            status: 'passed',
            testId: rand.guid,
            testName: name
        }
        reporter.submitResult(result);

        expect(reporter.plugins.length).toBe(1);
        expect(reporter.plugins[0].constructor.name).toEqual(MockReportingPlugin.name);
        expect(reporter.plugins[0].enabled).toBeTrue();
        expect((reporter.plugins[0] as MockReportingPlugin).results.length).toBe(1);
        expect((reporter.plugins[0] as MockReportingPlugin).results[0].testId).toEqual(result.testId);

        const origName = result.testName;
        result.testName = rand.guid;
        expect((reporter.plugins[0] as MockReportingPlugin).results[0].testName).toEqual(origName);
        expect((reporter.plugins[0] as MockReportingPlugin).results[0].testName).not.toEqual(result.testName);
    })
});

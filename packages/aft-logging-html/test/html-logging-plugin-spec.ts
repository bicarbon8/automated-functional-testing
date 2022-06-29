import * as fs from "fs";
import * as path from "path";
import { LoggingPlugin, LogManager, rand, TestResult, LogManagerOptions } from "aft-core";
import { HtmlLoggingPlugin, HtmlLoggingPluginOptions } from "../src";
import { HtmlResult } from "../src/html-result";

describe('HtmlLoggingPlugin', () => {
    beforeEach(() => {
        let c: string = path.join(process.cwd(), 'FileSystemMap', '_htmlSharedResults.json');
        if (fs.existsSync(c)) {fs.unlinkSync(c);}
        let d: string = path.join(process.cwd(), 'testresults.html');
        if (fs.existsSync(d)) {fs.unlinkSync(d);}
    });
    
    it('stores the specified number of log lines', async () => {
        const config: HtmlLoggingPluginOptions = {
            level: 'info',
            maxLogLines: 14
        };
        let plugin: HtmlLoggingPlugin = new HtmlLoggingPlugin(config);
        const logName = rand.getString(50);
        for (var i=0; i<25; i++) {
            await plugin.log({level: 'info', message: rand.getString(100), name: logName});
        }

        let actual: string[] = plugin.logs;
        expect(actual.length).toBe(14);
    });

    it('adds an ellipsis to the oldest log line only when exceeded maxLogLines', async () => {
        const config: HtmlLoggingPluginOptions = {
            level: 'info',
            maxLogLines: 3
        };
        let plugin: HtmlLoggingPlugin = new HtmlLoggingPlugin(config);
        const logName = rand.getString(50);
        for (var i=0; i<3; i++) {
            await plugin.log({level: 'info', message: rand.getString(100), name: logName});
        }

        let actual: string[] = plugin.logs;
        expect(actual.length).toBe(3);
        expect(actual[0]).not.toContain('...');

        await plugin.log({level: 'info', message: rand.getString(100), name: logName});

        actual = plugin.logs;
        expect(actual.length).toBe(3);
        expect(actual[0]).toContain('...');
    });

    it('stores logs only when at or above the specified level', async () => {
        const config: HtmlLoggingPluginOptions = {
            level: 'step',
            maxLogLines: 14
        };
        let plugin: HtmlLoggingPlugin = new HtmlLoggingPlugin(config);
        const logName = 'stores logs only when at or above the specified level';
        await plugin.log({level: 'none', message: 'level none', name: logName});
        await plugin.log({level: 'trace', message: 'level trace', name: logName});
        await plugin.log({level: 'debug', message: 'level debug', name: logName});
        await plugin.log({level: 'info', message: 'level info', name: logName});
        await plugin.log({level: 'step', message: 'level step', name: logName});
        await plugin.log({level: 'warn', message: 'level warn', name: logName});
        await plugin.log({level: 'pass', message: 'level pass', name: logName});
        await plugin.log({level: 'fail', message: 'level fail', name: logName});
        await plugin.log({level: 'error', message: 'level error', name: logName});

        let actual: string[] = plugin.logs;
        expect(actual.length).toBe(5);
        expect(actual).not.toContain('level none');
        expect(actual).not.toContain('level trace');
        expect(actual).not.toContain('level debug');
        expect(actual).not.toContain('level info');
    });

    it('can be loaded successfully from the LogManager', async () => {
        const config: LogManagerOptions = {
            logName: 'can be loaded successfully from the LogManager',
            plugins: ['html-logging-plugin']
        };
        let logMgr: LogManager = new LogManager(config);
        let plugin = await logMgr.first();

        expect(plugin).toBeDefined();
        expect(plugin.constructor.name).toEqual('HtmlLoggingPlugin');
    });

    it('only attempts to write to sharedCache and HTML file on call to dispose', async () => {
        const config: HtmlLoggingPluginOptions = {
            outputDir: './',
            fileName: 'testresults.html'
        };
        let plugin: HtmlLoggingPlugin = new HtmlLoggingPlugin(config);
        const readSpy = spyOn<any>(plugin, '_readFromSharedCache').and.callFake(() => {
            return [
                {description: 'Fake Test One', tests: [
                    {testId: 'C123', status: 'Failed', logs: ['foo', 'bar', 'baz']},
                    {testId: 'C234', status: 'Passed', logs: []}
                ]},
                {description: 'Fake Test Two', tests: [
                    {testId: 'C345', status: 'Passed', logs: ['foo bar baz']},
                    {testId: 'C456', status: 'Passed', logs: []}
                ]}
            ] as HtmlResult[]
        });
        let actualResults: HtmlResult[];
        const regenSpy = spyOn<any>(plugin, '_regenerateHtmlFile').and.callFake((results: HtmlResult[]) => {
            actualResults = results;
        });

        const logName = 'only attempts to write to sharedCache and HTML file on call to dispose';
        await plugin.log({level: 'info', message: 'fake log message', name: logName});
        const expectedResult: TestResult = {testId: 'C567', resultId: rand.guid, status: 'Passed', created: Date.now()};
        await plugin.logResult(logName, expectedResult);

        expect(readSpy).not.toHaveBeenCalled();
        expect(regenSpy).not.toHaveBeenCalled();

        await plugin.dispose(logName);

        expect(readSpy).toHaveBeenCalledTimes(1);
        expect(regenSpy).toHaveBeenCalledTimes(1);
        expect(actualResults).toHaveSize(2);
    });

    it('can generate HTML result file', async () => {
        const config: HtmlLoggingPluginOptions = {
            outputDir: './',
            fileName: 'testresults.html'
        };
        let plugin: HtmlLoggingPlugin = new HtmlLoggingPlugin(config);
        const readSpy = spyOn<any>(plugin, '_readFromSharedCache').and.callFake(() => {
            return [
                {description: 'Fake Test One', tests: [
                    {testId: 'C123', status: 'Failed', logs: ['foo', 'bar', 'baz']},
                    {testId: 'C234', status: 'Passed', logs: []}
                ]},
                {description: 'Fake Test Two', tests: [
                    {testId: 'C345', status: 'Passed', logs: ['foo bar baz']},
                    {testId: 'C456', status: 'Passed', logs: []}
                ]}
            ] as HtmlResult[]
        });

        const logName = 'can generate HTML result file';
        await plugin.log({level: 'info', message: 'fake log message', name: logName});
        const expectedResult: TestResult = {testId: 'C567', resultId: rand.guid, status: 'Passed', created: Date.now()};
        await plugin.logResult(logName, expectedResult);

        expect(readSpy).not.toHaveBeenCalled();

        await plugin.dispose(logName);

        expect(readSpy).toHaveBeenCalledTimes(1);
        expect(fs.existsSync(plugin.fullPathAndFile)).toBeTrue();
    });
});